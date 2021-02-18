const fs = require('fs')
const yaml = require('js-yaml')
const path = require('path')
const { deleteFolderRecursive, JSONcopy } = require("./helpers.js")
const rueten = require('./rueten.js')
const {fetchModel} = require('./b_fetch.js')

const { timer } = require("./timer")
timer.start(__filename)

const rootDir =  path.join(__dirname, '..')
const domainSpecificsPath = path.join(rootDir, 'domain_specifics.yaml')
const DOMAIN_SPECIFICS = yaml.safeLoad(fs.readFileSync(domainSpecificsPath, 'utf8'))

const sourceDir = path.join(rootDir, 'source')
const cassetteTemplatesDir = path.join(sourceDir, '_templates', 'cassette_templates')
const fetchDir = path.join(sourceDir, '_fetchdir')
const strapiDataDirPath = path.join(sourceDir, 'strapidata')

const strapiDataPersonPath = path.join(strapiDataDirPath, 'Person.yaml')
const STRAPIDATA_PERSONS = yaml.safeLoad(fs.readFileSync(strapiDataPersonPath, 'utf8'))
const strapiDataProgrammePath = path.join(strapiDataDirPath, 'Programme.yaml')
const STRAPIDATA_PROGRAMMES = yaml.safeLoad(fs.readFileSync(strapiDataProgrammePath, 'utf8'))
const strapiDataFEPath = path.join(strapiDataDirPath, 'FestivalEdition.yaml')
const STRAPIDATA_FE = yaml.safeLoad(fs.readFileSync(strapiDataFEPath, 'utf8'))
const strapiDataScreeningPath = path.join(strapiDataDirPath, 'Screening.yaml')
const STRAPIDATA_SCREENINGS_YAML = yaml.safeLoad(fs.readFileSync(strapiDataScreeningPath, 'utf8'))
const strapiDataFestivalPath = path.join(strapiDataDirPath, 'Festival.yaml')
const STRAPIDATA_FESTIVALS = yaml.safeLoad(fs.readFileSync(strapiDataFestivalPath, 'utf8'))
const strapiDataFilmPath = path.join(strapiDataDirPath, 'Film.yaml')
const STRAPIDATA_FILMS = yaml.safeLoad(fs.readFileSync(strapiDataFilmPath, 'utf8'))
const strapiDataCassettePath = path.join(strapiDataDirPath, 'Cassette.yaml')
const STRAPIDATA_CASSETTES_YAML = yaml.safeLoad(fs.readFileSync(strapiDataCassettePath, 'utf8'))

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
                    'media': {
                        model_name: 'FilmMedia'
                    },
                    'festival_editions': {
                        model_name: 'FestivalEdition'
                    },
                    'credentials': {
                        model_name: 'Credentials'
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
    'media': {
        model_name: 'FilmMedia',
        // expand: {
        //     'stills': {
        //         model_name: 'StrapiMedia'
        //     },
        //     'posters': {
        //         model_name: 'StrapiMedia'
        //     },
        //     'trailer': {
        //         model_name: 'Trailer'
        //     },
        //     'QaClip': {
        //         model_name: 'QaClip'
        //     }
        // }
    },
}
const STRAPIDATA_CASSETTES = fetchModel(STRAPIDATA_CASSETTES_YAML, minimodel_cassette)

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
        model_name: 'ScreeningMode'
    },
    'subtitles': {
        model_name: 'Language'
    },
    'screening_types': {
        model_name: 'ScreeningType'
    }
}
const STRAPIDATA_SCREENINGS = fetchModel(STRAPIDATA_SCREENINGS_YAML, minimodel_screenings)



// console.log(JSON.stringify(STRAPIDATA_CASSETTES[1], 0, 2));

const DOMAIN = process.env['DOMAIN'] || 'poff.ee'
const CASSETTELIMIT = parseInt(process.env['CASSETTELIMIT']) || 0
// true = check if programme is for this domain / false = check if festival edition is for this domain
const CHECKPROGRAMMES = false

// timer.log(__filename, `LIMIT: ${CASSETTELIMIT}`)

// Kõik Screening_types name mida soovitakse kasseti juurde lisada, VÄIKETÄHTEDES
const whichScreeningTypesToFetch = ['first screening', 'regular', 'online kino']

const mapping = DOMAIN_SPECIFICS.domain

// STRAPIDATA_PROGRAMMES.map(programme => programme.id)



////////////////////////////////////////////////////////////////////////////////
if(CHECKPROGRAMMES) {

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

} else if (!CHECKPROGRAMMES && DOMAIN !== 'poff.ee') {

    let cassettesWithOutFestivalEditions = []

    var STRAPIDATA_CASSETTE = STRAPIDATA_CASSETTES.filter(cassette => {
        let festival_editions = STRAPIDATA_FE.map(edition => edition.id)
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

const allLanguages = DOMAIN_SPECIFICS.locales[DOMAIN]
for (const lang of allLanguages) {
    let cassettesWithOutFilms = []
    let cassettesWithOutSpecifiedScreeningType = []

    const dataFrom = { 'articles': `/_fetchdir/articles.${lang}.yaml` }
    fs.mkdirSync(cassettesPath, { recursive: true })
    timer.log(__filename, `Fetching ${DOMAIN} cassettes ${lang} data`)
    let allData = []
    // data = rueten(data, lang)
    // timer.log(__filename, data)
    let slugMissingErrorNumber = 0
    var templateMissingMessageDisplayed = false
    let slugMissingErrorIDs = []
    let limit = CASSETTELIMIT
    let counting = 0
    for (const s_cassette of STRAPIDATA_CASSETTE) {
        var hasOneCorrectScreening = false
        if (limit !== 0 && counting === limit) break
        counting++

        const s_cassette_copy = JSONcopy(s_cassette)

        // if (s_cassette_copy.festival_editions && s_cassette_copy.festival_editions.length) {
        //     for (const festEdIx in s_cassette_copy.festival_editions) {
        //         var festEd = s_cassette_copy.festival_editions[festEdIx]
        //         console.log(STRAPIDATA_FESTIVALS.filter( (a) => { console.log(festEd); return festEd.festival === a.id })[0]);
        //         var festival = JSONcopy(STRAPIDATA_FESTIVALS.filter( (a) => { console.log(festEd); return festEd.festival === a.id })[0])
        //         if (festival) {
        //             s_cassette_copy.festivals = []
        //             s_cassette_copy.festivals.push(festival)
        //         }
        //     }
        // }

        let slugEn = undefined
        if (s_cassette_copy.films && s_cassette_copy.films.length === 1) {
            slugEn = s_cassette_copy.films[0].slug_en
            if (!slugEn) {
                slugEn = s_cassette_copy.films[0].slug_et
            }
        }
        if(!slugEn) {
            slugEn = s_cassette_copy.slug_en
            if (!slugEn) {
                slugEn = s_cassette_copy.slug_et
            }
        }

        if(typeof slugEn !== 'undefined') {
            s_cassette_copy.dirSlug = slugEn
            s_cassette_copy.directory = path.join(cassettesPath, slugEn)
            fs.mkdirSync(s_cassette_copy.directory, { recursive: true })

            let cassetteCarouselPicsCassette = []
            let cassetteCarouselPicsFilms = []
            let cassettePostersCassette = []
            let cassettePostersFilms = []

            // // Kasseti programmid
            // if (s_cassette_copy.tags && s_cassette_copy.tags.programmes && s_cassette_copy.tags.programmes[0]) {
            //     for (const programmeIx in s_cassette_copy.tags.programmes) {
            //         let programme = s_cassette_copy.tags.programmes[programmeIx]
            //         let programmeFromYAML = STRAPIDATA_PROGRAMMES.filter( (a) => { return programme.id === a.id })
            //         if (typeof programmeFromYAML !== 'undefined' && programmeFromYAML[0]) {
            //             s_cassette_copy.tags.programmes[programmeIx] = JSONcopy(programmeFromYAML[0])
            //         }
            //     }
            // }

            // Kasseti treiler
            if (s_cassette_copy.media && s_cassette_copy.media.trailer && s_cassette_copy.media.trailer[0]) {
                for (trailer of s_cassette_copy.media.trailer) {
                    if(trailer.url && trailer.url.length > 10) {
                        if (trailer.url.includes('vimeo')) {
                            let splitVimeoLink = trailer.url.split('/')
                            let videoCode = splitVimeoLink !== undefined ? splitVimeoLink[splitVimeoLink.length-1] : ''
                            if (videoCode.length === 9) {
                                trailer.videoCode = videoCode
                            }
                        } else {
                            let splitYouTubeLink = trailer.url.split('=')[1]
                            let splitForVideoCode = splitYouTubeLink !== undefined ? splitYouTubeLink.split('&')[0] : ''
                            if (splitForVideoCode.length === 11) {
                                trailer.videoCode = splitForVideoCode
                            }
                        }
                    }
                }
            }

            // rueten func. is run for each s_cassette_copy separately instead of whole data, that is
            // for the purpose of saving slug_en before it will be removed by rueten func.
            rueten(s_cassette_copy, lang)

            // #379 put ordered films to cassette.film
            let ordered_films = s_cassette_copy.orderedFilms
                // .filter( (isFilm) => { if (isFilm.film) { return 1 } else { console.log(`ERROR! Empty film under cassette with ID ${s_cassette_copy.id}`) } })
                // .map(s_c_film => {

                //     if (!s_c_film.film) {
                //         // console.log('ERROR: Cassette with no ordered film', s_cassette_copy.id);
                //         cassettesWithOutFilms.push(s_cassette_copy.id)
                //         // throw new Error('Cassette with no ordered film')
                //     } else {
                //         let s_films = STRAPIDATA_FILMS.filter( (s_film) => { return s_c_film.film.id === s_film.id } )

                //         if (s_films && s_films[0]) {
                //             s_films[0].ordinal = s_c_film.order
                //             return s_films[0]
                //         } else {
                //             return null
                //         }
                //     }
                // })
            if (ordered_films !== undefined && ordered_films[0]) {
                s_cassette_copy.films = JSON.parse(JSON.stringify(ordered_films))
                s_cassette_copy.films = s_cassette_copy.films.map(a => {
                    let film = a.film
                    film.order = a.order
                    return film
                })
            }

            if (s_cassette_copy.films && s_cassette_copy.films.length) {
                for (const onefilm of s_cassette_copy.films) {
                    if (onefilm.orderedCountries) {
                        let orderedCountries = onefilm.orderedCountries
                            .sort(function(a, b){ return (a.order > b.order) ? 1 : ((b.order > a.order) ? -1 : 0); })
                        onefilm.orderedCountries = orderedCountries
                        if (orderedCountries.length) {
                            onefilm.orderedCountriesDisplay = orderedCountries
                                .map(country => country.country.name)
                                .join(', ')
                        }

                    }
                }
            }

            // Screenings
            let screenings = []
            for (screeningIx in STRAPIDATA_SCREENINGS) {
                let screening = JSONcopy(STRAPIDATA_SCREENINGS[screeningIx])
                if (screening.cassette && screening.cassette.id === s_cassette_copy.id
                    && screening.screening_types && screening.screening_types[0]) {

                    let screeningNames = function(item) {
                        let itemNames = item.name
                        return itemNames
                    }
                    // Kontroll kas screeningtype kassetile lisada, st kas vähemalt üks screening type on whichScreeningTypesToFetch arrays olemas
                    if(!screening.screening_types.map(screeningNames).some(ai => whichScreeningTypesToFetch.includes(ai.toLowerCase()))) {
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

            // let s_cassette_copy = JSONcopy(s_cassette_copy))
            // let aliases = []
            let languageKeys = ['en', 'et', 'ru']
            for (key in s_cassette_copy) {
                if (key == 'slug') {
                    s_cassette_copy.path = `film/${s_cassette_copy[key]}`
                    s_cassette_copy.slug = `${s_cassette_copy[key]}`
                }

                if (typeof(s_cassette_copy[key]) === 'object' && s_cassette_copy[key] != null) {
                    // makeCSV(s_cassette_copy[key], s_cassette_copy, lang)
                }
            }

            if (s_cassette_copy.path === undefined) {
                s_cassette_copy.path = `film/${slugEn}`
                s_cassette_copy.slug = slugEn
            }

            // Cassette carousel pics
            if (s_cassette_copy.media && s_cassette_copy.media.stills && s_cassette_copy.media.stills[0]) {
                for (const stillIx in s_cassette_copy.media.stills) {
                    let still = s_cassette_copy.media.stills[stillIx]
                    if (still.hash && still.ext) {
                        if (still.hash.substring(0, 4) === 'F_1_') {
                            cassetteCarouselPicsCassette.unshift(`https://assets.poff.ee/img/${still.hash}${still.ext}`)
                        }
                        cassetteCarouselPicsCassette.push(`https://assets.poff.ee/img/${still.hash}${still.ext}`)
                    }
                }
            }

            if (cassetteCarouselPicsCassette.length > 0) {
                s_cassette_copy.cassetteCarouselPicsCassette = cassetteCarouselPicsCassette
            }

            // Cassette poster pics
            if (s_cassette_copy.media && s_cassette_copy.media.posters && s_cassette_copy.media.posters[0]) {
                for (const posterIx in s_cassette_copy.media.posters) {
                    let poster = s_cassette_copy.media.posters[posterIx]
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

                    // Film carousel pics
                    if (scc_film.media && scc_film.media.stills && scc_film.media.stills[0]) {
                        for (still of scc_film.media.stills) {
                            if (still.hash && still.ext) {
                                if (still.hash.substring(0, 4) === 'F_1_') {
                                    cassetteCarouselPicsFilms.unshift(`https://assets.poff.ee/img/${still.hash}${still.ext}`)
                                }
                                cassetteCarouselPicsFilms.push(`https://assets.poff.ee/img/${still.hash}${still.ext}`)
                            }
                        }
                    }

                    if (cassetteCarouselPicsFilms.length > 0) {
                        s_cassette_copy.cassetteCarouselPicsFilms = cassetteCarouselPicsFilms
                    }

                    // Film posters pics
                    if (scc_film.media && scc_film.media.posters && scc_film.media.posters[0]) {
                        for (poster of scc_film.media.posters) {
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
                    if (scc_film.media && scc_film.media.trailer && scc_film.media.trailer[0]) {
                        for (trailer of scc_film.media.trailer) {
                            if(trailer.url && trailer.url.length > 10) {
                                if (trailer.url.includes('vimeo')) {
                                    let splitVimeoLink = trailer.url.split('/')
                                    let videoCode = splitVimeoLink !== undefined ? splitVimeoLink[splitVimeoLink.length-1] : ''
                                    if (videoCode.length === 9) {
                                        trailer.videoCode = videoCode
                                    }
                                } else {
                                    let splitYouTubeLink = trailer.url.split('=')[1]
                                    let splitForVideoCode = splitYouTubeLink !== undefined ? splitYouTubeLink.split('&')[0] : ''
                                    if (splitForVideoCode.length === 11) {
                                        trailer.videoCode = splitForVideoCode
                                    }
                                }
                            }
                        }
                    }

                    // // Filmi programmid
                    // if (scc_film.tags && scc_film.tags.programmes && scc_film.tags.programmes[0]) {
                    //     for (const programmeIx in scc_film.tags.programmes) {
                    //         let programme = scc_film.tags.programmes[programmeIx]
                    //         let programmeFromYAML = STRAPIDATA_PROGRAMMES.filter( (a) => { return programme.id === a.id })
                    //         if (typeof programmeFromYAML[0] !== 'undefined') {
                    //             scc_film.tags.programmes[programmeIx] = JSONcopy(programmeFromYAML[0])
                    //         } else {
                    //             timer.log(__filename, `Error! Programme with ID ${programme.id}, under film with ID ${scc_film.id} - domain ${DOMAIN} probably not assigned to this programme!`)
                    //         }
                    //     }
                    // }

                    if(scc_film.credentials && scc_film.credentials.rolePerson && scc_film.credentials.rolePerson[0]) {
                        let rolePersonTypes = {}
                        scc_film.credentials.rolePerson.sort(function(a, b){ return (a.order > b.order) ? 1 : ((b.order > a.order) ? -1 : 0) })
                        for (roleIx in scc_film.credentials.rolePerson) {
                            let rolePerson = scc_film.credentials.rolePerson[roleIx]
                            if (rolePerson === undefined) { continue }
                            if (rolePerson.person) {
                                if (rolePerson.role_at_film.roleNamePrivate === 'Director') {
                                    scc_film.credentials.rolePerson[roleIx].person = STRAPIDATA_PERSONS.filter(person => rolePerson.person.id === person.id)[0]
                                }
                                let searchRegExp = new RegExp(' ', 'g')
                                const role_name_lc = rolePerson.role_at_film.roleNamePrivate.toLowerCase().replace(searchRegExp, '')
                                rolePersonTypes[role_name_lc] = rolePersonTypes[role_name_lc] || []

                                if (rolePerson.person.firstNameLastName) {
                                    rolePersonTypes[role_name_lc].push(rolePerson.person.firstNameLastName)
                                } else if (rolePerson.person.id) {
                                    let personFromYAML = STRAPIDATA_PERSONS.filter( (a) => { return rolePerson.person.id === a.id })[0]
                                    if (personFromYAML.fullName) {
                                        rolePersonTypes[role_name_lc].push(personFromYAML.fullName)
                                    }
                                }
                            } else {
                                // timer.log(__filename, film.id, ' - ', rolePerson.role_at_film.roleNamePrivate)
                            }
                            //- - timer.log(__filename, 'SEEEE ', rolePersonTypes[`${rolePerson.role_at_film.roleNamePrivate.toLowerCase()}`], ' - ', rolePerson.role_at_film.roleNamePrivate.toLowerCase(), ' - ', rolePersonTypes)
                        }
                        // console.log('foo2', scc_film.id, rolePersonTypes);
                        scc_film.credentials.rolePersonsByRole = rolePersonTypes
                    }
                }
                rueten(s_cassette_copy.films, lang)
            }

            if (hasOneCorrectScreening === true) {
                allData.push(s_cassette_copy)
                s_cassette_copy.data = dataFrom
                // timer.log(__filename, util.inspect(s_cassette_copy, {showHidden: false, depth: null}))
                generateYaml(s_cassette_copy, lang)
            } else {
                cassettesWithOutSpecifiedScreeningType.push(s_cassette_copy.id)
            }

        } else {
            slugMissingErrorNumber++
            slugMissingErrorIDs.push(s_cassette_copy.id)
        }
    }
    if(slugMissingErrorNumber > 0) {
        timer.log(__filename, `Notification! Value of slug_en or slug_et missing for total of ${slugMissingErrorNumber} cassettes with ID's ${slugMissingErrorIDs.join(', ')}`)
    }
    if(cassettesWithOutFilms.length) {
        uniqueIDs = [...new Set(cassettesWithOutFilms)]
        timer.log(__filename, `ERROR! No films under cassettes with ID's ${uniqueIDs.join(', ')}`)
    }
    if (cassettesWithOutSpecifiedScreeningType.length) {
        uniqueIDs2 = [...new Set(cassettesWithOutSpecifiedScreeningType)]
        timer.log(__filename, `Skipped cassettes with IDs ${uniqueIDs2.join(', ')}, as none of screening types are ${whichScreeningTypesToFetch.join(', ')}`)
    }
    generateAllDataYAML(allData, lang)
}

function generateYaml(element, lang){
    let yamlStr = yaml.safeDump(element, { 'noRefs': true, 'indent': '4' })

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

function generateAllDataYAML(allData, lang){


    for (cassette of allData) {

        function picSplit(txt) {
            return txt.replace('assets.poff.ee/img/', 'assets.poff.ee/img/thumbnail_')
        }

        cassette.cassetteCarouselPicsCassetteThumbs = (cassette.cassetteCarouselPicsCassette || []).map(txt => picSplit(txt))
        cassette.cassetteCarouselPicsFilmsThumbs = (cassette.cassetteCarouselPicsFilms || []).map(txt => picSplit(txt))
        cassette.cassettePostersCassetteThumbs = (cassette.cassettePostersCassette || []).map(txt => picSplit(txt))
        cassette.cassettePostersFilmsThumbs = (cassette.cassettePostersFilms || []).map(txt => picSplit(txt))

    }


    let allDataYAML = yaml.safeDump(allData, { 'noRefs': true, 'indent': '4' })
    fs.writeFileSync(path.join(fetchDir, `cassettes.${lang}.yaml`), allDataYAML, 'utf8')
    timer.log(__filename, `Ready for building are ${allData.length} cassettes`)

    // todo: #478 filtrid tuleb compareLocale sortida juba koostamisel.
    let filters = {
        programmes: {},
        languages: {},
        countries: {},
        subtitles: {},
        premieretypes: {},
        towns: {},
        cinemas: {}
    }
    const cassette_search = allData.map(cassette => {
        let programmes = []
        if (typeof cassette.tags.programmes !== 'undefined') {
            for (const programme of cassette.tags.programmes) {
                // console.log(programme.festival_editions, 'CASSETTE ', cassette.id);
                if (typeof programme.festival_editions !== 'undefined') {
                    for (const fested of programme.festival_editions) {
                        // console.log('PROGRAMMES: ', cassette.tags.programmes);
                        // console.log('FEST_ED: ', fested);
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
        for (const film of cassette.films) {
            for (const language of film.languages || []) {
                const langKey = language.code
                // console.log('KOOOOD', language);
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
                console.log('bad creds on film', JSON.stringify({film: film, creds:film.credentials}, null, 4));
                throw new Error(error)
            }
        }
        let subtitles = []
        let towns = []
        let cinemas = []
        for (const screenings of cassette.screenings) {
            for (const subtitle of screenings.subtitles || []) {
                const subtKey = subtitle.code
                const subtitle_name = subtitle.name
                subtitles.push(subtKey)
                filters.subtitles[subtKey] = subtitle_name
            }

            const townKey = `_${screenings.location.hall.cinema.town.id}`
            const town_name = screenings.location.hall.cinema.town.name
            towns.push(townKey)
            filters.towns[townKey] = town_name

            const cinemaKey = `_${screenings.location.hall.cinema.id}`
            const cinema_name = screenings.location.hall.cinema.name
            cinemas.push(cinemaKey)
            filters.cinemas[cinemaKey] = cinema_name
        }
        let premieretypes = []
        for (const types of cassette.tags.premiere_types || []) {
                const type_name = types
                premieretypes.push(type_name)
                filters.premieretypes[type_name] = type_name
        }
        return {
            id: cassette.id,
            text: [
                cassette.title,
                cassette.synopsis,
                cast_n_crew
            ].join(' ').toLowerCase(),
            programmes: programmes,
            languages: languages,
            countries: countries,
            subtitles: subtitles,
            premieretypes: premieretypes,
            towns: towns,
            cinemas: cinemas
        }
    })

    // sorted1 = [].slice.call(filters.programmes).sort((a, b) => a.localeCompare(b, lang))
    // [].slice.call(filters.languages).sort((a, b) => a.localeCompare(b, lang))
    // [].slice.call(filters.countries).sort((a, b) => a.localeCompare(b, lang))
    // [].slice.call(filters.subtitles).sort((a, b) => a.localeCompare(b, lang))
    // [].slice.call(filters.premieretypes).sort((a, b) => a.localeCompare(b, lang))
    // [].slice.call(filters.towns).sort((a, b) => a.localeCompare(b, lang))
    // [].slice.call(filters.cinemas).sort((a, b) => a.localeCompare(b, lang))
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
        programmes: mSort(filters.programmes),
        languages: mSort(filters.languages),
        countries: mSort(filters.countries),
        subtitles: mSort(filters.subtitles),
        premieretypes: mSort(filters.premieretypes),
        towns: mSort(filters.towns),
        cinemas: mSort(filters.cinemas),
    }

    // console.log(cassette_search);
    let searchYAML = yaml.safeDump(cassette_search, { 'noRefs': true, 'indent': '4' })
    fs.writeFileSync(path.join(fetchDir, `search_films.${lang}.yaml`), searchYAML, 'utf8')

    let filtersYAML = yaml.safeDump(sorted_filters, { 'noRefs': true, 'indent': '4' })
    fs.writeFileSync(path.join(fetchDir, `filters_films.${lang}.yaml`), filtersYAML, 'utf8')
}
