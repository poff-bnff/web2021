const fs = require('fs')
const path = require('path')

// path of log file for create/update/delete timing
const logDir = path.join(__dirname, '..', '..', 'strapi', 'logs')
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true })
}
const logFile = path.join(logDir, 'timer.log')
// save start time
fs.appendFileSync(logFile, `Timer loaded at ${new Date().toISOString()}\n`)
fs.appendFileSync(logFile, '[interv. ms] [total sec] [caller script] name\n')

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

    const checkMs = name => {
        if (!timers.hasOwnProperty(name)) {
            throw new Error(`No such timer as "${name}"`)
        }
        const _timer = timers[name]
        const now = new Date().getTime()
        const from_start = now - _timer.t0
        const from_check = now - _timer.check
        _timer.check = now
        const callerFromStackT = (new Error().stack.split('\n')[2].split(' ')[5]).split('\\').slice(-2).join('\\')
        const callerFromStack = ((new Error().stack).split("at ")[3]).trim()
        console.log((new Error().stack))
        fs.appendFileSync(logFile,
            `${timeUnit(from_check, 'ms')} ${timeUnit(from_start, 'sec')} [${callerFromStack}] [${callerFromStackT}] ${name}\n`)
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
        const c = checkMs(name).total
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

// test code
const t = timer()
t.start('test')
t.check('test')
