const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');
const rueten = require('./rueten.js');
const { fetchModel } = require('./b_fetch.js')
const addConfigPathAliases = require('./add_config_path_aliases.js')

const sourceDir = path.join(__dirname, '..', 'source');
const fetchDir = path.join(sourceDir, '_fetchdir');
const strapiDataDirPath = path.join(sourceDir, '_domainStrapidata');
const strapiDataIndustryProjectPath = path.join(strapiDataDirPath, 'IndustryProject.yaml')
const STRAPIDATA_IND_PROJECTS = yaml.load(fs.readFileSync(strapiDataIndustryProjectPath, 'utf8'))

const rootDir = path.join(__dirname, '..')
const domainSpecificsPath = path.join(rootDir, 'domain_specifics.yaml')
const DOMAIN_SPECIFICS = yaml.load(fs.readFileSync(domainSpecificsPath, 'utf8'))
const strapiDataPersonPath = path.join(strapiDataDirPath, 'Person.yaml')
const STRAPIDATA_PERSONS = yaml.load(fs.readFileSync(strapiDataPersonPath, 'utf8'))
const strapiDataCompanyPath = path.join(strapiDataDirPath, 'Organisation.yaml')
const STRAPIDATA_COMPANIES = yaml.load(fs.readFileSync(strapiDataCompanyPath, 'utf8'))
const strapiDataRoleAtFilmPath = path.join(strapiDataDirPath, 'RoleAtFilm.yaml')
const STRAPIDATA_ROLESATFILM = yaml.load(fs.readFileSync(strapiDataRoleAtFilmPath, 'utf8'))
const DOMAIN = process.env['DOMAIN'] || 'industry.poff.ee';
const active_editions = DOMAIN_SPECIFICS.active_industry_editions

const params = process.argv.slice(2)
const param_build_type = params[0]

const fetchDataDir = param_build_type === 'archive' ? path.join(fetchDir, 'industryprojects_archive') : path.join(fetchDir, 'industryprojects')

if (DOMAIN === 'industry.poff.ee') {

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
        'credentials': {
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

    const STRAPIDATA_IND_PROJECT = fetchModel(STRAPIDATA_IND_PROJECTS, minimodel)

    const languages = DOMAIN_SPECIFICS.locales[DOMAIN]

    if (param_build_type === 'archive') {
        addConfigPathAliases([`/industry_projects_archive_search`])
        let archiveProjectsYamlNameSuffix = 'projects_archive'
        let archiveProjects = STRAPIDATA_IND_PROJECT.filter(proj => proj.editions && proj.editions.map(ed => ed.id).some(id => !active_editions.includes(id)))
        startIndustryProjectProcessing(languages, archiveProjects, archiveProjectsYamlNameSuffix, true)
    } else {
        let activeProjectsYamlNameSuffix = 'projects'
        let activeProjects = STRAPIDATA_IND_PROJECT.filter(proj => proj.editions && proj.editions.map(ed => ed.id).some(id => active_editions.includes(id)))
        startIndustryProjectProcessing(languages, activeProjects, activeProjectsYamlNameSuffix)
    }

} else {

    let emptyYAML = yaml.dump([], { 'noRefs': true, 'indent': '4' })
    fs.writeFileSync(path.join(fetchDir, `search_projects.en.yaml`), emptyYAML, 'utf8')
    fs.writeFileSync(path.join(fetchDir, `search_projects_archive.en.yaml`), emptyYAML, 'utf8')
    fs.writeFileSync(path.join(fetchDir, `filters_projects.en.yaml`), emptyYAML, 'utf8')
    fs.writeFileSync(path.join(fetchDir, `filters_projects_archive.en.yaml`), emptyYAML, 'utf8')
    fs.writeFileSync(path.join(fetchDir, `industryprojects.en.yaml`), emptyYAML, 'utf8')
    fs.writeFileSync(path.join(fetchDir, `industryprojects_archive.en.yaml`), emptyYAML, 'utf8')

}



function mSort(to_sort, lang) {
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
            if (theEdition) {
                editions.push(theEdition);
                filters.editions[theEdition] = theEdition;
            }
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

function startIndustryProjectProcessing(languages, STRAPIDATA_IND_PROJECT, projectsYamlNameSuffix, archiveBuild = false) {
    var templateDomainName = archiveBuild ? 'industry_archive' : 'industry'

    for (const ix in languages) {
        const lang = languages[ix];
        console.log(`Fetching ${DOMAIN} industry ${projectsYamlNameSuffix} ${lang} data`);
        let allData = []
        for (const ix in STRAPIDATA_IND_PROJECT) {
            let industry_project = JSON.parse(JSON.stringify(STRAPIDATA_IND_PROJECT[ix]));
            industry_project.roles_in_project = {}
            industry_project.comp_roles_in_project = {}

            // rueten func. is run for each industry_project separately instead of whole data, that is
            // for the purpose of saving slug_en before it will be removed by rueten func.
            industry_project = rueten(industry_project, lang);
            let dirSlug = industry_project.slug ? industry_project.slug : null;

            if (dirSlug === null) {
                if (lang === 'en' && DOMAIN === 'industry.poff.ee') {
                    console.log(`ERROR! Industry ${projectsYamlNameSuffix} ID ${industry_project.id} missing slug ${lang}, skipped.`);
                }
                continue
            }
            if (!industry_project.title) {
                if (lang === 'en' && DOMAIN === 'industry.poff.ee') {
                    console.log(`ERROR! Industry ${projectsYamlNameSuffix} ID ${industry_project.id} missing title ${lang}, skipped.`);
                }
                continue
            }

            industry_project.path = `project/${dirSlug}`

            if (industry_project.clipUrl) {
                if (industry_project.clipUrl && industry_project.clipUrl.length > 10) {
                    if (industry_project.clipUrl.includes('vimeo')) {
                        let splitVimeoLink = industry_project.clipUrl.split('/')
                        let videoCode = splitVimeoLink !== undefined ? splitVimeoLink[splitVimeoLink.length - 1] : ''
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

            const credentials = industry_project.credentials || {}
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
                industry_project.persons[person_id] = industry_project.persons[person_id] || { id: person_id, rolesAtFilm: [] }
                if (role_person.role_at_film) {
                    industry_project.persons[person_id].rolesAtFilm.push(role_person.role_at_film.roleNamePrivate)

                    if (!(role_person.role_at_film.roleNamePrivate in industry_project.roles_in_project)) {

                        let roleName = STRAPIDATA_ROLESATFILM.filter(e => {
                            return e.id === role_person.role_at_film.id
                        })[0].roleName[lang]
                        industry_project.roles_in_project[role_person.role_at_film.roleNamePrivate] = { ord: role_person.role_at_film.order ? role_person.role_at_film.order : Number.MAX_VALUE, label: roleName, names: [] }
                    }
                    industry_project.roles_in_project[role_person.role_at_film.roleNamePrivate].names.push({ order: role_person.order, name: role_person.person.firstNameLastName })

                    industry_project.roles_in_project[role_person.role_at_film.roleNamePrivate].names = industry_project.roles_in_project[role_person.role_at_film.roleNamePrivate].names
                        .sort((a, b) => {
                            return a.ord - b.ord
                        })


                    industry_project.roles_in_project = Object.entries(industry_project.roles_in_project)
                        .sort(([, a], [, b]) => {
                            return a.ord - b.ord
                        })
                        .reduce((r, [k, v]) => ({ ...r, [k]: v }), {})
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
                    if (industry_person.person.biography.en) {
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
                industry_project.organisations[company_id] = industry_project.organisations[company_id] || { id: company_id, rolesAtFilm: [] }
                if (role_company.roles_at_film) {
                    industry_project.organisations[company_id].rolesAtFilm.push(role_company.roles_at_film.roleNamePrivate)

                    if (!(role_company.roles_at_film.roleNamePrivate in industry_project.comp_roles_in_project)) {

                        let roleName = STRAPIDATA_ROLESATFILM.filter(e => {
                            return e.id === role_company.roles_at_film.id
                        })[0].roleName[lang]

                        industry_project.comp_roles_in_project[role_company.roles_at_film.roleNamePrivate] = { ord: role_company.roles_at_film.order ? role_company.roles_at_film.order : Number.MAX_VALUE, label: roleName, names: [] }
                    }
                    industry_project.comp_roles_in_project[role_company.roles_at_film.roleNamePrivate].names.push({ order: role_company.order, name: role_company.organisation.namePrivate })
                    industry_project.comp_roles_in_project[role_company.roles_at_film.roleNamePrivate].names = industry_project.comp_roles_in_project[role_company.roles_at_film.roleNamePrivate].names
                        .sort((a, b) => {
                            return a.ord - b.ord
                        })

                    industry_project.comp_roles_in_project = Object.entries(industry_project.comp_roles_in_project)
                        .sort(([, a], [, b]) => {
                            return a.ord - b.ord
                        })
                        .reduce((r, [k, v]) => ({ ...r, [k]: v }), {})
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
                    if (industry_company.organisations.description.en) {
                        industry_company.organisations.description = industry_company.organisations.description.en
                    }
                } catch (error) {
                    null
                }
            }

            industry_project.organisations = Object.values(industry_project.organisations)
            // andmepuhastus

            delete industry_project.credentials

            const oneYaml = yaml.dump(industry_project, { 'noRefs': true, 'indent': '4' });
            const yamlPath = path.join(fetchDataDir, dirSlug, `data.${lang}.yaml`);
            let saveDir = path.join(fetchDataDir, dirSlug);
            fs.mkdirSync(saveDir, { recursive: true });

            fs.writeFileSync(yamlPath, oneYaml, 'utf8');
            fs.writeFileSync(`${saveDir}/index.pug`, `include /_templates/industryproject_${templateDomainName}_index_template.pug`)
            if (archiveBuild) {
                addConfigPathAliases([`/_fetchdir/industryprojects_archive/${dirSlug}`])
            }

            allData.push(industry_project);

        }

        const yamlPath = path.join(fetchDir, `industry${projectsYamlNameSuffix}.${lang}.yaml`);
        const searchYamlPath = path.join(fetchDir, `search_${projectsYamlNameSuffix}.${lang}.yaml`);
        const filtersYamlPath = path.join(fetchDir, `filters_${projectsYamlNameSuffix}.${lang}.yaml`);
        if (allData.length) {
            allData = allData.sort((a, b) => a.title.localeCompare(b.title, lang))
            const allDataYAML = yaml.dump(allData, { 'noRefs': true, 'indent': '4' });
            fs.writeFileSync(yamlPath, allDataYAML, 'utf8');

            generateProjectsSearchAndFilterYamls(allData, lang, projectsYamlNameSuffix);

        } else {
            console.log(`No data for industry ${projectsYamlNameSuffix}, creating empty YAMLs`);
            fs.writeFileSync(yamlPath, '[]', 'utf8');
            fs.writeFileSync(searchYamlPath, '[]', 'utf8');
            fs.writeFileSync(filtersYamlPath, '[]', 'utf8');
        }

        // for (const industry_project of allData) {
        //     const dirSlug = industry_project.slug || industry_project.id
        //     const saveDir = path.join(fetchDataDir, dirSlug);
        //     fs.mkdirSync(saveDir, { recursive: true });

        //     industry_project.data = {'articles': '/_fetchdir/articles.en.yaml'};
        //     industry_project.path = `project/${dirSlug}`

        //     const yamlPath = path.join(fetchDataDir, dirSlug, 'data.en.yaml')
        //     const oneYaml = yaml.dump(industry_project, { 'noRefs': true, 'indent': '4' })
        //     fs.writeFileSync(yamlPath, oneYaml, 'utf8')
        //     fs.writeFileSync(path.join(saveDir,'index.pug'), `include /_templates/industryproject_${templateDomainName}_index_template.pug`)
        // }
    }
}

