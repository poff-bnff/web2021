const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');
const ical = require('ical-generator');
const rueten = require('./rueten.js');
const {fetchModel} = require('./b_fetch.js')

const rootDir =  path.join(__dirname, '..')
const domainSpecificsPath = path.join(rootDir, 'domain_specifics.yaml')
const DOMAIN_SPECIFICS = yaml.load(fs.readFileSync(domainSpecificsPath, 'utf8'))
const DISCAMP_ACTIVE_FESTIVAL_EDITIONS = DOMAIN_SPECIFICS.active_discamp_editions

const sourceDir =  path.join(rootDir, 'source');
const fetchDir =  path.join(sourceDir, '_fetchdir');
const fetchDataDir =  path.join(fetchDir, 'discampevents');
const strapiDataDirPath = path.join(sourceDir, '_domainStrapidata');
const strapiDataDCEventPath = path.join(strapiDataDirPath, 'DisCampEvent.yaml')
const STRAPIDATA_DISCAMP_EVENTS = yaml.load(fs.readFileSync(strapiDataDCEventPath, 'utf8'))
const DOMAIN = process.env['DOMAIN'] || 'discoverycampus.poff.ee';

const params = process.argv.slice(2)
const param_build_type = params[0]
const target_id = params.slice(1)

const addConfigPathAliases = require('./add_config_path_aliases.js')

if (param_build_type === 'target') {
    addConfigPathAliases(['/discamp_events_search', '/discamp_mycal'])
}

if (DOMAIN === 'discoverycampus.poff.ee') {

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
        'discamp_categories': {
            model_name: 'DisCampCategory'
        },
        'project_type': {
            model_name: 'ProjectType'
        },
        'channel': {
            model_name: 'Channel'
        },
        'discamp_people': {
            model_name: 'DisCampPerson',
            expand: {
                'person': {
                    model_name: 'Person'
                },
                'discamp_person_types': {
                    model_name: 'DisCampPersonType'
                },
                'role_at_films': {
                    model_name: 'RoleAtFilm'
                },
            }
        },
        'discamp_projects': {
            model_name: 'DisCampProject'
        },
        'festival_editions': {
            model_name: 'FestivalEdition'
        },
        'event_mode': {
            model_name: 'EventMode'
        },
    }

    const STRAPIDATA_ALL_FE_DISCAMP_EVENTS = fetchModel(STRAPIDATA_DISCAMP_EVENTS, minimodel)
    const STRAPIDATA_discamp_EVENT = STRAPIDATA_ALL_FE_DISCAMP_EVENTS.filter(p => p.festival_editions && p.festival_editions.map(fe => fe.id).some(id => DISCAMP_ACTIVE_FESTIVAL_EDITIONS.includes(id)))

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

    console.log(`Fetching ${DOMAIN} discamp Event en data`);

    const allData = []
    for (const ix in STRAPIDATA_discamp_EVENT) {

        let element = JSON.parse(JSON.stringify(STRAPIDATA_discamp_EVENT[ix]));

        if (!element.startTime) {
            console.log(`ERROR! discamp event ID ${element.id} missing startTime`);
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

            if (param_build_type === 'target' && target_id.includes(element.id.toString())) {
                addConfigPathAliases([`/_fetchdir/discampevents/${element['slug_en']}`])
            }

            let dirSlug = element['slug_en']
            element.path = `events/${dirSlug}`

            element = rueten(element, 'en');


            // https://github.com/sebbo2002/ical-generator#readme
            let eventstart = convert_to_UTC(element.startTime)
            let eventend = new Date(eventstart)
            if(element.durationTime) {
                if (element.durationTime.split(':')[1] !== '00') {
                    eventend.setUTCMinutes(eventend.getUTCMinutes()+parseInt(element.durationTime.split(':')[1]))
                }
                if (element.durationTime.split(':')[0] !== '00') {
                    eventend.setUTCHours(eventend.getUTCHours()+parseInt(element.durationTime.split(':')[0]))
                }
            }
            element.calendar_data = escape(ical({
                domain: 'discoverycampus.poff.ee',
                // prodId: '//discoverycampus.poff.ee//discamp@Tallinn//EN',
                events: [
                    {
                        start: convert_to_UTC(element.startTime),
                        end: eventend,
                        timestamp: convert_to_UTC(element.startTime),
                        description: element.description,
                        location: element.location && element.location.hall && element.location.hall.cinema ? element.location.hall.cinema.name + `: http://discoverycampus.poff.ee/events/${element.slug}` : undefined,
                        summary: element.title,
                        // organizer: {
                        //     name: 'discamp@Tallinn & Baltic Event',
                        //     email: 'discamp@poff.ee'
                        // }
                    }
                ]
            }).toString())

            allData.push(element)
            if (param_build_type === 'target' && !target_id.includes(element.id.toString())) {
                continue
            } else if (param_build_type === 'target' && target_id.includes(element.id.toString())) {
                console.log('Targeting event ', element.id, target_id)
            }
            generateEventYaml(element, dirSlug);

        } else {
            if ('en' === 'en' && DOMAIN === 'discoverycampus.poff.ee') {
                console.log(`ERROR! discamp event ID ${element.id} missing slug`);
            }
        }
    }


    let dataToYAML = []
    let newDataToYAML = {eventsByDate: {}, allDates:[]}
    if (allData.length) {
        dataToYAML = allData.sort((a, b) => new Date(a.startTime) - new Date(b.startTime))

        Date.prototype.addHours = function(hours) {
            var date = new Date(this.valueOf());
            date.setHours(date.getHours() + hours);
            return date;
        }

        let allDates = dataToYAML.map(event => {
            let dateTimeUTC = convert_to_UTC(event.startTime)
            let dateTimeUTCtoEET = dateTimeUTC.addHours(2)
            let date = dateTimeUTCtoEET.getFullYear()+'-'+(dateTimeUTCtoEET.getMonth()+1)+'-'+(dateTimeUTCtoEET.getDate())
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
        console.log(`${dataToYAML.length} DisCamp Events ready for building`);
    }
    const allDataYAML = yaml.dump(dataToYAML, { 'noRefs': true, 'indent': '4' });
    const yamlPath = path.join(fetchDir, `discampeventscalendar.en.yaml`);
    fs.writeFileSync(yamlPath, allDataYAML, 'utf8');

    const allNewDataYAML = yaml.dump(newDataToYAML, { 'noRefs': true, 'indent': '4' });
    const yamlNewPath = path.join(fetchDir, `discampevents.en.yaml`);
    fs.writeFileSync(yamlNewPath, allNewDataYAML, 'utf8');

    search_and_filters(dataToYAML)

    function search_and_filters(dataToYAML) {

        let filters = {
            types: {},
            categories: {},
            channels: {},
            projects: {},
            persons: {},
            starttimes: {},
        }

        const events_search = dataToYAML.map(events => {

            let event = events
            let types = []
            if (typeof event.project_type !== 'undefined') {
                types.push(event.project_type.type)
                filters.types[event.project_type.type] = event.project_type.type
            }

            let categories = []
            if (typeof event.discamp_categories !== 'undefined') {
                let discamp_categories = event.discamp_categories.map(name => name.name)
                for (const name of discamp_categories) {
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
            if (typeof event.discamp_projects !== 'undefined') {
                let discamp_projects = event.discamp_projects.map(proj => proj.title)
                for (const title of discamp_projects) {
                    projects.push(title)
                    filters.projects[title] = title
                }
            }

            let persons = []
            if (typeof event.discamp_people !== 'undefined') {
                let discamp_people = event.discamp_people.filter(p => p.person).map(pers => `${pers.person.firstName} ${pers.person.lastName}`)
                for (const name of discamp_people) {
                    persons.push(name)
                    filters.persons[name] = name
                }
            }

            let starttimes = []
            if (typeof event.startTime !== 'undefined') {

                Date.prototype.addHours = function(hours) {
                    var date = new Date(this.valueOf());
                    date.setHours(date.getHours() + hours);
                    return date;
                }

                let dateTimeUTC = convert_to_UTC(event.startTime)
                let dateTimeUTCtoEET = dateTimeUTC.addHours(2)
                let date = dateTimeUTCtoEET.getFullYear()+'-'+(dateTimeUTCtoEET.getMonth()+1)+'-'+(dateTimeUTCtoEET.getDate())
                let dateKey = `_${date}`

                starttimes.push(dateKey)
                filters.starttimes[dateKey] = date
            }

            return {
                id: events.id,
                text: [
                    events.title,
                    events.description,
                    types.join(' '),
                    categories.join(' '),
                    channels.join(' '),
                    projects.join(' '),
                    persons.join(' '),
                ].join(' ').toLowerCase(),
                types: types,
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

            sortable = sortable.sort(function(a, b) {
                try {
                    const locale_sort = a[1].localeCompare(b[1], 'en')
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
            types: mSort(filters.types),
            categories: mSort(filters.categories),
            channels: mSort(filters.channels),
            projects: mSort(filters.projects),
            persons: mSort(filters.persons),
            starttimes: mSort(filters.starttimes),
        }

        let searchYAML = yaml.dump(events_search, { 'noRefs': true, 'indent': '4' })
        fs.writeFileSync(path.join(fetchDir, `search_discampeventscalendar.yaml`), searchYAML, 'utf8')

        let filtersYAML = yaml.dump(sorted_filters, { 'noRefs': true, 'indent': '4' })
        fs.writeFileSync(path.join(fetchDir, `filters_discampeventscalendar.yaml`), filtersYAML, 'utf8')

    }
} else {

    let emptyYAML = yaml.dump([], { 'noRefs': true, 'indent': '4' })
    fs.writeFileSync(path.join(fetchDir, `search_discampeventscalendar.yaml`), emptyYAML, 'utf8')
    fs.writeFileSync(path.join(fetchDir, `filters_discampeventscalendar.yaml`), emptyYAML, 'utf8')
    fs.writeFileSync(path.join(fetchDir, `discampeventscalendar.en.yaml`), emptyYAML, 'utf8');
    fs.writeFileSync(path.join(fetchDir, `discampevents.en.yaml`), emptyYAML, 'utf8');

}
function generateEventYaml(element, dirSlug) {
    const oneYaml = yaml.dump(rueten(element, 'en'), { 'noRefs': true, 'indent': '4' });
    const yamlPath = path.join(fetchDataDir, dirSlug, `data.en.yaml`);

    let saveDir = path.join(fetchDataDir, dirSlug);
    fs.mkdirSync(saveDir, { recursive: true });

    fs.writeFileSync(yamlPath, oneYaml, 'utf8');
    fs.writeFileSync(`${saveDir}/index.pug`, `include /_templates/discamp_event_index_template.pug`);
}

