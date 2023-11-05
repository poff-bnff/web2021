const search_input = document.getElementById('search');
const nonetoshow = document.getElementById('nonetoshow');
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const starttimes = document.getElementsByName('selectedDates');
const eventListInput = document.getElementById('event-list-view-button')
const eventCalendarInput = document.getElementById('event-calendar-view-button')

const selectors = {
    categories: document.getElementById('categories_select'),
    // projects: document.getElementById('projects_select'),
    persons: document.getElementById('persons_select'),
    festivaleditions: document.getElementById('festivaleditions_select'),
    eventtypes: document.getElementById('eventtypes_select'),
    eventmodes: document.getElementById('eventmodes_select'),
    isliveevent: document.getElementById('isliveevent_select'),
    eventaccess: document.getElementById('eventaccess_select'),
    location: document.getElementById('location_select'),
}

const urlSelect = () => {
    if (urlParams.getAll.length) {
        for (const [ix, params] of urlParams) {
            const filterValue = decodeURIComponent(params);
            if (selectors[ix]) {
                Array.from(selectors[ix].options).forEach(option => {
                    if (option.innerHTML === filterValue) {
                        option.selected = true;
                    }
                });
                // Trigger change event for select2
                $(selectors[ix]).trigger('change');
            } else if (ix === 'starttimes') {
                document.querySelector(`[name="selectedDates"][value="${filterValue}"]`).checked = true
            }
        }
        toggleAll();
    }
}

const setSearchParams =  () => {
    let urlParameters = new URLSearchParams();

    for (const selector in selectors) {
        if (selectors[selector].selectedOptions.length > 0) {
            Array.from(selectors[selector].selectedOptions).forEach(option => {
                let selectedText = option.innerHTML
                if (option.value) {
                    urlParameters.append(selector, encodeURIComponent(selectedText))
                }
            })
        }
    }

    const selectedStarttimes = Array.from(starttimes).filter(starttime => starttime.checked).map(starttime => starttime.value);

    selectedStarttimes.forEach(starttime => {
        urlParameters.append('starttimes', encodeURIComponent(starttime));
    })

    const urlParametersString = urlParameters.toString();

    let page = `${window.location.protocol}//${window.location.host}${window.location.pathname}`
    if (urlParametersString.length) {
        window.history.pushState('', '', `${page}?${urlParametersString}`);
    } else {
        window.history.pushState('', document.title, page);
    }
}

document.onreadystatechange = () => {
    const loading = document.getElementById('loading');
    // const content = document.getElementById('content');
    const filters = document.querySelector('.search_filters');

    if (document.readyState === 'complete') {
        urlSelect()
        filters.style.display = ""
        loading.style.display = "none"
        // content.style.display = ""

        for (img of document.images) {
            img_src = img.src || ''
            if (img_src.includes('thumbnail_')) {
                    img.src = img_src.replace('thumbnail_', '')
            }
        }
        setupEventFavoriteButtons()
    }
};

const select_next_or_previous = (which, id) => {
    var select = document.getElementById(id);
    if (which === '+') {
        select.selectedIndex++;
    } else {
        select.selectedIndex--;
    }
    toggleAll(id);
}

const toggleAll = (exclude_selector_name) => {
    setSearchParams()

    ids = execute_filters()

    $(document).trigger('update_events', [ids]);


    // kuva/peida 'pole vasteid'
    if (ids.length) {
        nonetoshow.style.display = "none"
    } else {
        nonetoshow.style.display = ""
    }

    // kuva/peida kassette
    let cards = document.querySelectorAll('[class="card_event"]')
    cards.forEach(card => {
        if (ids.includes(card.id)) {
            card.style.display = ""
        } else {
            card.style.display = "none"
        }
    })

    // filtreeri filtreid
    toggleFilters(exclude_selector_name)
}

const toggleFilters = (exclude_selector_name) => {

    if (exclude_selector_name !== 'starttimes') {
        Array.from(starttimes).forEach(starttime => {
            let count = searcharray
                .filter(screening => {
                    const compare_with = selectors.categories.value;
                    return compare_with === '' ? true : screening.categories.includes(compare_with)
                })
                .filter(screening => {
                    const compare_with = selectors.persons.value;
                    return compare_with === '' ? true : screening.persons.includes(compare_with)
                })
                .filter(screening => {
                    const compare_with = selectors.festivaleditions.value;
                    return compare_with === '' ? true : screening.festivaleditions.includes(compare_with)
                })
                .filter(screening => {
                    const compare_with = selectors.eventtypes.value;
                    return compare_with === '' ? true : screening.eventtypes.includes(compare_with)
                })
                .filter(screening => {
                    const compare_with = selectors.eventmodes.value;
                    return compare_with === '' ? true : screening.eventmodes.includes(compare_with)
                })
                .filter(screening => {
                    const compare_with = selectors.isliveevent.value;
                    return compare_with === '' ? true : screening.isliveevent.includes(compare_with)
                })
                .filter(screening => {
                    const compare_with = selectors.eventaccess.value;
                    return compare_with === '' ? true : screening.eventaccess.includes(compare_with)
                })
                .filter(screening => {
                    const compare_with = selectors.location.value;
                    return compare_with === '' ? true : screening.locations.includes(compare_with)
                })
                .filter((screening) => { return search_input.value ? screening.text.includes(search_input.value.toLowerCase()) : true })
                .filter((screening) => { return screening.starttimes.includes(starttime.value) })

            starttime.disabled = count.length === 0? true : false
        });
    }

    for (selector_name in selectors) {

        if (exclude_selector_name === selector_name) {
            continue
        }

        for (const option of selectors[selector_name].options) {
            const value = option.value
            if (value === '') {
                option.disabled = false // garanteerib tyhivaliku olemasolu
                continue
            }

            let count = searcharray
                .filter(screening => {
                    const compare_with = selector_name === 'categories' ? value : selectors.categories.value;
                    return compare_with === '' ? true : screening.categories.includes(compare_with)
                })
                // .filter(screening => {
                //     const compare_with = selector_name === 'projects' ? value : selectors.projects.value;
                //     return compare_with === '' ? true : screening.projects.includes(compare_with)
                // })
                .filter(screening => {
                    const compare_with = selector_name === 'persons' ? value : selectors.persons.value;
                    return compare_with === '' ? true : screening.persons.includes(compare_with)
                })
                .filter(screening => {
                    const compare_with = Array.from(starttimes).filter(starttime => starttime.checked).map(starttime => starttime.value);
                    return compare_with.length === 0 ? true : screening.starttimes.some(screening_starttime => compare_with.includes(screening_starttime))
                })
                .filter(screening => {
                    const compare_with = selector_name === 'festivaleditions' ? value : selectors.festivaleditions.value;
                    return compare_with === '' ? true : screening.festivaleditions.includes(compare_with)
                })
                .filter(screening => {
                    const compare_with = selector_name === 'eventtypes' ? value : selectors.eventtypes.value;
                    return compare_with === '' ? true : screening.eventtypes.includes(compare_with)
                })
                .filter(screening => {
                    const compare_with = selector_name === 'eventmodes' ? value : selectors.eventmodes.value;
                    return compare_with === '' ? true : screening.eventmodes.includes(compare_with)
                })
                .filter(screening => {
                    const compare_with = selector_name === 'isliveevent' ? value : selectors.isliveevent.value;
                    return compare_with === '' ? true : screening.isliveevent.includes(compare_with)
                })
                .filter(screening => {
                    const compare_with = selector_name === 'eventaccess' ? value : selectors.eventaccess.value;
                    return compare_with === '' ? true : screening.eventaccess.includes(compare_with)
                })
                .filter(screening => {
                    const compare_with = selector_name === 'location' ? value : selectors.location.value;
                    return compare_with === '' ? true : screening.locations.includes(compare_with)
                })
                .filter((screening) => { return search_input.value ? screening.text.includes(search_input.value.toLowerCase()) : true })
                .length

            option.disabled = count ? false : true
        }
    }
}

search_input.addEventListener('keyup', e => {
    toggleAll();
});

Array.from(starttimes).forEach(starttime => starttime.addEventListener('change', e => {
    toggleAll('starttimes');
}));

$(selectors.categories).on('change', e => {
    toggleAll('categories');
});

// selectors.projects.addEventListener('change', e => {
//     toggleAll('projects');
// });

$(selectors.persons).on('change', e => {
    toggleAll('persons');
});

$(selectors.festivaleditions).on('change', e => {
    toggleAll('festivaleditions');
});

$(selectors.eventtypes).on('change', e => {
    toggleAll('eventtypes');
});

$(selectors.eventmodes).on('change', e => {
    toggleAll('eventmodes');
});

$(selectors.isliveevent).on('change', e => {
    toggleAll('isliveevent');
});

$(selectors.eventaccess).on('change', e => {
    toggleAll('eventaccess');
});

$(selectors.location).on('change', e => {
    toggleAll('location');
});

const unselect_all = () => {
    search_input.value = '';
    Array.from(starttimes).forEach((starttime) => starttime.checked = false);
    $(selectors.categories).val(null).trigger('change');
    // selectors.projects.selectedIndex = 0;
    selectors.persons.selectedIndex = 0;
    selectors.festivaleditions.selectedIndex = 0;
    selectors.eventtypes.selectedIndex = 0;
    selectors.eventmodes.selectedIndex = 0;
    selectors.isliveevent.selectedIndex = 0;
    selectors.eventaccess.selectedIndex = 0;
    selectors.location.selectedIndex = 0;
    nonetoshow.selectedIndex = 0;
    toggleAll();
}

const toggle_filters = () => {
    document.querySelector('.mobile_filters_collapse').classList.toggle('open');
}

const execute_filters = () => {
    let filtered = searcharray
        .filter(screening => {
            if (selectors.categories.value) {
                const selected_categories = Array.from(selectors.categories).filter(category => category.selected).map(category => category.value);
                return screening.categories.some(screening_category => selected_categories.includes(screening_category))
            } else {
                return true
            }
        })
        // .filter(screening => {
        //     if (selectors.projects.value) {
        //         return screening.projects.includes(selectors.projects.value)
        //     } else {
        //         return true
        //     }
        // })
        .filter(screening => {
            if (selectors.persons.value) {
                return screening.persons.includes(selectors.persons.value)
            } else {
                return true
            }
        })
        .filter(screening => {
            const selected_starttimes = Array.from(starttimes).filter(starttime => starttime.checked).map(starttime => starttime.value);
            if (selected_starttimes.length > 0) {
                return screening.starttimes.some(screening_starttime => selected_starttimes.includes(screening_starttime))
            } else {
                return true
            }
        })
        .filter(screening => {
            if (selectors.festivaleditions.value) {
                return screening.festivaleditions.includes(selectors.festivaleditions.value)
            } else {
                return true
            }
        })
        .filter(screening => {
            if (selectors.eventtypes.value) {
                return screening.eventtypes.includes(selectors.eventtypes.value)
            } else {
                return true
            }
        })
        .filter(screening => {
            if (selectors.eventmodes.value) {
                return screening.eventmodes.includes(selectors.eventmodes.value)
            } else {
                return true
            }
        })
        .filter(screening => {
            if (selectors.isliveevent.value) {
                return screening.isliveevent.includes(selectors.isliveevent.value)
            } else {
                return true
            }
        })
        .filter(screening => {
            if (selectors.eventaccess.value) {
                return screening.eventaccess.includes(selectors.eventaccess.value)
            } else {
                return true
            }
        })
        .filter(screening => {
            if (selectors.location.value) {
                return screening.locations.includes(selectors.location.value)
            } else {
                return true
            }
        })
        .filter(screening => screening.text.includes(search_input.value.toLowerCase()))
        .map(element => element.id.toString());
    // console.log(filtered);
    // console.log(filtered.map(element => element.id));
    return filtered
}

$(document).ready(function () {
    // Disables search input in multiselect
    const overrideSelect2MultiselectLabel = (element) => {
        const selection = element.siblings("span.select2").find("ul");
        const count = element.select2('data').length;

        const label = element.attr("data-placeholder");
        selection.html(`<li>${label}${count > 0 ? ` (${count})` : ''}</li>`);
    };

    $(".select2-multiple").each(function () {
        $(this).select2({
            multiple: true,
            minimumResultsForSearch: -1,
            width: "100%",
            dropdownAutoWidth: true,
            closeOnSelect: false,
        });

        overrideSelect2MultiselectLabel($(this));
    });

    $('.select2-single').select2({
        minimumResultsForSearch: -1,
        width: "100%",
        dropdownAutoWidth: true,
    });

    $(".select2-multiple").on(
        "change select2:close select2:select select2:unselect select2:clear",
        function () {
            overrideSelect2MultiselectLabel($(this));
        }
    );

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
});

// Event favorite buttons
const setupEventFavoriteButtons = () => {
    const nslButtons = Array.from(document.querySelectorAll('.notsavedevent'))
    const slButtons = Array.from(document.querySelectorAll('.issavedevent'))
    const allEventIds = Array.from(document.getElementById('course_event_ids').value.split(','))
        .map(e => parseInt(e))

    if (getUser()) {
        nslButtons.forEach(button => { button.classList.add('d-none') })
        slButtons.forEach(button => { button.classList.add('d-none') })
        const myCourseEvents = reloadUserCourseEvents()

        nslButtons.forEach(button => { // event ID is in attribute 'course_event_id'
            const eventId = parseInt(button.getAttribute('course_event_id'))
            if (myCourseEvents.includes(eventId)) {
                button.classList.add('d-none')
            } else {
                button.classList.remove('d-none')
            }
        })
        slButtons.forEach(button => { // event ID is in attribute 'course_event_id'
            const eventId = parseInt(button.getAttribute('course_event_id'))
            if (myCourseEvents.includes(eventId)) {
                button.classList.remove('d-none')
            } else {
                button.classList.add('d-none')
            }
        })
    }
}
