const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');
const rueten = require('./rueten.js')

const rootDir =  path.join(__dirname, '..')
const domainSpecificsPath = path.join(rootDir, 'domain_specifics.yaml')
const DOMAIN_SPECIFICS = yaml.load(fs.readFileSync(domainSpecificsPath, 'utf8'))

const sourceDir =  path.join(__dirname, '..', 'source')
const fetchDir =  path.join(sourceDir, '_fetchdir')
const strapiDataDirPath = path.join(sourceDir, '_domainStrapidata')
const DOMAIN = process.env['DOMAIN'] || 'poff.ee'

const strapiDataChannelPath = path.join(strapiDataDirPath, 'Channel.yaml')
const STRAPIDATA_CHANNELS = yaml.load(fs.readFileSync(strapiDataChannelPath, 'utf8'))

const languages = DOMAIN_SPECIFICS.locales[DOMAIN]
for (const lang of languages) {
    processData(lang, CreateYAML);
    console.log(`Fetching ${DOMAIN} channels ${lang} data`);
}

function processData(lang, CreateYAML) {

    let copyData = JSON.parse(JSON.stringify(STRAPIDATA_CHANNELS));
    let buffer = [];
    for (index in copyData) {
        if (copyData[index].namePrivate && copyData[index].namePrivate === 'Industry TEST channel') {
            continue
        }
        buffer.push(rueten(copyData[index], lang))
    }
    CreateYAML(buffer, lang);
}

function CreateYAML(buffer, lang) {
    let allDataYAML = yaml.dump(buffer.sort((a, b) => a.namePrivate.localeCompare(b.namePrivate)), { 'noRefs': true, 'indent': '4' })
    const outFile = path.join(fetchDir, `channels.${lang}.yaml`)
    fs.writeFileSync(outFile, allDataYAML, 'utf8')
}


