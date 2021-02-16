const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');
const slugify = require('slugify');
const rueten = require('./rueten.js');
const {fetchModel} = require('./b_fetch.js')

const sourceDir =  path.join(__dirname, '..', 'source');
const fetchDir =  path.join(sourceDir, '_fetchdir');
const fetchDataDir =  path.join(fetchDir, 'industrypersons');
const strapiDataPath = path.join(sourceDir, 'strapidata', 'IndustryPerson.yaml');
const DOMAIN = process.env['DOMAIN'] || 'industry.poff.ee';

if (DOMAIN === 'industry.poff.ee') {
    const STRAPIDATA_INDUSTRY_PERSON = yaml.safeLoad(fs.readFileSync(strapiDataPath, 'utf8'));

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
        'industry_person_types': {
            model_name: 'IndustryPersonType'
        }
    }

    STRAPIDATA_INDUSTRY_PERSONS = fetchModel(STRAPIDATA_INDUSTRY_PERSON, minimodel)



    // const STRAPIDATA_PERSONS = yaml.safeLoad(fs.readFileSync(strapiDataPath, 'utf8'))['Person'];
    const STRAPIDIR = '/uploads/'

    const rootDir =  path.join(__dirname, '..')
    const domainSpecificsPath = path.join(rootDir, 'domain_specifics.yaml')
    const DOMAIN_SPECIFICS = yaml.safeLoad(fs.readFileSync(domainSpecificsPath, 'utf8'))


    const languages = DOMAIN_SPECIFICS.locales[DOMAIN]
    for (lang of languages) {

        // if (DOMAIN !== 'industry.poff.ee') { continue }

        console.log(`Fetching ${DOMAIN} industry persons ${lang} data`);

        allData = []
        for (const ix in STRAPIDATA_INDUSTRY_PERSONS) {
            let industry_person = JSON.parse(JSON.stringify(STRAPIDATA_INDUSTRY_PERSONS[ix]));

            var templateDomainName = 'industry';

            // rueten func. is run for each industry_person separately instead of whole data, that is
            // for the purpose of saving slug_en before it will be removed by rueten func.


            industry_person = rueten(industry_person, lang);
            // industry_person.data = {'articles': '/_fetchdir/articles.' + lang + '.yaml'};
            // industry_person.path = industry_person.slug;

            const filmography = industry_person.filmography || {}
            const films = filmography.film || []

            films.forEach(film => {
                const images = film.images || []
                images.forEach(image => {
                    image.url = image.url || ''
                    let searchRegExp = new RegExp(STRAPIDIR, 'g')
                    let replaceWith = `https://assets.poff.ee/img/`
                    image.url = image.url.replace(searchRegExp, replaceWith)
                })
            })

            if (industry_person.person) {
                let personFirstName = industry_person.person.firstName || ''
                let personLastName = industry_person.person.lastName || ''
                var personNameWithID = `${personFirstName} ${personLastName} ${industry_person.person.id}`
            } else {
                console.log(`ERROR! Industry person ID ${industry_person.id} not linked to any person, skipped.`)
                continue
            }
            industry_person.path = industry_person.slug;
            industry_person.data = {'articles': '/_fetchdir/articles.' + lang + '.yaml'};

            if (industry_person.clipUrl) {
                if(industry_person.clipUrl && industry_person.clipUrl.length > 10) {
                    if (industry_person.clipUrl.includes('vimeo')) {
                        let splitVimeoLink = industry_person.clipUrl.split('/')
                        let videoCode = splitVimeoLink !== undefined ? splitVimeoLink[splitVimeoLink.length-1] : ''
                        if (videoCode.length === 9) {
                            industry_person.clipUrlCode = videoCode
                        }
                    } else {
                        let splitYouTubeLink = industry_person.clipUrl.split('=')[1]
                        let splitForVideoCode = splitYouTubeLink !== undefined ? splitYouTubeLink.split('&')[0] : ''
                        if (splitForVideoCode.length === 11) {
                            industry_person.clipUrlCode = splitForVideoCode
                        }
                    }
                }
            }

            let oneYaml = {}
            try {
                oneYaml = yaml.safeDump(industry_person, { 'noRefs': true, 'indent': '4' })
            } catch (error) {
                console.error({error, industry_person})
                throw error
            }

            const yamlPath = path.join(fetchDataDir, industry_person.slug, `data.${lang}.yaml`);
            let saveDir = path.join(fetchDataDir, industry_person.slug);
            fs.mkdirSync(saveDir, { recursive: true });

            fs.writeFileSync(yamlPath, oneYaml, 'utf8');
            fs.writeFileSync(`${saveDir}/index.pug`, `include /_templates/industryperson_${templateDomainName}_index_template.pug`)
            allData.push(industry_person);
        }

        const yamlPath = path.join(fetchDir, `industrypersons.${lang}.yaml`)

        if (!allData.length) {
            console.log('No data for industry persons, creating empty YAML')
            fs.writeFileSync(yamlPath, '[]', 'utf8')
            continue
        }

        allData = allData.sort((a, b) => `${a.person.firstName} ${a.person.lastname}`.localeCompare(`${b.person.firstName} ${b.person.lastname}`, lang))
        const allDataYAML = yaml.safeDump(allData, { 'noRefs': true, 'indent': '4' });
        fs.writeFileSync(yamlPath, allDataYAML, 'utf8');


        let filters = {
            types: {},
            roleatfilms: {},
            lookingfors: {},
        }

        const industry_persons_search = allData.map(industry_person => {

            let types = []
            let person = industry_person.person
            if (typeof industry_person.industry_person_types !== 'undefined') {
                let industry_person_types = industry_person.industry_person_types.map(type => type.type)
                for (const type of industry_person_types) {
                    types.push(type)
                    filters.types[type] = type
                }
            }

            let roleatfilms = []

            for (const role of (industry_person.role_at_films || [])
                .sort(function(a, b){ return (a.order > b.order) ? 1 : ((b.order > a.order) ? -1 : 0) })
                    || []) {
                const roleName = role.roleName
                roleatfilms.push(roleName)
                filters.roleatfilms[roleName] = roleName
            }

            let lookingfors = []

            if (industry_person.lookingFor) {
                const lookingFor = industry_person.lookingFor
                lookingfors.push(lookingFor)
                filters.lookingfors[lookingFor] = lookingFor
            }

            let filmographies = []
            const filmography = industry_person.filmography
            if (filmography && filmography.text) {
                filmographies.push(filmography.text)
            }
            if (filmography && filmography.film) {
                for (const film of filmography.film) {
                    filmographies.push(`${film.title} ${film.title} ${film.synopsis}`)
                }
            }

            return {
                id: industry_person.id,
                text: [
                    `${person.firstName} ${person.lastName}`,
                    industry_person.emailAtInd,
                    industry_person.phoneAtInd,
                    industry_person.aboutText,
                    industry_person.lookingFor,
                    industry_person.website,
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

        let searchYAML = yaml.safeDump(industry_persons_search, { 'noRefs': true, 'indent': '4' })
        fs.writeFileSync(path.join(fetchDir, `search_industry_persons.${lang}.yaml`), searchYAML, 'utf8')

        let filtersYAML = yaml.safeDump(sorted_filters, { 'noRefs': true, 'indent': '4' })
        fs.writeFileSync(path.join(fetchDir, `filters_industry_persons.${lang}.yaml`), filtersYAML, 'utf8')


        // TODO: mida see funktsioon teeb?
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
} else {

    let emptyYAML = yaml.safeDump([], {
        'noRefs': true,
        'indent': '4'
    })
    fs.writeFileSync(path.join(fetchDir, `search_industry_persons.en.yaml`), emptyYAML, 'utf8')

    fs.writeFileSync(path.join(fetchDir, `filters_industry_persons.en.yaml`), emptyYAML, 'utf8')

    fs.writeFileSync(path.join(fetchDir, `industrypersons.en.yaml`), emptyYAML, 'utf8');

}
