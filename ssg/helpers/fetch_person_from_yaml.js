const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');
const rueten = require('./rueten.js');
const videoUrlToVideoCode = require('./videourl_to_videocode.js');
const { fetchModel } = require('./b_fetch.js')
// const replaceLinks = require('./replace_links.js')
// const addConfigPathAliases = require('./add_config_path_aliases.js')
// const prioritizeImages = require(path.join(__dirname, 'image_prioritizer.js'))

const rootDir = path.join(__dirname, '..')
const domainSpecificsPath = path.join(rootDir, 'domain_specifics.yaml')
const DOMAIN_SPECIFICS = yaml.load(fs.readFileSync(domainSpecificsPath, 'utf8'))

const sourceDir = path.join(rootDir, 'source');
const fetchDir = path.join(sourceDir, '_fetchdir');
const strapiDataPath = path.join(sourceDir, '_allStrapidata', 'Person.yaml');
const DOMAIN = process.env['DOMAIN'] || 'industry.poff.ee';

const fetchDataDir = path.join(fetchDir, 'persons')

// function slugify(text) {
//     return text.toString().toLowerCase()
//         .replace(/\s+/g, '-')           // Replace spaces with -
//         .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
//         .replace(/\-\-+/g, '-')         // Replace multiple - with single -
//         .replace(/^-+/, '')             // Trim - from start of text
//         .replace(/-+$/, '');            // Trim - from end of text
// }

if (DOMAIN !== 'industry.poff.ee') {
    let emptyYAML = yaml.dump([], {
        'noRefs': true,
        'indent': '4'
    })
    fs.writeFileSync(path.join(fetchDir, `search_persons.en.yaml`), emptyYAML, 'utf8')
    fs.writeFileSync(path.join(fetchDir, `filters_persons.en.yaml`), emptyYAML, 'utf8')
    fs.writeFileSync(path.join(fetchDir, `persons.en.yaml`), emptyYAML, 'utf8')
} else {
    const STRAPIDATA_PERSON = yaml.load(fs.readFileSync(strapiDataPath, 'utf8'))

    const minimodel = {
        'gender': {
            model_name: 'Gender'
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
        'role_at_films': {
            model_name: 'RoleAtFilm'
        },
        'organisations': {
            model_name: 'Organisation'
        },
        'industry_categories': {
            model_name: 'IndustryCategory'
        },
        'eye_colour': {
            model_name: 'EyeColour'
        },
        'hair_colour': {
            model_name: 'HairColour'
        },
        'shoe_size': {
            model_name: 'ShoeSize'
        },
        'pitch_of_voice': {
            model_name: 'PitchOfVoice'
        },
        'country': {
            model_name: 'Country'
        },
        'other_lang': {
            model_name: 'Language'
        },
        'native_lang': {
            model_name: 'Language'
        },
        'tag_secrets': {
            model_name: 'TagSecret'
        },
        'industry_person_types': {
            model_name: 'IndustryPersonType'
        },
        'stature': {
            model_name: 'Stature'
        },
        'filmographies': {
            model_name: 'Filmography',
            expand: {
                'tag_film_types': {
                    model_name: 'TagFilmType',
                },
                'role_at_films': {
                    model_name: 'RoleAtFilm',
                },
                'type_of_work': {
                    model_name: 'TypeOfWork'
                }
            }
        }
    }
    console.log(`Fetching ${DOMAIN} persons data`)
    const STRAPIDATA_ALL_PERSONS = fetchModel(STRAPIDATA_PERSON, minimodel)
    console.log(`Fetched ${STRAPIDATA_ALL_PERSONS.length} ${DOMAIN} persons data`)

    const languages = DOMAIN_SPECIFICS.locales[DOMAIN]

    const activeEditions = DOMAIN_SPECIFICS.active_editions['industry.poff.ee']
    console.log('activeEditions', activeEditions)
    const personsWithEditions = STRAPIDATA_ALL_PERSONS.filter(p => p.festival_editions && p.festival_editions.length)
    console.log('personsWithEditions', personsWithEditions.length)
    const activePersons = personsWithEditions
        .filter(p => {
            const feIds = (p.festival_editions || []).map(fe => fe.id) || []
            return feIds.some(id => activeEditions.includes(id))})
    console.log('activePersons', activePersons.length)
    startPersonProcessing(languages, activePersons)
}

function mSort(to_sort) {
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

function startPersonProcessing(languages, STRAPIDATA_PERSONS) {
    for (lang of languages) {

        console.log(`Fetching ${DOMAIN} persons ${lang} data`)

        allData = []
        for (const ix in STRAPIDATA_PERSONS) {
            let person = JSON.parse(JSON.stringify(STRAPIDATA_PERSONS[ix]));
            person = rueten(person, lang);

            let personSlug = person.slug
            // if slug is not defined, then skip this person
            if (!personSlug) {
                console.info(`Person ${person.id} has no slug, skipping`);
                continue
            }
            person.path = personSlug;
            person.slug = personSlug;

            if (person.showreel) {
                person.showreel = videoUrlToVideoCode(person.showreel)
            }

            let oneYaml = {}
            try {
                oneYaml = yaml.dump(person, { 'noRefs': true, 'indent': '4' })
            } catch (error) {
                console.error({ error, person })
                throw error
            }

            let saveDir = path.join(fetchDataDir, personSlug)
            fs.mkdirSync(saveDir, { recursive: true })
            fs.writeFileSync(`${saveDir}/data.${lang}.yaml`, oneYaml, 'utf8')
            fs.writeFileSync(`${saveDir}/index.pug`, `include /_templates/person_index_template.pug`)
            // console.log(`Fetched ${DOMAIN} person ${person.id} data`)
            allData.push(person);
        }

        const yamlPath = path.join(fetchDir, `persons.${lang}.yaml`)

        if (!allData.length) {
            console.log(`No data for persons, creating empty YAMLs`)
            fs.writeFileSync(yamlPath, '[]', 'utf8')
            fs.writeFileSync(path.join(fetchDir, `search_persons.${lang}.yaml`), '[]', 'utf8')
            fs.writeFileSync(path.join(fetchDir, `filters_persons.${lang}.yaml`), '[]', 'utf8')
            continue
        }

        allData = allData.sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`, lang))
        const allDataYAML = yaml.dump(allData, { 'noRefs': true, 'indent': '4' });
        fs.writeFileSync(yamlPath, allDataYAML, 'utf8');
        console.log(`Fetched ${allData.length} persons for ${DOMAIN}`);
        generatePersonsSearchAndFilterYamls(allData, lang);
    }
}

function generatePersonsSearchAndFilterYamls(allData, lang) {
    let filters = {
        genders: {},
        roleatfilms: {},
        nativelangs: {},
        types: {},
        icategories: {},
    };

    const persons_search = allData.map(person => {

        let genders = [];
        if (typeof person.gender !== 'undefined') {
            genders.push(person.gender);
            filters.genders[person.gender] = person.gender;
        }

        let roleatfilms = [];
        for (const role of (person.role_at_films || [])
            .sort(function (a, b) { return (a.order > b.order) ? 1 : ((b.order > a.order) ? -1 : 0); })
            || []) {
            const roleName = role.roleName;
            roleatfilms.push(roleName);
            filters.roleatfilms[roleName] = roleName;
        }

        let nativelangs = [];
        if (person.native_lang) {
            nativelangs.push(person.native_lang.name);
            filters.nativelangs[person.native_lang.name] = person.native_lang.name;
        }

        let industryPersonTypes = [];
        if (person.industry_person_types) {
            for (type of person.industry_person_types) {
                industryPersonTypes.push(type.type);
                filters.types[type.type] = type.type;
            }
        }

        let industryCategories = [];
        if (person.industry_categories) {
            console.log('cccc', person.industry_categories)
            for (icategory of person.industry_categories) {
                console.log('icic', icategory.name)
                industryCategories.push(icategory.name);
                filters.icategories[icategory.name] = icategory.name;
            }
        } else {
            console.log('xxxx', Object.keys(person))
        }

        return {
            id: person.id,
            text: [
                person.firstNameLastName,
                person.email,
                person.dateOfBirth,
                person.profession,
                person.lookingFor,
                person.website,
                // filmographies,
            ].join(' ').toLowerCase(),
            genders: genders,
            roleatfilms: roleatfilms,
            nativelangs: nativelangs,
            types: industryPersonTypes,
            icategories: industryCategories,
        };
    });

    let sorted_filters = {
        genders: mSort(filters.genders),
        roleatfilms: mSort(filters.roleatfilms),
        nativelangs: mSort(filters.nativelangs),
        types: mSort(filters.types),
        icategories:  mSort(filters.icategories),
    };

    let searchYAML = yaml.dump(persons_search, { 'noRefs': true, 'indent': '4' });
    fs.writeFileSync(path.join(fetchDir, `search_persons.${lang}.yaml`), searchYAML, 'utf8');

    let filtersYAML = yaml.dump(sorted_filters, { 'noRefs': true, 'indent': '4' });
    fs.writeFileSync(path.join(fetchDir, `filters_persons.${lang}.yaml`), filtersYAML, 'utf8');
}

