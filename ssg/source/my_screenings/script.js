const search_input = document.getElementById('search');
const nonetoshow = document.getElementById('nonetoshow');
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
var pageLoaded = false

if (!isUserTokenValid()) {
    window.open(`${location.origin}/${langpath}login`, '_self')
    savePreLoginUrl()
}

const selectors = {
    programmes: document.getElementById('programmes_select'),
    languages: document.getElementById('languages_select'),
    countries: document.getElementById('countries_select'),
    subtitles: document.getElementById('subtitles_select'),
    premieretypes: document.getElementById('premieretypes_select'),
    towns: document.getElementById('towns_select'),
    cinemas: document.getElementById('cinemas_select'),
    dates: document.getElementById('dates_select'),
    times: document.getElementById('times_select')
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

function toggleAll(exclude_selector_name) {
    setSearchParams()
    // Kui on kasutaja profiilis lemmikseansid, siis kuvab pärast filtreid järelejäänud seansse nende alusel
    if (userProfile && userProfile.My.screenings && userProfile.My.screenings.length) {
        var userMyScreeningsIds = getUniqueFavoritesArray(userProfile.My.screenings, 'schedule', 'screenings')
        var allIds = execute_filters()
        ids = allIds.filter(id => userMyScreeningsIds.includes(id))
    } else {
        ids = []
    }

    // kuva/peida 'pole vasteid'
    if (ids.length) {
        nonetoshow.style.display = "none"
    } else {
        nonetoshow.style.display = "grid"
    }

    // kuva/peida kassette
    let cards = document.querySelectorAll('[class="card_film"]')
    cards.forEach(card => {
        if (ids.includes(card.id)) {
            card.style.display = "grid"
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
                    const compare_with = selector_name === 'programmes' ? value : selectors.programmes.value;
                    return compare_with === '' ? true : screening.programmes.includes(compare_with)
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
                    const compare_with = selector_name === 'subtitles' ? value : selectors.subtitles.value;
                    return compare_with === '' ? true : screening.subtitles.includes(compare_with)
                })
                .filter(screening => {
                    const compare_with = selector_name === 'towns' ? value : selectors.towns.value;
                    return compare_with === '' ? true : screening.towns.includes(compare_with)
                })
                .filter(screening => {
                    const compare_with = selector_name === 'cinemas' ? value : selectors.cinemas.value;
                    return compare_with === '' ? true : screening.cinemas.includes(compare_with)
                })
                .filter(screening => {
                    const compare_with = selector_name === 'premieretypes' ? value : selectors.premieretypes.value;
                    return compare_with === '' ? true : screening.premieretypes.includes(compare_with)
                })
                .filter(screening => {
                    const compare_with = selector_name === 'dates' ? value : selectors.dates.value;
                    return compare_with === '' ? true : screening.dates.includes(compare_with)
                })
                .filter(screening => {
                    const compare_with = selector_name === 'times' ? value : selectors.times.value;
                    return compare_with === '' ? true : screening.times.includes(compare_with)
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

selectors.programmes.addEventListener('change', e => {
    toggleAll('programmes');
});

selectors.languages.addEventListener('change', e => {
    toggleAll('languages');
});

selectors.countries.addEventListener('change', e => {
    toggleAll('countries');
});

selectors.subtitles.addEventListener('change', e => {
    toggleAll('subtitles');
});

selectors.premieretypes.addEventListener('change', e => {
    toggleAll('premieretypes');
});

selectors.towns.addEventListener('change', e => {
    toggleAll('towns');
});

selectors.cinemas.addEventListener('change', e => {
    toggleAll('cinemas');
});

selectors.dates.addEventListener('change', e => {
    toggleAll('dates');
});

selectors.times.addEventListener('change', e => {
    toggleAll('times');
});

function unselect_all() {
    search_input.value = '';
    selectors.programmes.selectedIndex = 0;
    selectors.languages.selectedIndex = 0;
    selectors.countries.selectedIndex = 0;
    selectors.subtitles.selectedIndex = 0;
    selectors.premieretypes.selectedIndex = 0;
    selectors.towns.selectedIndex = 0;
    selectors.cinemas.selectedIndex = 0;
    selectors.dates.selectedIndex = 0;
    selectors.times.selectedIndex = 0;
    nonetoshow.selectedIndex = 0;
    toggleAll();
}

function execute_filters() {
    let filtered = searcharray
        .filter(screening => {
            if (selectors.programmes.value) {
                return screening.programmes.includes(selectors.programmes.value)
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
            if (selectors.subtitles.value) {
                return screening.subtitles.includes(selectors.subtitles.value)
            } else {
                return true
            }
        })
        .filter(screening => {
            if (selectors.premieretypes.value) {
                return screening.premieretypes.includes(selectors.premieretypes.value)
            } else {
                return true
            }
        })
        .filter(screening => {
            if (selectors.towns.value) {
                return screening.towns.includes(selectors.towns.value)
            } else {
                return true
            }
        })
        .filter(screening => {
            if (selectors.cinemas.value) {
                return screening.cinemas.includes(selectors.cinemas.value)
            } else {
                return true
            }
        })
        .filter(screening => {
            if (selectors.dates.value) {
                return screening.dates.includes(selectors.dates.value)
            } else {
                return true
            }
        })
        .filter(screening => {
            if (selectors.times.value) {
                return screening.times.includes(selectors.times.value)
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
