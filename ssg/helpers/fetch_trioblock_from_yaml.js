const fs = require('fs')
const yaml = require('js-yaml')
const path = require('path')
const rueten = require('./rueten.js')
const prioritizeImages = require(path.join(__dirname, 'image_prioritizer.js'))

const rootDir = path.join(__dirname, '..')

const sourceDir =  path.join(rootDir, 'source')
const fetchDir =  path.join(sourceDir, '_fetchdir')
const strapiDataDirPath = path.join(sourceDir, '_domainStrapidata')
const domainSpecificsPath = path.join(rootDir, 'domain_specifics.yaml')
const DOMAIN_SPECIFICS = yaml.load(fs.readFileSync(domainSpecificsPath, 'utf8'))
const imageOrder = DOMAIN_SPECIFICS.trioblockImagePriority
const imageOrderDefaults = DOMAIN_SPECIFICS.trioblockImagePriorityDefaults

const DOMAIN = process.env['DOMAIN'] || 'justfilm.ee'

const params = process.argv.slice(2)
const build_type = params[0]
const model_id = params[1]
const addConfigPathAliases = require('./add_config_path_aliases.js')
if(build_type === 'target') {
    addConfigPathAliases(['/home'])
}

const trio_mapping = {
    'poff.ee': 'TrioPOFF',
    'justfilm.ee': 'TrioJustFilm',
    'kinoff.poff.ee': 'TrioKinoff',
    'industry.poff.ee': 'TrioIndustry',
    'shorts.poff.ee': 'TrioShorts',
    'hoff.ee': 'TrioHOFF',
    'kumu.poff.ee': 'TrioKumu',
    'tartuff.ee': 'TrioTartuff',
    'filmikool.poff.ee': 'TrioFilmikool',
    'oyafond.ee': 'TrioBruno',
    'discoverycampus.poff.ee': 'TrioDisCamp'
}
const articleMapping = {
    'poff.ee': 'poffi',
    'justfilm.ee': 'just_filmi',
    'kinoff.poff.ee': 'kinoffi',
    'industry.poff.ee': 'industry',
    'shorts.poff.ee': 'shortsi',
    'hoff.ee': 'hoffi',
    'kumu.poff.ee': 'kumu',
    'tartuff.ee': 'tartuffi',
    'filmikool.poff.ee': 'filmikooli',
    'oyafond.ee': 'bruno',
    'discoverycampus.poff.ee': 'discamp'
}

const strapiDataTrioPath = path.join(strapiDataDirPath, `${trio_mapping[DOMAIN]}.yaml` )
const STRAPIDATA_TRIO = yaml.load(fs.readFileSync(strapiDataTrioPath, 'utf8'))

if (STRAPIDATA_TRIO.length < 1) {
    console.log(`ERROR! No data to fetch for ${DOMAIN} trioblock`)
}

const languages = ['en', 'et', 'ru']

for (const lang of languages) {

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

            let trioArticle = copyData[key][key2][`${articleMapping[DOMAIN]}_article`]
            let trioBlock = copyData[key][key2]

            // PROCESS IMAGES
            // If any images, construct temporary media component for image prioritizer
            if (trioBlock.image) {
                trioBlock.media = {}
                trioBlock.media.image = [trioBlock.image]
                // Delete original image data, as it being no longer needed
                delete trioBlock.image
            }

            // Prioritize images
            const primaryImage = prioritizeImages(trioBlock, imageOrder, imageOrderDefaults)
            if (primaryImage) { trioBlock.heroImage = primaryImage }

            // Delete temporary media component
            delete trioBlock.media

            if (trioArticle !== undefined) {
                buffer.push({
                    'block': trioBlock,
                    'article': trioArticle
                })
                delete trioArticle
            } else if (trioBlock !== undefined) {
                buffer.push({
                    'block': trioBlock,
                })
            }

            delete trioBlock
        }
    }
    const outFile = path.join(fetchDir, `articletrioblock.${lang}.yaml`)

    if(buffer.length > 0) {
        rueten(buffer, lang)
        let allDataYAML = yaml.dump(buffer, { 'noRefs': true, 'indent': '4' })
        fs.writeFileSync(outFile, allDataYAML, 'utf8')
    } else {
        fs.writeFileSync(outFile, '[]', 'utf8')
    }
}
