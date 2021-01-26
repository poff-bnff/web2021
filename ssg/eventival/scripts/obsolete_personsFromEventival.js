const util = require('util')
const https = require('https')
const fs = require('fs')
var parser = require('fast-xml-parser');
const yaml = require('js-yaml')
const path = require('path')


const fetchdir =  path.join(__dirname, '..', '..', 'source', '_fetchdir')
const E_PERSONS_FILE = path.join(fetchdir, 'eventival_persons.yaml')
const EVENTIVAL_TOKEN = process.env['EVENTIVAL_TOKEN']
const edition = '24'
const eventivalAPI = path.join('bo.eventival.com', 'poff', edition, 'en', 'ws', EVENTIVAL_TOKEN, 'people', 'accreditation', 'badges-with-barcode-and-photo.xml')

const relevantBadgeTypes = {
    'MANAGEMENT': 0,
    'JURY': 0,
    'Industry PRO': 0,
    'Industry ACCESS': 0,
    'PRESS': 0,
    'GUEST': 0
}


async function fetch_badges() {
    // console.log('Fetch', modelName)
    return new Promise((resolve, reject) => {
        // console.log('url', url);
        https.get('https://' + eventivalAPI, (res) => {
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

const foo = async () => {
    const eventivalXML = await fetch_badges()
    const badges = my_parser(eventivalXML, 'badges').badge
    const persons = {}
    for (const badge of badges) {
        if (badge.cancelled === 1) {
            continue
        }
        if (!badge.person) {
            console.log({E: 'Badge with no person', badge})
            continue
        }
        if (!badge.badge_type) {
            console.log({E: 'Badge with no type', badge})
            continue
        }
        if (!badge.badge_type.name) {
            console.log({E: 'Badge with unnamed type', badge})
            continue
        }
        if (!relevantBadgeTypes.hasOwnProperty(badge.badge_type.name)) {
            continue;
        }
        if (!badge.person.login_email && !badge.person.photo_link) {
            console.log({E: 'no email nor pic for person', badge})
            continue
        }
        // relevantBadgeTypes[badge.badge_type.name] = relevantBadgeTypes[badge.badge_type.name] || 0
        // relevantBadgeTypes[badge.badge_type.name] ++
        const person_id = badge.person.login_email || badge.person.photo_link.split(/(people\/|\/photo)/)[1] || false
        if (!person_id) {
            console.log({E: 'cant get an id on person', badge})
            continue
        }
        persons[person_id] = persons[person_id] || {}
        const person = persons[person_id]

        person.id = person_id
        person.name = person.name || badge.person.name || null
        person.surname = person.surname || badge.person.surname || null
        person.login_email = person.login_email || badge.person.login_email || null
        person.photo_link = person.photo_link || badge.person.photo_link || null
        // process.exit(1)
    }
    // fs.writeFileSync(E_PERSONS_FILE, JSON.stringify(persons, null, 4))
    // console.log(util.inspect(persons, null, 10))

    let persons_array = []
    for (const person in persons) {
        persons_array.push(persons[person])
    }

    persons_array.sort((a, b) => {
        return `${a.name ? a.name : ''} ${a.surname ? a.surname : ''}`.localeCompare(`${b.name ? b.name : ''} ${b.surname ? b.surname : ''}`, 'en')
    })

    console.log(persons_array.length, 'Eventival persons fetched.');
    fs.writeFileSync(E_PERSONS_FILE, yaml.safeDump(persons_array, { 'noRefs': true, 'indent': '4' }))
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
