const fs = require('fs')
const yaml = require('js-yaml')
const path = require('path')
const ical = require('ical-generator');
const rueten = require('./rueten.js')
const { fetchModel } = require('./b_fetch.js')

const rootDir = path.join(__dirname, '..')
const domainSpecificsPath = path.join(rootDir, 'domain_specifics.yaml')
const DOMAIN_SPECIFICS = yaml.load(fs.readFileSync(domainSpecificsPath, 'utf8'))

const sourceDir = path.join(rootDir, 'source')
const fetchDir = path.join(sourceDir, '_fetchdir')
const strapiDataDirPath = path.join(sourceDir, '_domainStrapidata')
const DOMAIN = process.env['DOMAIN'] || 'industry.poff.ee'
const allLanguages = DOMAIN_SPECIFICS.locales[DOMAIN]

let ACTIVE_FESTIVAL_EDITIONS
let NAMEVARIABLE
let FETCHDATADIR
if (DOMAIN === 'discoverycampus.poff.ee') {
    ACTIVE_FESTIVAL_EDITIONS = DOMAIN_SPECIFICS.active_discamp_editions
    NAMEVARIABLE = 'discamp'
    FETCHDATADIR = path.join(fetchDir, 'discampcourses')
} else if (DOMAIN === 'industry.poff.ee') {
    ACTIVE_FESTIVAL_EDITIONS = DOMAIN_SPECIFICS.active_industry_editions
    NAMEVARIABLE = 'industry'
    FETCHDATADIR = path.join(fetchDir, 'industryevents')
} else if (DOMAIN === 'filmikool.poff.ee') {
    ACTIVE_FESTIVAL_EDITIONS = null
    NAMEVARIABLE = 'filmikool'
    FETCHDATADIR = path.join(fetchDir, 'filmikoolcourses')
}

const params = process.argv.slice(2)
const param_build_type = params[0]
const target_id = params.slice(1)

const currentTimeUTC = convert_to_UTC()

if (DOMAIN === 'filmikool.poff.ee' || DOMAIN === 'industry.poff.ee' || DOMAIN === 'discoverycampus.poff.ee') {

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
                        'roles_at_film': {
                            model_name: 'RoleAtFilm'
                        },
                        'organisation': {
                            model_name: 'Organisation'
                        }
                    }
                }
            }
        },
        // 'festival_editions': {
        //     model_name: 'FestivalEdition',
        // },
        'industry_categories': {
            model_name: 'IndustryCategory',
        },
        // 'presentedBy': {
        //     model_name: 'PresentedBy',
        //     expand: {
        //         'organisations': {
        //             model_name: 'Organisation'
        //         }
        //     }
        // },
        // 'events': {
        //     model_name: 'Event',
        //         expand: {
        //         'location': {
        //             model_name: 'Location',
        //             expand: {
        //                 'hall': {
        //                     model_name: 'Hall',
        //                     expand: {
        //                         'cinema': {
        //                             model_name: 'Cinema',
        //                             expand: {
        //                                 'town': {
        //                                     model_name: 'Town'
        //                                 }
        //                             }
        //                         }
        //                     }
        //                 }
        //             }
        //         }
        //     }
        // }
    }

    const STRAPIDATA_COURSE_UNFILTERED = fetchModel(STRAPIDATA_COURSES, minimodel)
    let STRAPIDATA_COURSE
    if (ACTIVE_FESTIVAL_EDITIONS) {
        STRAPIDATA_COURSE = STRAPIDATA_COURSE_UNFILTERED.filter(p => p.festival_editions && p.festival_editions.map(fe => fe.id).some(id => ACTIVE_FESTIVAL_EDITIONS.includes(id)))
        // console.log(JSON.stringify(STRAPIDATA_COURSE.filter(a => a.festival_editions)[0], null, 2));
    } else {
        STRAPIDATA_COURSE = STRAPIDATA_COURSE_UNFILTERED
    }

    for (const lang of allLanguages) {
        const courseEventCopy = { ...STRAPIDATA_COURSE }
        processCourseEvent(courseEventCopy, lang, DOMAIN)
    }
}

function processCourseEvent(courseEventCopy, lang, DOMAIN) {
    let allData = processEvents(courseEventCopy, lang)
    generateAllDataYaml(allData, lang)
    searchAndFilters(allData, lang)
}

function processEvents(courseEventCopy, lang) {
    const allData = []

    for (const ix in courseEventCopy) {

        let element = courseEventCopy[ix];
        element = rueten(element, lang);

        if (!element.start_time) {
            console.log(`ERROR! ${DOMAIN} CourseEvent ID ${element.id} missing start_time`);
            continue
        }

        if (!element.publish) {
            continue
        }


        if (element.publishFrom && convert_to_UTC(element.publishFrom) > currentTimeUTC) {
            continue
        }

        if (element.publishUntil && convert_to_UTC(element.publishUntil) < currentTimeUTC) {
            continue
        }

        if (element.slug) {

            if (param_build_type === 'target' && target_id.includes(element.id.toString())) {
                addConfigPathAliases([`/_fetchdir/${NAMEVARIABLE}courseevents/${element.slug}`])
            }

            let dirSlug = element.slug
            if (DOMAIN === 'filmikool.poff.ee') {
                element.path = `courses/${dirSlug}`
            } else {
                element.path = `events/${dirSlug}`
            }

            rolePersonsByRole(element)
            roleCompaniesByRole(element)

            // https://github.com/sebbo2002/ical-generator#readme
            let eventstart = convert_to_UTC(element.start_time)
            let eventend = new Date(eventstart)
            if (element.duration_time) {
                if (element.duration_time.split(':')[1] !== '00') {
                    eventend.setUTCMinutes(eventend.getUTCMinutes() + parseInt(element.duration_time.split(':')[1]))
                }
                if (element.duration_time.split(':')[0] !== '00') {
                    eventend.setUTCHours(eventend.getUTCHours() + parseInt(element.duration_time.split(':')[0]))
                }
            }
            element.calendar_data = escape(ical({
                domain: DOMAIN,
                prodId: `//${DOMAIN}//Industry@Tallinn//EN`,
                events: [
                    {
                        start: convert_to_UTC(element.startTime),
                        end: eventend,
                        timestamp: convert_to_UTC(element.startTime),
                        description: element.description,
                        location: element.location && element.location.hall && element.location.hall.cinema ? element.location.hall.cinema.name + `: http://${DOMAIN}/events/${element.slug}` : undefined,
                        summary: element.title,
                        organizer: {
                            name: 'Industry@Tallinn & Baltic Event',
                            email: 'industry@poff.ee'
                        }
                    }
                ]
            }).toString())

            allData.push(element)
            if (param_build_type === 'target' && !target_id.includes(element.id.toString())) {
                continue
            } else if (param_build_type === 'target' && target_id.includes(element.id.toString())) {
                console.log('Targeting event ', element.id, target_id)
            }
            generateEventYaml(element, dirSlug, lang);

        } else {
            console.log(`ERROR! ${DOMAIN} CourseEvent ID ${element.id} missing slug`);
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

function generateEventYaml(element, dirSlug, lang) {
    const oneYaml = yaml.dump(rueten(element, lang), { 'noRefs': true, 'indent': '4' });
    const yamlPath = path.join(FETCHDATADIR, dirSlug, `data.${lang}.yaml`);

    let saveDir = path.join(FETCHDATADIR, dirSlug);
    fs.mkdirSync(saveDir, { recursive: true });

    fs.writeFileSync(yamlPath, oneYaml, 'utf8');
    fs.writeFileSync(`${saveDir}/index.pug`, `include /_templates/${NAMEVARIABLE}_courseevent_index_template.pug`);
}

function generateAllDataYaml(allData, lang) {
    console.log(`${allData.length} ${DOMAIN} CourseEvents ready for building`);

    const allDataYAML = yaml.dump(allData, { 'noRefs': true, 'indent': '4' });
    const yamlPath = path.join(fetchDir, `${NAMEVARIABLE}_courseevents.${lang}.yaml`);
    fs.writeFileSync(yamlPath, allDataYAML, 'utf8');
}

function searchAndFilters(dataToYAML, lang) {

    let filters = {
        categories: {},
        projects: {},
        credentials: {},
        starttimes: {},
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
            let date = dateTimeUTCtoEET.getFullYear() + '-' + (dateTimeUTCtoEET.getMonth() + 1) + '-' + (dateTimeUTCtoEET.getDate())
            let dateKey = `_${date}`

            starttimes.push(dateKey)
            filters.starttimes[dateKey] = date
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
        }
    });

    let sorted_filters = {
        categories: mSort(filters.categories),
        projects: mSort(filters.projects),
        persons: mSort(filters.credentials),
        starttimes: mSort(filters.starttimes),
    }

    let searchYAML = yaml.dump(events_search, { 'noRefs': true, 'indent': '4' })
    fs.writeFileSync(path.join(fetchDir, `search_${NAMEVARIABLE}_courseevents.${lang}.yaml`), searchYAML, 'utf8')
    let filtersYAML = yaml.dump(sorted_filters, { 'noRefs': true, 'indent': '4' })
    fs.writeFileSync(path.join(fetchDir, `filters_${NAMEVARIABLE}_courseevents.${lang}.yaml`), filtersYAML, 'utf8')

}

function mSort(to_sort) {
    let sortable = []
    for (var item in to_sort) {
        sortable.push([item, to_sort[item]]);
    }

    sortable = sortable.sort(function (a, b) {
        try {
            const locale_sort = a[1].localeCompare(b[1], 'en')
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
                rolePersonTypes[role_name_lc] = rolePersonTypes[role_name_lc] || []

                if (rolePerson.person.firstNameLastName) {
                    rolePersonTypes[role_name_lc].push(rolePerson.person.firstNameLastName)
                } else if (personFromYAML.fullName) {
                    rolePersonTypes[role_name_lc].push(personFromYAML.fullName)
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
                const role_name_lc = roleCompany.roles_at_film.roleNamePrivate.toLowerCase().replace(searchRegExp, '')
                roleCompanyTypes[role_name_lc] = roleCompanyTypes[role_name_lc] || []

                if (roleCompany.organisation.name) {
                    roleCompanyTypes[role_name_lc].push(roleCompany.organisation.name)
                }
            }
        }
        element.credentials.roleCompaniesByRole = roleCompanyTypes
    }
}
