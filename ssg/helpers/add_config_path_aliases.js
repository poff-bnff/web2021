const fs = require('fs')
const yaml = require('js-yaml')
const path = require('path')

const rootDir = path.join(__dirname, '..')
const buildConfigPath = path.join(rootDir, 'entu-ssg.yaml')
const BUILD_CONFIG = yaml.load(fs.readFileSync(buildConfigPath, 'utf8'))
const BUILD_PATHS = BUILD_CONFIG.dev.paths || []

function addConfigPathAliases(pathAliases = []) {
    pathAliases.map(pa => BUILD_PATHS.push(pa))

    let unique_paths = [...new Set(BUILD_PATHS)];

    BUILD_CONFIG.dev.paths = unique_paths

    const BUILD_CONFIG_YAML = yaml.dump(BUILD_CONFIG, { 'noRefs': true, 'indent': '4' });
    fs.writeFileSync(buildConfigPath, BUILD_CONFIG_YAML, 'utf8');
}

function displayConfigPathAliases() {
    let unique_paths = [...new Set(BUILD_PATHS)];
    console.log('Config build paths:')
    unique_paths.map(p => console.log(`\t${p}`));
}

if (process.argv[2]) {
    if (process.argv[2] === 'display') {
        displayConfigPathAliases()
    } else if (process.argv[2] === 'login') {
        addConfigPathAliases([
            '/_scripts',
            '/login',
            '/my_screenings',
            '/screenings-search',
            '/my_films',
            '/_fetchdir/cassettes/200-meters',
            '/search',
            '/mypoff',
            '/userprofile',
            '/_fetchdir/products/hoff_pass',
            '/resetPswd',
            '/signup'
        ])
        displayConfigPathAliases()
    }
}
module.exports = addConfigPathAliases
