const search_input = document.getElementById('search');
const listLength = document.getElementById('listLengthCount');
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);


const selectors = {
    roleatfilms: document.getElementById('roleatfilms_select'),
    location: document.getElementById('location_select'),
    languages: document.getElementById('languages_select'),
    lookingfor: document.getElementById('lookingfor_select'),
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
    const filters = document.getElementById('filters');
    if (document.readyState === 'complete') {
        urlSelect()
        filters.style.display = "grid"
        loading.style.display = "none"
    }
};

function toggleAll(exclude_selector_name) {
    setSearchParams()

    ids = execute_filters()

    // kuva/peida kassette
    let cards = document.querySelectorAll('[class="profile_card"]')
    listLength.innerHTML = ids.length;
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
                .filter(profiles => {
                    const compare_with = selector_name === 'roleatfilms' ? value : selectors.roleatfilms.value;
                    return compare_with === '' ? true : profiles.roleatfilms.includes(compare_with)
                })
                .filter(profiles => {
                    const compare_with = selector_name === 'location' ? value : selectors.location.value;
                    return compare_with === '' ? true : profiles.location.includes(compare_with)
                })
                .filter(profiles => {
                    const compare_with = selector_name === 'languages' ? value : selectors.languages.value;
                    return compare_with === '' ? true : profiles.languages.includes(compare_with)
                })
                .filter(profiles => {
                    const compare_with = selector_name === 'lookingfor' ? value : selectors.lookingfor.value;
                    return compare_with === '' ? true : profiles.lookingfor.includes(compare_with)
                })
                .filter((profiles) => { return search_input.value ? profiles.text.includes(search_input.value.toLowerCase()) : true })
                .length


            option.disabled = count ? false : true

        }

    }

}

search_input.addEventListener('keyup', e => {
    toggleAll();
});

selectors.roleatfilms.addEventListener('change', e => {
    toggleAll('roleatfilms');
});

selectors.location.addEventListener('change', e => {
    toggleAll('location');
});

selectors.languages.addEventListener('change', e => {
    toggleAll('languages');
});

selectors.lookingfor.addEventListener('change', e => {
    toggleAll('lookingfor');
});

function clear_all() {
    search_input.value = '';
    selectors.roleatfilms.selectedIndex = 0;
    selectors.location.selectedIndex = 0;
    selectors.languages.selectedIndex = 0;
    selectors.lookingfor.selectedIndex = 0;
    toggleAll();
}

function execute_filters() {
    let filtered = searcharray
        .filter(profiles => {
            if (selectors.roleatfilms.value) {
                return profiles.roleatfilms.includes(selectors.roleatfilms.value)
            } else {
                return true
            }
        })
        .filter(profiles => {
            if (selectors.location.value) {
                return profiles.location.includes(selectors.location.value)
            } else {
                return true
            }
        })
        .filter(profiles => {
            if (selectors.languages.value) {
                return profiles.languages.includes(selectors.languages.value)
            } else {
                return true
            }
        })
        .filter(profiles => {
            if (selectors.lookingfor.value) {
                return profiles.lookingfor.includes(selectors.lookingfor.value)
            } else {
                return true
            }
        })
        .filter(profiles => profiles.text.includes(search_input.value.toLowerCase()))
        .map(element => element.id.toString());
    return filtered
}


