const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');
const rueten = require('./rueten.js')
const {fetchModel} = require('./b_fetch.js')

const sourceDir =  path.join(__dirname, '..', 'source')
const fetchDir =  path.join(sourceDir, '_fetchdir')
const strapiDataDirPath = path.join(sourceDir, 'strapidata')
const DOMAIN = process.env['DOMAIN'] || 'poff.ee'

const mapping = {
    'poff.ee': 'POFFiMenu',
    'justfilm.ee': 'JustFilmiMenu',
    'kinoff.poff.ee': 'KinoffiMenu',
    'industry.poff.ee': 'IndustryMenu',
    'shorts.poff.ee': 'ShortsiMenu',
    'hoff.ee': 'HOFFiMenu',
    'kumu.poff.ee': 'KumuMenu',
    'tartuff.ee': 'TartuffiMenu'
}
const strapiDataMenuPath = path.join(strapiDataDirPath, `${mapping[DOMAIN]}.yaml`)
const STRAPIDATA_MENUS = yaml.safeLoad(fs.readFileSync(strapiDataMenuPath, 'utf8'))

const artMapping = {
    'poff.ee': 'poffi_article',
    'justfilm.ee': 'just_filmi_article',
    'kinoff.poff.ee': 'kinoffi_article',
    'industry.poff.ee': 'industry_article',
    'shorts.poff.ee': 'shortsi_article',
    'hoff.ee': 'hoffi_article'
}
const artMapping2 = {
    'poff.ee': 'POFFiArticle',
    'justfilm.ee': 'JustFilmiArticle',
    'kinoff.poff.ee': 'KinoffiArticle',
    'industry.poff.ee': 'IndustryArticle',
    'shorts.poff.ee': 'ShortsiArticle',
    'hoff.ee': 'HOFFiArticle'
}
const minimodel = {
    [`${artMapping[DOMAIN]}`]: {
        model_name: artMapping2[DOMAIN]
    },
}
STRAPIDATA_MENU = fetchModel(STRAPIDATA_MENUS, minimodel)

const languages = ['en', 'et', 'ru']
for (const lang of languages) {

    const globalDataFile =  path.join(sourceDir, `global.${lang}.yaml`)
    let globalData = yaml.safeLoad(fs.readFileSync(globalDataFile, 'utf8'))
    globalData.menu = []

    let copyData = JSON.parse(JSON.stringify(STRAPIDATA_MENU))
    for (values in copyData) {
        globalData.menu.push(rueten(copyData[values], lang))
    }

    let globalDataYAML = yaml.safeDump(globalData, { 'noRefs': true, 'indent': '4' })
    fs.writeFileSync(globalDataFile, globalDataYAML, 'utf8')
    console.log(`Fetched ${DOMAIN} menu ${lang} data`)
}
