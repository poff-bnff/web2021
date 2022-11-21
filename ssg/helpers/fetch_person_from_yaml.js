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
const strapiDataPath = path.join(sourceDir, '_domainStrapidata', 'Person.yaml');
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

    const STRAPIDATA_ALL_PERSONS = fetchModel(STRAPIDATA_PERSON, minimodel)

    const languages = DOMAIN_SPECIFICS.locales[DOMAIN]

    let activePersonsYamlNameSuffix = 'persons'
    let activePersons = STRAPIDATA_ALL_PERSONS.filter(p => p?.festival_editions?.map(fe => fe.id).some(id => DOMAIN_SPECIFICS.active_industry_editions.includes(id)))

    startPersonProcessing(languages, activePersons, activePersonsYamlNameSuffix)


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

function startPersonProcessing(languages, STRAPIDATA_PERSONS, personsYamlNameSuffix) {
    for (lang of languages) {

        console.log(`Fetching ${DOMAIN} ${personsYamlNameSuffix} ${lang} data`);

        allData = []
        for (const ix in STRAPIDATA_PERSONS) {
            let person = JSON.parse(JSON.stringify(STRAPIDATA_PERSONS[ix]));

            // rueten func. is run for each person separately instead of whole data, that is
            // for the purpose of saving slug_en before it will be removed by rueten func.
            person = rueten(person, lang);
            // person.path = person.slug;
            // let slugifyName = slugify(`${person.firstNameLastName}-${person.id}`)
            // person.path = slugifyName;
            // person.slug = slugifyName;

            let personSlug = person.slug
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

            const yamlPath = path.join(fetchDataDir, personSlug, `data.${lang}.yaml`);
            let saveDir = path.join(fetchDataDir, personSlug);
            fs.mkdirSync(saveDir, { recursive: true });

            fs.writeFileSync(yamlPath, oneYaml, 'utf8');
            fs.writeFileSync(`${saveDir}/index.pug`, `include /_templates/person_index_template.pug`)

            allData.push(person);
        }

        const yamlPath = path.join(fetchDir, `${personsYamlNameSuffix}.${lang}.yaml`)

        if (!allData.length) {
            console.log(`No data for ${personsYamlNameSuffix}, creating empty YAMLs`)
            fs.writeFileSync(yamlPath, '[]', 'utf8')
            fs.writeFileSync(path.join(fetchDir, `search_${personsYamlNameSuffix}.${lang}.yaml`), '[]', 'utf8')
            fs.writeFileSync(path.join(fetchDir, `filters_${personsYamlNameSuffix}.${lang}.yaml`), '[]', 'utf8')
            continue
        }

        allData = allData.sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`, lang))
        const allDataYAML = yaml.dump(allData, { 'noRefs': true, 'indent': '4' });
        fs.writeFileSync(yamlPath, allDataYAML, 'utf8');
        console.log(`Fetched ${allData.length} persons for ${DOMAIN}`);
        generatePersonsSearchAndFilterYamls(allData, lang, personsYamlNameSuffix);

    }
}

function generatePersonsSearchAndFilterYamls(allData, lang, yamlNameSuffix) {
    let filters = {
        genders: {},
        roleatfilms: {},
        nativelangs: {},
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

        // let filmographies = [];
        // const filmography = person.filmographies;
        // if (filmography && filmography.text) {
        //     filmographies.push(filmography.text);
        // }
        // if (filmography && filmography.film) {
        //     for (const film of filmography.film) {
        //         filmographies.push(`${film.title} ${film.title} ${film.synopsis}`);
        //     }
        // }

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
        };
    });

    let sorted_filters = {
        genders: mSort(filters.genders),
        roleatfilms: mSort(filters.roleatfilms),
        nativelangs: mSort(filters.nativelangs),
    };

    let searchYAML = yaml.dump(persons_search, { 'noRefs': true, 'indent': '4' });
    fs.writeFileSync(path.join(fetchDir, `search_${yamlNameSuffix}.${lang}.yaml`), searchYAML, 'utf8');

    let filtersYAML = yaml.dump(sorted_filters, { 'noRefs': true, 'indent': '4' });
    fs.writeFileSync(path.join(fetchDir, `filters_${yamlNameSuffix}.${lang}.yaml`), filtersYAML, 'utf8');
}

