const fs = require('fs')
const yaml = require('js-yaml')
const path = require('path')
const rueten = require('./rueten.js')

const sourceDir =  path.join(__dirname, '..', 'source')
const fetchDir =  path.join(sourceDir, '_fetchdir')
const strapiDataDirPath = path.join(sourceDir, '_domainStrapidata')
const DOMAIN = process.env['DOMAIN'] || 'poff.ee'

const params = process.argv.slice(2)
const build_type = params[0]
const model_id = params[1]
const addConfigPathAliases = require('./add_config_path_aliases.js')
if(build_type === 'target') {
    addConfigPathAliases(['/home'])
}
const trio2_mapping = {
    'poff.ee': 'TrioPOFF2',
}
const articleMapping = {
    'poff.ee': 'poffi',
}
if (DOMAIN === 'poff.ee'){
    const strapiDataTrioPath = path.join(strapiDataDirPath, `${trio2_mapping[DOMAIN]}.yaml` )
    const STRAPIDATA_TRIO = yaml.load(fs.readFileSync(strapiDataTrioPath, 'utf8'))

    if (STRAPIDATA_TRIO.length < 1) {
        console.log(`ERROR! No data to fetch for ${DOMAIN} trioblock2`)
    }

    const languages = ['en', 'et', 'ru']

    for (const lang of languages) {

        console.log(`Fetching ${DOMAIN} trioblock2 ${lang} data`)

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
        const outFile = path.join(fetchDir, `articletrioblock2.${lang}.yaml`)

        if(buffer.length > 0) {
            rueten(buffer, lang)
            let allDataYAML = yaml.dump(buffer, { 'noRefs': true, 'indent': '4' })
            fs.writeFileSync(outFile, allDataYAML, 'utf8')
        } else {
            fs.writeFileSync(outFile, '[]', 'utf8')
        }
    }

}else {

    let emptyYAML = yaml.dump([], { 'noRefs': true, 'indent': '4' })
    fs.writeFileSync(path.join(fetchDir, `articletrioblock2.et.yaml`), emptyYAML, 'utf8')
    console.log(`Fetching ${DOMAIN} trioblock2 et data`)
    fs.writeFileSync(path.join(fetchDir, `articletrioblock2.en.yaml`), emptyYAML, 'utf8')
    console.log(`Fetching ${DOMAIN} trioblock2 en data`)
    fs.writeFileSync(path.join(fetchDir, `articletrioblock2.ru.yaml`), emptyYAML, 'utf8')
    console.log(`Fetching ${DOMAIN} trioblock2 ru data`)
}
