const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');
const ical = require('ical-generator');
const rueten = require('./rueten.js');
const { fetchModel } = require('./b_fetch.js')

const rootDir = path.join(__dirname, '..')
const domainSpecificsPath = path.join(rootDir, 'domain_specifics.yaml')
const DOMAIN_SPECIFICS = yaml.load(fs.readFileSync(domainSpecificsPath, 'utf8'))
const INDUSTRY_ACTIVE_FESTIVAL_EDITIONS = DOMAIN_SPECIFICS.active_industry_editions

const sourceDir = path.join(rootDir, 'source');
const fetchDir = path.join(sourceDir, '_fetchdir');
const fetchDataDir = path.join(fetchDir, 'industryevents');
const strapiDataDirPath = path.join(sourceDir, '_domainStrapidata');
const strapiDataIndustryEventPath = path.join(strapiDataDirPath, 'IndustryEvent.yaml')
const STRAPIDATA_INDUSTRY_EVENTS = yaml.load(fs.readFileSync(strapiDataIndustryEventPath, 'utf8'))
const DOMAIN = process.env['DOMAIN'] || 'industry.poff.ee';

if (DOMAIN === 'industry.poff.ee') {

    const minimodel = {
        'images': {
            model_name: 'StrapiMedia'
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
        'industry_categories': {
            model_name: 'IndustryCategory'
        },
        'project_type': {
            model_name: 'ProjectType'
        },
        'channel': {
            model_name: 'Channel'
        },
        'industry_people': {
            model_name: 'IndustryPerson',
            expand: {
                'person': {
                    model_name: 'Person'
                },
                'industry_person_types': {
                    model_name: 'IndustryPersonType'
                },
                'role_at_films': {
                    model_name: 'RoleAtFilm'
                },
            }
        },
        'industry_projects': {
            model_name: 'IndustryProject'
        },
        'festival_editions': {
            model_name: 'FestivalEdition'
        },
        'event_mode': {
            model_name: 'EventMode'
        },
    }

    const STRAPIDATA_ALL_FE_INDUSTRY_EVENTS = fetchModel(STRAPIDATA_INDUSTRY_EVENTS, minimodel)
    const STRAPIDATA_INDUSTRY_EVENT = STRAPIDATA_ALL_FE_INDUSTRY_EVENTS.filter(p => p.festival_editions && p.festival_editions.map(fe => fe.id).some(id => INDUSTRY_ACTIVE_FESTIVAL_EDITIONS.includes(id)))

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

    const currentTimeUTC = convert_to_UTC()

    console.log(`Fetching ${DOMAIN} Industry Event en data`);

    const allData = []
    for (const ix in STRAPIDATA_INDUSTRY_EVENT) {

        let element = JSON.parse(JSON.stringify(STRAPIDATA_INDUSTRY_EVENT[ix]));

        if (!element.startTime) {
            console.log(`ERROR! Industry event ID ${element.id} missing startTime`);
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

        if (element['slug_en']) {
            let dirSlug = element['slug_en']
            element.path = `events/${dirSlug}`

            element = rueten(element, 'en');


            // https://github.com/sebbo2002/ical-generator#readme
            let eventstart = convert_to_UTC(element.startTime)
            let eventend = new Date(eventstart)
            if (element.durationTime) {
                if (element.durationTime.split(':')[1] !== '00') {
                    eventend.setUTCMinutes(eventend.getUTCMinutes() + parseInt(element.durationTime.split(':')[1]))
                }
                if (element.durationTime.split(':')[0] !== '00') {
                    eventend.setUTCHours(eventend.getUTCHours() + parseInt(element.durationTime.split(':')[0]))
                }
            }
            element.calendar_data = escape(ical({
                domain: 'industry.poff.ee',
                prodId: '//industry.poff.ee//Industry@Tallinn//EN',
                events: [
                    {
                        start: convert_to_UTC(element.startTime),
                        end: eventend,
                        timestamp: convert_to_UTC(element.startTime),
                        description: element.description,
                        location: element.location && element.location.hall && element.location.hall.cinema ? element.location.hall.cinema.name + `: http://industry.poff.ee/events/${element.slug}` : undefined,
                        summary: element.title,
                        organizer: {
                            name: 'Industry@Tallinn & Baltic Event',
                            email: 'industry@poff.ee'
                        }
                    }
                ]
            }).toString())

            const oneYaml = yaml.dump(rueten(element, 'en'), { 'noRefs': true, 'indent': '4' });
            const yamlPath = path.join(fetchDataDir, dirSlug, `data.en.yaml`);

            let saveDir = path.join(fetchDataDir, dirSlug);
            fs.mkdirSync(saveDir, { recursive: true });

            fs.writeFileSync(yamlPath, oneYaml, 'utf8');
            fs.writeFileSync(`${saveDir}/index.pug`, `include /_templates/industry_event_index_template.pug`)

            allData.push(element)
        } else {
            if ('en' === 'en' && DOMAIN === 'industry.poff.ee') {
                console.log(`ERROR! Industry event ID ${element.id} missing slug`);
            }
        }
    }


    let dataToYAML = []
    let newDataToYAML = { eventsByDate: {}, allDates: [] }
    if (allData.length) {
        dataToYAML = allData.sort((a, b) => new Date(a.startTime) - new Date(b.startTime))

        Date.prototype.addHours = function (hours) {
            var date = new Date(this.valueOf());
            date.setHours(date.getHours() + hours);
            return date;
        }

        let allDates = dataToYAML.map(event => {
            let dateTimeUTC = convert_to_UTC(event.startTime)
            let dateTimeUTCtoEET = dateTimeUTC.addHours(2)
            let date = dateTimeUTCtoEET.getFullYear() + '-' + (dateTimeUTCtoEET.getMonth() + 1) + '-' + (dateTimeUTCtoEET.getDate())
            if (event.channel) {
                newDataToYAML.eventsByDate[date] = newDataToYAML.eventsByDate[date] || {}
                newDataToYAML.eventsByDate[date][`Channel_${event.channel.id}`] = newDataToYAML.eventsByDate[date][`Channel_${event.channel.id}`] || []
                newDataToYAML.eventsByDate[date][`Channel_${event.channel.id}`].push(event)
            }
            return date
        });

        for (const date in newDataToYAML.eventsByDate) {
            newDataToYAML.allDates.push(date)
        }
        console.log(`${dataToYAML.length} Industry Events ready for building`);
    }
    const allDataYAML = yaml.dump(dataToYAML, { 'noRefs': true, 'indent': '4' });
    const yamlPath = path.join(fetchDir, `industryeventscalendar.en.yaml`);
    fs.writeFileSync(yamlPath, allDataYAML, 'utf8');

    const allNewDataYAML = yaml.dump(newDataToYAML, { 'noRefs': true, 'indent': '4' });
    const yamlNewPath = path.join(fetchDir, `industryevents.en.yaml`);
    fs.writeFileSync(yamlNewPath, allNewDataYAML, 'utf8');

    search_and_filters(dataToYAML)

    function search_and_filters(dataToYAML) {

        let filters = {
            // types: {},
            locations: {},
            modes: {},
            publics: {},
            lives: {},
            categories: {},
            channels: {},
            projects: {},
            persons: {},
            starttimes: {},
        }

        const events_search = dataToYAML.map(events => {

            let event = events

            // let types = []
            // if (typeof event.project_type !== 'undefined') {
            //     types.push(event.project_type.type)
            //     filters.types[event.project_type.type] = event.project_type.type
            // }

            locations = []
            if (typeof event.location !== 'undefined') {
                let industry_location = event.location.name
                locations.push(industry_location)
                filters.locations[industry_location] = industry_location
            }

            modes = []
            if (typeof event.event_mode !== 'undefined') {
                let event_mode = event.event_mode.name
                modes.push(event_mode)
                filters.modes[event_mode] = event_mode
            }

            publics = []
            let public_event = event.isPublicEvent ? 'Public event' : 'Closed event'
            publics.push(public_event)
            filters.publics[public_event] = public_event

            lives = []
            let isLiveEvent = event.isLiveEvent ? 'Live stream' : 'No live stream'
            lives.push(isLiveEvent)
            filters.lives[isLiveEvent] = isLiveEvent

            let categories = []
            if (typeof event.industry_categories !== 'undefined') {
                let industry_categories = event.industry_categories.map(name => name.name)
                for (const name of industry_categories) {
                    categories.push(name)
                    filters.categories[name] = name
                }
            }

            let channels = []
            if (typeof event.channel !== 'undefined') {
                channels.push(event.channel.name)
                filters.channels[event.channel.name] = event.channel.name
            }

            let projects = []
            if (typeof event.industry_projects !== 'undefined') {
                let industry_projects = event.industry_projects.map(proj => proj.title)
                for (const title of industry_projects) {
                    projects.push(title)
                    filters.projects[title] = title
                }
            }

            let persons = []
            if (typeof event.industry_people !== 'undefined') {
                let industry_people = event.industry_people.filter(p => p.person).map(pers => `${pers.person.firstName} ${pers.person.lastName}`)
                for (const name of industry_people) {
                    persons.push(name)
                    filters.persons[name] = name
                }
            }

            let starttimes = []
            if (typeof event.startTime !== 'undefined') {

                Date.prototype.addHours = function (hours) {
                    var date = new Date(this.valueOf());
                    date.setHours(date.getHours() + hours);
                    return date;
                }

                let dateTimeUTC = convert_to_UTC(event.startTime)
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
                    // types.join(' '),
                    locations.join(' '),
                    modes.join(' '),
                    publics.join(' '),
                    lives.join(' '),
                    categories.join(' '),
                    channels.join(' '),
                    projects.join(' '),
                    persons.join(' '),
                ].join(' ').toLowerCase(),
                // types: types,
                locations: locations,
                modes: modes,
                publics: publics,
                lives: lives,
                categories: categories,
                channels: channels,
                projects: projects,
                persons: persons,
                starttimes: starttimes,
            }
        });

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

        let sorted_filters = {
            // types: mSort(filters.types),
            locations: mSort(filters.locations),
            modes: mSort(filters.modes),
            publics: mSort(filters.publics),
            lives: mSort(filters.lives),
            categories: mSort(filters.categories),
            channels: mSort(filters.channels),
            projects: mSort(filters.projects),
            persons: mSort(filters.persons),
            starttimes: mSort(filters.starttimes),
        }

        let searchYAML = yaml.dump(events_search, { 'noRefs': true, 'indent': '4' })
        fs.writeFileSync(path.join(fetchDir, `search_industryeventscalendar.yaml`), searchYAML, 'utf8')

        let filtersYAML = yaml.dump(sorted_filters, { 'noRefs': true, 'indent': '4' })
        fs.writeFileSync(path.join(fetchDir, `filters_industryeventscalendar.yaml`), filtersYAML, 'utf8')

    }
} else {

    let emptyYAML = yaml.dump([], { 'noRefs': true, 'indent': '4' })
    fs.writeFileSync(path.join(fetchDir, `search_industryeventscalendar.yaml`), emptyYAML, 'utf8')
    fs.writeFileSync(path.join(fetchDir, `filters_industryeventscalendar.yaml`), emptyYAML, 'utf8')
    fs.writeFileSync(path.join(fetchDir, `industryeventscalendar.en.yaml`), emptyYAML, 'utf8');
    fs.writeFileSync(path.join(fetchDir, `industryevents.en.yaml`), emptyYAML, 'utf8');

}
