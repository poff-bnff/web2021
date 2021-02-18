const fs = require('fs')
const util = require('util')
const yaml = require('js-yaml')
const path = require('path')

const sourceDir =  path.join(__dirname, '..', 'source')
const fetchDir =  path.join(sourceDir, '_fetchdir')
const rootDir =  path.join(__dirname, '..')

const eventivalPersonsPath = path.join(rootDir, 'eventival', 'static', 'eventival_persons.yaml')
const EVENTIVAL_PERSONS = yaml.safeLoad(fs.readFileSync(eventivalPersonsPath, 'utf8'))
const E_PERSONS_FILE = path.join(fetchDir, 'eventival_persons.yaml')
const DOMAIN = process.env['DOMAIN'] || 'poff.ee'


if (DOMAIN === 'industry.poff.ee') {

    console.log(`Fetching ${DOMAIN} eventival persons data`)

    function eventival_persons_yaml() {
        let data = {
            persons: EVENTIVAL_PERSONS,
            filters: {},
            search: [],
        }

        add_filters_and_search_to_data(data)

        console.log(data.persons.length, 'Eventival persons fetched.')


        // console.log(util.inspect(data, null, 10))

        fs.writeFileSync(E_PERSONS_FILE, yaml.safeDump(data, { 'noRefs': true, 'indent': '4' }))
    }

    function add_filters_and_search_to_data(data) {


        let filters = {
            types: {},
            companies: {},
            roles: {},
            countries: {},
            projects: {},
        }

        const eventival_persons_search = data.persons.map(person => {

            let types = []
            if (person.AttendeeType && person.AttendeeType.length) {
                const type = person.AttendeeType
                types.push(type)
                filters.types[type] = person.AttendeeType
            }

            let companies = []
            if (person.Company && person.Company.length) {
                const company = person.Company
                companies.push(company)
                filters.companies[company] = person.Company
            }

            let roles = []
            if (person.Role && person.Role.length) {
                const role = person.Role
                for (const eachrole of role.split(', ')) {
                    if (eachrole.length) {
                        let trim_role = eachrole.trim()
                        roles.push(trim_role)
                        filters.roles[trim_role] = trim_role
                    }
                }
            }

            let countries = []
            if (person.Country && person.Country.length) {
                const country = person.Country
                countries.push(country)
                filters.countries[country] = country
            }

            let projects = []
            if (person.Project) {
                const project = person.Project
                projects.push(project)
                filters.projects[project] = project
            }

            return {
                id: person.EV_ID,
                text: [
                    `${person.FirstName} ${person.LastName}`,
                    person.AttendeeType,
                    person.Company,
                    person.Role,
                    person.Project,
                    person.Country,
                ].join(' ').toLowerCase(),
                types: types,
                companies: companies,
                roles: roles,
                countries: countries,
                projects: projects,
            }
        })

        function mSort(to_sort) {
            let sortable = []
            for (var item in to_sort) {
                sortable.push([item, to_sort[item]])
            }

            sortable = sortable.sort(function(a, b) {
                try {
                    const locale_sort = a[1].localeCompare(b[1], 'en')
                    return locale_sort
                } catch (error) {
                    console.log('failed to sort', JSON.stringify({a, b}, null, 4))
                    throw new Error(error)
                }
            })

            var objSorted = {}
            for (let index = 0; index < sortable.length; index++) {
                const item = sortable[index]
                objSorted[item[0]]=item[1]
            }
            return objSorted
        }

        let sorted_filters = {
            types: mSort(filters.types),
            companies: mSort(filters.companies),
            roles: mSort(filters.roles),
            countries: mSort(filters.countries),
            projects: mSort(filters.projects),
        }

        data.search = eventival_persons_search
        data.filters = sorted_filters

        return data
    }

    eventival_persons_yaml()
} else {
    fs.writeFileSync(E_PERSONS_FILE, yaml.safeDump([], { 'noRefs': true, 'indent': '4' }))
}
