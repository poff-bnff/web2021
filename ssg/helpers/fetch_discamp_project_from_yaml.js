const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');
const rueten = require('./rueten.js');
const {fetchModel} = require('./b_fetch.js')

const sourceDir =  path.join(__dirname, '..', 'source');
const fetchDir =  path.join(sourceDir, '_fetchdir');
const fetchDataDir =  path.join(fetchDir, 'discampprojects');
const strapiDataDirPath = path.join(sourceDir, '_domainStrapidata');
const strapiDataDisCampProjectPath = path.join(strapiDataDirPath, 'DisCampProject.yaml')
const STRAPIDATA_DC_PROJECTS = yaml.load(fs.readFileSync(strapiDataDisCampProjectPath, 'utf8'))

const rootDir =  path.join(__dirname, '..')
const domainSpecificsPath = path.join(rootDir, 'domain_specifics.yaml')
const DOMAIN_SPECIFICS = yaml.load(fs.readFileSync(domainSpecificsPath, 'utf8'))
const strapiDataPersonPath = path.join(strapiDataDirPath, 'Person.yaml')
const STRAPIDATA_PERSONS = yaml.load(fs.readFileSync(strapiDataPersonPath, 'utf8'))
const strapiDataCompanyPath = path.join(strapiDataDirPath, 'Organisation.yaml')
const STRAPIDATA_COMPANIES = yaml.load(fs.readFileSync(strapiDataCompanyPath, 'utf8'))
const DOMAIN = process.env['DOMAIN'] || 'discoverycampus.poff.ee';
const active_editions = DOMAIN_SPECIFICS.active_discamp_editions

if (DOMAIN === 'discoverycampus.poff.ee') {

    const minimodel = {
        'countries': {
            model_name: 'Country'
        },
        'languages': {
            model_name: 'Language'
        },
        'project_types': {
            model_name: 'ProjectType'
        },
        'project_statuses': {
            model_name: 'ProjectStatus'
        },
        'broadcasters': {
            model_name: 'Organisation'
        },
        'country_focus': {
            model_name: 'Country'
        },
        'teamCredentials': {
            model_name: 'Credentials'
        },
        'attached_partners': {
            model_name: 'Organisation'
        },
        'contactCompany': {
            model_name: 'Organisation'
        },
        'images': {
            model_name: 'StrapiMedia'
        },
        'tag_genres': {
            model_name: 'TagGenre'
        },
        'editions': {
            model_name: 'FestivalEdition'
        },
        'tag_looking_fors': {
            model_name: 'TagLookingFor'
        },
    }

    const STRAPIDATA_DC_PROJECT = fetchModel(STRAPIDATA_DC_PROJECTS, minimodel)

    const languages = DOMAIN_SPECIFICS.locales[DOMAIN]

    let activeProjectsYamlNameSuffix = 'dis_camp_projects'
    let activeProjects = STRAPIDATA_DC_PROJECT.filter(proj => proj.editions && proj.editions.map(ed => ed.id).some(id => active_editions.includes(id)))
    startdiscampProjectProcessing(languages, activeProjects, activeProjectsYamlNameSuffix)

    let archiveProjects = STRAPIDATA_DC_PROJECT.filter(proj => proj.editions && proj.editions.map(ed => ed.id).some(id => !active_editions.includes(id)))
    let archiveProjectsYamlNameSuffix = 'dis_camp_projects_archive'
    startdiscampProjectProcessing(languages, archiveProjects, archiveProjectsYamlNameSuffix)

} else {

    let emptyYAML = yaml.dump([], { 'noRefs': true, 'indent': '4' })
    fs.writeFileSync(path.join(fetchDir, `search_dis_camp_projects.en.yaml`), emptyYAML, 'utf8')
    fs.writeFileSync(path.join(fetchDir, `search_dis_camp_projects_archive.en.yaml`), emptyYAML, 'utf8')
    fs.writeFileSync(path.join(fetchDir, `filters_dis_camp_projects.en.yaml`), emptyYAML, 'utf8')
    fs.writeFileSync(path.join(fetchDir, `filters_dis_camp_projects_archive.en.yaml`), emptyYAML, 'utf8')
    fs.writeFileSync(path.join(fetchDir, `discamp_projects.en.yaml`), emptyYAML, 'utf8')
    fs.writeFileSync(path.join(fetchDir, `discamp_projects_archive.en.yaml`), emptyYAML, 'utf8')

}



function mSort(to_sort, lang) {
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

function generateProjectsSearchAndFilterYamls(allData, lang, yamlNameSuffix) {

    let filters = {
        types: {},
        languages: {},
        countries: {},
        statuses: {},
        genres: {},
        editions: {},
    }

    const projects_search = allData.map(projects => {

        let types = [];
        let project = projects;
        if (typeof project.project_types !== 'undefined') {
            let project_types = project.project_types.map(type => type.type);
            for (const type of project_types) {
                types.push(type);
                filters.types[type] = type;
            }
        }

        let languages = [];
        let countries = [];
        let statuses = [];
        let genres = [];
        let editions = [];

        for (const language of project.languages || []) {
            const langKey = language.code;
            const language_name = language.name;
            languages.push(langKey);
            filters.languages[langKey] = language_name;
        }

        for (const country of project.countries || []) {
            const countryKey = country.code;
            const country_name = country.name;
            countries.push(countryKey);
            filters.countries[countryKey] = country_name;
        }

        for (const status of project.project_statuses || []) {
            const theStatus = status.status;
            statuses.push(theStatus);
            filters.statuses[theStatus] = theStatus;
        }

        for (const genre of project.tag_genres || []) {
            const theGenre = genre;
            genres.push(theGenre);
            filters.genres[theGenre] = theGenre;
        }

        for (const edition of project.editions || []) {
            const theEdition = edition.name;
            editions.push(theEdition);
            filters.editions[theEdition] = theEdition;
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
            editions: editions,
        };
    });

    let searchYAML = yaml.dump(projects_search, { 'noRefs': true, 'indent': '4' });
    fs.writeFileSync(path.join(fetchDir, `search_${yamlNameSuffix}.${lang}.yaml`), searchYAML, 'utf8');

    let sorted_filters = {
        types: mSort(filters.types, lang),
        languages: mSort(filters.languages, lang),
        countries: mSort(filters.countries, lang),
        statuses: mSort(filters.statuses, lang),
        genres: mSort(filters.genres, lang),
        editions: mSort(filters.editions, lang),
    }

    let filtersYAML = yaml.dump(sorted_filters, { 'noRefs': true, 'indent': '4' })
    fs.writeFileSync(path.join(fetchDir, `filters_${yamlNameSuffix}.${lang}.yaml`), filtersYAML, 'utf8')

}

function startdiscampProjectProcessing(languages, STRAPIDATA_DC_PROJECT, projectsYamlNameSuffix) {
    for (const ix in languages) {
        const lang = languages[ix];
        console.log(`Fetching ${DOMAIN} discamp ${projectsYamlNameSuffix} ${lang} data`);
        let allData = []
        for (const ix in STRAPIDATA_DC_PROJECT) {
            let discamp_project = JSON.parse(JSON.stringify(STRAPIDATA_DC_PROJECT[ix]));
            discamp_project.roles_in_project = {}
            discamp_project.comp_roles_in_project = {}

            var templateDomainName = 'discamp';

            // rueten func. is run for each discamp_project separately instead of whole data, that is
            // for the purpose of saving slug_en before it will be removed by rueten func.
            discamp_project = rueten(discamp_project, lang);
            let dirSlug = discamp_project.slug ? discamp_project.slug : null ;

            if (dirSlug === null) {
                if (lang === 'en' && DOMAIN === 'discoverycampus.poff.ee') {
                    console.log(`ERROR! discamp ${projectsYamlNameSuffix} ID ${discamp_project.id} missing slug ${lang}, skipped.`);
                }
                continue
            }
            if (!discamp_project.title) {
                if (lang === 'en' && DOMAIN === 'discoverycampus.poff.ee') {
                    console.log(`ERROR! discamp ${projectsYamlNameSuffix} ID ${discamp_project.id} missing title ${lang}, skipped.`);
                }
                continue
            }

            discamp_project.path = `project/${dirSlug}`

            if (discamp_project.clipUrl) {
                if(discamp_project.clipUrl && discamp_project.clipUrl.length > 10) {
                    if (discamp_project.clipUrl.includes('vimeo')) {
                        let splitVimeoLink = discamp_project.clipUrl.split('/')
                        let videoCode = splitVimeoLink !== undefined ? splitVimeoLink[splitVimeoLink.length-1] : ''
                        if (videoCode.length === 9) {
                            discamp_project.clipUrlCode = videoCode
                        }
                    } else {
                        let splitYouTubeLink = discamp_project.clipUrl.split('=')[1]
                        let splitForVideoCode = splitYouTubeLink !== undefined ? splitYouTubeLink.split('&')[0] : ''
                        if (splitForVideoCode.length === 11) {
                            discamp_project.clipUrlCode = splitForVideoCode
                        }
                    }
                }
            }

            const oneYaml = yaml.dump(discamp_project, { 'noRefs': true, 'indent': '4' });
            const yamlPath = path.join(fetchDataDir, dirSlug, `data.${lang}.yaml`);
            let saveDir = path.join(fetchDataDir, dirSlug);
            fs.mkdirSync(saveDir, { recursive: true });

            fs.writeFileSync(yamlPath, oneYaml, 'utf8');
            fs.writeFileSync(`${saveDir}/index.pug`, `include /_templates/discampproject_${templateDomainName}_index_template.pug`)
            allData.push(discamp_project);

            const credentials = discamp_project.teamCredentials || {}

            // persoonide blokk
            const role_persons = credentials.rolePerson || []
            discamp_project.persons = {}
            for (const role_person of role_persons) {
                let person_id
                try {
                    person_id = role_person.person.id
                } catch (error) {
                    continue
                }
                discamp_project.persons[person_id] = discamp_project.persons[person_id] || {id: person_id, rolesAtFilm: []}
                if (role_person.role_at_film) {
                    discamp_project.persons[person_id].rolesAtFilm.push(role_person.role_at_film.roleNamePrivate)
                    if (!(role_person.role_at_film.roleNamePrivate in discamp_project.roles_in_project)) {
                        discamp_project.roles_in_project[role_person.role_at_film.roleNamePrivate] = {ord: role_person.role_at_film.order, names: []}
                    }
                    discamp_project.roles_in_project[role_person.role_at_film.roleNamePrivate].names.push(role_person.person.firstNameLastName)


                }
                // discamp_project.roles_in_project = discamp_project.roles_in_project.sort((a, b) => {
                //     return a[role_person.role_at_film.roleNamePrivate].ord - b[role_person.role_at_film.roleNamePrivate].ord
                // })

            }



            for (const ix in discamp_project.persons) {
                const discamp_person = discamp_project.persons[ix]
                try {
                    discamp_person.person = STRAPIDATA_PERSONS
                    .filter(strapi_person => (strapi_person.id === discamp_person.id))[0]
                } catch (error) {
                    console.log('Seda pole ette nähtud juhtuma: strapi_person.id !== discamp_person.id', discamp_person.id)
                }
                try {
                    if(discamp_person.person.biography.en){
                        discamp_person.person.biography = discamp_person.person.biography.en
                    }
                } catch (error) {
                    null
                }
            }
            discamp_project.persons = Object.values(discamp_project.persons)

            // kompaniide blokk
            const role_companies = credentials.roleCompany || []
            discamp_project.organisations = {}

            for (const role_company of role_companies) {
                let company_id
                try {
                    company_id = role_company.organisation.id
                } catch (error) {
                    continue
                }
                discamp_project.organisations[company_id] = discamp_project.organisations[company_id] || {id: company_id, rolesAtFilm: []}
                if (role_company.roles_at_film){
                    discamp_project.organisations[company_id].rolesAtFilm.push(role_company.roles_at_film.roleNamePrivate)

                    if(!(role_company.roles_at_film.roleNamePrivate in discamp_project.comp_roles_in_project)) {
                        discamp_project.comp_roles_in_project[role_company.roles_at_film.roleNamePrivate] = {ord: role_company.roles_at_film.order, names: []}
                    }
                    discamp_project.comp_roles_in_project[role_company.roles_at_film.roleNamePrivate].names.push(role_company.organisation.namePrivate)
                }
            }
            for (const ix in discamp_project.organisations) {
                const discamp_company = discamp_project.organisations[ix]
                try {
                    discamp_company.organisations = STRAPIDATA_COMPANIES
                    .filter(strapi_company => (strapi_company.id === discamp_company.id))[0]
                } catch (error) {
                    console.log('Seda pole ette nähtud juhtuma: strapi_company.id !== discamp_company.id', discamp_company.id)
                }
                try {
                    if(discamp_company.organisations.description.en){
                        discamp_company.organisations.description = discamp_company.organisations.description.en
                    }
                } catch (error) {
                    null
                }
            }

            discamp_project.organisations = Object.values(discamp_project.organisations)

            // andmepuhastus

            delete discamp_project.teamCredentials
        }

        const yamlPath = path.join(fetchDir, `discamp${projectsYamlNameSuffix}.${lang}.yaml`);
        const searchYamlPath = path.join(fetchDir, `search_${projectsYamlNameSuffix}.${lang}.yaml`);
        const filtersYamlPath = path.join(fetchDir, `filters_${projectsYamlNameSuffix}.${lang}.yaml`);
        if (allData.length) {
            allData = allData.sort((a, b) => a.title.localeCompare(b.title, lang))
            const allDataYAML = yaml.dump(allData, { 'noRefs': true, 'indent': '4' });
            fs.writeFileSync(yamlPath, allDataYAML, 'utf8');

            generateProjectsSearchAndFilterYamls(allData, lang, projectsYamlNameSuffix);

        } else {
            console.log(`No data for discamp ${projectsYamlNameSuffix}, creating empty YAMLs`);
            fs.writeFileSync(yamlPath, '[]', 'utf8');
            fs.writeFileSync(searchYamlPath, '[]', 'utf8');
            fs.writeFileSync(filtersYamlPath, '[]', 'utf8');
        }

        for (const discamp_project of allData) {
            const dirSlug = discamp_project.slug || discamp_project.id
            const saveDir = path.join(fetchDataDir, dirSlug);
            fs.mkdirSync(saveDir, { recursive: true });

            discamp_project.data = {'articles': '/_fetchdir/articles.en.yaml'};
            discamp_project.path = `project/${dirSlug}`

            const yamlPath = path.join(fetchDataDir, dirSlug, 'data.en.yaml')
            const oneYaml = yaml.dump(discamp_project, { 'noRefs': true, 'indent': '4' })
            fs.writeFileSync(yamlPath, oneYaml, 'utf8')
            fs.writeFileSync(path.join(saveDir,'index.pug'), 'include /_templates/discampproject_discamp_index_template.pug')
        }
    }
}
