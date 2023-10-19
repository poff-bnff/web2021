const fs = require('fs')
const yaml = require('js-yaml')
const path = require('path')

const rootDir = path.join(__dirname, '..')
const ssgConfPath = path.join(rootDir, 'entu-ssg.yaml')

const templatePath = path.join(rootDir, 'entu-ssg-template.yaml')
const template = yaml.load(fs.readFileSync(templatePath, 'utf8'))

const mappingsPath = path.join(rootDir, 'domain_specifics.yaml')
const mappings = yaml.load(fs.readFileSync(mappingsPath, 'utf8'))

const DOMAIN = process.env['DOMAIN'] || 'poff.ee'
template.locales = mappings.locales[DOMAIN]
template.defaultLocale = mappings.defaultLocale[DOMAIN]

const args = process.argv.slice(2)
if (args.length && args[0] === 'archive') {
    template.build = './archive/' + mappings.domain[DOMAIN]
} else {
    template.build = './build/' + mappings.domain[DOMAIN]
}

let ssg_conf = yaml.dump(template, { 'noRefs': true, 'indent': '4' })

try {
    fs.writeFileSync(ssgConfPath, ssg_conf, 'utf8')
} catch (err) {
    console.error(err)
}
