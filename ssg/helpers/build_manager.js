const fs = require('fs')
const yaml = require('js-yaml')
const path = require('path')
const { exec } = require("child_process");
const moment = require('moment-timezone')

const rootDir = path.join(__dirname, '..')
const helpersDir = path.join(rootDir, 'helpers')
const queuePath = path.join(helpersDir, 'build_queue.yaml')
const logsPath = path.join(helpersDir, 'build_logs.yaml')


function startBuildManager(options = null) {
    // Enable force run via command line when BM accidentally closed mid-work (due to server restart etc)
    if (process.argv[2] === 'force' && !options) {
        // Quit if no queuefile
        if (!fs.existsSync(queuePath)) {
            console.log('No pending queue')
        } else {
            // If queue exists, check if last known PID is still running if it is, quit, else start building
            const isRunning = checkIfProcessAlreadyRunning()
            if(isRunning) {
                console.log(`Last process with PID ${isRunning} is still running.`);
            } else {
                console.log('Continuing with existing queue');
                startBuild()
            }
        }
    } else if (options.domain && options.file && options.type) {
        // If required options received, create queue and start build
        if (!fs.existsSync(queuePath)) {
            fs.writeFileSync(queuePath, '[]');

            addToQueue(options)
            startBuild()
        // If queue already exists, add to queue
        } else {
            addToQueue(options)
        }
    } else {
        console.log('Invalid options', options);
    }
}

function startBuild() {
    // Eliminate duplicates from queue every time new build starts
    eliminateDuplicates()

    const queueFile = yaml.safeLoad(fs.readFileSync(queuePath, 'utf8'))
    const firstInQueue = queueFile[0]
    const buildDomain = firstInQueue.domain
    const buildFileName = firstInQueue.file
    const buildFilePath = path.join(rootDir, buildFileName)
    const buildType = firstInQueue.type
    const buildParameters = firstInQueue.parameters
    const startTime = getCurrentTime()

    console.log('Starting build: ', buildFileName, buildDomain, buildType, buildParameters);
    writeToLogFile(`Build start`, firstInQueue)

    // Run shell cript
    exec(`bash ${buildFilePath} ${buildDomain} ${buildType} ${buildParameters}`, (error, stdout, stderr) => {
        let errors = false
        if (error) {
            errors = true
            console.log(`error: ${stderr}`);
        }
        if (stderr) {
            errors = true
            console.log(`stderr: ${stderr}`);
        }

        console.log('Build end ', buildFileName, buildDomain, buildType, buildParameters, ' with result:\n', stdout);
        const duration = moment.duration(getCurrentTime().diff(startTime)).as('milliseconds')

        if (!errors) {
            writeToLogFile(`Build finish`, firstInQueue, duration)
        } else {
            if (error) {
                writeToLogFile(`Build fail error`, firstInQueue, duration, error)
            }
            if (stderr) {
                writeToLogFile(`Build fail stderr`, firstInQueue, duration, stderr)
            }
        }

        console.log('\n', 'Removing build from queue: ', buildFileName, buildDomain, buildType, buildParameters);
        // After build end, remove from queue
        removeFirstInQueue()

        // If queue empty, rm queue file, else start building first one in queue
        if (!deleteQueueIfEmpty()) { startBuild() }

    });
}

function addToQueue(options) {
    const queueFile = yaml.safeLoad(fs.readFileSync(queuePath, 'utf8'))

    options.time = getCurrentTime().format('YYYY.MM.DD HH:mm:ss (Z)')
    queueFile.push(options)

    const queueDump = yaml.safeDump(queueFile, { 'noRefs': true, 'indent': '4' });
    fs.writeFileSync(queuePath, queueDump, 'utf8');
    console.log('Added to queue');
    writeToLogFile(`Add to queue`, options)
}

function deleteQueueIfEmpty() {
    const queueFile = yaml.safeLoad(fs.readFileSync(queuePath, 'utf8'))
    if (!queueFile.length) {
        fs.unlinkSync(queuePath)
        return true
    } else {
        return false
    }
}

function removeFirstInQueue() {
    const queueFile = yaml.safeLoad(fs.readFileSync(queuePath, 'utf8'))
    queueFile.shift()
    const queueDump = yaml.safeDump(queueFile, { 'noRefs': true, 'indent': '4' });
    fs.writeFileSync(queuePath, queueDump, 'utf8');
}

function writeToLogFile(logType, command, duration = null, error = null) {
    if (!fs.existsSync(logsPath)) {
        fs.writeFileSync(logsPath, '[]');
    }
    const logFile = yaml.safeLoad(fs.readFileSync(logsPath, 'utf8'))

    const createLogObject = {
        'time': getCurrentTime().format('YYYY.MM.DD HH:mm:ss (Z)'),
        'type': logType || null,
        'duration': duration || null,
        'command': command || null,
        'PID': process.pid,
        'error': error && typeof error === 'object' ? JSON.stringify(error) : error
    }
    logFile.push(createLogObject)
    const logDump = yaml.safeDump(logFile, { 'noRefs': true, 'indent': '4' });
    fs.writeFileSync(logsPath, logDump, 'utf8');
}

function getCurrentTime() {
    return moment(new Date()).tz('Europe/Tallinn')
}

function calcBuildAvgDur(options, queueEst = false) {
    if (!fs.existsSync(logsPath)) {
        console.log('No log file for getting build estimates');
        return;
    }
    const logFile = yaml.safeLoad(fs.readFileSync(logsPath, 'utf8'))
    const logData = logFile.filter(a => {
        const oneCommand = `${a.command.domain} ${a.command.file} ${a.command.type}`
        if (a.duration && !a.error && oneCommand === `${options.domain} ${options.file} ${options.type}`) {
            return true
        } else {
            return false
        }
    })

    const lastFive = logData.slice(Math.max(logData.length - 5, 0))
    const avgDurInMs = lastFive.map(a => a.duration).reduce((partial_sum, a) => partial_sum + a, 0) / lastFive.length
    var duration = moment.duration(avgDurInMs);
    if (!queueEst) {
        if (duration._isValid) {
            console.log(`Average duration for this type of build is:`, duration.minutes(), `m`, duration.seconds(), `s`);
        } else {
            console.log('No log data for getting build estimates');
        }
    } else {
        return avgDurInMs ? avgDurInMs : 0
    }
}

function calcQueueEstDur() {
    if (!fs.existsSync(logsPath)) {
        console.log('No log file for getting queue estimates');
        return;
    }
    if (!fs.existsSync(queuePath)) {
        console.log('No queue file for getting queue estimates');
        return;
    }
    const queueFile = yaml.safeLoad(fs.readFileSync(queuePath, 'utf8'))

    const queue = queueFile.map(q => {
        options = {
            domain: q.domain,
            file: q.file,
            type: q.type
        }
        return JSON.stringify(options)
    })

    let estimateInMs = 0
    let noEstimate = 0
    const uniqueQueue = [...new Set(queue)].map(q => {
        const options = JSON.parse(q)
        const milliSecs = calcBuildAvgDur(options, true)
        estimateInMs += milliSecs
        if (milliSecs === 0) {
            noEstimate++
        }
    })

    const duration = moment.duration(estimateInMs)
    if (duration._isValid && estimateInMs > 0) {
        console.log(`Based on current queue (${uniqueQueue.length} builds) your build will finish in ~` ,duration.minutes(), `m`, duration.seconds(), `s`);
    }
    if (noEstimate > 0) {
        console.log(`Please note that no estimates were found for`, noEstimate, `builds, therefore this might not be exact.`);
    }
}

function eliminateDuplicates() {
    const queueFile = yaml.safeLoad(fs.readFileSync(queuePath, 'utf8'))
    const firstEntryCopy = JSON.parse(JSON.stringify(queueFile[0]))
    delete firstEntryCopy.time

    const eliminated = queueFile.filter(a => {
        const aCopy = JSON.parse(JSON.stringify(a))
        delete aCopy.time
        if (JSON.stringify(aCopy) === JSON.stringify(firstEntryCopy)) {
            return false
        } else {
            return true
        }
    })

    const difference = queueFile.length - (eliminated.length + 1)

    if (difference !== 0) {
        eliminated.unshift(queueFile[0])
        const queueDump = yaml.safeDump(eliminated, { 'noRefs': true, 'indent': '4' });
        fs.writeFileSync(queuePath, queueDump, 'utf8');
        console.log(`Removed ${difference} duplicates from queue for ${queueFile[0].domain} ${queueFile[0].file} ${queueFile[0].type} ${queueFile[0].parameters}`);
        writeToLogFile(`Remove ${difference} duplicates`, queueFile[0])
    }
}

function checkIfProcessAlreadyRunning() {
    if (fs.existsSync(logsPath)) {
        const logFile = yaml.safeLoad(fs.readFileSync(logsPath, 'utf8'))
            .filter(a => a.PID && a.type === 'Build start')

        const lastPID = logFile.slice(-1)[0].PID

        try {
            // Signal 0 given for checking (and not killing) existence of process
            process.kill(lastPID, 0)
            return lastPID
        } catch (e) {
            return false
        }

    } else {
        console.log('No logs to check last "Build start" PID from');
        return false
    }
}

if (process.argv[2] === 'force') {
    startBuildManager()
} else if (process.argv[2] === 'queue') {
    calcQueueEstDur()
} else {
    const { model } = require('./get_build_model.js')

    const params = process.argv.slice(2) || ''
    const args = params[0].split(',')

    console.log('args', args)  // [ 'hoff.ee', 'cassette', 'target', '3', '1', '2' ]

    let file = `build_${model(args[1])}.sh`

    let options = {
        'domain': args[0],
        'file': file,
        'type': args[2],
        'parameters': args.slice(3).join(' ')
    }

    console.log('options', options)

    calcBuildAvgDur(options)
    calcQueueEstDur()
    startBuildManager(options)
}

exports.startBuildManager = startBuildManager
exports.calcBuildAvgDur = calcBuildAvgDur
