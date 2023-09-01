const search_input = document.getElementById('search');
const nonetoshow = document.getElementById('nonetoshow');
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const starttimes = document.getElementsByName('selectedDates');

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

function urlSelect() {
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

function setSearchParams() {
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
    const filters = document.getElementById('filters');
    const date_filters = document.getElementById('date_filters');
    if (document.readyState === 'complete') {
        urlSelect()
        filters.style.display = ""
        date_filters.style.display = ""
        loading.style.display = "none"
        // content.style.display = ""

        for (img of document.images) {
            img_src = img.src || ''
            if (img_src.includes('thumbnail_')) {
                    img.src = img_src.replace('thumbnail_', '')
            }
        }
    }
};

function select_next_or_previous(which, id) {
    var select = document.getElementById(id);
    if (which === '+') {
        select.selectedIndex++;
    } else {
        select.selectedIndex--;
    }
    toggleAll(id);
}

function toggleAll(exclude_selector_name) {
    setSearchParams()

    ids = execute_filters()

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

function toggleFilters(exclude_selector_name) {

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

function unselect_all() {
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

function execute_filters() {
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
});
