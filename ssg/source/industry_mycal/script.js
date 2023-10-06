const search_input = document.getElementById('search');
const nonetoshow = document.getElementById('nonetoshow');
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
var pageLoaded = false

requireLogin()

const selectors = {
    categories: document.getElementById('categories_select'),
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
            urlParameters += !firstParamDone ? `?${selector}=${encodeURIComponent(selectedText)}` : `&${selector}=${encodeURIComponent(selectedText)}`
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

document.onreadystatechange = () => {
    if (document.readyState === 'complete') {
        pageLoaded = true
        pageLoadingAndUserProfileFetched()
    }
};


function pageLoadingAndUserProfileFetched() {
    if (!pageLoaded || !userProfileHasBeenLoaded) { return false }
    const loading = document.getElementById('loading');
    // const content = document.getElementById('content');
    const filters = document.getElementById('filters');
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
}

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

    if (userProfile && userProfile.My.course_events && userProfile.My.course_events.length) {
        var userMyCalendarIds = getUniqueFavoritesArray(userProfile.My.course_events, 'schedule', 'industry_events')
        var allIds = execute_filters()
        var ids = allIds.filter(id => userMyCalendarIds.includes(id))
    } else {
        var ids = []
    }

    console.log('ids', ids);

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
    toggleFilters(exclude_selector_name, ids)
}

function toggleFilters(exclude_selector_name, ids) {

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
                    const compare_with = selector_name === 'starttimes' ? value : selectors.starttimes.value;
                    return compare_with === '' ? true : screening.starttimes.includes(compare_with)
                })
                .filter((screening) => { return search_input.value ? screening.text.includes(search_input.value.toLowerCase()) : true })
                .filter((screening) => { return ids && ids.length ? ids.includes(screening.id.toString()) : false })
                .length


            option.disabled = count ? false : true

        }

    }

}

search_input.addEventListener('keyup', e => {
    toggleAll();
});

selectors.categories.addEventListener('change', e => {
    toggleAll('categories');
});

// selectors.projects.addEventListener('change', e => {
//     toggleAll('projects');
// });

selectors.persons.addEventListener('change', e => {
    toggleAll('persons');
});

selectors.starttimes.addEventListener('change', e => {
    toggleAll('starttimes');
});

function unselect_all() {
    search_input.value = '';
    selectors.categories.selectedIndex = 0;
    // selectors.projects.selectedIndex = 0;
    selectors.persons.selectedIndex = 0;
    selectors.starttimes.selectedIndex = 0;
    nonetoshow.selectedIndex = 0;
    toggleAll();
}

function execute_filters() {
    let filtered = searcharray
        .filter(screening => {
            if (selectors.categories.value) {
                return screening.categories.includes(selectors.categories.value)
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
    console.log('Filtered', filtered);
    return filtered
}


