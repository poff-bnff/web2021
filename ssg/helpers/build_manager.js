const fs = require('fs')
const yaml = require('js-yaml')
const path = require('path')
const { exec } = require("child_process");
const moment = require('moment-timezone')

const rootDir =  path.join(__dirname, '..')
const helpersDir =  path.join(rootDir, 'helpers')
const queuePath = path.join(helpersDir, 'build_queue.yaml')
const logsPath = path.join(helpersDir, 'build_logs.yaml')

function startBuildManager(options) {
    if (!fs.existsSync(queuePath)) {
        fs.writeFileSync(queuePath, '[]', { flag: 'wx' }, function (err) {
            if (err) throw err;
        });
        addToQueue(options)
        startBuild()
    } else {
        addToQueue(options)
    }
}

function startBuild() {
    eliminateDuplicates()
    const queueFile = yaml.safeLoad(fs.readFileSync(queuePath, 'utf8'))
    const firstInQueue = queueFile[0]
    const buildDomain = firstInQueue.domain
    const buildFileName = firstInQueue.file
    const buildType = firstInQueue.type
    const buildParameters = firstInQueue.parameters
    const startTime = getCurrentTime()

    console.log('Starting build: ', buildFileName, buildDomain, buildType, buildParameters);
    writeToLogFile(`Build start`, firstInQueue)

    exec(`bash ${buildFileName} ${buildDomain} ${buildType} ${buildParameters}`, (error, stdout, stderr) => {
        let errors = false
        if (error) {
            console.log(`error: ${error.message}`);
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

        console.log('\n', 'Removing build: ', buildFileName, buildDomain, buildType, buildParameters);
        removeFirstInQueue()
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
    if(!fs.existsSync(logsPath)) {
        fs.writeFileSync(logsPath, '[]', { flag: 'wx' }, function (err) {
            if (err) throw err;
            console.log('No logfile, creating one...');
        });
    }
    const logFile = yaml.safeLoad(fs.readFileSync(logsPath, 'utf8'))

    const createLogObject = {
        'time': getCurrentTime().format('YYYY.MM.DD HH:mm:ss (Z)'),
        'type': logType,
        'duration': duration,
        'command': command,
        'error': error
    }

    logFile.push(createLogObject)
    const logDump = yaml.safeDump(logFile, { 'noRefs': true, 'indent': '4' });
    fs.writeFileSync(logsPath, logDump, 'utf8');
}

function getCurrentTime() {
    return moment(new Date()).tz('Europe/Tallinn')
}

function calculateAverageDuration(options) {
    if(!fs.existsSync(logsPath)) {
        console.log('No log file for getting estimates');
        return;
    }
    const logFile = yaml.safeLoad(fs.readFileSync(logsPath, 'utf8'))
    const logData = logFile.filter(a => {
        const oneCommand = `${a.command.domain} ${a.command.file} ${a.command.type} ${a.command.parameters}`
        if (a.duration && !a.error && oneCommand === `${options.domain} ${options.file} ${options.type} ${options.parameters}`) {
            return true
        } else {
            return false
        }
    })
    const lastFive = logData.slice(Math.max(logData.length - 5, 0))
    const avgDurInMs = lastFive.map(a => a.duration).reduce((partial_sum, a) => partial_sum + a,0) / lastFive.length
    var duration = moment.duration(avgDurInMs);
    if(duration._isValid) {
        console.log(`Based on last 5 builds, average duration for this type of build is: ${duration.minutes()}m ${duration.seconds()}s`);
    } else {
        console.log('No log data for getting estimates');
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

exports.startBuildManager = startBuildManager
exports.calculateAverageDuration = calculateAverageDuration
