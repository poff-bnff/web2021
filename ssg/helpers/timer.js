const fs = require('fs')
const path = require('path')
const jsyaml = require('js-yaml');

// path of log file for create/update/delete timing
const logDir = path.join(__dirname, '..', '..', 'strapi', 'logs')
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true })
}
const logFile = path.join(logDir, 'timer.log')
if (!fs.existsSync(logFile)) {
    fs.writeFileSync(logFile, '')
}
const mavFile = path.join(logDir, 'timer_mav.yaml')
if (!fs.existsSync(mavFile)) {
    fs.writeFileSync(mavFile, '{}')
}

const lockFile = path.join(logDir, 'timer_mav.lock')
// make sure lockfile is deleted when process exits
process.on('exit', () => {
    if (fs.existsSync(lockFile)) {
        fs.unlinkSync(lockFile)
    }
})

const lock = () => {
    waitUntilUnlocked()
    fs.writeFileSync(lockFile, '')
}
const unlock = () => {
    fs.unlinkSync(lockFile)
}
const isLocked = () => {
    return fs.existsSync(lockFile)
}
const waitUntilUnlocked = () => {
    while (isLocked()) { }
}

const loadMAV = (message = '') => {
    const mav = jsyaml.load(fs.readFileSync(mavFile, 'utf8'))
    if (message === '') {
        return mav
    }
    if (!mav.hasOwnProperty(message)) {
        mav[message] = {}
    }
    return mav[message]
}

const saveMAV = (message, mav) => {
    const mavs = loadMAV()
    // if new message, then sort MAV by keys before save
    let sort = false
    if (!mavs.hasOwnProperty(message)) {
        sort = true
    }
    mavs[message] = mav
    if (sort) {
        mavs = sortMAV(mavs)
    }
    fs.writeFileSync(mavFile, jsyaml.dump(mavs))
}

// sort MAV by keys
const sortMAV = (mav) => {
    const ciSort = (a, b) => {
        const aLower = a.toLowerCase()
        const bLower = b.toLowerCase()
        if (aLower < bLower) {
            return -1
        }
        if (aLower > bLower) {
            return 1
        }
        return 0
    }

    const sorted = Object.keys(mav).sort(ciSort).reduce(
        (obj, key) => {
            obj[key] = mav[key]
            return obj
        }, {}
    )
    return sorted
}

const timer = () => {
    const timers = {}

    const start = name => {
        const now = new Date().getTime()
        timers[name] = {
            t0: now,
            check: now
        }
    }

    const checkMs = (name, message = false) => {
        if (!timers.hasOwnProperty(name)) {
            throw new Error(`No such timer as "${name}"`)
        }
        const _timer = timers[name]
        const now = new Date().getTime()
        const fromStart = now - _timer.t0
        const fromCheck = now - _timer.check
        _timer.check = now

        const triDot = '…'
        const stack = (new Error().stack).split('\n').slice(1).filter(line => !line.includes(__filename)).map(line => line.split('at ')[1])
        const stackLine = stack[0]
        // console.log({stack}, {stackLine})
        const stackObject = stackLine.split(' ')[0]
        // remove parenthesis from stackFunction
        const stackFunction = stackLine.split(' ')[1].slice(1, -1)
        const callerTextLength = 60
        const maxStackFunctionLength = callerTextLength - stackObject.length
        // if stackFunction is longer than maxStackFunctionLength, then
        // shorten stackfunction from begginning so that it fits to
        // stackFunctionLength and add "..." to the beginning.
        // else pad stackFunction with spaces to maxStackFunctionLength
        const shortStackFunction = stackFunction.length > maxStackFunctionLength ?
            `${triDot}${stackFunction.slice(-maxStackFunctionLength-1)}` :
            stackFunction.padEnd(maxStackFunctionLength, ' ')
        const callerFromStack = `${stackObject}@${shortStackFunction}`

        fs.appendFileSync(logFile,
            `${timeUnit(fromCheck, 'ms')} ${timeUnit(fromStart, 'sec')} [${callerFromStack}] /${name}/ ${message || name}\n`)

        // number of messages to calculate moving average
        const sampleSize = 20
        if (message) {
            // if message contains (new Date().toISOString()) timestamp, replace it
            message = message.replace(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/, '{ISO datetime}')
            // if message contains list of numbers, replace it
            message = message.replace(/\d+(, ?\d+)*/, '{list of numbers}')
            // replace locales 'en', 'et', 'ru' with {locale}. Make sure to match between word boundaries
            message = message.replace(/\b(en|et|ru)\b/, '{locale}')

            lock()
            const mav = loadMAV(message)
            // check if moving average of given length is already calculated
            if (!mav.hasOwnProperty(sampleSize)) {
                mav[sampleSize] = {
                    numOfSamples: 0,
                    fromCheck: 0,
                    fromStart: 0,
                    totalEvents: 0
                }
            }
            // calculate moving average
            const m = mav[sampleSize]
            m.numOfSamples++
            m.totalEvents = m.totalEvents ? m.totalEvents + 1 : 1
            // round to whole number
            m.fromCheck = Math.round((m.fromCheck * (m.numOfSamples - 1) + fromCheck) / m.numOfSamples)
            m.fromStart = Math.round((m.fromStart * (m.numOfSamples - 1) + fromStart) / m.numOfSamples)
            m.numOfSamples = Math.min(m.numOfSamples, sampleSize)
            // save moving average
            saveMAV(message, mav)
            unlock()
        }

        return {
            interval: fromCheck,
            total: fromStart,
            unit: 'ms'
        }
    }

    const checkVerbal = (name, unit = 'ms') => {
        if (!timers.hasOwnProperty(name)) {
            throw new Error(`No such timer as "${name}"`)
        }
        const c = checkMs(name)
        return {
            interval: timeUnit(c.interval, unit),
            total: timeUnit(c.total, unit)
        }
    }

    const log = (name, message, unit = 'ms') => {
        if (!timers.hasOwnProperty(name)) {
            throw new Error(`No such timer as "${name}"`)
        }
        const c = checkMs(name, message).total
        console.log(`${timeUnit(c, unit)} ${message}`)
    }

    const timeUnit = (ms, unit) => {
        return {
            'ms': `[${ms.toString().padStart(8, ' ')}ms]`,
            'sec': `[${(Math.round(ms / 100) / 10).toString().padStart(6, ' ')}sec]`
        }[unit]
    }

    return {
        start: start,
        check: checkMs,
        checkVerbal: checkVerbal,
        log: log
    }
}

exports.timer = timer()

// save start time
exports.timer.start('start')
exports.timer.check('start', `Timer loaded at ${new Date().toISOString()}`)

// load, sort and save MAV on startup
lock()
const mavs = jsyaml.load(fs.readFileSync(mavFile, 'utf8'))
fs.writeFileSync(mavFile, jsyaml.dump(sortMAV(mavs)))
unlock()

