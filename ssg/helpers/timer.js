const fs = require('fs')
const path = require('path')

// path of log file for create/update/delete timing
const logDir = path.join(__dirname, '..', '..', 'strapi', 'logs')
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true })
}
const logFile = path.join(logDir, 'timer.log')

const timer = () => {
    const timeUnit = (ms, unit) => {
        return {
            'ms': `[${ms.toString().padStart(8, ' ')}ms]`,
            'sec': `[${(Math.round(ms / 100) / 10).toString().padStart(6, ' ')}sec]`
        }[unit]
    }

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
        const from_start = now - _timer.t0
        const from_check = now - _timer.check
        _timer.check = now

        const triDot = '…'
        const stack = (new Error().stack).split('\n').slice(1).filter(line => !line.includes(__filename)).map(line => line.split('at ')[1])
        const stackLine = stack[0]
        console.log({stack}, {stackLine})
        const stackObject = stackLine.split(' ')[0]
        // remove parenthesis from stackFunction
        const stackFunction = stackLine.split(' ')[1].slice(1, -1)
        const callerTextLength = 50
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
            `${timeUnit(from_check, 'ms')} ${timeUnit(from_start, 'sec')} [${callerFromStack}] ${message || name}\n`)
        return {
            interval: from_check,
            total: from_start,
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

    let timers = {}
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
