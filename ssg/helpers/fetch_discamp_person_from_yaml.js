const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');
const rueten = require('./rueten.js');
const {fetchModel} = require('./b_fetch.js')
const replaceLinks = require('./replace_links.js')

const rootDir =  path.join(__dirname, '..')
const domainSpecificsPath = path.join(rootDir, 'domain_specifics.yaml')
const DOMAIN_SPECIFICS = yaml.load(fs.readFileSync(domainSpecificsPath, 'utf8'))
const DISCAMP_ACTIVE_FESTIVAL_EDITIONS = DOMAIN_SPECIFICS.active_discamp_editions
const sourceDir =  path.join(rootDir, 'source');
const fetchDir =  path.join(sourceDir, '_fetchdir');
const fetchDataDir =  path.join(fetchDir, 'discamppersons');
const strapiDataPath = path.join(sourceDir, '_domainStrapidata', 'DisCampPerson.yaml');
const DOMAIN = process.env['DOMAIN'] || 'discoverycampus.poff.ee';

if (DOMAIN !== 'discoverycampus.poff.ee') {
    let emptyYAML = yaml.dump([], {
        'noRefs': true,
        'indent': '4'
    })
    fs.writeFileSync(path.join(fetchDir, `search_discamp_persons.en.yaml`), emptyYAML, 'utf8')
    fs.writeFileSync(path.join(fetchDir, `filters_discamp_persons.en.yaml`), emptyYAML, 'utf8')
    fs.writeFileSync(path.join(fetchDir, `discamppersons.en.yaml`), emptyYAML, 'utf8')
} else {
    const STRAPIDATA_DC_PERSON = yaml.load(fs.readFileSync(strapiDataPath, 'utf8'))

    const minimodel = {
        'person': {
            model_name: 'Person'
        },
        'profilePicAtInd': {
            model_name: 'StrapiMedia'
        },
        'role_at_films': {
            model_name: 'RoleAtFilm'
        },
        'images': {
            model_name: 'StrapiMedia'
        },
        'filmography': {
            model_name: 'Filmography'
        },
        'dis-camp_person_types': {
            model_name: 'DisCampPersonType'
        }
    }

    const STRAPIDATA_ALL_FE_DC_PERSONS = fetchModel(STRAPIDATA_DC_PERSON, minimodel)
    const STRAPIDATA_DC_PERSONS = STRAPIDATA_ALL_FE_DC_PERSONS.filter(p => p.festival_editions && p.festival_editions.map(ed => ed.id).some(id => DISCAMP_ACTIVE_FESTIVAL_EDITIONS.includes(id)))

    const rootDir =  path.join(__dirname, '..')
    const domainSpecificsPath = path.join(rootDir, 'domain_specifics.yaml')
    const DOMAIN_SPECIFICS = yaml.load(fs.readFileSync(domainSpecificsPath, 'utf8'))


    const languages = DOMAIN_SPECIFICS.locales[DOMAIN]
    for (lang of languages) {

        console.log(`Fetching ${DOMAIN} discamp persons ${lang} data`);

        allData = []
        for (const ix in STRAPIDATA_DC_PERSONS) {
            let discamp_person = JSON.parse(JSON.stringify(STRAPIDATA_DC_PERSONS[ix]));

            var templateDomainName = 'discamp';

            // rueten func. is run for each discamp_person separately instead of whole data, that is
            // for the purpose of saving slug_en before it will be removed by rueten func.
            discamp_person = rueten(discamp_person, lang);

            const filmography = discamp_person.filmography || {}
            const films = filmography.film || []

            films.forEach(film => {
                const images = film.images || []
                images.forEach(image => {
                    image.url = image.url || ''
                    image.url = replaceLinks(image.url)
                })
            })

            if (!discamp_person.person) {
                console.log(`ERROR! discamp person ID ${discamp_person.id} not linked to any person, skipped.`)
                continue
            }
            discamp_person.path = discamp_person.slug;

            if (discamp_person.clipUrl) {
                if(discamp_person.clipUrl && discamp_person.clipUrl.length > 10) {
                    if (discamp_person.clipUrl.includes('vimeo')) {
                        let splitVimeoLink = discamp_person.clipUrl.split('/')
                        let videoCode = splitVimeoLink !== undefined ? splitVimeoLink[splitVimeoLink.length-1] : ''
                        if (videoCode.length === 9) {
                            discamp_person.clipUrlCode = videoCode
                        }
                    } else {
                        let splitYouTubeLink = discamp_person.clipUrl.split('=')[1]
                        let splitForVideoCode = splitYouTubeLink !== undefined ? splitYouTubeLink.split('&')[0] : ''
                        if (splitForVideoCode.length === 11) {
                            discamp_person.clipUrlCode = splitForVideoCode
                        }
                    }
                }
            }

            let oneYaml = {}
            try {
                oneYaml = yaml.dump(discamp_person, { 'noRefs': true, 'indent': '4' })
            } catch (error) {
                console.error({error, discamp_person})
                throw error
            }

            const yamlPath = path.join(fetchDataDir, discamp_person.slug, `data.${lang}.yaml`);
            let saveDir = path.join(fetchDataDir, discamp_person.slug);
            fs.mkdirSync(saveDir, { recursive: true });

            fs.writeFileSync(yamlPath, oneYaml, 'utf8');
            fs.writeFileSync(`${saveDir}/index.pug`, `include /_templates/discampperson_${templateDomainName}_index_template.pug`)
            allData.push(discamp_person);
        }

        const yamlPath = path.join(fetchDir, `discamppersons.${lang}.yaml`)

        if (!allData.length) {
            console.log('No data for discamp persons, creating empty YAMLs')
            fs.writeFileSync(yamlPath, '[]', 'utf8')
            fs.writeFileSync(path.join(fetchDir, `search_discamp_persons.${lang}.yaml`), '[]', 'utf8')
            fs.writeFileSync(path.join(fetchDir, `filters_discamp_persons.${lang}.yaml`), '[]', 'utf8')
            continue
        }

        allData = allData.sort((a, b) => `${a.person.firstName} ${a.person.lastname}`.localeCompare(`${b.person.firstName} ${b.person.lastname}`, lang))
        const allDataYAML = yaml.dump(allData, { 'noRefs': true, 'indent': '4' });
        fs.writeFileSync(yamlPath, allDataYAML, 'utf8');


        let filters = {
            types: {},
            roleatfilms: {},
            lookingfors: {},
        }

        const discamp_persons_search = allData.map(discamp_person => {

            let types = []
            let person = discamp_person.person
            if (typeof discamp_person.discamp_person_types !== 'undefined') {
                let discamp_person_types = discamp_person.discamp_person_types.map(type => type.type)
                for (const type of discamp_person_types) {
                    types.push(type)
                    filters.types[type] = type
                }
            }

            let roleatfilms = []

            for (const role of (discamp_person.role_at_films || [])
                .sort(function(a, b){ return (a.order > b.order) ? 1 : ((b.order > a.order) ? -1 : 0) })
                    || []) {
                const roleName = role.roleName
                roleatfilms.push(roleName)
                filters.roleatfilms[roleName] = roleName
            }

            let lookingfors = []

            if (discamp_person.lookingFor) {
                const lookingFor = discamp_person.lookingFor
                lookingfors.push(lookingFor)
                filters.lookingfors[lookingFor] = lookingFor
            }

            let filmographies = []
            const filmography = discamp_person.filmography
            if (filmography && filmography.text) {
                filmographies.push(filmography.text)
            }
            if (filmography && filmography.film) {
                for (const film of filmography.film) {
                    filmographies.push(`${film.title} ${film.title} ${film.synopsis}`)
                }
            }

            return {
                id: discamp_person.id,
                text: [
                    `${person.firstName} ${person.lastName}`,
                    discamp_person.emailAtInd,
                    discamp_person.phoneAtInd,
                    discamp_person.aboutText,
                    discamp_person.lookingFor,
                    discamp_person.website,
                    filmographies,
                ].join(' ').toLowerCase(),
                types: types,
                roleatfilms: roleatfilms,
                lookingfors: lookingfors,
            }
        });

        let sorted_filters = {
            types: mSort(filters.types),
            roleatfilms: mSort(filters.roleatfilms),
            lookingfors: mSort(filters.lookingfors),
        }

        let searchYAML = yaml.dump(discamp_persons_search, { 'noRefs': true, 'indent': '4' })
        fs.writeFileSync(path.join(fetchDir, `search_discamp_persons.${lang}.yaml`), searchYAML, 'utf8')

        let filtersYAML = yaml.dump(sorted_filters, { 'noRefs': true, 'indent': '4' })
        fs.writeFileSync(path.join(fetchDir, `filters_discamp_persons.${lang}.yaml`), filtersYAML, 'utf8')

        // Töötav sorteerimisfunktsioon filtritele
        function mSort(to_sort) {
            let sortable = []
            for (var item in to_sort) {
                sortable.push([item, to_sort[item]]);
            }

            sortable = sortable.sort(function(a, b) {
                try {
                    const locale_sort = a[1].localeCompare(b[1], lang)
                    return locale_sort
                } catch (error) {
                    console.log('failed to sort', JSON.stringify({a, b}, null, 4));
                    throw new Error(error)
                }
            });

            var objSorted = {}
            for (let index = 0; index < sortable.length; index++) {
                const item = sortable[index];
                objSorted[item[0]]=item[1]
            }
            return objSorted
        }
    }
}
