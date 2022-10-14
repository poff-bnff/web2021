const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');
const rueten = require('./rueten.js')
const {fetchModel} = require('./b_fetch.js')

const rootDir = path.join(__dirname, '..')
const domainSpecificsPath = path.join(rootDir, 'domain_specifics.yaml')
const DOMAIN_SPECIFICS = yaml.load(fs.readFileSync(domainSpecificsPath, 'utf8'))

const sourceDir =  path.join(__dirname, '..', 'source')
const strapiDataDirPath = path.join(sourceDir, '_domainStrapidata')
const fetchDirDirPath = path.join(sourceDir, '_fetchdir')
const DOMAIN = process.env['DOMAIN'] || 'poff.ee'

if (DOMAIN !== 'industry.poff.ee') {
    console.log('Skipping locations fetch as domain is not industry.poff.ee');
    return
}

const strapiDataLocationPath = path.join(strapiDataDirPath, `Location.yaml`)
const STRAPIDATA_LOCATIONS_FULL = yaml.load(fs.readFileSync(strapiDataLocationPath, 'utf8'))

const strapiDataTagLocationsPath = path.join(strapiDataDirPath, `TagCategory.yaml`)
const TAG_CATEGORIES = yaml.load(fs.readFileSync(strapiDataTagLocationsPath, 'utf8'))

const fetchDataDir = path.join(fetchDirDirPath, 'locations')
const locationYamlNameSuffix = 'locations'
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
    'tag_keywords': {
        model_name: 'TagKeyword',
    },
    'tag_locations': {
        model_name: 'TagLocation',
        expand: {
            'tag_categories': {
                model_name: 'TagCategory'
            }
        }
    }
}

STRAPIDATA_LOCATIONS = fetchModel(STRAPIDATA_LOCATIONS_FULL, minimodel)
STRAPIDATA_LOCATIONS.filter( e => e.name)
const languages = DOMAIN_SPECIFICS.locales[DOMAIN]

startLocationProcessing(languages, STRAPIDATA_LOCATIONS )

function startLocationProcessing(languages, STRAPIDATA_LOCATIONS) {
    for (const lang of languages) {

        let copyData = []
        for(const ix in STRAPIDATA_LOCATIONS) {
            let location = JSON.parse(JSON.stringify(STRAPIDATA_LOCATIONS[ix]))

                location = rueten(location, lang)
                let slugifyName = slugify(`${location.name}-${location.id}`)
                location.path = slugifyName
                location.slug = slugifyName

                if(location.tag_locations) {
                    let sorted_tag_categories = TAG_CATEGORIES.sort((a, b) => (a.order > b.order)? 1: -1)
                    let sorted_tag_locations = location.tag_locations.sort((a, b) => (a.order > b.order)? 1: -1)


                    let list = sorted_tag_categories.map(category => {

                        if(category.active == true) {
                            let data = {
                                "id": category.id,
                                "name": category.name
                            }
                            if(category.select_one){
                                data.select_one = category.select_one
                            }

                            let tags = []
                            sorted_tag_locations.filter( loc_tag => {
                                category.tag_locations.forEach( cat_tag => {
                                    if (loc_tag.id === cat_tag.id){
                                        tags.push({
                                            "id": loc_tag.id,
                                            "name": loc_tag.name
                                        })
                                    }
                                })

                            })

                            return {"category": data, "tags": tags}
                        }

                    })


                    location.tag_list = list.filter( e => {
                        return e.tags.length > 0
                    })
                }


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

                copyData.push(location)
        }

        const locationDataFile =  path.join(fetchDirDirPath, `${locationYamlNameSuffix}.${lang}.yaml`)


        locationData = rueten(copyData, lang)

        let locationDataYAML = yaml.dump(locationData, { 'noRefs': true, 'indent': '4' })
        fs.writeFileSync(locationDataFile, locationDataYAML, 'utf8')
        console.log(`Fetched ${DOMAIN} location ${lang} data`)

        generateLocationsSearchAndFilterYamls(locationData, lang, locationYamlNameSuffix);
    }
}

function mSort(to_sort, lang) {
    // Töötav sorteerimisfunktsioon filtritele

    let sortable = []
    for (var item in to_sort) {
        sortable.push([item, to_sort[item]]);
    }

    sortable = sortable.sort(function (a, b) {
        try {
            const locale_sort = a[1].localeCompare(b[1], lang)
            return locale_sort
        } catch (error) {
            console.log('failed to sort', JSON.stringify({ a, b }, null, 4));
            throw new Error(error)
        }
    });

    var objSorted = {}
    for (let index = 0; index < sortable.length; index++) {
        const item = sortable[index];
        objSorted[item[0]] = item[1]
    }
    return objSorted
}

function generateLocationsSearchAndFilterYamls(allData, lang, yamlNameSuffix) {
    let filters = {
        names: {},
        addresses: {},
    };

    const locations_search = allData.map(location => {

        let names = [];
        if (typeof location.name !== 'undefined') {
            names.push(location.name);
            filters.names[location.name] = location.name;
        }

        let addresses = [];
        if(location.addr_coll) {
            if(typeof location.addr_coll.hr_address !== 'undefined') {
                addresses.push(location.addr_coll.hr_address)
                filters.addresses[location.addr_coll.hr_address] = location.addr_coll.hr_address
            }
        }

        // for (const addr of (location.addr_coll.hr_address || [])
        //     .sort(function (a, b) { return (a.order > b.order) ? 1 : ((b.order > a.order) ? -1 : 0); })
        //     || []) {
        //     const addrName = addr.addrName;
        //     addratfilms.push(addrName);
        //     filters.addresses[addrName] = addrName;
        // }

        return {
            id: location.id,
            text: [
                location.name,
                location.addr_coll?.hr_address,
                // location.dateOfBirth,
                // location.profession,
                // location.lookingFor,
                // location.website,
            ].join(' ').toLowerCase(),
            names: names,
            addresses: addresses,
            // nativelangs: nativelangs,
        };
    });

    let sorted_filters = {
        names: mSort(filters.names, lang),
        addresses: mSort(filters.addresses, lang),
        // nativelangs: mSort(filters.nativelangs, lang),
    };

    let searchYAML = yaml.dump(locations_search, { 'noRefs': true, 'indent': '4' });
    fs.writeFileSync(path.join(fetchDirDirPath, `search_${yamlNameSuffix}.${lang}.yaml`), searchYAML, 'utf8');

    let filtersYAML = yaml.dump(sorted_filters, { 'noRefs': true, 'indent': '4' });
    fs.writeFileSync(path.join(fetchDirDirPath, `filters_${yamlNameSuffix}.${lang}.yaml`), filtersYAML, 'utf8');
}
