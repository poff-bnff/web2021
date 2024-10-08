const fs = require('fs')
const yaml = require('js-yaml')
const path = require('path')
const ical = require('ical-generator')
const rueten = require('./rueten.js')
const { fetchModel } = require('./b_fetch.js')

const rootDir = path.join(__dirname, '..')
const domainSpecificsPath = path.join(rootDir, 'domain_specifics.yaml')
const DOMAIN_SPECIFICS = yaml.load(fs.readFileSync(domainSpecificsPath, 'utf8'))

const sourceDir = path.join(rootDir, 'source')
const fetchDir = path.join(sourceDir, '_fetchdir')
const fetchDirRestricted = path.join(sourceDir, '_fetchdirRestricted')
const strapiDataDirPath = path.join(sourceDir, '_domainStrapidata')

const DOMAIN = process.env['DOMAIN'] || 'industry.poff.ee'
const allLanguages = DOMAIN_SPECIFICS.locales[DOMAIN]
const ACTIVE_FESTIVAL_EDITIONS = DOMAIN_SPECIFICS.active_editions[DOMAIN] || []
const NAMEVARIABLE = DOMAIN_SPECIFICS.domain[DOMAIN] || ''
const ACTIVE_EVENT_TYPE = DOMAIN_SPECIFICS.active_event_types[DOMAIN] || []
const EVENTLIMIT = parseInt(process.env['EVENTLIMIT']) || 0

let FETCHDATADIR
let FETCHDATADIRRESTRICTED
let FETCHDATADIRNAME
if (DOMAIN === 'discoverycampus.poff.ee') {
    FETCHDATADIRNAME = 'discampcourses'
    FETCHDATADIR = path.join(fetchDir, FETCHDATADIRNAME)
    FETCHDATADIRRESTRICTED = path.join(fetchDirRestricted, FETCHDATADIRNAME)
} else if (DOMAIN === 'industry.poff.ee') {
    FETCHDATADIRNAME = 'industryevents'
    FETCHDATADIR = path.join(fetchDir, FETCHDATADIRNAME)
    FETCHDATADIRRESTRICTED = path.join(fetchDirRestricted, FETCHDATADIRNAME)
} else if (DOMAIN === 'filmikool.poff.ee') {
    FETCHDATADIRNAME = 'filmikoolcourses'
    FETCHDATADIR = path.join(fetchDir, FETCHDATADIRNAME)
    FETCHDATADIRRESTRICTED = path.join(fetchDirRestricted, FETCHDATADIRNAME)
}

const params = process.argv.slice(2)
const param_build_type = params[0]
const target_id = params.slice(1)

const addConfigPathAliases = require('./add_config_path_aliases.js')

if (param_build_type === 'target') {
    addConfigPathAliases([`/${NAMEVARIABLE}_courseevents_search`])
}

const currentTimeUTC = convert_to_UTC()

if (['filmikool.poff.ee', 'industry.poff.ee', 'discoverycampus.poff.ee'].includes(DOMAIN)) {

    const strapiDataCourseEventPath = path.join(strapiDataDirPath, `CourseEvent.yaml`)
    const STRAPIDATA_COURSES = yaml.load(fs.readFileSync(strapiDataCourseEventPath, 'utf8')) || []
    const minimodel = {
        // 'languages': {
        //     model_name: 'Language'
        // },
        'location': {
            model_name: 'Location',
            expand: {
                'hall': {
                    model_name: 'Hall'
                }
            }
        },
        'event_mode': {
            model_name: 'EventMode',
        },
        'event_access': {
            model_name: 'EventAccess',
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
                        }
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
                        }
                    }
                }
            }
        },
        'festival_editions': {
            model_name: 'FestivalEdition',
        },
        'product_categories': {
            model_name: 'Product_Category',
        },
        'event_types': {
            model_name: 'EventType',
        },
        'industry_categories': {
            model_name: 'IndustryCategory',
        },
    }

    const STRAPIDATA_COURSE_UNFILTERED = fetchModel(STRAPIDATA_COURSES, minimodel)
    let PUBLIC_STRAPIDATA_COURSES = STRAPIDATA_COURSE_UNFILTERED.filter(e => e.public) // only public events
        .sort((a, b) => new Date(a.start_time) - new Date(b.start_time)) // Sort by starting time

    let STRAPIDATA_COURSE
    if (ACTIVE_FESTIVAL_EDITIONS.length > 0) {
        STRAPIDATA_COURSE = PUBLIC_STRAPIDATA_COURSES.filter(p => p.festival_editions && p.festival_editions.map(fe => fe.id).some(id => ACTIVE_FESTIVAL_EDITIONS.includes(id)))
        // console.log(JSON.stringify(STRAPIDATA_COURSE.filter(a => a.festival_editions)[0], null, 2));
    } else {
        STRAPIDATA_COURSE = PUBLIC_STRAPIDATA_COURSES
    }

    if (ACTIVE_EVENT_TYPE.length > 0) {
        STRAPIDATA_COURSE = STRAPIDATA_COURSE.filter(p => p.event_types && p.event_types.map(e_t => e_t.id).some(id => ACTIVE_EVENT_TYPE.includes(id)))
        // console.log(JSON.stringify(STRAPIDATA_COURSE.filter(a => a.event_types)[0], null, 2));
    } else {
        STRAPIDATA_COURSE = STRAPIDATA_COURSE
    }

    for (const lang of allLanguages) {
        const courseEventCopy = { ...STRAPIDATA_COURSE }
        let allData = processEvents(courseEventCopy, lang)
        generateAllDataYaml(allData, lang)
        searchAndFilters(allData, lang)
    }
}

function processEvents(courseEventCopy, lang) {
    const allData = []

    let limit = EVENTLIMIT
    let counting = 0

    for (const ix in courseEventCopy) {

        if (limit !== 0 && counting === limit) break
        counting++

        let elementCopy = { ...courseEventCopy[ix] };
        elementCopy.dirSlug = elementCopy.slug_en ? elementCopy.slug_en : null
        element = rueten(elementCopy, lang);

        // if (!element.start_time) {
        //     console.log(`ERROR! ${DOMAIN} CourseEvent ID ${element.id} missing start_time`);
        //     continue
        // }

        if (!element.publish) {
            continue
        }


        if (element.publishFrom && convert_to_UTC(element.publishFrom) > currentTimeUTC) {
            continue
        }

        if (element.publishUntil && convert_to_UTC(element.publishUntil) < currentTimeUTC) {
            continue
        }

        if (element.dirSlug) {

            if (param_build_type === 'target' && target_id.includes(element.id.toString())) {
                addConfigPathAliases([`/_fetchdir/${FETCHDATADIRNAME}/${element.dirSlug}`])
                if (!element.public) {
                    addConfigPathAliases([`/_fetchdirRestricted/${FETCHDATADIRNAME}/${element.dirSlug}`])
                }
            }

            if (DOMAIN === 'filmikool.poff.ee') {
                element.path = `courses/${element.dirSlug}`
            } else {
                element.path = `events/${element.dirSlug}`
            }

            rolePersonsByRole(element)
            roleCompaniesByRole(element)

            // https://github.com/sebbo2002/ical-generator#readme
            let eventstart = convert_to_UTC(element.start_time)
            let eventend = new Date(eventstart)
            // Calculate end time from duration.
            if (element.duration_time) {
                if (element.duration_time.split(':')[1] !== '00') {
                    eventend.setUTCMinutes(eventend.getUTCMinutes() + parseInt(element.duration_time.split(':')[1]))
                }
                if (element.duration_time.split(':')[0] !== '00') {
                    eventend.setUTCHours(eventend.getUTCHours() + parseInt(element.duration_time.split(':')[0]))
                }
            } else {
                // No duration set, use end_time.
                eventend = convert_to_UTC(element.end_time)
            }
            const icalAddData = {
                domain: DOMAIN,
                prodId: `//${DOMAIN}//Industry@Tallinn//EN`,
                events: [
                    {
                        start: eventstart,
                        end: eventend,
                        timestamp: eventstart,
                        description: element.description,
                        location: element.hasOwnProperty('location') && element.location.hasOwnProperty('name') ? element.location.name + `: https://${DOMAIN}/events/${element.slug}` : undefined,
                        summary: element.title,
                        organizer: {
                            name: 'Industry@Tallinn & Baltic Event',
                            email: 'industry@poff.ee'
                        }
                    }
                ]
            }
            const icalAddEvent = ical(icalAddData)
            element.calendar_data = encodeURI(icalAddEvent.toString())
            const icalCancelData = JSON.parse(JSON.stringify(icalAddData))
            icalCancelData.method = 'CANCEL'
            icalCancelData.events[0].status = 'CANCELLED'
            const icalCancelEvent = ical(icalCancelData)
            element.calendar_cancel_data = encodeURI(icalCancelEvent.toString())

            allData.push(element)
            if (param_build_type === 'target' && !target_id.includes(element.id.toString())) {
                continue
            } else if (param_build_type === 'target' && target_id.includes(element.id.toString())) {
                console.log('Targeting event ', element.id, target_id)
            }
            generateEventYaml(element, element.dirSlug, lang);
            // Make a restricted page as well if not public
            if (!element.public) {
                generateEventYaml(element, element.dirSlug, lang, true);
            }

        } else {
            console.log(`ERROR! ${DOMAIN} CourseEvent ID ${element.id} missing slug_en`, element);
        }
    }
    return allData
}

function convert_to_UTC(datetime) {
    datetime = datetime ? new Date(datetime) : new Date()
    try {
        return new Date(
            Date.UTC(
                datetime.getUTCFullYear(),
                datetime.getUTCMonth(),
                datetime.getUTCDate(),
                datetime.getUTCHours(),
                datetime.getUTCMinutes(),
                datetime.getUTCSeconds(),
                datetime.getUTCMilliseconds()
            )
        )
    } catch (error) {
        throw new Error('Invalid input date')
    }
}

function generateEventYaml(element, dirSlug, lang, restricted = false) {
    if (restricted) {
        element.path = path.join('restrictedcontent', element.path)
    }
    const oneYaml = yaml.dump(rueten(element, lang), { 'noRefs': true, 'indent': '4' });
    const fetchDirToUse = restricted ? FETCHDATADIRRESTRICTED : FETCHDATADIR
    const yamlPath = path.join(fetchDirToUse, dirSlug, `data.${lang}.yaml`);

    let saveDir = path.join(fetchDirToUse, dirSlug);
    fs.mkdirSync(saveDir, { recursive: true });

    fs.writeFileSync(yamlPath, oneYaml, 'utf8');
    fs.writeFileSync(`${saveDir}/index.pug`, `include /_templates/courseevent${restricted ? '_restricted' : ''}_index_template.pug`);
}

function generateAllDataYaml(allData, lang) {
    console.log(`${allData.length} ${DOMAIN} CourseEvents ready for building`);

    const allDataYAML = yaml.dump(allData, { 'noRefs': true, 'indent': '4' });
    const yamlPath = path.join(fetchDir, `courseevents.${lang}.yaml`);
    fs.writeFileSync(yamlPath, allDataYAML, 'utf8');
}

function searchAndFilters(dataToYAML, lang) {

    let filters = {
        categories: {},
        projects: {},
        credentials: {},
        starttimes: {},
        festivaleditions: {},
        eventaccesses: {},
        eventtypes: {},
        eventmodes: {},
        isliveevent: {},
        eventaccess: {},
        locations: {},
    }

    const events_search = dataToYAML.map(events => {

        let event = events

        let categories = []
        if (typeof event.industry_categories !== 'undefined') {
            let industry_categories = event.industry_categories.map(name => name.name)
            for (const name of industry_categories) {
                categories.push(name)
                filters.categories[name] = name
            }
        }

        let projects = []
        if (typeof event.industry_projects !== 'undefined') {
            let industry_projects = event.industry_projects.map(proj => proj.title)
            for (const title of industry_projects) {
                projects.push(title)
                filters.projects[title] = title
            }
        }

        let credentials = []
        if (event?.credentials?.rolePerson) {
            let industryCredentials = event.credentials.rolePerson.filter(p => p.person).map(pers => `${pers.person.firstName} ${pers.person.lastName}`)
            for (const name of industryCredentials) {
                credentials.push(name)
                filters.credentials[name] = name
            }
        }

        let starttimes = []
        if (typeof event.start_time !== 'undefined') {

            Date.prototype.addHours = function (hours) {
                var date = new Date(this.valueOf());
                date.setHours(date.getHours() + hours);
                return date;
            }

            let dateTimeUTC = convert_to_UTC(event.start_time)
            let dateTimeUTCtoEET = dateTimeUTC.addHours(2)
            let date = dateTimeUTCtoEET.getFullYear() + '-' + (dateTimeUTCtoEET.getMonth() + 1).toString().padStart(2, '0') + '-' + (dateTimeUTCtoEET.getDate()).toString().padStart(2, '0')
            let dateKey = `_${date}`

            starttimes.push(dateKey)
            filters.starttimes[dateKey] = date
        }

        let festivaleditions = []
        if (typeof event.festival_editions !== 'undefined') {
            let festival_editions = event.festival_editions.map(name => name.name).filter(name => name)

            for (const name of festival_editions) {
                festivaleditions.push(name)
                filters.festivaleditions[name] = name
            }
        }

        let locations = []
        if (event?.location?.name) {
            let location = event.location.name

            if (location.length > 0) {
                locations.push(location)
                filters.locations[location] = location
            }
        }

        let eventtypes = []
        if (typeof event.event_types !== 'undefined') {
            for (const name of event.event_types) {
                eventtypes.push(name)
                filters.eventtypes[name] = name
            }
        }

        let eventmodes = []
        if (typeof event.event_mode !== 'undefined') {
            eventmodes.push(event.event_mode.name)
            filters.eventmodes[event.event_mode.name] = event.event_mode.name
        }

        let isliveevent = []
        if (typeof event.is_live_event !== 'undefined') {
            isliveevent.push('Yes')
            filters.isliveevent['Yes'] = 'Yes'
        } else {
            isliveevent.push('No')
            filters.isliveevent['No'] = 'No'
        }

        let eventaccess = []
        if (typeof event.event_access !== 'undefined') {
            eventaccess.push(event.event_access)
            filters.eventaccess[event.event_access] = event.event_access
        }

        return {
            id: events.id,
            text: [
                events.title,
                events.description,
                categories.join(' '),
                projects.join(' '),
                credentials.join(' '),
            ].join(' ').toLowerCase(),
            categories: categories,
            projects: projects,
            persons: credentials,
            starttimes: starttimes,
            festivaleditions: festivaleditions,
            eventtypes: eventtypes,
            eventmodes: eventmodes,
            isliveevent: isliveevent,
            eventaccess: eventaccess,
            locations: locations,
        }
    });

    let sorted_filters = {
        categories: mSort(filters.categories, lang),
        projects: mSort(filters.projects, lang),
        persons: mSort(filters.credentials, lang),
        starttimes: mSort(filters.starttimes, lang),
        festivaleditions: mSort(filters.festivaleditions, lang),
        eventtypes: mSort(filters.eventtypes, lang),
        eventmodes: mSort(filters.eventmodes, lang),
        isliveevent: mSort(filters.isliveevent, lang),
        eventaccess: mSort(filters.eventaccess, lang),
        locations: mSort(filters.locations, lang),
    }

    let searchYAML = yaml.dump(events_search, { 'noRefs': true, 'indent': '4' })
    fs.writeFileSync(path.join(fetchDir, `search_courseevents.${lang}.yaml`), searchYAML, 'utf8')
    let filtersYAML = yaml.dump(sorted_filters, { 'noRefs': true, 'indent': '4' })
    fs.writeFileSync(path.join(fetchDir, `filters_courseevents.${lang}.yaml`), filtersYAML, 'utf8')

}

function mSort(to_sort, lang) {
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

function rolePersonsByRole(element) {
    // Rolepersons by role
    if (element?.credentials?.rolePerson?.[0]) {
        let rolePersonTypes = {}
        element.credentials.rolePerson.sort(function (a, b) { return (a.order > b.order) ? 1 : ((b.order > a.order) ? -1 : 0) })

        for (roleIx in element.credentials.rolePerson) {
            let rolePerson = element.credentials.rolePerson[roleIx]
            if (rolePerson === undefined) { continue }
            if (rolePerson.person) {
                let searchRegExp = new RegExp(' ', 'g')
                const role_name_lc = rolePerson?.role_at_film?.roleNamePrivate?.toLowerCase()?.replace(searchRegExp, '')
                if (!role_name_lc) {
                    continue
                }
                if (!rolePersonTypes[role_name_lc]) {
                    rolePersonTypes[role_name_lc] = {
                        roleName: rolePerson?.role_at_film?.roleName,
                        persons: []
                    }
                }

                if (rolePerson.person.firstNameLastName) {
                    rolePersonTypes[role_name_lc].persons.push(rolePerson.person.firstNameLastName)
                } else if (personFromYAML.fullName) {
                    rolePersonTypes[role_name_lc].persons.push(personFromYAML.fullName)
                }
            }
        }
        element.credentials.rolePersonsByRole = rolePersonTypes
    }
}

function roleCompaniesByRole(element) {
    // Rolecompanies by role
    if (element.credentials && element.credentials.roleCompany && element.credentials.roleCompany[0]) {
        let roleCompanyTypes = {}
        element.credentials.roleCompany.sort(function (a, b) { return (a.order > b.order) ? 1 : ((b.order > a.order) ? -1 : 0) })
        for (roleIx in element.credentials.roleCompany) {
            let roleCompany = element.credentials.roleCompany[roleIx]
            if (roleCompany === undefined) { continue }
            if (roleCompany.organisation) {
                let searchRegExp = new RegExp(' ', 'g')
                const role_name_lc = roleCompany.role_at_film.roleNamePrivate.toLowerCase().replace(searchRegExp, '')
                roleCompanyTypes[role_name_lc] = roleCompanyTypes[role_name_lc] || []

                if (roleCompany.organisation.name) {
                    roleCompanyTypes[role_name_lc].push(roleCompany.organisation.name)
                }
            }
        }
        element.credentials.roleCompaniesByRole = roleCompanyTypes
    }
}
