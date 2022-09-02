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
const STRAPIDATA_LOCATIONS_FULL = yaml.load(fs.readFileSync(strapiDataLocationPath, 'utf8'))

const fetchDataDir = path.join(fetchDirDirPath, 'locations')

function slugify(text) {
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')           // Replace spaces with -
        .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
        .replace(/\-\-+/g, '-')         // Replace multiple - with single -
        .replace(/^-+/, '')             // Trim - from start of text
        .replace(/-+$/, '');            // Trim - from end of text
}

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
        expand: {
            'country': {
                model_name: 'Country',
            },
            'county': {
                model_name: 'County',
            },
            'municipality': {
                model_name: 'Municipality'
            }
        }
    },
    'festival_editions': {
        model_name: 'FestivalEdition',
    },
    'tag_secrets': {
        model_name: 'TagSecret',
    },
    'tag_categories': {
        model_name: 'TagCategory',
        expand: {
            'tag_locations': {
                model_name: 'TagLocation',
            }
        }
    },
    'tag_keywords': {
        model_name: 'TagKeyword',
    },
    'tag_locations': {
        model_name: 'TagLocation',
    }
}



STRAPIDATA_LOCATIONS = fetchModel(STRAPIDATA_LOCATIONS_FULL, minimodel)

STRAPIDATA_LOCATIONS.filter( e => e.name)

const languages = ['en', 'et', 'ru']
for (const lang of languages) {

    for(const ix in STRAPIDATA_LOCATIONS) {
        let location = JSON.parse(JSON.stringify(STRAPIDATA_LOCATIONS[ix]))

            location = rueten(location, lang)
            let slugifyName = slugify(`${location.name}-${location.id}`)
            location.path = slugifyName
            location.slug = slugifyName

            let oneYaml = {}
            try {
                oneYaml = yaml.dump(location, { 'noRefs': true, 'indent': '4' })
            } catch (error) {
                console.error({ error, location })
                throw error
            }

            const yamlPath = path.join(fetchDataDir, slugifyName, `data.${lang}.yaml`)
            let saveDir = path.join(fetchDataDir, slugifyName);
            fs.mkdirSync(saveDir, { recursive: true });

            fs.writeFileSync(yamlPath, oneYaml, 'utf8');
            fs.writeFileSync(`${saveDir}/index.pug`, `include /_templates/location_template.pug`)

    }

    const locationDataFile =  path.join(fetchDirDirPath, `locations.${lang}.yaml`)

    let copyData = JSON.parse(JSON.stringify(STRAPIDATA_LOCATIONS))
    locationData = rueten(copyData, lang)

    let locationDataYAML = yaml.dump(locationData, { 'noRefs': true, 'indent': '4' })
    fs.writeFileSync(locationDataFile, locationDataYAML, 'utf8')
    console.log(`Fetched ${DOMAIN} location ${lang} data`)
}
