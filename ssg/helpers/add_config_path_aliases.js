const fs = require('fs')
const yaml = require('js-yaml')
const path = require('path')

let rootDir
	console.log('dirname in add_config.....', __dirname)

if ((__dirname.split(path.sep).slice(-1)[0]) === 'ssg') {
	rootDir = __dirname
} else {
	rootDir =  path.join(__dirname, '..')
	console.log('rootdir in add_config....', rootDir)
}

const buildConfigPath = path.join(rootDir, 'entu-ssg.yaml')

console.log(buildConfigPath)
const BUILD_CONFIG = yaml.safeLoad(fs.readFileSync(buildConfigPath, 'utf8'))
const BUILD_PATHS = BUILD_CONFIG.dev.paths || []

function addConfigPathAliases(pathAliases = []) {
    pathAliases.map(pa => BUILD_PATHS.push(pa))

    let unique_paths = [...new Set(BUILD_PATHS)];

    BUILD_CONFIG.dev.paths = unique_paths

    const BUILD_CONFIG_YAML = yaml.safeDump(BUILD_CONFIG, { 'noRefs': true, 'indent': '4' });
    fs.writeFileSync(buildConfigPath, BUILD_CONFIG_YAML, 'utf8');
}

function displayConfigPathAliases() {
    let unique_paths = [...new Set(BUILD_PATHS)];
    console.log('Config build paths:')
    unique_paths.map(p => console.log(`\t${p}`));
}

if(process.argv[2] === 'display') {
    displayConfigPathAliases()
}

module.exports = addConfigPathAliases
