const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');
const rueten = require('./rueten.js')
const {fetchModel} = require('./b_fetch.js')

const sourceDir =  path.join(__dirname, '..', 'source')
const strapiDataDirPath = path.join(sourceDir, '_domainStrapidata')
const fetchDirDirPath = path.join(sourceDir, '_fetchdir')
const DOMAIN = process.env['DOMAIN'] || 'poff.ee'


const strapiDataLocationPath = path.join(strapiDataDirPath, `Location.yaml`)
const STRAPIDATA_LOCATIONS = yaml.load(fs.readFileSync(strapiDataLocationPath, 'utf8'))

const minimodel = {
    'country': {
        model_name: 'Country',
    },
    'town': {
        model_name: 'Town',
    },
    'cinema': {
        model_name: 'Cinema',
    },
    'hall': {
        model_name: 'Hall',
    },
    'addr_coll': {
        model_name: 'Address',
    },
    'festival_editions': {
        model_name: 'FestivalEdition',
    },
    'tag_secrets': {
        model_name: 'TagSecret',
    },
    'tag_categries': {
        model_name: 'TagCategory',
    },
    'tag_keywords': {
        model_name: 'TagKeyword',
    },
    'tag_locations': {
        model_name: 'TagLocation',
    }
}



STRAPIDATA_LOCATION = fetchModel(STRAPIDATA_LOCATIONS, minimodel)

const languages = ['en', 'et', 'ru']
for (const lang of languages) {

    const locationDataFile =  path.join(fetchDirDirPath, `location.${lang}.yaml`)

    let copyData = JSON.parse(JSON.stringify(STRAPIDATA_LOCATION))
    locationData = rueten(copyData, lang)

    let locationDataYAML = yaml.dump(locationData, { 'noRefs': true, 'indent': '4' })
    fs.writeFileSync(locationDataFile, locationDataYAML, 'utf8')
    console.log(`Fetched ${DOMAIN} location ${lang} data`)
}
