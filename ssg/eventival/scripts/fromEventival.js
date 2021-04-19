const https = require('https')
const fs = require('fs')
var parser = require('fast-xml-parser');
const yaml = require('js-yaml')
const path = require('path')
const readline = require('readline');
const html2plaintext = require('html2plaintext');
const h2p = function (txt) {
    return txt.toString().split(/<\/div>|<\/p>|<br>|<br \/>|\n|\r/)
        .map(t => html2plaintext(html2plaintext(html2plaintext(t)))).join('\n\n')
        .replace(/\n\n+/g,'\n\n')
}

const dynamicDir =  path.join(__dirname, '..', 'dynamic')

const EVENTIVAL_TOKEN = process.env['EVENTIVAL_TOKEN']
const edition = '24'
const eventivalAPI = path.join('bo.eventival.com', 'poff', edition, 'en', 'ws')

const categories = [
    { "id": 9, "name": "Just Film" },
    { "id": 10, "name": "PÖFF" },
    { "id": 1838, "name": "Shortsi alam" },
    { "id": 1839, "name": "Shorts" },
    { "id": 2651, "name": "KinoFF" }
]
const rolesAtFilm = { // hardcoded strapi ID's
    'directors': 1,
    'producers': 7,
    'writers': 2,
    'cast': 4
}

const dataMap = {
    'venues': {
        'api': 'venues.xml',
        'outyaml': path.join(dynamicDir, 'venues.yaml'),
        'root': 'venues',
        'iterator': 'venue'
    },
    // 'films': {
    //     'api': 'films/',
    //     'category': 'categories/?/films.xml',
    //     'outyaml': path.join(dynamicDir, 'films.yaml'),
    //     'root': 'films',
    //     'iterator': 'item'
    // },
    'films': {
        'api': 'films/publications-locked.xml',
        'outyaml': path.join(dynamicDir, 'films.yaml'),
        'root': 'films',
        'iterator': 'item'
    },
    'screenings': {
        'api': 'films/screenings.xml',
        'outyaml': path.join(dynamicDir, 'screenings.yaml'),
        'root': 'screenings',
        'iterator': 'screening'
    }
}

// const filmsO = yaml.load(fs.readFileSync(path.join(dynamicDir, 'films.yaml'))).map( film => {
//     if (film.eventival_categorization && film.eventival_categorization.sections && film.eventival_categorization.sections.section) {
//         for (const section of film.eventival_categorization.sections.section) {
//             console.log(section);
//         }
//     } else {
//         return ''
//     }
// })
// console.log(filmsO)


async function eventivalFetch(url) {
    // console.log('Fetch', modelName)
    return new Promise((resolve, reject) => {
        // console.log('url', url);
        https.get(url, (res) => {
            const { statusCode } = res;
            const contentType = res.headers['content-type'];
            // console.log(statusCode);
            let error
            if (statusCode !== 200) {
                error = new Error('Request Failed.\n' + `Status Code: ${statusCode}`)
                console.log('headers', res.headers);
            } else if (!/^text\/xml/.test(contentType)) {
                error = new Error('Invalid content-type.\n' + `Expected text/xml but received ${contentType}`);
            }

            if (error) {
                console.error('E1', error.message)
                // Consume response data to free up memory
                res.resume()
                return
            }

            res.setEncoding('utf8')
            let rawData = ''
            res.on('data', (chunk) => { rawData += chunk })
            res.on('end', () => {
                resolve(rawData)
            })
        }).on('error', (e) => {
            reject(`Got error: ${e.message}`)
        })
    })
}

const fetch_lists = async () => {
    let e_data = {}

    for (const [model, mapping] of Object.entries(dataMap)) {
        console.log('go for', model, 'list')
        let eApis = []
        let jsonList = []
        const url = 'https://' + path.join(eventivalAPI, EVENTIVAL_TOKEN, mapping.api)
        const eventivalXML = await eventivalFetch(url)
            .catch(e => {
                console.log('E3:', e)
            })
        // console.log('eventivalXML', eventivalXML)
        const fetched = my_parser(eventivalXML, mapping.root);
        if (Object.keys(fetched).includes(mapping.iterator)) {
            jsonList = jsonList.concat(fetched[mapping.iterator])
        }
        e_data[model] = jsonList
    }
    return e_data
}

// make sure obj.keep_prop.list_prop is a list
// and replace obj.keep_prop with obj.keep_prop.list_prop
const makeList = (obj, keep_prop, list_prop) => {
    const list_a = obj[keep_prop][list_prop]
    if (list_a === undefined) {
        return
    }
    obj[keep_prop] = (Array.isArray(list_a) ? list_a : [list_a])
}

const fetch_films = async (e_films) => {
    const endlineAt = 60
    for (const ix in e_films) {
        // if (ix > 5) { continue }
        const url = 'https://' + path.join(eventivalAPI, EVENTIVAL_TOKEN, 'films/' + e_films[ix].id + '.xml')
        const eventivalXML = await eventivalFetch(url)
        .catch(e => {
            console.log('E4:', e)
        })
        // siin ei saa kasutada e_film, sest muidu katkeb seos e_film === e_films[ix]
        e_films[ix] = my_parser(eventivalXML, 'film')

        makeList(e_films[ix].film_info, 'languages', 'language')
        makeList(e_films[ix].film_info, 'subtitle_languages', 'subtitle_language')
        makeList(e_films[ix].film_info, 'types', 'type')
        makeList(e_films[ix].film_info, 'countries', 'country')
        makeList(e_films[ix].film_info.relationships, 'directors', 'director')
        makeList(e_films[ix].film_info.relationships, 'cast', 'cast')
        makeList(e_films[ix].eventival_categorization, 'categories', 'category')
        makeList(e_films[ix].eventival_categorization, 'sections', 'section')
        makeList(e_films[ix].eventival_categorization, 'tags', 'tag')
        // e_films[ix].titles.title_english = h2p(e_films[ix].titles.title_english)
        // e_films[ix].titles.title_original = h2p(e_films[ix].titles.title_original)
        // e_films[ix].titles.title_local = h2p(e_films[ix].titles.title_local)
        // e_films[ix].titles.title_custom = h2p(e_films[ix].titles.title_custom)


        for (const [lang, publication] of Object.entries(e_films[ix]['publications'])) {
            makeList(publication, 'crew', 'contact')
            // console.log('before', publication.crew);
            publication.crew = publication.crew.filter(crew => crew.text).map(crew => {
                crew.text = crew.text.split(',').map(txt => txt.trim())
                return crew
            })
            // console.log('after', publication.crew);

            // console.log(publication.crew);
            for (const [role, strapi_id] of Object.entries(rolesAtFilm)) {
                publication.crew.push({
                    strapi_role_at_film: strapi_id,
                    text: h2p(publication[role]).split(',').map(txt => txt.trim())
                })
                delete publication[role]
            }

            publication.synopsis_long = h2p(publication.synopsis_long)
            publication.directors_bio = h2p(publication.directors_bio)
            delete(publication.contacts)
        }

        const cursor_x = parseInt(ix)%endlineAt
        const dot = (ix%10 ? (ix%5 ? '.' : 'i') : '|')
        if (cursor_x === 0 && parseInt(ix) !== 0) {
            readline.cursorTo(process.stdout, endlineAt)
            console.log(dot + ' = ' + ix)
        }
        readline.cursorTo(process.stdout, cursor_x)
        process.stdout.write(dot + ' (' + ix + ')')

        readline.cursorTo(process.stdout, cursor_x + 1)
    }
    process.stdout.write(' = ' + e_films.length + '\n')

}

const decodeScreeningTexts = (e_screenings) => {
    for (const e_screening of e_screenings) {
        let e_film = e_screening.film
        e_film.title_english = h2p(e_film.title_english)
        e_film.title_original = h2p(e_film.title_original)
        e_film.title_local = h2p(e_film.title_local)
        e_film.title_custom = h2p(e_film.title_custom)
    }
}

const decodeFilmTexts = (e_films) => {
    for (const e_film of e_films) {
        if (e_film.titles) {
            // console.log(JSON.stringify(e_film.titles, null, 4));
            e_film.titles.title_english = h2p(e_film.titles.title_english)
            e_film.titles.title_original = h2p(e_film.titles.title_original)
            e_film.titles.title_local = h2p(e_film.titles.title_local)
            e_film.titles.title_custom = h2p(e_film.titles.title_custom)
        } else {
            console.log('film with no titles:', e_film);
        }
    }
}

const foo = async () => {
    const e_data = await fetch_lists()
    decodeScreeningTexts(e_data.screenings)
    console.log('go for all the films ');
    await fetch_films(e_data.films)
    decodeFilmTexts(e_data.films)
    for (const [model, data] of Object.entries(e_data)) {
        const yamlStr = yaml.dump(data, { 'indent': '4' })
        fs.writeFileSync(dataMap[model].outyaml, yamlStr, "utf8")
    }
}

function my_parser(eventivalXML, root_node) {
    if (parser.validate(eventivalXML) !== true) { //optional (it'll return an object in case it's not valid)
        process.exit(1)
    }
    var options = {
        attributeNamePrefix: "@_",
        attrNodeName: "attr",
        textNodeName: "#text",
        ignoreAttributes: true,
        ignoreNameSpace: false,
        allowBooleanAttributes: false,
        parseNodeValue: true,
        parseAttributeValue: false,
        trimValues: true,
        // cdataTagName: "__cdata",
        // cdataPositionChar: "\\c",
        parseTrueNumberOnly: false,
        arrayMode: false,
        stopNodes: ["parse-me-as-string"]
    }
    return parser.parse(eventivalXML, options)[root_node]
}

foo()
