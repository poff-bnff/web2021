const { strapiQuery } = require("../../helpers/strapiQuery.js")

const STRAPI_URL = 'http://139.59.130.149'
const FILMS_API = `${STRAPI_URL}/films`
const CASSETTES_API = `${STRAPI_URL}/cassettes`
const SCREENINGS_API = `${STRAPI_URL}/screenings`
const PERSONS_API = `${STRAPI_URL}/people`
const ROLES_API = `${STRAPI_URL}/role-at-films`


const firstNameLastName = async () => {
    strapi_persons = await strapiQuery({
        headers: { 'Content-Type': 'application/json' },
        path: PERSONS_API + '?_limit=-1',
        method: 'GET'
    })
    for (const s_person of strapi_persons) {
        let firstNameLastName = (s_person.firstName || '') + (s_person.lastName ? ' ' : '') + (s_person.lastName || '')
        if (s_person.firstNameLastName === firstNameLastName) {
            continue
        }
        console.log( s_person.firstNameLastName, '=', firstNameLastName );
        // console.log(JSON.stringify(s_person, null, 2));
        s_person.firstNameLastName = firstNameLastName
        let options =  {
            headers: { 'Content-Type': 'application/json' },
            path: PERSONS_API + '/?',
            method: 'PUT'
        }
        options.path = options.path.replace('?', s_person.id)
        // console.log(options, JSON.stringify(s_person, null, 2));
        await strapiQuery(options, s_person)
    }
}

const removeIfNo1stScreening = async () => {
    strapi_screenings = await strapiQuery({
        headers: { 'Content-Type': 'application/json' },
        path: SCREENINGS_API + '?_limit=-1',
        method: 'GET'
    })
    let screeningsToRemove = strapi_screenings.filter(s => {
        if (s.screening_types === undefined) {
            console.log(s.cassette.title_en, 'no types');
            return true
        }
        return s.screening_types.filter(st => st.name === 'First Screening').length === 0
    })
    // console.log(JSON.stringify(screeningsToRemove, null, 4));
    let screeningsToKeep = strapi_screenings.filter(s => {
        if (s.screening_types === undefined) {
            console.log(s.cassette.title_en, 'no types');
            return false
        }
        return s.screening_types.filter(st => st.name === 'First Screening').length > 0
    })
    // console.log(JSON.stringify(screeningsToKeep, null, 4));

    strapi_cassettes = await strapiQuery({
        headers: { 'Content-Type': 'application/json' },
        path: CASSETTES_API + '?_limit=-1',
        method: 'GET'
    })
    let cassetteIdsToKeep = screeningsToKeep.map(s => s.cassette.id)
    console.log(cassetteIdsToKeep);

    let cassetteIdsToRemove = strapi_cassettes.filter(c => !cassetteIdsToKeep.includes(c.id)).map(c => c.id)
    console.log(cassetteIdsToRemove);

    let cassettesToRemove = strapi_cassettes.filter(c => {
        return !cassetteIdsToKeep.includes(c.id)
    })
    let cassettesToKeep = strapi_cassettes.filter(c => {
        return cassetteIdsToKeep.includes(c.id)
    })
    let filmIdsToKeep = []
    for (const cassetteToKeep of cassettesToKeep) {
        filmIdsToKeep = [].concat(filmIdsToKeep, cassetteToKeep.films.map(f => f.id))
    }
    let filmIdsToRemove = []
    for (const cassetteToRemove of cassettesToRemove) {
        filmIdsToRemove = [].concat(filmIdsToRemove, cassetteToRemove.films.map(f => f.id))
    }
    filmIdsToRemove = filmIdsToRemove.filter(id => !filmIdsToKeep.includes(id))
    console.log(filmIdsToRemove)

    for (const id of filmIdsToRemove) {
        let options = {
            headers: { 'Content-Type': 'application/json' },
            path: FILMS_API + '/' + id,
            method: 'DELETE'
        }
        // console.log(options)
        await strapiQuery(options)
    }
    for (const id of cassetteIdsToRemove) {
        let options = {
            headers: { 'Content-Type': 'application/json' },
            path: CASSETTES_API + '/' + id,
            method: 'DELETE'
        }
        // console.log(options)
        await strapiQuery(options)
    }

}

removeIfNo1stScreening()
