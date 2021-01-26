const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');
const rueten = require('./rueten.js');

const sourceDir =  path.join(__dirname, '..', 'source');
const fetchDir =  path.join(sourceDir, '_fetchdir');
const fetchDataDir =  path.join(fetchDir, 'industryprojects');
const strapiDataPath = path.join(fetchDir, 'strapiData.yaml');
const STRAPIDATA_IND_PROJECT = yaml.safeLoad(fs.readFileSync(strapiDataPath, 'utf8'))['IndustryProject'];


const rootDir =  path.join(__dirname, '..')
const domainSpecificsPath = path.join(rootDir, 'domain_specifics.yaml')
const DOMAIN_SPECIFICS = yaml.safeLoad(fs.readFileSync(domainSpecificsPath, 'utf8'))
const STRAPIDATA = yaml.safeLoad(fs.readFileSync(strapiDataPath, 'utf8'))
const STRAPIDATA_PERSONS = STRAPIDATA['Person']
const STRAPIDATA_COMPANIES = STRAPIDATA['Organisation']
const DOMAIN = process.env['DOMAIN'] || 'industry.poff.ee';





const languages = DOMAIN_SPECIFICS.locales[DOMAIN]

for (const ix in languages) {
    const lang = languages[ix];
    console.log(`Fetching ${DOMAIN} industry projects ${lang} data`);

    allData = []
    for (const ix in STRAPIDATA_IND_PROJECT) {
        let industry_project = JSON.parse(JSON.stringify(STRAPIDATA_IND_PROJECT[ix]));

        var templateDomainName = 'industry';

        // rueten func. is run for each industry_project separately instead of whole data, that is
        // for the purpose of saving slug_en before it will be removed by rueten func.
        industry_project = rueten(industry_project, lang);
        let dirSlug = industry_project.slug ? industry_project.slug : null ;

        if (dirSlug === null) {
            if (lang === 'en' && DOMAIN === 'industry.poff.ee') {
                console.log(`ERROR! Industry project ID ${industry_project.id} missing slug ${lang}, skipped.`);
            }
            continue
        }
        if (!industry_project.title) {
            if (lang === 'en' && DOMAIN === 'industry.poff.ee') {
                console.log(`ERROR! Industry project ID ${industry_project.id} missing title ${lang}, skipped.`);
            }
            continue
        }

        industry_project.data = {'articles': '/_fetchdir/articles.' + lang + '.yaml'};
        industry_project.path = `project/${dirSlug}`

        if (industry_project.clipUrl) {
            if(industry_project.clipUrl && industry_project.clipUrl.length > 10) {
                if (industry_project.clipUrl.includes('vimeo')) {
                    let splitVimeoLink = industry_project.clipUrl.split('/')
                    let videoCode = splitVimeoLink !== undefined ? splitVimeoLink[splitVimeoLink.length-1] : ''
                    if (videoCode.length === 9) {
                        industry_project.clipUrlCode = videoCode
                    }
                } else {
                    let splitYouTubeLink = industry_project.clipUrl.split('=')[1]
                    let splitForVideoCode = splitYouTubeLink !== undefined ? splitYouTubeLink.split('&')[0] : ''
                    if (splitForVideoCode.length === 11) {
                        industry_project.clipUrlCode = splitForVideoCode
                    }
                }
            }
        }


        const oneYaml = yaml.safeDump(industry_project, { 'noRefs': true, 'indent': '4' });
        const yamlPath = path.join(fetchDataDir, dirSlug, `data.${lang}.yaml`);
        let saveDir = path.join(fetchDataDir, dirSlug);
        fs.mkdirSync(saveDir, { recursive: true });

        fs.writeFileSync(yamlPath, oneYaml, 'utf8');
        fs.writeFileSync(`${saveDir}/index.pug`, `include /_templates/industryproject_${templateDomainName}_index_template.pug`)
        allData.push(industry_project);

        const credentials = industry_project.teamCredentials || {}

        // persoonide blokk
        const role_persons = credentials.rolePerson || []
        industry_project.persons = {}
        for (const role_person of role_persons) {
            let person_id
            try {
                person_id = role_person.person.id
            } catch (error) {
                continue
            }
            industry_project.persons[person_id] = industry_project.persons[person_id] || {id: person_id, rolesAtFilm: []}
            if (role_person.role_at_film){
                industry_project.persons[person_id].rolesAtFilm.push(role_person.role_at_film.roleNamePrivate)
            }
        }
        for (const ix in industry_project.persons) {
            const industry_person = industry_project.persons[ix]
            try {
                industry_person.person = STRAPIDATA_PERSONS
                .filter(strapi_person => (strapi_person.id === industry_person.id))[0]
            } catch (error) {
                console.log('Seda pole ette nähtud juhtuma: strapi_person.id !== industry_person.id', industry_person.id)
            }
            try {
                if(industry_person.person.biography.en){
                    industry_person.person.biography = industry_person.person.biography.en
                }
            } catch (error) {
                null
            }
        }
        industry_project.persons = Object.values(industry_project.persons)

        // kompaniide blokk
        const role_companies = credentials.roleCompany || []
        industry_project.organisations = {}

        for (const role_company of role_companies) {
            let company_id
            try {
                company_id = role_company.organisation.id
            } catch (error) {
                continue
            }
            industry_project.organisations[company_id] = industry_project.organisations[company_id] || {id: company_id, rolesAtFilm: []}
            if (role_company.roles_at_film){
                industry_project.organisations[company_id].rolesAtFilm.push(role_company.roles_at_film.roleNamePrivate)

            }
        }
        for (const ix in industry_project.organisations) {
            const industry_company = industry_project.organisations[ix]
            try {
                industry_company.organisations = STRAPIDATA_COMPANIES
                .filter(strapi_company => (strapi_company.id === industry_company.id))[0]
            } catch (error) {
                console.log('Seda pole ette nähtud juhtuma: strapi_company.id !== industry_company.id', industry_company.id)
            }
            try {
                if(industry_company.organisations.description.en){
                    industry_company.organisations.description = industry_company.organisations.description.en
                }
            } catch (error) {
                null
            }
        }

        industry_project.organisations = Object.values(industry_project.organisations)

        // andmepuhastus

        delete industry_project.teamCredentials


    }

    const yamlPath = path.join(fetchDir, `industryprojects.${lang}.yaml`);
    if (allData.length) {
        allData = allData.sort((a, b) => a.title.localeCompare(b.title, lang))
        const allDataYAML = yaml.safeDump(allData, { 'noRefs': true, 'indent': '4' });
        fs.writeFileSync(yamlPath, allDataYAML, 'utf8');




        let filters = {
            types: {},
            languages: {},
            countries: {},
            statuses: {},
            genres: {},
        }

        const projects_search = allData.map(projects => {

            let types = []
            let project = projects
            if (typeof project.project_types !== 'undefined') {
                let project_types = project.project_types.map(type => type.type)
                for (const type of project_types) {
                    types.push(type)
                    filters.types[type] = type
                }
            }

            let languages = []
            let countries = []
            let statuses = []
            let genres = []

            for (const language of project.languages || []) {
            const langKey = language.code
            const language_name = language.name
            languages.push(langKey)
            filters.languages[langKey] = language_name
            }

            for (const country of project.countries || []) {
                const countryKey = country.code
                const country_name = country.name
                countries.push(countryKey)
                filters.countries[countryKey] = country_name
            }

            for (const status of project.project_statuses || []) {
                const theStatus = status.status
                statuses.push(theStatus)
                filters.statuses[theStatus] = theStatus
            }

            for (const genre of project.tag_genres || []) {
                const theGenre = genre
                genres.push(theGenre)
                filters.genres[theGenre] = theGenre
            }

            return {
                id: projects.id,
                text: [
                    projects.title,
                    projects.synopsis,
                    projects.directorsNote,
                    projects.lookingFor,
                    projects.contactName,
                    projects.contactEmail,
                ].join(' ').toLowerCase(),
                languages: languages,
                countries: countries,
                types: types,
                statuses: statuses,
                genres: genres,
            }
        });

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

        let sorted_filters = {
            types: mSort(filters.types),
            languages: mSort(filters.languages),
            countries: mSort(filters.countries),
            statuses: mSort(filters.statuses),
            genres: mSort(filters.genres),
        }

        let searchYAML = yaml.safeDump(projects_search, { 'noRefs': true, 'indent': '4' })
        fs.writeFileSync(path.join(fetchDir, `search_projects.${lang}.yaml`), searchYAML, 'utf8')

        let filtersYAML = yaml.safeDump(sorted_filters, { 'noRefs': true, 'indent': '4' })
        fs.writeFileSync(path.join(fetchDir, `filters_projects.${lang}.yaml`), filtersYAML, 'utf8')

    } else {
        console.log('No data for industry project, creating empty YAML');
        fs.writeFileSync(yamlPath, '[]', 'utf8');
    }
}

for (const industry_project of allData) {
    const dirSlug = industry_project.slug || industry_project.id
    const saveDir = path.join(fetchDataDir, dirSlug);
    fs.mkdirSync(saveDir, { recursive: true });

    industry_project.data = {'articles': '/_fetchdir/articles.en.yaml'};
    industry_project.path = `project/${dirSlug}`

    const yamlPath = path.join(fetchDataDir, dirSlug, 'data.en.yaml')
    const oneYaml = yaml.safeDump(industry_project, { 'noRefs': true, 'indent': '4' })
    fs.writeFileSync(yamlPath, oneYaml, 'utf8')
    fs.writeFileSync(path.join(saveDir,'index.pug'), 'include /_templates/industryproject_industry_index_template.pug')
}
