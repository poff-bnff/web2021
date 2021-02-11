const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');
const rueten = require('./rueten.js')

const rootDir =  path.join(__dirname, '..')
const domainSpecificsPath = path.join(rootDir, 'domain_specifics.yaml')
const DOMAIN_SPECIFICS = yaml.safeLoad(fs.readFileSync(domainSpecificsPath, 'utf8'))

const sourceDir =  path.join(__dirname, '..', 'source')
const fetchDir =  path.join(sourceDir, '_fetchdir')
const strapiDataPath = path.join(fetchDir, 'strapiData.yaml')
const STRAPIDATA = yaml.safeLoad(fs.readFileSync(strapiDataPath, 'utf8'))
const DOMAIN = process.env['DOMAIN'] || 'industry.poff.ee'

const STRAPIDATA_CHANNELS = STRAPIDATA['Channel']
const languages = DOMAIN_SPECIFICS.locales[DOMAIN]
for (const lang of languages) {
    processData(lang, CreateYAML);
    console.log(`Fetching ${DOMAIN} channels ${lang} data`);
}


function processData(lang, CreateYAML) {
    // console.log(util.inspect(data));


    let copyData = JSON.parse(JSON.stringify(STRAPIDATA_CHANNELS));
    // console.log(util.inspect(copyData));
    let buffer = [];
    for (index in copyData) {
        // console.log(index, copyData[index]);
        // console.log('domain', domain);
        // console.log('copydatadomeen', copyData[index].domain);
        if (copyData[index].namePrivate && copyData[index].namePrivate === 'Industry TEST channel') {
            continue
        }
        buffer.push(rueten(copyData[index], lang))
    }
    CreateYAML(buffer, lang);
    // console.log('COPYDATA', copyData.keys());
    // console.log('BUFFER', buffer);
}

function CreateYAML(buffer, lang) {
    let allDataYAML = yaml.safeDump(buffer.sort((a, b) => a.namePrivate.localeCompare(b.namePrivate)), { 'noRefs': true, 'indent': '4' })
    const outFile = path.join(fetchDir, `channels.${lang}.yaml`)
    fs.writeFileSync(outFile, allDataYAML, 'utf8')
}


