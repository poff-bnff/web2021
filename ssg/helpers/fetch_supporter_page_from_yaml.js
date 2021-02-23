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
    'poff.ee': 'POFFSupporter',
    'justfilm.ee': 'JustSupporter',
    'kinoff.poff.ee': 'KinoffiSupporter',
    'industry.poff.ee': 'IndustrySupporter',
    'shorts.poff.ee': 'ShortsSupporter',
    'hoff.ee': 'HoffiSupporter',
    'kumu.poff.ee': 'KumuSupporter',
    'tartuff.ee': 'TartuffiSupporter',
    'filmikool.poff.ee': 'FilmikooliSupporter',
    'oyafond.ee': 'BrunoSupporter'
}

const mapping2 = {
    'poff.ee': 'SupSecPoff',
    'justfilm.ee': 'SupSecJust',
    'kinoff.poff.ee': 'SupSecKinoff',
    'industry.poff.ee': 'SupSecIndustry',
    'shorts.poff.ee': 'SupSecShorts',
    'hoff.ee': 'SupSecHoff',
    'kumu.poff.ee': 'SupSecKumu',
    'tartuff.ee': 'SupSecTartuff'
}

const mapping3 = {
    'poff.ee': 'SupPoff',
    'justfilm.ee': 'SupJust',
    'kinoff.poff.ee': 'SupKinoff',
    'industry.poff.ee': 'SupIndustry',
    'shorts.poff.ee': 'SupShorts',
    'hoff.ee': 'SupHoff',
    'kumu.poff.ee': 'SupKumu',
    'tartuff.ee': 'SupTartuff'
}

const strapiDataSupporterPath = path.join(strapiDataDirPath, `${mapping[DOMAIN]}.yaml`)
const STRAPIDATA_SUPPORTER_PAGES = yaml.safeLoad(fs.readFileSync(strapiDataSupporterPath, 'utf8'))

const minimodel = {
    'domain': {
        model_name: 'Domain'
    },
    'supporters': {
        model_name: mapping2[DOMAIN],
        expand: {
            'supporter': {
                model_name: mapping3[DOMAIN]
                // expand: {
                //     'poffi_article': {
                //         model_name: 'POFFiArticle'
                //     }
                // }
            }
        }
    }
}

STRAPIDATA_SUPPORTER_PAGE = fetchModel(STRAPIDATA_SUPPORTER_PAGES, minimodel)

LangSelect('et');
LangSelect('en');
LangSelect('ru');

function LangSelect(lang) {
    processData(lang, CreateYAML);
    console.log(`Fetching ${DOMAIN} supporter page ${lang} data`);
}


function processData(lang, CreateYAML) {

    let copyData = JSON.parse(JSON.stringify(STRAPIDATA_SUPPORTER_PAGE));
    let buffer = [];

    for (index in copyData) {
        if(copyData[index].domain.url === DOMAIN) {
            buffer = rueten(copyData[index], lang)
        }
    }
    CreateYAML(buffer, lang);
}

function CreateYAML(buffer, lang) {
    let allDataYAML = yaml.safeDump(buffer, { 'noRefs': true, 'indent': '4' })
    const outFile = path.join(fetchDir, `supporterspage.${lang}.yaml`)
    fs.writeFileSync(outFile, allDataYAML, 'utf8')
}


