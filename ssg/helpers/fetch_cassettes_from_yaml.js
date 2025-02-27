const fs = require('fs')
const yaml = require('js-yaml')
const path = require('path')
const { deleteFolderRecursive, JSONcopy } = require("./helpers.js")
const rueten = require('./rueten.js')
const { fetchModel } = require('./b_fetch.js')
const prioritizeImagesFilm = require('./image_prioritizer_for_film.js')
const prioritizeImages = require('./image_prioritizer.js')
const replaceBadChars = require('./replace_bad_chars.js')

const { parseMediaLink } = require('./regexes')
const { timer } = require("./timer")
timer.start(__filename)

const rootDir = path.join(__dirname, '..')
const domainSpecificsPath = path.join(rootDir, 'domain_specifics.yaml')
const DOMAIN_SPECIFICS = yaml.load(fs.readFileSync(domainSpecificsPath, 'utf8'))
const imageOrderStills = DOMAIN_SPECIFICS.cassettesAndFilmsImageStillsPriority
const imageOrderStillsListView = DOMAIN_SPECIFICS.cassettesAndFilmsListViewImagePriority
const imageOrderDirector = DOMAIN_SPECIFICS.cassettesAndFilmsDirectorPicturePriority
const imageOrderDirectorDefaults = DOMAIN_SPECIFICS.cassettesAndFilmsDirectorPicturePriorityDefaults
const showVotemo = DOMAIN_SPECIFICS.cassettesAndFilmsShowVotemo

const sourceDir = path.join(rootDir, 'source')
const cassetteTemplatesDir = path.join(sourceDir, '_templates', 'cassette_templates')
const fetchDir = path.join(sourceDir, '_fetchdir')
const strapiDataDirPath = path.join(sourceDir, '_domainStrapidata')

const strapiDataPersonPath = path.join(strapiDataDirPath, 'Person.yaml')
const STRAPIDATA_PERSONS = yaml.load(fs.readFileSync(strapiDataPersonPath, 'utf8'))
const strapiDataProgrammePath = path.join(strapiDataDirPath, 'Programme.yaml')
const STRAPIDATA_PROGRAMMES = yaml.load(fs.readFileSync(strapiDataProgrammePath, 'utf8'))
// const strapiDataFEPath = path.join(strapiDataDirPath, 'FestivalEdition.yaml')
// const STRAPIDATA_FE = yaml.load(fs.readFileSync(strapiDataFEPath, 'utf8'))
const strapiDataScreeningPath = path.join(strapiDataDirPath, 'Screening.yaml')
const STRAPIDATA_SCREENINGS_YAML = yaml.load(fs.readFileSync(strapiDataScreeningPath, 'utf8'))

// if Cassette_updates.yaml does exist, then merge it with Cassette.yaml and overwrite the values from Cassette.yaml
timer.log(__filename, `Merging Cassette_updates.yaml with Cassette.yaml and loading it`)
const { loadStrapidataCassettes } = require('./helpers.js')
const STRAPIDATA_CASSETTES_YAML = loadStrapidataCassettes()

const whichScreeningTypesToFetch = []

const params = process.argv.slice(2)
const param_build_type = params[0]
const target_id = params.slice(1)

const addConfigPathAliases = require('./add_config_path_aliases.js')

if (param_build_type === 'target') {
    addConfigPathAliases(['/films', '/search', '/my_films'])
}

const DOMAIN = process.env['DOMAIN'] || 'poff.ee'
const festival_editions = DOMAIN_SPECIFICS.cassettes_festival_editions[DOMAIN] || []

// Kassettide limiit mida buildida
const CASSETTELIMIT = parseInt(process.env['CASSETTELIMIT']) || 0

// true = check if programme is for this domain / false = check if festival edition is for this domain
const CHECKPROGRAMMES = false

// Domeenid mille puhul näidatakse ka filme millel ei ole screeningut
const skipScreeningsCheckDomains = DOMAIN_SPECIFICS.domains_show_cassetes_wo_screenings || []

// DEFAULT DEFAULT
// // Teistel domeenidel, siia kõik Screening_types name mida soovitakse kasseti juurde lisada, VÄIKETÄHTEDES.
if (!skipScreeningsCheckDomains.includes(DOMAIN)) {
    whichScreeningTypesToFetch.push('first screening')
    whichScreeningTypesToFetch.push('first wave')
    whichScreeningTypesToFetch.push('first wave first screening')
    whichScreeningTypesToFetch.push('regular')
    // whichScreeningTypesToFetch.push('online kino')
    whichScreeningTypesToFetch.push('free')
}

const mapping = DOMAIN_SPECIFICS.domain

const minimodel_cassette = {
    'presenters': {
        model_name: 'Organisation'
    },
    'tags': {
        model_name: 'Tags',
        expand: {
            'programmes': {
                model_name: 'Programme',
                expand: {
                    'festival_editions': {
                        model_name: 'FestivalEdition',
                        expand: {
                            'festival': {
                                model_name: 'Festival'
                            }
                        }
                    }
                }
            }
        }
    },
    'orderedFilms': {
        model_name: 'OrderedFilm',
        expand: {
            'film': {
                model_name: 'Film',
                expand: {
                    // 'media': {
                    //     model_name: 'FilmMedia'
                    // },
                    'festival_editions': {
                        model_name: 'FestivalEdition'
                    },
                    'credentials': {
                        model_name: 'Credentials',
                        expand: {
                            'rolePerson': {
                                model_name: 'RolePerson',
                                expand: {
                                    'role_at_film': {
                                        model_name: 'RoleAtFilm'
                                    },
                                    'person': {
                                        model_name: 'Person'
                                    },
                                }
                            },
                            'roleCompany': {
                                model_name: 'RoleCompany',
                                expand: {
                                    'role_at_film': {
                                        model_name: 'RoleAtFilm'
                                    },
                                    'organisation': {
                                        model_name: 'Organisation'
                                    },
                                }
                            },
                        }
                    },
                    'world_sales': {
                        model_name: 'Organisation'
                    },
                    'presentedBy': {
                        model_name: 'PresentedBy',
                        expand: {
                            'organisations': {
                                model_name: 'Organisation'
                            }
                        }
                    },
                    'orderedCountries': {
                        model_name: 'OrderedCountries',
                        expand: {
                            'country': {
                                model_name: 'Country'
                            }
                        }
                    },
                    'languages': {
                        model_name: 'Language'
                    },
                    'subtitles': {
                        model_name: 'Language'
                    },
                    'other_festivals': {
                        model_name: 'Festival'
                    },
                    'tags': {
                        model_name: 'Tags',
                        expand: {
                            'programmes': {
                                model_name: 'Programme',
                                expand: {
                                    'festival_editions': {
                                        model_name: 'FestivalEdition',
                                        expand: {
                                            'festival': {
                                                model_name: 'Festival'
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                }
            }
        }
    },
    'festival_editions': {
        model_name: 'FestivalEdition',
        expand: {
            'festival': {
                model_name: 'Festival'
            },
            'domain': {
                model_name: 'Domain'
            }
        }
    },
    'languages': {
        model_name: 'Language'
    },
}

timer.log(__filename, 'fetch_cassettes with merged cassette strapidata calling fetchModel')
const STRAPIDATA_CASSETTES_UNFILTERED = fetchModel(STRAPIDATA_CASSETTES_YAML, minimodel_cassette)

// koondnimekirja tootmisel tehakse:
// nimekiri A kõikidest üksikkassettidest
// nimekiri B kõigist mitmikkassettidest
// nimekirjast A visatakse välja kõik kassetid, mille film figureerib nimekirjas B, ja millel on boolean === false
// koondminekiri salvestatakse A + B

const FILMS_IN_LIST_B_BOOLEAN_FALSE = []
const STRAPIDATA_CASSETTES_B = STRAPIDATA_CASSETTES_UNFILTERED.filter(c => {
    if (c.orderedFilms && c.orderedFilms.length > 1) {
        c.orderedFilms.filter(f => {
            if (f.film) {
                return true
            } else {
                console.log(`ERROR! Cassette ${c.id} has empty orderedFilms record!!!`);
                return false
            }
        }).map(f => {
            if (!f.film.multi_and_single) {
                FILMS_IN_LIST_B_BOOLEAN_FALSE.push(f.film.id)
            }
        })
        return true
    }
})

const STRAPIDATA_CASSETTES_A = STRAPIDATA_CASSETTES_UNFILTERED.filter(c => {
    // Throw error, if orderedFilms does not have film.id
    if (c.orderedFilms && c.orderedFilms.length === 1 &&
        !(c.orderedFilms[0].film && c.orderedFilms[0].film.id)) {
        console.log(`ERROR! Cassette ${c.id} has empty orderedFilms record!!!`);
        throw new Error(`ERROR! Cassette ${c.id} has empty orderedFilms record!!!`)
    }

    if (c.orderedFilms && c.orderedFilms.length === 1 && !FILMS_IN_LIST_B_BOOLEAN_FALSE.includes(c.orderedFilms[0].film.id)) {
        return true
    } else {
        return false
    }
})

const STRAPIDATA_CASSETTES = STRAPIDATA_CASSETTES_A.concat(STRAPIDATA_CASSETTES_B)

// console.log(STRAPIDATA_CASSETTES[1].festival_editions[0].domain);
// console.log(STRAPIDATA_CASSETTES[1].festival_editions[0].festival);

const minimodel_screenings = {
    'introQaConversation': {
        model_name: 'IntroConversationQandA'
    },
    'location': {
        model_name: 'Location',
        expand: {
            'hall': {
                model_name: 'Hall',
                expand: {
                    'cinema': {
                        model_name: 'Cinema',
                        expand: {
                            'town': {
                                model_name: 'Town'
                            }
                        }
                    }
                }
            }
        }
    },
    'extraInfo': {
        model_name: 'Translated'
    },
    'screening_types': {
        model_name: 'ScreeningType'
    },
    'screening_mode': {
        model_name: 'EventMode'
    },
    'subtitles': {
        model_name: 'Language'
    },
    'screening_types': {
        model_name: 'ScreeningType'
    },
    'cassette': {
        model_name: 'Cassette'
    }
}
timer.log(__filename, 'fetch_cassettes with screening strapidata calling fetchModel')
const STRAPIDATA_SCREENINGS = fetchModel(STRAPIDATA_SCREENINGS_YAML, minimodel_screenings)

if (CHECKPROGRAMMES) {
    let cassettesWithOutProgrammes = []
    var STRAPIDATA_CASSETTE = STRAPIDATA_CASSETTES.filter(cassette => {
        let programme_ids = STRAPIDATA_PROGRAMMES.map(programme => programme.id)
        if (cassette.tags && cassette.tags.programmes) {
            let cassette_programme_ids = cassette.tags.programmes.map(programme => programme.id)
            return cassette_programme_ids.filter(cp_id => programme_ids.includes(cp_id))[0] !== undefined
        } else {
            cassettesWithOutProgrammes.push(cassette.id)
            return false
        }
    })
    if (cassettesWithOutProgrammes && cassettesWithOutProgrammes.length) {
        timer.log(__filename, `Cassettes with IDs ${cassettesWithOutProgrammes.join(', ')} have no programmes`)
    }

} else if (!CHECKPROGRAMMES) { //  && DOMAIN !== 'poff.ee' commented out, unsure why set in first place

    let cassettesWithOutFestivalEditions = []

    // Filter cassettes by FE's
    var STRAPIDATA_CASSETTE = STRAPIDATA_CASSETTES.filter(cassette => {
        if (cassette.festival_editions && cassette.festival_editions.length) {
            let cassette_festival_editions_ids = cassette.festival_editions.map(edition => edition.id)
            return cassette_festival_editions_ids.filter(cfe_id => festival_editions.includes(cfe_id))[0] !== undefined
        } else {
            cassettesWithOutFestivalEditions.push(cassette.id)
            return false
        }
    })
    if (cassettesWithOutFestivalEditions.length) {
        timer.log(__filename, `Cassettes with IDs ${cassettesWithOutFestivalEditions.join(', ')} have no festival editions`)
    }

} else {
    var STRAPIDATA_CASSETTE = STRAPIDATA_CASSETTES
}

const cassettesPath = path.join(fetchDir, 'cassettes')
deleteFolderRecursive(cassettesPath)

const missingUrlErrorIDs = { cassette: [], film: [] }
const allLanguages = DOMAIN_SPECIFICS.locales[DOMAIN]

for (const lang of allLanguages) {
    let cassettesWithOutFilms = []
    let cassettesWithOutSpecifiedScreeningType = []

    fs.mkdirSync(cassettesPath, { recursive: true })
    timer.log(__filename, `Fetching ${DOMAIN} cassettes ${lang} data`)
    let allData = []
    let slugMissingErrorNumber = 0
    var templateMissingMessageDisplayed = false
    let slugMissingErrorIDs = []
    let limit = CASSETTELIMIT
    let counting = 0
    for (const s_cassette of STRAPIDATA_CASSETTE) {
        var hasOneCorrectScreening = skipScreeningsCheckDomains.includes(DOMAIN) ? true : false

        if (limit !== 0 && counting === limit) break
        counting++

        const s_cassette_copy = JSONcopy(s_cassette)
        s_cassette_copy.switches = s_cassette.switches || {}
        s_cassette_copy.switches.showVotemo = showVotemo

        let slugEn = undefined
        if (s_cassette_copy.films && s_cassette_copy.films.length === 1) {
            slugEn = s_cassette_copy.films[0].slug_en
            if (!slugEn) {
                slugEn = s_cassette_copy.films[0].slug_et
            }
        }
        if (!slugEn) {
            slugEn = s_cassette_copy.slug_en
            if (!slugEn) {
                slugEn = s_cassette_copy.slug_et
            }
        }

        if (typeof slugEn === 'undefined' || slugEn === null || slugEn === '') {
            slugMissingErrorNumber++
            slugMissingErrorIDs.push(s_cassette_copy.id)
            continue
        }

        if (param_build_type === 'target' && target_id.includes(s_cassette_copy.id.toString())) {
            addConfigPathAliases([`/_fetchdir/cassettes/${slugEn}`])
        }

        s_cassette_copy.dirSlug = slugEn
        s_cassette_copy.directory = path.join(cassettesPath, slugEn)
        fs.mkdirSync(s_cassette_copy.directory, { recursive: true })

        let cassetteCarouselPicsCassette = []
        let cassetteCarouselPicsCassetteThumbs = []
        let cassetteCarouselPicsFilms = []
        let cassetteCarouselPicsFilmsThumbs = []
        let cassettePostersCassette = []
        let cassettePostersFilms = []

        // rueten func. is run for each s_cassette_copy separately instead of whole data, that is
        // for the purpose of saving slug_en before it will be removed by rueten func.
        rueten(s_cassette_copy, lang)

        if (s_cassette_copy.synopsis && typeof s_cassette_copy.synopsis === 'string') {
            s_cassette_copy.synopsis = replaceBadChars(s_cassette_copy.synopsis, s_cassette_copy.id, 'cassette')
        }

        if (s_cassette_copy.logline && typeof s_cassette_copy.logline === 'string') {
            s_cassette_copy.logline = replaceBadChars(s_cassette_copy.logline, s_cassette_copy.id, 'cassette')
        }

        // #379 put ordered films to cassette.film
        let ordered_films = s_cassette_copy.orderedFilms.filter(f => f.film)

        if (ordered_films !== undefined && ordered_films[0]) {
            s_cassette_copy.films = JSON.parse(JSON.stringify(ordered_films))
            s_cassette_copy.films = s_cassette_copy.films.map(a => {
                let film = a.film
                film.order = a.order
                return film
            })
        }

        // Kasseti treiler
        trailerProcessing(s_cassette_copy, 'cassette')

        if (s_cassette_copy.films && s_cassette_copy.films.length) {
            for (const onefilm of s_cassette_copy.films) {
                if (onefilm.orderedCountries) {
                    let orderedCountries = onefilm.orderedCountries.filter(c => {
                        if (c && c.country) {
                            return true
                        } else {
                            console.log(`ERROR! Film ${onefilm.id} has empty orderedCountries!!!`);
                            return false
                        }
                    })
                        .sort(function (a, b) { return (a.order > b.order) ? 1 : ((b.order > a.order) ? -1 : 0); })
                    onefilm.orderedCountries = orderedCountries
                    if (orderedCountries.length) {
                        onefilm.orderedCountriesDisplay = orderedCountries
                            .map(country => country.country.name)
                            .join(', ')
                    }

                }
                if (onefilm.synopsis && typeof onefilm.synopsis === 'string') {
                    onefilm.synopsis = replaceBadChars(onefilm.synopsis, onefilm.id, 'film')
                }
                if (onefilm.logline && typeof onefilm.logline === 'string') {
                    onefilm.logline = replaceBadChars(onefilm.logline, onefilm.id, 'film')
                }
            }
        }

        // Screenings
        let screenings = []
        for (screeningIx in STRAPIDATA_SCREENINGS) {
            let screening = JSONcopy(STRAPIDATA_SCREENINGS[screeningIx])

            if (screening.cassette && screening.cassette.id === s_cassette_copy.id
                && screening.screening_types && screening.screening_types[0]) {
                let screeningNames = function (item) {
                    let itemNames = item.name
                    return itemNames
                }
                // Kontroll kas screeningtype kassetile lisada, st kas vähemalt üks screening type on whichScreeningTypesToFetch arrays olemas
                if (!skipScreeningsCheckDomains.includes(DOMAIN) && !screening.screening_types.map(screeningNames).some(ai => whichScreeningTypesToFetch.includes(ai.toLowerCase()))) {
                    continue
                }

                // Kui vähemalt üks screeningtype õige, siis hasOneCorrectScreening = true
                // - st ehitatakse

                hasOneCorrectScreening = true

                delete screening.cassette
                screenings.push(rueten(screening, lang))
            }
        }

        if (screenings.length > 0) {
            s_cassette_copy.screenings = screenings.sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime))
        }

        for (key in s_cassette_copy) {
            if (key == 'slug') {
                s_cassette_copy.path = `film/${s_cassette_copy[key]}`
                s_cassette_copy.slug = `${s_cassette_copy[key]}`
            }
        }

        if (s_cassette_copy.path === undefined) {
            s_cassette_copy.path = `film/${slugEn}`
            s_cassette_copy.slug = slugEn
        }

        s_cassette_copy.media = {}
        if (s_cassette_copy?.stills?.[0]) { s_cassette_copy.media.stills = s_cassette_copy.stills }
        if (s_cassette_copy?.posters?.[0]) { s_cassette_copy.media.posters = s_cassette_copy.posters }
        if (s_cassette_copy?.trailer?.[0]) { s_cassette_copy.media.trailer = s_cassette_copy.trailer }
        if (s_cassette_copy?.QaClip?.[0]) { s_cassette_copy.media.QaClip = s_cassette_copy.QaClip }
        delete s_cassette_copy.media

        const cassetteStills = prioritizeImagesFilm(s_cassette_copy, imageOrderStills, 'stills')
        const cassetteStillsThumbs = prioritizeImagesFilm(s_cassette_copy, imageOrderStillsListView, 'stills')

        // Cassette carousel pics
        if (cassetteStills?.length?.images) {
            for (still of cassetteStills.images) {
                if (still.substring(0, 4) === 'F_1_') {
                    cassetteCarouselPicsCassette.unshift(`https://assets.poff.ee/img/${still}`)
                }
                cassetteCarouselPicsCassette.push(`https://assets.poff.ee/img/${still}`)
            }
        }

        // Cassette carousel pics thumbs
        if (cassetteStillsThumbs?.length?.imagesThumbs) {
            for (still of cassetteStillsThumbs.imagesThumbs) {
                if (still.substring(0, 4) === 'F_1_') {
                    cassetteCarouselPicsCassetteThumbs.unshift(`https://assets.poff.ee/img/${still}`)
                }
                cassetteCarouselPicsCassetteThumbs.push(`https://assets.poff.ee/img/${still}`)
            }
        }

        // // Cassette carousel pics
        // if (s_cassette_copy.media && s_cassette_copy.media.stills && s_cassette_copy.media.stills[0]) {
        //     for (const stillIx in s_cassette_copy.media.stills) {
        //         let still = s_cassette_copy.media.stills[stillIx]
        //         if (still.hash && still.ext) {
        //             if (still.hash.substring(0, 4) === 'F_1_') {
        //                 cassetteCarouselPicsCassette.unshift(`https://assets.poff.ee/img/${still.hash}${still.ext}`)
        //             }
        //             cassetteCarouselPicsCassette.push(`https://assets.poff.ee/img/${still.hash}${still.ext}`)
        //         }
        //     }
        // }

        if (cassetteCarouselPicsCassette.length > 0) {
            s_cassette_copy.cassetteCarouselPicsCassette = [...new Set(cassetteCarouselPicsCassette)]
            s_cassette_copy.cassetteCarouselPicsCassetteThumbs = [[...new Set(cassetteCarouselPicsCassetteThumbs)][0]]
        }

        // Cassette poster pics
        if (s_cassette_copy.posters && s_cassette_copy.posters[0]) {
            for (const posterIx in s_cassette_copy.posters) {
                let poster = s_cassette_copy.posters[posterIx]
                if (poster.hash && poster.ext) {
                    if (poster.hash.substring(0, 2) === 'P_') {
                        cassettePostersCassette.unshift(`https://assets.poff.ee/img/${poster.hash}${poster.ext}`)
                    }
                    cassettePostersCassette.push(`https://assets.poff.ee/img/${poster.hash}${poster.ext}`)
                }
            }
        }

        if (cassettePostersCassette.length > 0) {
            s_cassette_copy.cassettePostersCassette = cassettePostersCassette
        }

        if (s_cassette_copy.films && s_cassette_copy.films[0]) {
            for (scc_film of s_cassette_copy.films) {

                // console.log(scc_film);
                let filmSlugEn = scc_film.slug_en

                if (!filmSlugEn) {
                    filmSlugEn = scc_film.slug
                }
                if (typeof filmSlugEn !== 'undefined') {
                    scc_film.dirSlug = filmSlugEn
                }

                scc_film.media = {}
                // Construct film media
                if (scc_film?.stills?.[0]) { scc_film.media.stills = scc_film.stills }
                if (scc_film?.posters?.[0]) { scc_film.media.posters = scc_film.posters }
                if (scc_film?.trailer?.[0]) { scc_film.media.trailer = scc_film.trailer }
                if (scc_film?.QaClip?.[0]) { scc_film.media.QaClip = scc_film.QaClip }

                const filmStills = prioritizeImagesFilm(scc_film, imageOrderStills, 'stills')
                const filmStillsThumbs = prioritizeImagesFilm(scc_film, imageOrderStillsListView, 'stills')
                delete scc_film.media

                let sortedFilmStills = []

                // Film carousel pics
                if (filmStills?.images?.length) {
                    for (still of filmStills.images) {
                        if (still.substring(0, 4) === 'F_1_') {
                            cassetteCarouselPicsFilms.unshift(`https://assets.poff.ee/img/${still}`)
                            sortedFilmStills.unshift(still)
                        } else {
                            cassetteCarouselPicsFilms.push(`https://assets.poff.ee/img/${still}`)
                            sortedFilmStills.push(still)
                        }
                    }
                }
                scc_film.stills = sortedFilmStills.length ? sortedFilmStills : null

                // Film carousel pics thumbs
                if (filmStillsThumbs?.imagesThumbs?.length) {
                    for (still of filmStillsThumbs.imagesThumbs) {
                        if (still.substring(0, 4) === 'F_1_') {
                            cassetteCarouselPicsFilmsThumbs.unshift(`https://assets.poff.ee/img/${still}`)
                        } else {
                            cassetteCarouselPicsFilmsThumbs.push(`https://assets.poff.ee/img/${still}`)
                        }
                    }
                }

                // // Film carousel pics
                // if (scc_film.media && scc_film.media.stills && scc_film.media.stills[0]) {
                //     for (still of scc_film.media.stills) {
                //         if (still.hash && still.ext) {
                //             if (still.hash.substring(0, 4) === 'F_1_') {
                //                 cassetteCarouselPicsFilms.unshift(`https://assets.poff.ee/img/${still.hash}${still.ext}`)
                //             }
                //             cassetteCarouselPicsFilms.push(`https://assets.poff.ee/img/${still.hash}${still.ext}`)
                //         }
                //     }
                // }

                if (cassetteCarouselPicsFilms.length > 0) {
                    s_cassette_copy.cassetteCarouselPicsFilms = [...new Set(cassetteCarouselPicsFilms)]
                    s_cassette_copy.cassetteCarouselPicsFilmsThumbs = [[...new Set(cassetteCarouselPicsFilmsThumbs)][0]]
                }

                // Film posters pics
                if (scc_film.posters && scc_film.posters[0]) {
                    for (poster of scc_film.posters) {
                        if (poster.hash && poster.ext) {
                            if (poster.hash.substring(0, 2) === 'P_') {
                                cassettePostersFilms.unshift(`https://assets.poff.ee/img/${poster.hash}${poster.ext}`)
                            }
                            cassettePostersFilms.push(`https://assets.poff.ee/img/${poster.hash}${poster.ext}`)
                        }
                    }
                }

                if (cassettePostersFilms.length > 0) {
                    s_cassette_copy.cassettePostersFilms = cassettePostersFilms
                }

                // Filmi treiler
                trailerProcessing(scc_film, 'film')

                // Rolepersons by role
                // Expand persons with roles:
                const rolesToExpand = ['Director']
                if (scc_film.credentials && scc_film.credentials.rolePerson && scc_film.credentials.rolePerson[0]) {
                    let rolePersonTypes = {}
                    scc_film.credentials.rolePerson.sort(function (a, b) { return (a.order > b.order) ? 1 : ((b.order > a.order) ? -1 : 0) })
                    for (roleIx in scc_film.credentials.rolePerson) {
                        let rolePerson = scc_film.credentials.rolePerson[roleIx]
                        if (rolePerson === undefined) { continue }
                        if (rolePerson.person) {
                            const roleAtFilm = rolePerson.role_at_film || null
                            const roleNamePrivate = roleAtFilm.roleNamePrivate || null
                            if (roleNamePrivate) {
                                if (rolesToExpand.includes(roleNamePrivate)) {
                                    // TODO: manipulate object in place instead of making hard copy
                                    let copyOfPerson = {
                                        ...STRAPIDATA_PERSONS.filter(person => rolePerson.person.id === person.id)[0]
                                    }
                                    copyOfPerson.media = {
                                        picture: [copyOfPerson.picture]
                                    }

                                    // TODO: wtf
                                    const primaryImage = prioritizeImages(copyOfPerson, imageOrderDirector, imageOrderDirectorDefaults)
                                    if (primaryImage) { copyOfPerson.primaryImage = primaryImage }
                                    delete copyOfPerson.media

                                    scc_film.credentials.rolePerson[roleIx].person = copyOfPerson
                                }
                                let searchRegExp = new RegExp(' ', 'g')
                                const role_name_lc = roleAtFilm.roleNamePrivate.toLowerCase().replace(searchRegExp, '')
                                rolePersonTypes[role_name_lc] = rolePersonTypes[role_name_lc] || []

                                if (rolePerson.person.firstNameLastName) {
                                    rolePersonTypes[role_name_lc].push(rolePerson.person.firstNameLastName)
                                } else if (rolePerson.person.id) {
                                    let personFromYAML = STRAPIDATA_PERSONS.filter((a) => { return rolePerson.person.id === a.id })[0]
                                    if (personFromYAML.fullName) {
                                        rolePersonTypes[role_name_lc].push(personFromYAML.fullName)
                                    }
                                }
                            } else {
                                console.log(`WARNING: Something wrong with film ID ${scc_film.id} credentials person ID ${rolePerson.person.id} role_at_film`);
                            }
                        } else {
                            // timer.log(__filename, film.id, ' - ', rolePerson.role_at_film.roleNamePrivate)
                        }
                    }
                    scc_film.credentials.rolePersonsByRole = rolePersonTypes
                }

                // Rolecompanies by role
                if (scc_film.credentials && scc_film.credentials.roleCompany && scc_film.credentials.roleCompany[0]) {
                    let roleCompanyTypes = {}
                    scc_film.credentials.roleCompany.sort(function (a, b) { return (a.order > b.order) ? 1 : ((b.order > a.order) ? -1 : 0) })
                    for (roleIx in scc_film.credentials.roleCompany) {
                        let roleCompany = scc_film.credentials.roleCompany[roleIx]
                        if (roleCompany === undefined) { continue }
                        if (roleCompany.organisation) {
                            if (roleCompany?.role_at_film?.roleNamePrivate) {
                                let searchRegExp = new RegExp(' ', 'g')
                                const role_name_lc = roleCompany.role_at_film.roleNamePrivate.toLowerCase().replace(searchRegExp, '')
                                roleCompanyTypes[role_name_lc] = roleCompanyTypes[role_name_lc] || []

                                if (roleCompany.organisation.name) {
                                    roleCompanyTypes[role_name_lc].push(roleCompany.organisation.name)
                                }
                            } else {
                                console.log(`WARNING: Something wrong with film ID ${scc_film.id} credentials company ID ${scc_film.credentials.roleCompany.id} role_at_film`);
                            }
                        } else {
                            // timer.log(__filename, film.id, ' - ', roleCompany.role_at_film.roleNamePrivate)
                        }
                    }
                    scc_film.credentials.roleCompaniesByRole = roleCompanyTypes
                }
            }
            rueten(s_cassette_copy.films, lang)
        }

        if (hasOneCorrectScreening === true) {
            allData.push(s_cassette_copy)
            if (param_build_type === 'target' && !target_id.includes(s_cassette.id.toString())) {
                continue
            } else if (param_build_type === 'target' && target_id.includes(s_cassette.id.toString())) {
                console.log('Targeting cassette ', s_cassette.id, target_id)
                // timer.log(__filename, util.inspect(s_cassette_copy, {showHidden: false, depth: null}))
            }
            generateYaml(s_cassette_copy, lang)
        } else {
            cassettesWithOutSpecifiedScreeningType.push(s_cassette_copy.id)
        }
    }
    if (slugMissingErrorNumber > 0) {
        timer.log(__filename, `Notification! Value of slug_en or slug_et missing for total of ${slugMissingErrorNumber} cassettes with ID's ${slugMissingErrorIDs.join(', ')}`)
    }
    if (cassettesWithOutFilms.length) {
        uniqueIDs = [...new Set(cassettesWithOutFilms)]
        timer.log(__filename, `ERROR! No films under cassettes with ID's ${uniqueIDs.join(', ')}`)
    }
    if (cassettesWithOutSpecifiedScreeningType.length) {
        uniqueIDs2 = [...new Set(cassettesWithOutSpecifiedScreeningType)]
        timer.log(__filename, `Skipped cassettes with IDs ${uniqueIDs2.join(', ')}, as none of screening types are ${whichScreeningTypesToFetch.join(', ')}`)
    }
    generateAllDataYAML(allData, lang)
}

if (missingUrlErrorIDs.cassette.length) {
    console.warn('WARNING! Cassette(s) with ID(s)', missingUrlErrorIDs.cassette.join(', '), 'have empty trailer components')
}

if (missingUrlErrorIDs.film.length) {
    console.warn('WARNING! Film(s) with ID(s)', missingUrlErrorIDs.film.join(', '), 'have empty trailer components')
}

function trailerProcessing(cassetteOrFilm, type) {
    cassetteOrFilm.trailer = cassetteOrFilm.trailer || []
    // cassetteOrFilm.trailer must be an array
    if (!Array.isArray(cassetteOrFilm.trailer)) {
        throw new Error(`ERROR! ${type} ${cassetteOrFilm.id} trailer is not an array`)
    }
    // filter out empty trailer urls and collect IDs for error message
    cassetteOrFilm.trailer = cassetteOrFilm.trailer
        .filter(t => {
            if (!t.url) {
                missingUrlErrorIDs[type].push(cassetteOrFilm.id)
                return false
            }
            return true
        })
    for (trailer of cassetteOrFilm.trailer) {
        const parsedUrl = parseMediaLink(trailer.url)
        if (parsedUrl === false) {
            console.error(`ERROR! ${type} ${cassetteOrFilm.id} trailer url ${trailer.url} is not valid`)
            throw new Error(`ERROR! ${type} ${cassetteOrFilm.id} trailer url ${trailer.url} is not valid`)
        }
        trailer.videoCode = parsedUrl.code
        trailer.videoHost = parsedUrl.host

        // TODO: make sure some of these would get used on some of the sites
        if (trailer.videoHost === 'youtube.com') {
            trailer.videoUrl = `https://www.youtube.com/watch?v=${trailer.videoCode}`
            trailer.videoEmbedUrl = `https://www.youtube.com/embed/${trailer.videoCode}`
        }
        if (trailer.videoHost === 'youtu.be') {
            trailer.videoUrl = `https://www.youtube.com/watch?v=${trailer.videoCode}`
            trailer.videoEmbedUrl = `https://www.youtube.com/embed/${trailer.videoCode}`
        }
        if (trailer.videoHost === 'vimeo.com') {
            trailer.videoUrl = `https://vimeo.com/${trailer.videoCode}`
            trailer.videoEmbedUrl = `https://player.vimeo.com/video/${trailer.videoCode}`
        }
    }
}

function generateYaml(element, lang) {
    let yamlStr = yaml.dump(element, { 'noRefs': true, 'indent': '4' })


    fs.writeFileSync(`${element.directory}/data.${lang}.yaml`, yamlStr, 'utf8')

    if (mapping[DOMAIN]) {
        let cassetteIndexTemplate = path.join(cassetteTemplatesDir, `cassette_${mapping[DOMAIN]}_index_template.pug`)
        if (fs.existsSync(cassetteIndexTemplate)) {
            fs.writeFileSync(`${element.directory}/index.pug`, `include /_templates/cassette_templates/cassette_${mapping[DOMAIN]}_index_template.pug`)
        } else {
            if (!templateMissingMessageDisplayed) {
                timer.log(__filename, `ERROR! Template ${cassetteIndexTemplate} missing! Using poff.ee template`)
                templateMissingMessageDisplayed = true
            }
            fs.writeFileSync(`${element.directory}/index.pug`, `include /_templates/cassette_templates/cassette_poff_index_template.pug`)
        }
    }
}

function generateAllDataYAML(allData, lang) {


    for (cassette of allData) {

        function picSplit(txt) {
            return txt.replace('assets.poff.ee/img/', 'assets.poff.ee/img/thumbnail_')
        }

        cassette.cassettePostersCassetteThumbs = cassette.cassettePostersCassette?.length ?
            cassette.cassettePostersCassette.map(txt => picSplit(txt)) : null
        cassette.cassettePostersFilmsThumbs = cassette.cassettePostersFilms?.length ?
            cassette.cassettePostersFilms.map(txt => picSplit(txt)) : null

    }


    let allDataYAML = yaml.dump(allData, { 'noRefs': true, 'indent': '4' })
    fs.writeFileSync(path.join(fetchDir, `cassettes.${lang}.yaml`), allDataYAML, 'utf8')
    timer.log(__filename, `Ready for building are ${allData.length} cassettes`)

    // todo: #478 filtrid tuleb compareLocale sortida juba koostamisel.
    let filters = {
        programmes: {},
        languages: {},
        countries: {},
        subtitles: {},
        premieretypes: {},
        filmtypes: {},
        genres: {},
        keywords: {},
        towns: {},
        cinemas: {}
    }
    const cassette_search = allData.map(cassette => {
        let programmes = []
        if (cassette.tags && typeof cassette.tags.programmes !== 'undefined') {
            for (const programme of cassette.tags.programmes) {
                if (typeof programme.festival_editions !== 'undefined') {
                    for (const fested of programme.festival_editions.filter(fe => fe.festival)) {
                        const key = fested.festival.id + '_' + programme.id
                        const festival = fested.festival
                        var festival_name = festival.name

                        programmes.push(key)
                        filters.programmes[key] = `${festival_name} ${programme.name}`
                    }
                }
            }
        }
        let languages = []
        let countries = []
        let cast_n_crew = []
        let film_titles = []
        for (const film of cassette.films) {
            film_titles.push(film.title)
            film_titles.push(film.title_et)
            film_titles.push(film.title_en)
            film_titles.push(film.titleOriginal)
            for (const language of film.languages || []) {
                const langKey = language.code
                const language_name = language.name
                languages.push(langKey)
                filters.languages[langKey] = language_name
            }
            for (const country of film.orderedCountries || []) {
                const countryKey = country.country.code
                const country_name = country.country.name
                countries.push(countryKey)
                filters.countries[countryKey] = country_name
            }

            film.credentials = film.credentials || []
            try {
                for (const key in film.credentials.rolePersonsByRole) {
                    for (const crew of film.credentials.rolePersonsByRole[key]) {
                        cast_n_crew.push(crew)
                    }
                }
            } catch (error) {
                console.log('bad creds on film', JSON.stringify({ film: film, creds: film.credentials }, null, 4));
                throw new Error(error)
            }
        }
        let subtitles = []
        let towns = []
        let cinemas = []
        if (cassette.screenings) {
            for (const screening of cassette.screenings) {
                for (const subtitle of screening.subtitles || []) {
                    const subtKey = subtitle.code
                    const subtitle_name = subtitle.name
                    subtitles.push(subtKey)
                    filters.subtitles[subtKey] = subtitle_name
                }

                const location = screening.location
                if (!location || !location.hall || !location.hall.cinema || !location.hall.cinema.town) {
                    console.warn('screening', screening.id, 'has no location or hall or cinema or town')
                    continue
                }
                const cinema = location.hall.cinema
                const townKey = `_${cinema.town.id}`
                const town_name = cinema.town.name
                towns.push(townKey)
                filters.towns[townKey] = town_name

                const cinemaKey = `_${cinema.id}`
                cinemas.push(cinemaKey)
                filters.cinemas[cinemaKey] = cinema.name
            }
        }
        let premieretypes = []
        let filmtypes = []
        let genres = []
        let keywords = []
        if (cassette.tags) {
            for (const filmpremieretype of cassette.tags.premiere_types || []) {
                const type_name = filmpremieretype
                premieretypes.push(type_name)
                filters.premieretypes[type_name] = type_name
            }
            for (const filmtype of cassette.tags.film_types || []) {
                const type_name = filmtype
                filmtypes.push(type_name)
                filters.filmtypes[type_name] = type_name
            }
            for (const genre of cassette.tags.genres || []) {
                const type_name = genre
                genres.push(type_name)
                filters.genres[type_name] = type_name
            }
            for (const keyword of cassette.tags.keywords || []) {
                const type_name = keyword
                keywords.push(type_name)
                filters.keywords[type_name] = type_name
            }
        }
        return {
            id: cassette.id,
            text: [
                cassette.title,
                cassette.synopsis,
                cassette.logline,
                cast_n_crew,
                film_titles
            ].join(' ').toLowerCase(),
            programmes: programmes,
            languages: languages,
            countries: countries,
            subtitles: subtitles,
            premieretypes: premieretypes,
            filmtypes: filmtypes,
            genres: genres,
            keywords: keywords,
            towns: towns,
            cinemas: cinemas
        }
    })

    function mSort(to_sort) {
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
                console.log('Details:', JSON.stringify({ to_sort }, null, 4));
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

    let sorted_filters = {
        programmes: mSort(filters.programmes),
        languages: mSort(filters.languages),
        countries: mSort(filters.countries),
        subtitles: mSort(filters.subtitles),
        premieretypes: mSort(filters.premieretypes),
        filmtypes: mSort(filters.filmtypes),
        genres: mSort(filters.genres),
        keywords: mSort(filters.keywords),
        towns: mSort(filters.towns),
        cinemas: mSort(filters.cinemas),
    }

    let searchYAML = yaml.dump(cassette_search, { 'noRefs': true, 'indent': '4' })
    fs.writeFileSync(path.join(fetchDir, `search_films.${lang}.yaml`), searchYAML, 'utf8')

    let filtersYAML = yaml.dump(sorted_filters, { 'noRefs': true, 'indent': '4' })
    fs.writeFileSync(path.join(fetchDir, `filters_films.${lang}.yaml`), filtersYAML, 'utf8')
}
