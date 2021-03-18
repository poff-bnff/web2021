const { startBuildManager, calcBuildAvgDur } = require('./build_manager.js')

const params = process.argv.slice(2) || ''

let options = {
    'domain': params[1],
    'file': params[0],
    'type': params[2],
    'parameters': process.argv.slice(5).join(' '),
}

calcBuildAvgDur(options)
startBuildManager(options)
