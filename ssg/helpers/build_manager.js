const fs = require('fs')
const yaml = require('js-yaml')
const path = require('path')
const { exec } = require("child_process");
const moment = require('moment-timezone')
const https = require('https')
const { strapiAuth } = require('./strapiAuth.js')

const rootDir = path.join(__dirname, '..')
const helpersDir = path.join(rootDir, 'helpers')
const queuePath = path.join(helpersDir, 'build_queue.yaml')
const logsPath = path.join(helpersDir, 'build_logs.yaml')
const strapiAddress = process.env['StrapiHostPoff2021']
let TOKEN = ''

function startBuildManager(options = null) {
    // Enable force run via command line when BM accidentally closed mid-work (due to server restart etc)
    if (process.argv[2] === 'force' && !options) {
        // Quit if no queuefile
        if (!fs.existsSync(queuePath)) {
            console.log('Build Manager: No pending queue')
        } else {
            // If queue exists, check if last known PID is still running if it is, quit, else start building
            const isRunning = checkIfProcessAlreadyRunning()
            if (isRunning) {
                console.log(`Build Manager: Last process with PID ${isRunning} is still running.`);
            } else {
                console.log('Build Manager: Continuing with existing queue');
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
        console.log('Build Manager: Invalid options', options);
    }
}

function startBuild() {
    // Eliminate duplicates from queue every time new build starts
    const duplicatesLogIds = eliminateDuplicates()

    const queueFile = yaml.safeLoad(fs.readFileSync(queuePath, 'utf8'))
    const firstInQueue = queueFile[0]
    const buildDomain = firstInQueue.domain
    const buildFileName = firstInQueue.file
    const buildFilePath = path.join(rootDir, buildFileName)
    const buildType = firstInQueue.type
    const buildParameters = firstInQueue.parameters
    const startTime = getCurrentTime()
    firstInQueue.also_builds = duplicatesLogIds

    console.log('Starting build: ', buildFileName, buildDomain, buildType, buildParameters);
    const build_start_time = moment().tz('Europe/Tallinn').format()

    if (duplicatesLogIds?.length) {
        writeToOtherBuildLogs(duplicatesLogIds, { start_time: build_start_time, built_by: firstInQueue.log_id })
    }
    writeToLogFile(`Build start`, firstInQueue)
    logQuery(firstInQueue.log_id, 'PUT', { start_time: build_start_time })

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

        const build_end_time = moment().tz('Europe/Tallinn').format()
        const build_end_data = {
            end_time: build_end_time,
            duration: duration,
            build_errors: stderr || null,
            build_stdout: stdout || null
        }
        logQuery(firstInQueue.log_id, 'PUT', build_end_data)

        if (duplicatesLogIds?.length) {
            writeToOtherBuildLogs(duplicatesLogIds, build_end_data)
        }

        console.log('\n', 'Removing build from queue: ', buildFileName, buildDomain, buildType, buildParameters);
        // After build end, remove from queue
        removeFirstInQueue()

        // If queue empty, rm queue file, else start building first one in queue
        if (!deleteQueueIfEmpty()) { startBuild() }

    });
}

function writeToOtherBuildLogs(LogIds, data) {
    LogIds.map(log => {
        logQuery(log, 'PUT', data)
    })
}

function addToQueue(options) {
    const queueFile = yaml.safeLoad(fs.readFileSync(queuePath, 'utf8'))

    options.time = getCurrentTime().format('YYYY.MM.DD HH:mm:ss (Z)')
    queueFile.push(options)

    const queueDump = yaml.safeDump(queueFile, { 'noRefs': true, 'indent': '4' });
    fs.writeFileSync(queuePath, queueDump, 'utf8');
    console.log('Added to queue');
    writeToLogFile(`Add to queue`, options)

    // Update Strapi deploy_logs
    const thisBuildAvg = calcBuildAvgDur(options)
    const queueEst = calcQueueEstDur()
    const postData = {
        build_est_duration: thisBuildAvg,
        queue_est_duration: queueEst.duration || 0,
        no_estimate_builds_in_queue: queueEst.noest || 0,
        in_queue: queueEst.inqueue || 0
    }
    logQuery(options.log_id, 'PUT', postData)
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
        return 0;
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
            return Math.round(avgDurInMs)
        } else {
            console.log('No log data for getting build estimates');
            return 0
        }
    } else {
        return avgDurInMs ? Math.round(avgDurInMs) : 0
    }
}

function calcQueueEstDur() {
    if (!fs.existsSync(logsPath)) {
        console.log('No log file for getting queue estimates');
        return null;
    }
    if (!fs.existsSync(queuePath)) {
        console.log('No queue file for getting queue estimates');
        return null;
    }

    const queueFile = yaml.safeLoad(fs.readFileSync(queuePath, 'utf8'))

    const queue = queueFile.map(q => {
        options = {
            domain: q.domain,
            file: q.file,
            type: q.type,
            parameters: q.parameters
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
        console.log(`Based on current queue (${uniqueQueue.length} builds) your build will finish in ~`, duration.minutes(), `m`, duration.seconds(), `s`);
        if (noEstimate > 0) {
            console.log(`Please note that no estimates were found for`, noEstimate, `builds, therefore this might not be exact.`);
        }
    }

    return {
        duration: Math.round(estimateInMs),
        inqueue: uniqueQueue.length,
        noest: noEstimate
    }
}

function eliminateDuplicates() {
    const queueFile = yaml.safeLoad(fs.readFileSync(queuePath, 'utf8'))
    const firstEntryCopy = JSON.parse(JSON.stringify(queueFile[0]))
    delete firstEntryCopy.time
    delete firstEntryCopy.log_id

    const duplicatesLogIds = []
    const eliminated = queueFile.filter(a => {
        const aCopy = JSON.parse(JSON.stringify(a))
        delete aCopy.time
        delete aCopy.log_id
        if (JSON.stringify(aCopy) === JSON.stringify(firstEntryCopy)) {
            if (a.log_id !== queueFile[0].log_id) {
                duplicatesLogIds.push(a.log_id)
            }
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

    return duplicatesLogIds.length ? duplicatesLogIds : null
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

async function logQuery(id, type = 'GET', data) {
    if (TOKEN === '') {
        TOKEN = await strapiAuth()
    }

    return new Promise((resolve, reject) => {

        const mapper = {
            GET: 'onelog',
            PUT: 'updatelog'
        }

        var options = {
            hostname: strapiAddress,
            path: `/publisher/${mapper[type]}/${id}`,
            method: type,
            headers: {
                Authorization: `Bearer ${TOKEN}`,
                'Content-Type': 'application/json'
            }
        };

        if (type === 'PUT') {
            data = JSON.stringify(data)
        }

        let resData = ''

        const req = https.request(options, res => {
            res.setEncoding('utf8')

            res.on('data', d => {
                resData += d
            })

            res.on('end', async function () {

                if (res.statusCode === 200) {
                    resolve(JSON.parse(resData))
                } else {
                    console.log('\nStatus', res.statusCode, options)
                    resolve([])
                }

            })

            res.on('error', function (err) {
                // spin.stop()
                console.log('\nE:1', err)
                reject(err)
            })
        })


        req.on('error', async function (error) {
            if (error.code === 'ETIMEDOUT') {
                process.stdout.write('r')
                let resolved = await logQuery(id, type, data)
                resolve(resolved)
            } else if (error.code === 'ECONNRESET') {
                process.stdout.write('r')
                let resolved = await logQuery(id, type, data)
                resolve(resolved)
            } else {
                console.log('\nE:2', error)
                reject
            }
        })

        if (type === 'PUT') {
            req.write(data)
        }

        req.end()

    })

}

if (process.argv[2] === 'force') {
    startBuildManager()
} else if (process.argv[2] === 'queue') {
    calcQueueEstDur()
} else {
    const { model } = require('./get_build_model.js')

    const params = process.argv.slice(2) || ''
    const args = (params[0] || '').split(',')

    // console.log('args', args)  // [ 'hoff.ee', 'cassette', 'target', '3', '1', '2' ]

    const modelName = model(args[2])

    let options = {
        domain: args[0] || null,
        file: modelName ? `build_${model}.sh` : null,
        type: args[3] || null,
        log_id: args[1] || null,
        parameters: args.slice(4).join(' ') || null
    }

    startBuildManager(options)
}

exports.startBuildManager = startBuildManager
exports.calcBuildAvgDur = calcBuildAvgDur
