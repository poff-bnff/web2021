const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');
const rueten = require('./rueten.js');
const images = require('./images.js');
const {fetchModel} = require('./b_fetch.js')

const rootDir =  path.join(__dirname, '..')
const domainSpecificsPath = path.join(rootDir, 'domain_specifics.yaml')
const DOMAIN_SPECIFICS = yaml.load(fs.readFileSync(domainSpecificsPath, 'utf8'))

const sourceDir =  path.join(__dirname, '..', 'source')
const fetchDir =  path.join(sourceDir, '_fetchdir')
const strapiDataDirPath = path.join(sourceDir, '_domainStrapidata')

const strapiDataFEPath = path.join(strapiDataDirPath, 'FestivalEdition.yaml')
const STRAPIDATA_FE = yaml.load(fs.readFileSync(strapiDataFEPath, 'utf8'))
const strapiDataScreeningPath = path.join(strapiDataDirPath, 'Screening.yaml')
const STRAPIDATA_SCREENING = yaml.load(fs.readFileSync(strapiDataScreeningPath, 'utf8'))
const strapiDataFilmPath = path.join(strapiDataDirPath, 'Film.yaml')
const STRAPIDATA_FILM = yaml.load(fs.readFileSync(strapiDataFilmPath, 'utf8'))

const params = process.argv.slice(2)
const param_build_type = params[0]

const addConfigPathAliases = require('./add_config_path_aliases.js')

if(param_build_type === 'target') {
    addConfigPathAliases(['/screenings', '/myscreenings', '/screenings-search'])
}

const DOMAIN = process.env['DOMAIN'] || 'hoff.ee';

const allLanguages = DOMAIN_SPECIFICS.locales[DOMAIN]

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
    },
    'cassette': {
        model_name: 'Cassette',
        expand: {
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
            }
        }
    }
}

const STRAPIDATA_SCREENINGS = fetchModel(STRAPIDATA_SCREENING, minimodel_screenings)

for (const lang of allLanguages) {
    LangSelect(lang)
}

function LangSelect(lang) {
    // Screeningu kuupäeva check
    Date.prototype.addHours = function(hours) {
        var date = new Date(this.valueOf());
        date.setHours(date.getHours() + hours);
        return date;
    }
    let dateTimeUTC = new Date().addHours(2)
    let dateNow = parseInt(`${dateTimeUTC.getFullYear()}${("0" + (dateTimeUTC.getMonth() + 1)).slice(-2)}${("0" + dateTimeUTC.getDate()).slice(-2)}`)

    let festival_editions = []
    // For PÖFF, fetch only online 2021 FE ID 7
    // 2021 muudatus, PÖFF lehel hetkel vaid veebikino
    if (DOMAIN !== 'poff.ee') {
        festival_editions = STRAPIDATA_FE.map(edition => edition.id)
    } else {
        festival_editions = [7]
    }

    let data = STRAPIDATA_SCREENINGS
        .filter(scrn => {
            let scrnDateTimeUTC = new Date(scrn.dateTime).addHours(2)
            let scrnDate = parseInt(`${scrnDateTimeUTC.getFullYear()}${("0" + (scrnDateTimeUTC.getMonth() + 1)).slice(-2)}${("0" + scrnDateTimeUTC.getDate()).slice(-2)}`)
            // Kui pole online screening e Strapis ID 16, siis tänasest vanemad screeningud välja
            // Online screeningud eemaldatakse screeningu lõppemisel Eventivali kaudu
            return scrn.location && scrn.location.id !== 16 ? dateNow <= scrnDate : true
        })
        // Näita lehe screeninguid, PÖFFi puhul kõikide lehtede screeninguid. [väljakommenteeritud hetkel]
        // 2021 muudatus, PÖFF lehel hetkel vaid veebikino
        .filter(scrning => {
            // if (DOMAIN !== 'poff.ee') {
                if (scrning.cassette && scrning.cassette.festival_editions) {

                    cassette_fested_ids = scrning.cassette.festival_editions.map(ed => ed.id)
                    return cassette_fested_ids.filter(cfestid => festival_editions.includes(cfestid))[0] !== undefined

                } else {
                    return false
                }
            // } else {
            //     return true
            // }
        })

    processData(data, lang, CreateYAML);
    console.log(`Fetching ${DOMAIN} screenings ${lang} data`);
}

function processData(data, lang, CreateYAML) {

    const cassettesPath = path.join(fetchDir, `cassettes.${lang}.yaml`)
    const CASSETTES = yaml.load(fs.readFileSync(cassettesPath, 'utf8'))

    let allData = []
    if (data.length) {
        let screeningsMissingCassetteIDs = []

        for (screeningIx in data) {
            let screening = data[screeningIx]

            if (screening.cassette) {
                let cassetteFromYAML = CASSETTES.filter( (a) => { return screening.cassette.id === a.id})
                if (cassetteFromYAML.length) {
                    data[screeningIx].cassette = JSON.parse(JSON.stringify(cassetteFromYAML[0]))
                }

                for (filmIx in screening.cassette.orderedFilms) {
                    let oneFilm = screening.cassette.orderedFilms[filmIx].film
                    data[screeningIx].cassette.orderedFilms[filmIx].film = STRAPIDATA_FILM.filter((film) => { return oneFilm.id === film.id })[0]
                }

                images(screening)
                delete data[screeningIx].cassette.orderedFilms

                allData.push(data[screeningIx])

            } else {
                screeningsMissingCassetteIDs.push(screening.id)
            }

            function picSplit(txt) {
                return txt.replace('assets.poff.ee/img/', 'assets.poff.ee/img/thumbnail_')
            }

            screening.cassetteCarouselPicsCassetteThumbs = (screening.cassetteCarouselPicsCassette || []).map(txt => picSplit(txt))
            screening.cassetteCarouselPicsFilmsThumbs = (screening.cassetteCarouselPicsFilms || []).map(txt => picSplit(txt))
            screening.cassettePostersCassetteThumbs = (screening.cassettePostersCassette || []).map(txt => picSplit(txt))
            screening.cassettePostersFilmsThumbs = (screening.cassettePostersFilms || []).map(txt => picSplit(txt))

        }

        if (screeningsMissingCassetteIDs.length) {
            console.log('Screenings with IDs ', screeningsMissingCassetteIDs.join(', '), ' missing cassette');
        }

    }
    CreateYAML(allData, lang);

}

function CreateYAML(screenings, lang) {

    const SCREENINGS_YAML_PATH = path.join(fetchDir, `screenings.${lang}.yaml`)

    let screeningsCopy = rueten(JSON.parse(JSON.stringify(screenings)), lang)

    let allDataYAML = yaml.safeDump(screeningsCopy, { 'noRefs': true, 'indent': '4' });
    fs.writeFileSync(SCREENINGS_YAML_PATH, allDataYAML, 'utf8');
    console.log(`Fetched ${screeningsCopy.length} screenings`);

    // FOR SEARCH BELOW

    let filters = {
        programmes: {},
        languages: {},
        countries: {},
        subtitles: {},
        premieretypes: {},
        towns: {},
        cinemas: {},
        dates: {},
        times: {}
    }

    const screenings_search = screeningsCopy.map(screenings => {

        let dates = []
        let times = []


        let dateTimeUTC = new Date(screenings.dateTime)

        Date.prototype.addHours = function(hours) {
            var date = new Date(this.valueOf());
            date.setHours(date.getHours() + hours);
            return date;
        }
        let dateTime = dateTimeUTC.addHours(2); // , {timeZone: "EET"}

        let date = dateTime.getFullYear() + '-' + ('0' + (dateTime.getMonth()+1)).slice(-2) + '-' + ('0' + dateTime.getDate()).slice(-2)
        let dateKey = `_${date}`
        let time = ('0' + (dateTime.getHours())).slice(-2) + ':' + ('0' + dateTime.getMinutes()).slice(-2)
        let timeKey = `_${time}`

        dates.push(dateKey)
        filters.dates[dateKey] = date
        times.push(timeKey)
        filters.times[timeKey] = time

        let programmes = []
        let cassette = screenings.cassette
        if (typeof cassette.tags.programmes !== 'undefined') {
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

        if (cassette.films) {
            for (const film of cassette.films) {
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
                    console.log('bad creds on film', JSON.stringify({film: film, creds:film.credentials}, null, 4));
                    throw new Error(error)
                }
            }
        }
        let subtitles = []
        let towns = []
        let cinemas = []

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

        let premieretypes = []
        for (const types of cassette.tags.premiere_types || []) {
                const type_name = types
                premieretypes.push(type_name)
                filters.premieretypes[type_name] = type_name
        }
        return {
            id: screenings.id,
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
            cinemas: cinemas,
            dates: dates,
            times: times
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

    function dateTimeSort(to_sort) {
        let sortable = []
        for (var item in to_sort) {
            sortable.push([item, to_sort[item]]);
        }

        sortable = sortable.sort(function(a, b) {
            try {
                const sort = (a[1] > b[1]) ? 1 : ((b[1] > a[1]) ? -1 : 0)
                return sort
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
        dates: dateTimeSort(filters.dates),
        times: dateTimeSort(filters.times)
    }

    let searchYAML = yaml.safeDump(screenings_search, { 'noRefs': true, 'indent': '4' })
    fs.writeFileSync(path.join(fetchDir, `search_screenings.${lang}.yaml`), searchYAML, 'utf8')

    let filtersYAML = yaml.safeDump(sorted_filters, { 'noRefs': true, 'indent': '4' })
    fs.writeFileSync(path.join(fetchDir, `filters_screenings.${lang}.yaml`), filtersYAML, 'utf8')

}
