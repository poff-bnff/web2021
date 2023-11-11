const eventListInput = document.getElementById('event-list-view-button')
const eventCalendarInput = document.getElementById('event-calendar-view-button')

document.onreadystatechange = async () => {
    const loading = document.getElementById('loading');
    // const content = document.getElementById('content');
    if (document.readyState !== 'complete') {
        loading.style.display = "block"
        return
    }

    loading.style.display = "none"
    // content.style.display = ""

    for (img of document.images) {
        img_src = img.src || ''
        if (img_src.includes('thumbnail_')) {
                img.src = img_src.replace('thumbnail_', '')
        }
    }
    await setupCourseEventFavoriteButtons()
    console.log(`My ${userCourseEvents.length} events:`, userCourseEvents)
    // Hide cards that are not in userCourseEvents
    const currentCourseEventIDs = Array.from(document.getElementById('course_event_ids').value.split(',')).map(id => parseInt(id))
    // console.log(`Current ${currentCourseEventIDs.length} events:`, currentCourseEventIDs)
    const events2remove = currentCourseEventIDs.filter(id => !userCourseEvents.includes(id))
    console.log(`Remove ${events2remove.length} from ${currentCourseEventIDs.length} events`)
    // Remove non-favorite cards and calendar events
    events2remove.forEach(id => {
        // console.log('Removing event:', id)
        document.getElementById(id).parentElement.remove()
        // EventCalendar items are '.ec-event' divs, that are parents of '.single-event' links, that have hrefs with event id
        try {
            document.querySelector(`.ec-event a[href="#eventModal${id}"]`).parentElement.parentElement.remove()
        } catch (error) {
            // console.log(`EventCalendar item with href="#eventModal${id}" not found`)
        }
    })
    // Filter out events, that are not in userCourseEvents
    calendarEventData = calendarEventData.filter(event => userCourseEvents.includes(event.id))
    // Filter out dates, that have no events
    // console.log('Start times:', calendarEventData.map(event => event.start_time))
    const uniqueDates = [...new Set(calendarEventData.map(event => moment.parseZone(new Date(event.start_time)).tz('Europe/Tallinn').format('YYYY-MM-DD')))]
    // console.log('Unique dates:', uniqueDates)
    // remove dates, that have no events: .event-calendar-container with attribute key="_YYYY-MM-DD"
    Object.keys(datesArray).forEach(key => {
        if (!uniqueDates.includes(datesArray[key])) {
            document.querySelector(`.event-calendar-container[key="${key}"]`).remove()
        }
    })
    // datesArray is actually an object, that has dates prefixed with underscores as keys
    datesArray = uniqueDates.reduce((obj, date) => {
        obj[`_${date}`] = date
        return obj
    }, {})

    console.log('datesArray:', datesArray)
// }

// $(document).ready(function () {
    // Disables search input in multiselect


    // Add class to activate event person image animation
    $('.event_person_link').on('mouseleave', function () {
        $(this).addClass('after_hover');

        setTimeout(() => {
            $(this).removeClass('after_hover');
        }, 800);
    });

    // event list buttons
    eventListInput.checked = true;
    if(eventListInput.checked) {
        document.querySelectorAll('.event-calendar-container').forEach(item => {
            item.classList.add('list-view-hidden');
        })
        document.querySelectorAll('.event_card_link').forEach(item => {
            item.classList.remove('list-view-hidden');
        })
    }
    eventListInput.addEventListener('change', () => {
        if(eventListInput.checked) {
            document.querySelectorAll('.event-calendar-container').forEach(item => {
                item.classList.add('list-view-hidden');
            })
            document.querySelectorAll('.event_card_link').forEach(item => {
                item.classList.remove('list-view-hidden');
            })
        }
    })
    eventCalendarInput.addEventListener('change', () => {
        if(eventCalendarInput.checked) {
            document.querySelectorAll('.event_card_link').forEach(item => {
                item.classList.add('list-view-hidden');
            })
            document.querySelectorAll('.event-calendar-container').forEach(item => {
                item.classList.remove('list-view-hidden');
            })
        }
    })

    // event calendar
    let earliestTimePortion = null;
    let latestTimePortion = null;

    for (const date in datesArray) {
        if (datesArray.hasOwnProperty(date)) {
            // Get the value associated with the date key
            const dateValue = datesArray[date];

            // Get the calendar container element by ID
            const calendarContainer = document.getElementById(`ec-${dateValue}`);

            // Initialize variables to track earliest start time and latest end time
            let earliestStartTime = null;
            let latestEndTime = null;
            let eventsForCalendar = [];
            let uniqueEventLocations = [];

            // Loop through events to find the earliest start time and latest end time get locations for matching date
            calendarEventData.forEach(function(event) {
                const eventStartTime = moment.parseZone(new Date(event.start_time)).tz('Europe/Tallinn').format()
                const eventEndTime = moment.parseZone(new Date(event.end_time)).tz('Europe/Tallinn').format()
                if (moment(eventStartTime).isSame(dateValue, 'day') && event.location && event.end_time) {

                    if (earliestStartTime === null || eventStartTime < earliestStartTime) {
                        earliestStartTime = eventStartTime;
                        earliestTimePortion = moment(earliestStartTime).format('HH:mm:ss');
                    }
                    if (latestEndTime === null || eventEndTime > latestEndTime) {
                        latestEndTime = eventEndTime;
                        latestTimePortion = moment(latestEndTime).format('HH:mm:ss');
                    }

                    const eventLocation = event.location;
                    if (eventLocation && !uniqueEventLocations.some(location => location.id === eventLocation.id)) {
                        uniqueEventLocations.push(eventLocation);
                    }


                    // Create events for calendar
                    console.log(`Event ${event.id} start: ${eventStartTime}, end: ${eventEndTime}, title: ${event.title}, location: ${event.location.name}, ical: ${event.calendar_data}`)
                    const singleEventId = event.id
                    const singleEventLocation = event.location.id
                    const singleEventStartTime = eventStartTime
                    const singleEventEndTime = eventEndTime
                    const singleEventTitle = event.title
                    const singleEventICal = event.calendar_data
                    eventsForCalendar.push({
                        id: singleEventId,
                        start: singleEventStartTime,
                        end: singleEventEndTime,
                        resourceId: singleEventLocation, // Event location
                        title: singleEventTitle,
                        extendedProps: {
                        ical: `${singleEventICal}`,
                        },
                    });
                }
            });
            // Calculate firstEventTime and lastEventTime, get eventLocations
            const firstEventTime = earliestTimePortion ? earliestTimePortion : '';
            const lastEventTime = latestTimePortion ? latestTimePortion : '';
            const calendarResources = uniqueEventLocations.map(location => ({
                id: location.id,
                title: location.name,
            }))
            if(calendarResources.length && eventsForCalendar.length) {
                // Initialize the calendar with options
                const ec = new EventCalendar(calendarContainer, {
                    view: 'resourceTimeGridDay',
                    date: dateValue,
                    slotMinTime: firstEventTime,
                    slotMaxTime: lastEventTime,
                    slotEventOverlap: false,
                    slotHeight: 36,
                    firstDay: 1,
                    locale: 'et',
                    allDaySlot: false,
                    titleFormat: function (start, end) {
                    const options = { month: 'short', day: 'numeric' };
                    const formattedDate = start.toLocaleDateString('en-US', options);
                    const formattedWeekday = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(start);
                    return {
                        html: `<div class="calendar-title"><span class="formatted-date">${formattedDate}</span><span class="formatted-weekday">${formattedWeekday}</span><span class="calendar-line"></span></div>`,
                    }
                    },
                    headerToolbar: {
                        start: 'title', center: '', end: ''
                    },
                    resources: calendarResources,
                });
                ec.setOption('eventContent', function (info) {
                    return {
                        html: `<a class="single-event" href='#eventModal${info.event.id}' data-bs-toggle='modal' data-bs-target='#eventModal${info.event.id}'>
                        <div class="ec-event-title">
                        ${info.event.title}
                        </div>
                        ${
                            info.event.extendedProps !== undefined && info.event.extendedProps.ical !== undefined
                            ? `<a class="event-icon" href="data:text/calendar,${info.event.extendedProps.ical}" download="${info.event.title}"><svg width="24" height="25" viewBox="0 0 24 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M19 4.00195H5C3.89543 4.00195 3 4.89738 3 6.00195V20.002C3 21.1065 3.89543 22.002 5 22.002H19C20.1046 22.002 21 21.1065 21 20.002V6.00195C21 4.89738 20.1046 4.00195 19 4.00195Z" stroke="#636769" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M16 2.00195V6.00195" stroke="#636769" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M8 2.00195V6.00195" stroke="#636769" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M3 10.002H21" stroke="#636769" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M12 12.002V20.002" stroke="#636769" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M8 16.002H16" stroke="#636769" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            </a>`
                            : ''
                        }
                        </a>`,
                    };
                })

                ec.setOption('eventStartEditable', false);
                ec.setOption('eventDurationEditable', false);

                // Add events from array
                ec.setOption('events', eventsForCalendar);
                $(document).on('update_events', function(event, ids) {
                    const filteredEvents = eventsForCalendar.filter(event => ids.includes(event.id.toString()))
                    ec.setOption('events', filteredEvents);
                    if (!filteredEvents.length) {
                        $(calendarContainer).parent().addClass('d-none');
                    } else {
                        $(calendarContainer).parent().removeClass('d-none');
                    }
                })
            }
        }
    }
}
// )
