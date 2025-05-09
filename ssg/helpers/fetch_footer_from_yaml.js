const fs = require('fs')
const yaml = require('js-yaml')
const path = require('path')
const rueten = require('./rueten.js')
const {fetchModel} = require('./b_fetch.js')

const { timer } = require("./timer")
timer.start(__filename)

const rootDir =  path.join(__dirname, '..')
const domainSpecificsPath = path.join(rootDir, 'domain_specifics.yaml')
const DOMAIN_SPECIFICS = yaml.load(fs.readFileSync(domainSpecificsPath, 'utf8'))

const sourceDir =  path.join(rootDir, 'source')
const strapiDataDirPath = path.join(sourceDir, '_domainStrapidata')
const DOMAIN = process.env['DOMAIN'] || 'poff.ee'

const mapping = DOMAIN_SPECIFICS.footer
const strapiDataFooterPath = path.join(strapiDataDirPath, `${mapping[DOMAIN]}.yaml`)
const STRAPIDATA_FOOTERS = yaml.load(fs.readFileSync(strapiDataFooterPath, 'utf8'))

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
    let buffer = [];
    for (index in copyData) {
        if(copyData[index].domain.url === DOMAIN) {
            buffer = rueten(copyData[index], lang)
        }
    }

    const globalDataPath = path.join(sourceDir, `global.${lang}.yaml`)
    let globalData= yaml.load(fs.readFileSync(globalDataPath, 'utf8'))
    globalData.footer = buffer

    globalData.deepchatActiveInWeb = DOMAIN_SPECIFICS.deepchatActiveInWeb[DOMAIN]

    globalData.userprofileRequiredFields = DOMAIN_SPECIFICS.userprofileRequiredFields[DOMAIN] ?? DOMAIN_SPECIFICS.userprofileRequiredFields['poff.ee']

    let allDataYAML = yaml.dump(globalData, { 'noRefs': true, 'indent': '4' })
    fs.writeFileSync(globalDataPath, allDataYAML, 'utf8')
}
timer.log(__filename, `Fetched ${DOMAIN} footer`);
