const fs = require('fs')
const yaml = require('js-yaml')
const path = require('path')
const rueten = require('./rueten.js')

const sourceDir =  path.join(__dirname, '..', 'source')
const strapiDataDirPath = path.join(sourceDir, 'strapidata')
const strapiDataLabelGroupPath = path.join(strapiDataDirPath, 'LabelGroup.yaml')
const STRAPIDATA_LABELGROUP = yaml.safeLoad(fs.readFileSync(strapiDataLabelGroupPath, 'utf8'))
const DOMAIN = process.env['DOMAIN'] || 'poff.ee'

const sourceFolder =  path.join(__dirname, '../source/')

const languages = ['et', 'en', 'ru']

for (const lang of languages) {
    console.log(`Fetching ${DOMAIN} labels ${lang} data`)

    let labelGroups = JSON.parse(JSON.stringify(STRAPIDATA_LABELGROUP))
    rueten(labelGroups, lang)

    let labels = {}
    for (labelGroup of labelGroups) {
        let labelGroupName = labelGroup.name
        labels[labelGroupName] = {}
        for (label of labelGroup.label) {
            if (label.value) {
                labels[labelGroupName][label.name] = label.value
            }
        }
    }

    const globalStatic = path.join(sourceFolder, 'global_static', `global_s.${lang}.yaml`)
    let globalData= yaml.safeLoad(fs.readFileSync(globalStatic, 'utf8'))
    globalData.label = labels
    let allDataYAML = yaml.safeDump(globalData, { 'noRefs': true, 'indent': '4' })
    fs.writeFileSync(`${sourceFolder}global.${lang}.yaml`, allDataYAML, 'utf8')
}


