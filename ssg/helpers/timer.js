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

    const check = (name, unit = 'ms') => {
        if (!name in timers) {
            throw new Error(`No such timer - ${name}`)
        }
        const _timer = timers[name]
        const now = new Date().getTime()
        const from_start = now - _timer.t0
        const from_check = now - _timer.check
        _timer.check = now
        return {
            interval: timeUnit(from_check, unit),
            total: timeUnit(from_start, unit)
        }
    }

    const log = (name, message) => {
        const time_unit = check(name, 'sec').total
        console.log(time_unit, message)
    }

    let timers = {}
    return {
        start: start,
        check: check,
        log: log
    }
}

exports.timer = timer()
