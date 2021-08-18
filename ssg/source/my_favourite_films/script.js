const search_input = document.getElementById('search');
const nonetoshow = document.getElementById('nonetoshow');
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
var pageLoaded = false

if (!validToken) {
    window.open(`${location.origin}/${langpath}login`, '_self')
    saveUrl()
}

const selectors = {
    programmes: document.getElementById('programmes_select'),
    languages: document.getElementById('languages_select'),
    countries: document.getElementById('countries_select'),
    subtitles: document.getElementById('subtitles_select'),
    premieretypes: document.getElementById('premieretypes_select'),
    towns: document.getElementById('towns_select'),
    cinemas: document.getElementById('cinemas_select')
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

    if (userProfile && userProfile.my_films && userProfile.my_films.length) {
        var PrepareUserMyFilmsIds = userProfile.my_films
            .filter(myFavoriteLists => myFavoriteLists.type === "favorite")
            .map(myFilms => myFilms.cassettes)
            .flat()
            .map(cassette => cassette.id.toString())
        var userMyFilmsIds = [...new Set(PrepareUserMyFilmsIds)]
        var allIds = execute_filters()
        ids = allIds.filter(id => userMyFilmsIds.includes(id))
        console.log('MyFilmsIDs', {userMyFilmsIds}, {allIds}, {ids});
    } else {
        console.log('Show all films because no user');
        ids = execute_filters()
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
        // console.log(typeof ids[0], ' - ',typeof card.id);
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
        // console.log(exclude_selector_name, ' - ', selector_name);

        if (exclude_selector_name === selector_name) {
            continue
        }

        for (const option of selectors[selector_name].options) {
            const value = option.value
            if (value === '') {
                option.disabled = false // garanteerib tyhivaliku olemasolu
                continue
            }

            // console.log(`value is this '${value}' - ${typeof value}`);
            let count = searcharray
                .filter(cassette => {
                    const compare_with = selector_name === 'programmes' ? value : selectors.programmes.value;
                    return compare_with === '' ? true : cassette.programmes.includes(compare_with)
                })
                .filter(cassette => {
                    const compare_with = selector_name === 'languages' ? value : selectors.languages.value;
                    return compare_with === '' ? true : cassette.languages.includes(compare_with)
                })
                .filter(cassette => {
                    const compare_with = selector_name === 'countries' ? value : selectors.countries.value;
                    return compare_with === '' ? true : cassette.countries.includes(compare_with)
                })
                .filter(cassette => {
                    const compare_with = selector_name === 'subtitles' ? value : selectors.subtitles.value;
                    return compare_with === '' ? true : cassette.subtitles.includes(compare_with)
                })
                .filter(cassette => {
                    const compare_with = selector_name === 'towns' ? value : selectors.towns.value;
                    return compare_with === '' ? true : cassette.towns.includes(compare_with)
                })
                .filter(cassette => {
                    const compare_with = selector_name === 'cinemas' ? value : selectors.cinemas.value;
                    return compare_with === '' ? true : cassette.cinemas.includes(compare_with)
                })
                .filter(cassette => {
                    const compare_with = selector_name === 'premieretypes' ? value : selectors.premieretypes.value;
                    return compare_with === '' ? true : cassette.premieretypes.includes(compare_with)
                })

                .filter((cassette) => { return search_input.value ? cassette.text.includes(search_input.value.toLowerCase()) : true })
                .length
            // .filter((cassette) => { return selectors.countries.value ? cassette.countries.includes(selectors.countries.value) : true })
            // .filter((cassette) => { return selectors.subtitles.value ? cassette.subtitles.includes(selectors.subtitles.value) : true })
            // .filter((cassette) => { return selectors.towns.value ? cassette.towns.includes(selectors.towns.value) : true })
            // .filter((cassette) => { return selectors.cinemas.value ? cassette.cinemas.includes(selectors.cinemas.value) : true })
            // .filter((cassette) => { return selectors.premieretypes.value ? cassette.premieretypes.includes(selectors.premieretypes.value) : true })
            // .filter((cassette) => { return search_input.value ? cassette.text.includes(search_input.value.toLowerCase()) : true })
            // option.innerHTML += `${count} ${value}`
            option.disabled = count ? false : true

        }

    }

    // console.log(programmes.options.value);

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

function unselect_all() {
    search_input.value = '';
    selectors.programmes.selectedIndex = 0;
    selectors.languages.selectedIndex = 0;
    selectors.countries.selectedIndex = 0;
    selectors.subtitles.selectedIndex = 0;
    selectors.premieretypes.selectedIndex = 0;
    selectors.towns.selectedIndex = 0;
    selectors.cinemas.selectedIndex = 0;
    nonetoshow.selectedIndex = 0;
    toggleAll(execute_filters());
}

function execute_filters() {
    let filtered = searcharray
        .filter(cassette => {
            if (selectors.programmes.value) {
                return cassette.programmes.includes(selectors.programmes.value)
            } else {
                return true
            }
        })
        .filter(cassette => {
            if (selectors.languages.value) {
                return cassette.languages.includes(selectors.languages.value)
            } else {
                return true
            }
        })
        .filter(cassette => {
            if (selectors.countries.value) {
                return cassette.countries.includes(selectors.countries.value)
            } else {
                return true
            }
        })
        .filter(cassette => {
            if (selectors.subtitles.value) {
                return cassette.subtitles.includes(selectors.subtitles.value)
            } else {
                return true
            }
        })
        .filter(cassette => {
            if (selectors.premieretypes.value) {
                return cassette.premieretypes.includes(selectors.premieretypes.value)
            } else {
                return true
            }
        })
        .filter(cassette => {
            if (selectors.towns.value) {
                return cassette.towns.includes(selectors.towns.value)
            } else {
                return true
            }
        })
        .filter(cassette => {
            if (selectors.cinemas.value) {
                return cassette.cinemas.includes(selectors.cinemas.value)
            } else {
                return true
            }
        })
        .filter(cassette => cassette.text.includes(search_input.value.toLowerCase()))
        .map(element => element.id.toString());
    // console.log(filtered);
    // console.log(filtered.map(element => element.id));
    return filtered
}

// console.log('foo'.includes(undefined));


