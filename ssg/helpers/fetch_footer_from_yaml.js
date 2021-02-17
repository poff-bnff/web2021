const fs = require('fs')
const yaml = require('js-yaml')
const path = require('path')
const rueten = require('./rueten.js')
const {fetchModel} = require('./b_fetch.js')

const { timer } = require("./timer")
timer.start(__filename)

const rootDir =  path.join(__dirname, '..')
const domainSpecificsPath = path.join(rootDir, 'domain_specifics.yaml')
const DOMAIN_SPECIFICS = yaml.safeLoad(fs.readFileSync(domainSpecificsPath, 'utf8'))

const sourceDir =  path.join(rootDir, 'source')
const fetchDir =  path.join(sourceDir, '_fetchdir')
const strapiDataDirPath = path.join(sourceDir, 'strapidata')
const DOMAIN = process.env['DOMAIN'] || 'justfilm.ee'

const mapping = DOMAIN_SPECIFICS.footer
const strapiDataFooterPath = path.join(strapiDataDirPath, `${mapping[DOMAIN]}.yaml`)
const STRAPIDATA_FOOTERS = yaml.safeLoad(fs.readFileSync(strapiDataFooterPath, 'utf8'))

const minimodel = {
    'domain': {
        model_name: 'Domain'
    }
}

const STRAPIDATA_FOOTER = fetchModel(STRAPIDATA_FOOTERS, minimodel)
const allLanguages = DOMAIN_SPECIFICS.locales[DOMAIN]
for (const lang of allLanguages) {
    timer.log(__filename, `Fetching ${DOMAIN} footer ${lang} data`);

    let copyData = JSON.parse(JSON.stringify(STRAPIDATA_FOOTER));
    // timer.log(__filename, util.inspect(copyData));
    let buffer = [];
    for (index in copyData) {
        if(copyData[index].domain.url === DOMAIN) {
            buffer = rueten(copyData[index], lang)
        }
    }

    const globalDataPath = path.join(sourceDir, `global.${lang}.yaml`)
    // timer.log(__filename, buffer);
    let globalData= yaml.safeLoad(fs.readFileSync(globalDataPath, 'utf8'))
    // timer.log(__filename, globalData);
    globalData.footer = buffer

    let allDataYAML = yaml.safeDump(globalData, { 'noRefs': true, 'indent': '4' })
    fs.writeFileSync(globalDataPath, allDataYAML, 'utf8')
}
timer.log(__filename, `Fetched ${DOMAIN} footer`);
