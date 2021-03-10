const fs = require('fs')
const yaml = require('js-yaml')
const path = require('path')

const rootDir =  path.join(__dirname, '..')
const buildConfigPath = path.join(rootDir, 'entu-ssg.yaml')
const BUILD_CONFIG = yaml.safeLoad(fs.readFileSync(buildConfigPath, 'utf8'))
const BUILD_PATHS = BUILD_CONFIG.dev.paths || []

console.log(buildConfigPath, BUILD_PATHS)

function addConfigPathAliases(pathAliases = []) {
    pathAliases.map(pa => BUILD_PATHS.push(pa))

    let unique_paths = [...new Set(BUILD_PATHS)];

    BUILD_CONFIG.dev.paths = unique_paths

    const BUILD_CONFIG_YAML = yaml.safeDump(BUILD_CONFIG, { 'noRefs': true, 'indent': '4' });
    fs.writeFileSync(buildConfigPath, BUILD_CONFIG_YAML, 'utf8');

    console.log('Current config build paths:')
    unique_paths.map(p => console.log(`\t${p}`));
}

module.exports = addConfigPathAliases