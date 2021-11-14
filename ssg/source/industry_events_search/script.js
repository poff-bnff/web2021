const search_input = document.getElementById('search');
const nonetoshow = document.getElementById('nonetoshow');
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);

const selectors = {
    // types: document.getElementById('types_select'),
    locations: document.getElementById('locations_select'),
    modes: document.getElementById('modes_select'),
    publics: document.getElementById('publics_select'),
    lives: document.getElementById('lives_select'),
    categories: document.getElementById('categories_select'),
    // channels: document.getElementById('channels_select'),
    // projects: document.getElementById('projects_select'),
    persons: document.getElementById('persons_select'),
    starttimes: document.getElementById('starttimes_select'),
}

function urlSelect() {
    if (urlParams.getAll.length) {
        for (const [ix, params] of urlParams) {
            if (selectors[ix]) {
                for (const option of selectors[ix].options) {
                    if (option.innerHTML === params) {
                        selectors[ix].value = option.value
                        // If selector is date selector, modify buttons as well
                        if(selectors[ix].id === 'starttimes_select') {
                            console.log('Tere ', selectors[ix].value, selectors[ix], option.value);
                            calendarButtonSelector(option.value.slice(-2))
                        }
                    }
                }
            }
        }
        toggleAll();
    }
}

function setSearchParams() {
    let urlParameters = ''
    let firstParamDone = false
    for (const selector in selectors) {
        if (selectors[selector].selectedIndex !== 0) {
            let selectedText = selectors[selector].options[selectors[selector].selectedIndex].innerHTML
            urlParameters += !firstParamDone ? `?${selector}=${selectedText}` : `&${selector}=${selectedText}`
            firstParamDone = true
        }
    }

    let page = `${window.location.protocol}//${window.location.host}${window.location.pathname}`
    if (urlParameters.length) {
        window.history.pushState('', '', `${page}${urlParameters}`);
    } else {
        window.history.pushState('', document.title, page);
    }
}

function calendarButtonSelector(calendarDate) {
    var calendarButtons = document.querySelectorAll('[id^="calendarBtnNov"]');

    for (var i = 0; i < calendarButtons.length; i++) {
        if (calendarButtons[i].id === `calendarBtnNov${calendarDate}`) {
            const thisElementClasses = [...calendarButtons[i].classList]
            console.log('thisElementClasses', thisElementClasses);
            if (thisElementClasses.includes('selected_button')) {
                calendarButtons[i].classList.remove('selected_button')
                console.log(calendarButtons[i].id, 'unselected active');
                selectors.starttimes.value = ``
            } else {
                calendarButtons[i].classList.add('selected_button')
                console.log(calendarButtons[i].id, 'selected');
                selectors.starttimes.value = `_2021-11-${calendarDate}`
            }
        } else {
            calendarButtons[i].classList.remove('selected_button')
            console.log(calendarButtons[i].id, 'UNselected');
        }
    }
    toggleAll();
}

document.onreadystatechange = () => {
    const loading = document.getElementById('loading');
    // const content = document.getElementById('content');
    const filters = document.getElementById('filters');
    if (document.readyState === 'complete') {
        urlSelect()
        filters.style.display = "grid"
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
        nonetoshow.style.display = "grid"
    }

    // kuva/peida kassette
    let cards = document.querySelectorAll('[class="card_event"]')
    cards.forEach(card => {
        if (ids.includes(card.id)) {
            card.style.display = "grid"
        } else {
            card.style.display = "none"
        }
    })

    // filtreeri filtreid
    toggleFilters(exclude_selector_name)
}

function toggleFilters(exclude_selector_name) {

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
                // .filter(screening => {
                //     const compare_with = selector_name === 'types' ? value : selectors.types.value;
                //     return compare_with === '' ? true : screening.types.includes(compare_with)
                // })
                .filter(screening => {
                    const compare_with = selector_name === 'locations' ? value : selectors.locations.value;
                    return compare_with === '' ? true : screening.locations.includes(compare_with)
                })
                .filter(screening => {
                    const compare_with = selector_name === 'modes' ? value : selectors.modes.value;
                    return compare_with === '' ? true : screening.modes.includes(compare_with)
                })
                .filter(screening => {
                    const compare_with = selector_name === 'publics' ? value : selectors.publics.value;
                    return compare_with === '' ? true : screening.publics.includes(compare_with)
                })
                .filter(screening => {
                    const compare_with = selector_name === 'lives' ? value : selectors.lives.value;
                    return compare_with === '' ? true : screening.lives.includes(compare_with)
                })

                .filter(screening => {
                    const compare_with = selector_name === 'categories' ? value : selectors.categories.value;
                    return compare_with === '' ? true : screening.categories.includes(compare_with)
                })
                // .filter(screening => {
                //     const compare_with = selector_name === 'channels' ? value : selectors.channels.value;
                //     return compare_with === '' ? true : screening.channels.includes(compare_with)
                // })
                // .filter(screening => {
                //     const compare_with = selector_name === 'projects' ? value : selectors.projects.value;
                //     return compare_with === '' ? true : screening.projects.includes(compare_with)
                // })
                .filter(screening => {
                    const compare_with = selector_name === 'persons' ? value : selectors.persons.value;
                    return compare_with === '' ? true : screening.persons.includes(compare_with)
                })
                .filter(screening => {
                    const compare_with = selector_name === 'starttimes' ? value : selectors.starttimes.value;
                    return compare_with === '' ? true : screening.starttimes.includes(compare_with)
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

// selectors.types.addEventListener('change', e => {
//     toggleAll('types');
// });

selectors.locations.addEventListener('change', e => {
    toggleAll('locations');
});
selectors.modes.addEventListener('change', e => {
    toggleAll('modes');
});
selectors.publics.addEventListener('change', e => {
    toggleAll('publics');
});
selectors.lives.addEventListener('change', e => {
    toggleAll('lives');
});

selectors.categories.addEventListener('change', e => {
    toggleAll('categories');
});

// selectors.channels.addEventListener('change', e => {
//     toggleAll('channels');
// });

// selectors.projects.addEventListener('change', e => {
//     toggleAll('projects');
// });

selectors.persons.addEventListener('change', e => {
    toggleAll('persons');
});

selectors.starttimes.addEventListener('change', e => {
    // If date selected, toggle buttons
    if(selectors.starttimes.value !== '') {
        calendarButtonSelector(selectors.starttimes.value.slice(-2))
    }
    toggleAll('starttimes');
});

function unselect_all() {
    search_input.value = '';
    // selectors.types.selectedIndex = 0;
    selectors.locations.selectedIndex = 0;
    selectors.modes.selectedIndex = 0;
    selectors.publics.selectedIndex = 0;
    selectors.lives.selectedIndex = 0;
    selectors.categories.selectedIndex = 0;
    // selectors.channels.selectedIndex = 0;
    // selectors.projects.selectedIndex = 0;
    selectors.persons.selectedIndex = 0;
    selectors.starttimes.selectedIndex = 0;
    nonetoshow.selectedIndex = 0;

    // Reset calendar buttons
    calendarButtonSelector()

    toggleAll();
}

function execute_filters() {
    let filtered = searcharray
        // .filter(screening => {
        //     if (selectors.types.value) {
        //         return screening.types.includes(selectors.types.value)
        //     } else {
        //         return true
        //     }
        // })
        .filter(screening => {
            if (selectors.locations.value) {
                return screening.locations.includes(selectors.locations.value)
            } else {
                return true
            }
        })
        .filter(screening => {
            if (selectors.modes.value) {
                return screening.modes.includes(selectors.modes.value)
            } else {
                return true
            }
        })
        .filter(screening => {
            if (selectors.publics.value) {
                return screening.publics.includes(selectors.publics.value)
            } else {
                return true
            }
        })
        .filter(screening => {
            if (selectors.lives.value) {
                return screening.lives.includes(selectors.lives.value)
            } else {
                return true
            }
        })
        .filter(screening => {
            if (selectors.categories.value) {
                return screening.categories.includes(selectors.categories.value)
            } else {
                return true
            }
        })
        // .filter(screening => {
        //     if (selectors.channels.value) {
        //         return screening.channels.includes(selectors.channels.value)
        //     } else {
        //         return true
        //     }
        // })
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
            if (selectors.starttimes.value) {
                return screening.starttimes.includes(selectors.starttimes.value)
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


