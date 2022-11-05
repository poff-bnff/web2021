const fs = require('fs')
const yaml = require('js-yaml')
const path = require('path')
const { create } = require('xmlbuilder2');
const images = require('./images.js');
const { fetchModel } = require('./b_fetch.js')
const replaceBadChars = require('./replace_bad_chars.js')

const sourceDir = path.join(__dirname, '..', 'source')
const fetchDir = path.join(sourceDir, '_fetchdir')
const strapiDataPath = path.join(sourceDir, '_domainStrapidata')
const strapiDataScreeningPath = path.join(strapiDataPath, 'Screening.yaml')
const assetsDirXML = path.join(sourceDir, '..', 'assets', 'xml')
const XMLpath = path.join(assetsDirXML, 'xml.xml')
const domainSpecificsPath = path.join(sourceDir, '..', 'domain_specifics.yaml')
const DOMAIN_SPECIFICS = yaml.load(fs.readFileSync(domainSpecificsPath, 'utf8'))
const XML_festival_editions = DOMAIN_SPECIFICS.XML_festival_editions
const SCREENING = yaml.load(fs.readFileSync(strapiDataScreeningPath, 'utf8'))
const STRAPIDATA_DOMAIN = []
// const STRAPIDATA_DOMAIN = STRAPIDATA['Domain']
const STRAPIDATA_FILM = []
// const STRAPIDATA_FILM = STRAPIDATA['Film']

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
        model_name: 'Cassette',
        expand: {
            'tags': {
                model_name: 'Tags',
                expand: {
                    'programmes': {
                        model_name: 'Programme',
                    }
                },
                'festival_editions': {
                    model_name: 'FestivalEdition',
                    expand: {
                        'domains': {
                            model_name: 'Domain'
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
                            'festival_editions': {
                                model_name: 'FestivalEdition',
                                expand: {
                                    'domains': {
                                        model_name: 'Domain'
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

const SCREENINGS_FETCH = fetchModel(SCREENING, minimodel_screenings)

// Filter out cassettes which do not have FE defined in domain_specifics
const SCREENINGS = SCREENINGS_FETCH.filter(s => {
    if (s?.cassette?.festival_editions) {
        return XML_festival_editions.some(r => s.cassette.festival_editions.map(fe => fe.id).includes(r))
    } else {
        return false
    }
})

// console.log(SCREENINGS[0].cassette.orderedFilms[0].film.festival_editions[0]);

const domainMapping = {
    'poff.ee': 'https://poff.ee/',
    'justfilm.ee': 'https://justfilm.ee/',
    'kinoff.poff.ee': 'https://kinoff.ee/',
    'industry.poff.ee': 'https://industry.poff.ee/',
    'shorts.poff.ee': 'http://shorts.poff.ee/'
}

const languages = ['et', 'en', 'ru']
const langs = { 'et': 'EST', 'ru': 'RUS', 'en': 'ENG' }

let data = { 'info': { 'concerts': { 'concert': [] } } }

for (const screeningIx in SCREENINGS) {
    const screening = SCREENINGS[screeningIx]

    if (screening.cassette && screening.cassette.orderedFilms) {
        images(screening)
    }

    if (screening.ticketingId) {
        let concert = {}
        let id = screening.ticketingId
        concert.ticketingId = id
        for (const lang of languages) {
            let synopsis = undefined
            if (screening.cassette && screening.cassette.orderedFilms && screening.cassette.orderedFilms.length > 1) {
                if (screening.cassette.synopsis && screening.cassette.synopsis[lang]) {
                    synopsis = screening.cassette.synopsis[lang] ? screening.cassette.synopsis[lang] : undefined
                }
            } else if (screening.cassette && screening.cassette.orderedFilms && screening.cassette.orderedFilms && screening.cassette.orderedFilms.length === 1) {
                if (screening.cassette.orderedFilms[0] && screening.cassette.orderedFilms[0].film && screening.cassette.orderedFilms[0].film.synopsis && screening.cassette.orderedFilms[0].film.synopsis[lang]) {
                    synopsis = (screening.cassette.orderedFilms[0].film.synopsis[lang]) ? screening.cassette.orderedFilms[0].film.synopsis[lang] : undefined
                }
            }
            if (synopsis !== undefined) {
                // Filter out characters that Strapi does not like and which eventually would render bad XML
                synopsis = replaceBadChars(synopsis, screening.cassette.id, 'cassette')
                concert[`description${langs[lang]}`] = synopsis
            }

            let slug = undefined

            if (screening.cassette && screening.cassette[`slug_${lang}`]) {
                slug = screening.cassette[`slug_${lang}`]
            }


            if (typeof slug !== 'undefined') {
                if (screening.cassette.orderedFilms && screening.cassette.orderedFilms.length) {
                    for (const filmIx in screening.cassette.orderedFilms) {
                        let film = screening.cassette.orderedFilms[filmIx].film

                        if (film && film.festival_editions && film.festival_editions[0].domains) {
                            let removePoffDomain = film.festival_editions[0].domains.map(d => d.url).filter(d => d !== 'poff.ee')
                            let festivalEdDomain = 'poff.ee'

                            if (removePoffDomain.length) {
                                festivalEdDomain = removePoffDomain[0]
                            }

                            concert[`urls${langs[lang]}`] = `${domainMapping[festivalEdDomain]}${lang === 'et' ? '' : `${lang}/`}film/${slug}`
                        }
                        // let domainUrl = STRAPIDATA_DOMAIN.filter( (a) => { return oneFilm.id === a.id })
                    }
                }
            }


        }


        if (screening.cassette && screening.cassette.orderedFilms) {
            if (screening.cassette.orderedFilms.length > 1) {
                if (screening.cassettePostersCassette && screening.cassettePostersCassette.length) {
                    concert.image = screening.cassettePostersCassette[0]
                } else if (screening.cassetteCarouselPicsCassette && screening.cassetteCarouselPicsCassette.length) {
                    concert.image = screening.cassetteCarouselPicsCassette[0]
                } else if (screening.cassettePostersFilms && screening.cassettePostersFilms.length) {
                    concert.image = screening.cassettePostersFilms[0]
                } else if (screening.cassetteCarouselPicsFilms && screening.cassetteCarouselPicsFilms.length) {
                    concert.image = screening.cassetteCarouselPicsFilms[0]
                }
            } else if (screening.cassette.orderedFilms.length === 1) {
                if (screening.cassettePostersFilms && screening.cassettePostersFilms.length) {
                    concert.image = screening.cassettePostersFilms[0]
                } else if (screening.cassetteCarouselPicsFilms && screening.cassetteCarouselPicsFilms.length) {
                    concert.image = screening.cassetteCarouselPicsFilms[0]
                }
            }
        }



        if (concert) {
            // const item = root.ele('data');
            // item.att('x', concert);
            data.info.concerts.concert.push(concert)

        }


    }
}

const doc = create(data);
const xml = doc.end({ prettyPrint: true });
// console.log(xml);
fs.mkdirSync(assetsDirXML, { recursive: true })
fs.writeFileSync(XMLpath, xml, 'utf8')

console.log('assets/xml/xml.xml created');

//- Mitmefilmikassett PL jaoks siis kasseti P ja kui seda pole siis kasseti F, ja kui neid pole siis suvalise filmi P ja kui seda pole siis suvalise filmi F

//- poster picture ja kui pole, siis esimene still
//- synopsis 3 keeles
//- igas keeles synopsis ja synopsise lõppu kasseti url
//- Kui mitmefilmikassett, näitame kasseti pilti K algusega, kui K algusega ei leia siis suvalise F algusega
//-
