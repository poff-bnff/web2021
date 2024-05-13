const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');
const rueten = require('./rueten.js');
const videoUrlToVideoCode = require('./videourl_to_videocode.js');
const { fetchModel } = require('./b_fetch.js')

const rootDir = path.join(__dirname, '..')
const domainSpecificsPath = path.join(rootDir, 'domain_specifics.yaml')
const DOMAIN_SPECIFICS = yaml.load(fs.readFileSync(domainSpecificsPath, 'utf8'))
const INDUSTRY_ORGANISATION_IN_EDITIONS = DOMAIN_SPECIFICS.industry_organisation_in_editions

const sourceDir = path.join(rootDir, 'source');
const fetchDir = path.join(sourceDir, '_fetchdir');
const strapiDataPath = path.join(sourceDir, '_allStrapidata', 'Organisation.yaml');
const DOMAIN = process.env['DOMAIN'] || 'industry.poff.ee';
const ORGANISATIONLIMIT = parseInt(process.env['ORGANISATIONLIMIT']) || 0

const fetchDataDir = path.join(fetchDir, 'organisations')

if (DOMAIN !== 'industry.poff.ee') {
    let emptyYAML = yaml.dump([], {
        'noRefs': true,
        'indent': '4'
    })
    fs.writeFileSync(path.join(fetchDir, `organisations.en.yaml`), emptyYAML, 'utf8')
} else {
    const STRAPIDATA_ORGANISATION = yaml.load(fs.readFileSync(strapiDataPath, 'utf8'))

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
        }
    }
    console.log(`Fetching ${DOMAIN} organisation data`)
    const STRAPIDATA_ALL_ORGANISATIONS = fetchModel(STRAPIDATA_ORGANISATION, minimodel)
    console.log(`Fetched ${STRAPIDATA_ALL_ORGANISATIONS.length} ${DOMAIN} organisation data`)

    const languages = DOMAIN_SPECIFICS.locales[DOMAIN]

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
    startOrganisationProcessing(languages, activeOrganisations)
}

function startOrganisationProcessing(languages, activeOrganisations) {
    for (lang of languages) {

        console.log(`Fetching ${DOMAIN} organisations ${lang} data`)

        //const filteredOrganisations = []
        let limit = ORGANISATIONLIMIT
        let counting = 0

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

            if (organisation.showreel) {
                organisation.showreel = videoUrlToVideoCode(organisation.showreel)
            }

            let oneYaml = {}
            try {
                oneYaml = yaml.dump(organisation, { 'noRefs': true, 'indent': '4' })
            } catch (error) {
                console.error({ error, organisation })
                throw error
            }

            let saveDir = path.join(fetchDataDir, organisationSlug)
            fs.mkdirSync(saveDir, { recursive: true })
            fs.writeFileSync(`${saveDir}/data.${lang}.yaml`, oneYaml, 'utf8')
            fs.writeFileSync(`${saveDir}/index.pug`, `include /_templates/organisation_index_template.pug`)
        }
    }
}