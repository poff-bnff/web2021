const fs = require('fs')
const path = require('path')

// path of log file for create/update/delete timing
const logDir = path.join(__dirname, '..', '..', '..', 'logs')
if (!fs.existsSync(logDir)) {
    strapi.log.debug('Creating log dir', logDir)
    fs.mkdirSync(logDir, { recursive: true })
}
const logFile = path.join(logDir, 'timer.log')
fs.appendFileSync(logFile, '---')


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
