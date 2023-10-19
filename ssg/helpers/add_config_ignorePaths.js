const fs = require('fs')
const yaml = require('js-yaml')
const path = require('path')

const DOMAIN = process.env['DOMAIN'] || 'hoff.ee'

const rootDir = path.join(__dirname, '..')

const ignorePathsPath = path.join(rootDir, 'ignore_paths.yaml')
const IGNORE_PATHS = yaml.load(fs.readFileSync(ignorePathsPath, 'utf8'))

const buildConfigPath = path.join(rootDir, 'entu-ssg.yaml')
const BUILD_CONFIG = yaml.load(fs.readFileSync(buildConfigPath, 'utf8'))

const domainIgnorePaths = IGNORE_PATHS[DOMAIN] || IGNORE_PATHS['default']

BUILD_CONFIG.dev.ignorePaths = domainIgnorePaths

const BUILD_CONFIG_YAML = yaml.dump(BUILD_CONFIG, { 'noRefs': true, 'indent': '4' })
fs.writeFileSync(buildConfigPath, BUILD_CONFIG_YAML, 'utf8')
