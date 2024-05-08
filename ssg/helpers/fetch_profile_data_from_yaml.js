const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');
const rueten = require('./rueten.js');
const { fetchModel } = require('./b_fetch.js')

const rootDir = path.join(__dirname, '..')
const domainSpecificsPath = path.join(rootDir, 'domain_specifics.yaml')
const DOMAIN_SPECIFICS = yaml.load(fs.readFileSync(domainSpecificsPath, 'utf8'))
const INDUSTRY_ORGANISATION_IN_EDITIONS = DOMAIN_SPECIFICS.industry_organisation_in_editions
const INDUSTRY_PERSON_IN_EDITIONS = DOMAIN_SPECIFICS.industry_person_in_editions
const ACTOR_ROLES = DOMAIN_SPECIFICS.actor_roles

const sourceDir = path.join(rootDir, 'source');
const fetchDir = path.join(sourceDir, '_fetchdir');
const strapiDataPathOrg = path.join(sourceDir, '_allStrapidata', 'Organisation.yaml');
const strapiDataPathPerson = path.join(sourceDir, '_allStrapidata', 'Person.yaml');
const DOMAIN = process.env['DOMAIN'] || 'industry.poff.ee';
const SHORT_DESC_LENGTH = 100
const DATALIMIT = parseInt(process.env['ORGANISATIONLIMIT']) || 0

if (DOMAIN !== 'industry.poff.ee') {
    let emptyYAML = yaml.dump([], {
        'noRefs': true,
        'indent': '4'
    })
    fs.writeFileSync(path.join(fetchDir, `profiles.en.yaml`), emptyYAML, 'utf8')
} else {
    let activeOrganisations = getActiveOrganisations()
    let activePersons = getActivePersons()
    const languages = DOMAIN_SPECIFICS.locales[DOMAIN]

    startProfileProcessing(languages, activePersons, activeOrganisations)
}

function startProfileProcessing(languages, activePersons, activeOrganisations) {
    for (lang of languages) {

        console.log(`Fetching ${DOMAIN} profiles ${lang} data`)

        const filteredProfiles = []
        let limit = DATALIMIT
        let counting = 0

        for (const ix in activePersons) {
            if (limit !== 0 && counting === limit) break
            counting++

            let person = JSON.parse(JSON.stringify(activePersons[ix])) // deep copy, because rueten mutates the object
            person = rueten(person, lang) // TODO: rueten mutates the object, assignment is unnecessary

            let personSlug = person.slug
            // if slug is not defined, then skip this person
            if (!personSlug) {
                console.info(`Person ${person.id} has no slug, skipping`)
                continue
            }
            person.path = personSlug
            person.slug = personSlug

            person.filterName = person.firstNameLastName

            person.profileType = isActor(person) ? "Actor" : "Person"

            person.serviceSize = "Freelancer"

            person.shortDescription = person.bio ? person.bio.substr(0, SHORT_DESC_LENGTH) + "...": ""

            person.cardLocation = person.addr_coll ? getCardLocation(person.addr_coll) : ""

            filteredProfiles.push(person);
        }

        counting = 0

        for (const ix in activeOrganisations) {

            if (limit !== 0 && counting === limit) break
            counting++

            let organisation = JSON.parse(JSON.stringify(activeOrganisations[ix])) // deep copy, because rueten mutates the object
            organisation = rueten(organisation, lang) // TODO: rueten mutates the object, assignment is unnecessary

            let organisationSlug = organisation.slug
            // if slug is not defined, then skip this organisation
            if (!organisationSlug) {
                console.info(`Organisation ${organisation.id} has no slug, skipping`)
                continue
            }
            organisation.path = organisationSlug
            organisation.slug = organisationSlug

            organisation.filterName = organisation.name
            organisation.profileType = "Organisation"

            var sSize = ""
            if(organisation.employees_n > 0 && organisation.employees_n < 6){
                sSize = "1-5 employees"
            }
            else if(organisation.employees_n > 5 && organisation.employees_n < 11){
                sSize = "6-10 employees"
            }
            else if(organisation.employees_n > 10){
                sSize = "10+ employees"
            }
            organisation.serviceSize = sSize

            organisation.shortDescription = organisation.description ? organisation.description.substr(0, SHORT_DESC_LENGTH) + "...": ""

            organisation.cardLocation = organisation.addr_coll ? getCardLocation(organisation.addr_coll) : ""

            filteredProfiles.push(organisation);
        }

        const yamlPath = path.join(fetchDir, `profiles.${lang}.yaml`)

        if (filteredProfiles.length === 0) {
            console.log(`No data for profiles, creating empty YAMLs`)
            fs.writeFileSync(yamlPath, '[]', 'utf8')
            fs.writeFileSync(path.join(fetchDir, `search_profiles.${lang}.yaml`), '[]', 'utf8')
            fs.writeFileSync(path.join(fetchDir, `filters_profiles.${lang}.yaml`), '[]', 'utf8')
            continue
        }

        filteredProfiles.sort((a, b) => `${a.filterName}`.localeCompare(`${b.filterName}`, lang))
        const filteredProfilesYAML = yaml.dump(filteredProfiles, { 'noRefs': true, 'indent': '4' });
        fs.writeFileSync(yamlPath, filteredProfilesYAML, 'utf8');
        console.log(`Fetched ${filteredProfiles.length} profiles for ${DOMAIN}`);

        /*const activeCategories = Object.keys(INDUSTRY_PERSON_IN_EDITIONS)
        for (const activeCategory of activeCategories) {
            generatePersonsSearchAndFilterYamls(filteredPersons, activeCategory, lang)
        }*/
    }
}

function getCardLocation(address) {
    let location = ""
    if(address.municipality && address.municipality.name){
        location = address.municipality.name
    }
    else if(address.county && address.county.name){
        location = address.county.name
    }

    if(address.country && address.country.name){
        location += ", " + address.country.name
    }
    return location
}

function isActor(person) {
    let isActor = false
    if(person.role_at_films){
        for (const [key, role] of Object.entries(person.role_at_films)) {
            if(ACTOR_ROLES.includes(role.id)){
                isActor = true
            }
        }
    }
    return isActor
}

function getActivePersons() {
    const STRAPIDATA_PERSON = yaml.load(fs.readFileSync(strapiDataPathPerson, 'utf8'))

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
        },
        'tag_looking_fors': {
            model_name: 'TagLookingFor'
        }
    }
    console.log(`Fetching ${DOMAIN} persons data`)
    const STRAPIDATA_ALL_PERSONS = fetchModel(STRAPIDATA_PERSON, minimodel)
    console.log(`Fetched ${STRAPIDATA_ALL_PERSONS.length} ${DOMAIN} persons data`)

    const activeCategories = Object.keys(INDUSTRY_PERSON_IN_EDITIONS)
    console.log('activeCategories', activeCategories)
    const activePersons = STRAPIDATA_ALL_PERSONS
        // filter out persons who have no festival_editions
        .filter(p => p.festival_editions && p.festival_editions.length)
        // set is_in_industry and is_in_creative and ... to true/false based on festival_editions of the person
        .map(p => {
            for (const [industryPersonInEdition, editionIds] of Object.entries(INDUSTRY_PERSON_IN_EDITIONS)) {
                // console.log('industryPersonInEdition', industryPersonInEdition, 'editionId', editionIds)
                p[industryPersonInEdition] = p.festival_editions.some(fe => editionIds.includes(fe.id))
            }
            return p
        })
        // filter out persons who are not in any active edition
        .filter(p => {
            return activeCategories.some(activeEdition => p[activeEdition])
        })
    console.log('activePersons', activePersons.length)
    return activePersons
}

function getActiveOrganisations() {
    const STRAPIDATA_ORGANISATION = yaml.load(fs.readFileSync(strapiDataPathOrg, 'utf8'))

    const minimodel = {
        'role_at_films': {
            model_name: 'RoleAtFilm'
        },
        'awardings': {
            model_name: 'Awarding'
        },
        'filmographies': {
            model_name: 'Filmography'
        },
        'clients': {
            model_name: 'Organisation'
        },
        'addr_coll': {
            model_name: 'Address',
            expand: {
                'country': {
                    model_name: 'Country'
                },
                'county': {
                    model_name: 'County'
                }
            }
        },
        'country': {
            model_name: 'Country'
        },
        'tag_looking_fors': {
            model_name: 'TagLookingFor'
        }
    }
    console.log(`Fetching ${DOMAIN} organisation data`)
    const STRAPIDATA_ALL_ORGANISATIONS = fetchModel(STRAPIDATA_ORGANISATION, minimodel)
    console.log(`Fetched ${STRAPIDATA_ALL_ORGANISATIONS.length} ${DOMAIN} organisation data`)

    const activeCategories = Object.keys(INDUSTRY_ORGANISATION_IN_EDITIONS)
    console.log('activeCategories', activeCategories)
    const activeOrganisations = STRAPIDATA_ALL_ORGANISATIONS
        // filter out organisations who have no festival_editions
        .filter(p => p.festival_editions && p.festival_editions.length)
        // set is_in_industry and is_in_creative and ... to true/false based on festival_editions of the organisation
        .map(p => {
            for (const [industryOrganisationInEdition, editionIds] of Object.entries(INDUSTRY_ORGANISATION_IN_EDITIONS)) {
                p[industryOrganisationInEdition] = p.festival_editions.some(fe => editionIds.includes(fe.id))
            }
            return p
        })
        // filter out organisations who are not in any active edition
        .filter(p => {
            return activeCategories.some(activeEdition => p[activeEdition])
        })
    console.log('activeOrganisations', activeOrganisations.length)
    return activeOrganisations
}