const search_input = document.getElementById('search');
const nonetoshow = document.getElementById('nonetoshow');
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);


const selectors = {
    types: document.getElementById('types_select'),
    languages: document.getElementById('languages_select'),
    countries: document.getElementById('countries_select'),
    statuses: document.getElementById('statuses_select'),
    genres: document.getElementById('genres_select'),
    editions: document.getElementById('editions_select'),
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
    let cards = document.querySelectorAll('[class="card_project"]')
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
                .filter(screening => {
                    const compare_with = selector_name === 'types' ? value : selectors.types.value;
                    return compare_with === '' ? true : screening.types.includes(compare_with)
                })
                .filter(screening => {
                    const compare_with = selector_name === 'languages' ? value : selectors.languages.value;
                    return compare_with === '' ? true : screening.languages.includes(compare_with)
                })
                .filter(screening => {
                    const compare_with = selector_name === 'countries' ? value : selectors.countries.value;
                    return compare_with === '' ? true : screening.countries.includes(compare_with)
                })
                .filter(screening => {
                    const compare_with = selector_name === 'statuses' ? value : selectors.statuses.value;
                    return compare_with === '' ? true : screening.statuses.includes(compare_with)
                })
                .filter(screening => {
                    const compare_with = selector_name === 'genres' ? value : selectors.genres.value;
                    return compare_with === '' ? true : screening.genres.includes(compare_with)
                })
                .filter(screening => {
                    const compare_with = selector_name === 'editions' ? value : selectors.editions.value;
                    return compare_with === '' ? true : screening.editions.includes(compare_with)
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

selectors.types.addEventListener('change', e => {
    toggleAll('types');
});

selectors.languages.addEventListener('change', e => {
    toggleAll('languages');
});

selectors.countries.addEventListener('change', e => {
    toggleAll('countries');
});

selectors.statuses.addEventListener('change', e => {
    toggleAll('statuses');
});

selectors.genres.addEventListener('change', e => {
    toggleAll('genres');
});

selectors.editions.addEventListener('change', e => {
    toggleAll('editions');
});

function unselect_all() {
    search_input.value = '';
    selectors.types.selectedIndex = 0;
    selectors.languages.selectedIndex = 0;
    selectors.countries.selectedIndex = 0;
    selectors.statuses.selectedIndex = 0;
    selectors.genres.selectedIndex = 0;
    selectors.editions.selectedIndex = 0;
    nonetoshow.selectedIndex = 0;
    toggleAll();
}

function execute_filters() {
    let filtered = searcharray
        .filter(screening => {
            if (selectors.types.value) {
                return screening.types.includes(selectors.types.value)
            } else {
                return true
            }
        })
        .filter(screening => {
            if (selectors.languages.value) {
                return screening.languages.includes(selectors.languages.value)
            } else {
                return true
            }
        })
        .filter(screening => {
            if (selectors.countries.value) {
                return screening.countries.includes(selectors.countries.value)
            } else {
                return true
            }
        })
        .filter(screening => {
            if (selectors.statuses.value) {
                return screening.statuses.includes(selectors.statuses.value)
            } else {
                return true
            }
        })
        .filter(screening => {
            if (selectors.genres.value) {
                return screening.genres.includes(selectors.genres.value)
            } else {
                return true
            }
        })
        .filter(screening => {
            if (selectors.editions.value) {
                return screening.editions.includes(selectors.editions.value)
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


