const fs = require('fs')
const yaml = require('js-yaml')
const path = require('path')
const rueten = require('./rueten.js')
const {fetchModel} = require('./b_fetch.js')

const sourceDir =  path.join(__dirname, '..', 'source')
const fetchDir =  path.join(sourceDir, '_fetchdir')
const strapiDataDirPath = path.join(sourceDir, 'strapidata')
const DOMAIN = process.env['DOMAIN'] || 'poff.ee'

const mapping = {
    'poff.ee': 'TrioPOFF',
    'justfilm.ee': 'TrioJustFilm',
    'kinoff.poff.ee': 'TrioKinoff',
    'industry.poff.ee': 'TrioIndustry',
    'shorts.poff.ee': 'TrioShorts',
    'hoff.ee': 'TrioHOFF'
}
const articleMapping = {
    'poff.ee': 'poffi',
    'justfilm.ee': 'just_filmi',
    'kinoff.poff.ee': 'kinoffi',
    'industry.poff.ee': 'industry',
    'shorts.poff.ee': 'shortsi',
    'hoff.ee': 'hoffi'
}
//used for minimodel
const mappingMini = {
    'poff.ee': 'trioPoff',
    'justfilm.ee': 'trioJustFilm',
    'kinoff.poff.ee': 'trioKinoff',
    'industry.poff.ee': 'trioIndustry',
    'shorts.poff.ee': 'trioShorts',
    'hoff.ee': 'trioHoff'
}

const strapiDataTrioPath = path.join(strapiDataDirPath, `${mapping[DOMAIN]}.yaml` )
const STRAPIDATA_TRIO = yaml.safeLoad(fs.readFileSync(strapiDataTrioPath, 'utf8'))

if (STRAPIDATA_TRIO.length < 1) {
    console.log(`ERROR! No data to fetch for ${DOMAIN} trioblock`)
}

const languages = ['en', 'et', 'ru']


for (const lang of languages) {

    // const minimodel_trio = {
    //     [`${mappingMini[DOMAIN]}_${lang}`]: {
    //         model_name: 'ArticleType'
    //     },
    // }
    // STRAPIDATA_TRIO = fetchModel(STRAPIDATA_TRIOS, minimodel_trio)

    console.log(`Fetching ${DOMAIN} trioblock ${lang} data`)

    let copyData = JSON.parse(JSON.stringify(STRAPIDATA_TRIO[0]))
    let buffer = []
    for (key in copyData) {
        if (key.split('_')[1] !== lang) {
            continue
        }
        for (key2 in copyData[key]) {
            if (key2.split('_')[0] !== 'trioItem') {
                continue
            }

            if (copyData[key][key2][`${articleMapping[DOMAIN]}_article`] !== undefined) {
                buffer.push({
                    'block': copyData[key][key2],
                    'article': copyData[key][key2][`${articleMapping[DOMAIN]}_article`]
                })
                delete copyData[key][key2][`${articleMapping[DOMAIN]}_article`]
            } else if (copyData[key][key2] !== undefined) {
                buffer.push({
                    'block': copyData[key][key2],
                })
            }

            delete copyData[key][key2]
        }
    }
    // console.log(buffer);
    const outFile = path.join(fetchDir, `articletrioblock.${lang}.yaml`)

    if(buffer.length > 0) {
        rueten(buffer, lang)
        let allDataYAML = yaml.safeDump(buffer, { 'noRefs': true, 'indent': '4' })
        fs.writeFileSync(outFile, allDataYAML, 'utf8')
    } else {
        fs.writeFileSync(outFile, '[]', 'utf8')
    }
}
