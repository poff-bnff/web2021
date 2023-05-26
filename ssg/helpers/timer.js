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

        const stack = new Error().stack
        // remove from stack the lines that are from this file
        const stack1 = stack.split('\n').filter(line => !line.includes(__filename)).join('\n')
        const stack2 = (stack1.split("at ")[2]).trim()
        const stackObject = stack2.split(' ')[0]
        // remove parenthesis from stackFunction
        const stackFunction = stack2.split(' ')[1].slice(1, -1)
        const callerTextLength = 50
        const maxStackFunctionLength = callerTextLength - stackObject.length
        // if stackFunction is longer than maxStackFunctionLength, then
        // shorten stackfunction from begginning so that it fits to
        // stackFunctionLength and add "..." to the beginning.
        // else pad stackFunction with spaces to maxStackFunctionLength
        const shortStackFunction = stackFunction.length > maxStackFunctionLength ?
            `...${stackFunction.slice(-maxStackFunctionLength-3)}` :
            stackFunction.padEnd(maxStackFunctionLength, ' ')
        const callerFromStack = `${stackObject}@${shortStackFunction}`

        fs.appendFileSync(logFile,
            `${timeUnit(from_check, 'ms')} ${timeUnit(from_start, 'sec')} [${callerFromStack}] ${name}\n`)
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
