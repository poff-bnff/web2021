const search_input = document.getElementById('search');
const nonetoshow = document.getElementById('nonetoshow');
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);


const selectors = {
    programmes: document.getElementById('programmes_select'),
    languages: document.getElementById('languages_select'),
    countries: document.getElementById('countries_select'),
    subtitles: document.getElementById('subtitles_select'),
    premieretypes: document.getElementById('premieretypes_select'),
    filmtypes: document.getElementById('filmtypes_select'),
    genres: document.getElementById('genres_select'),
    keywords: document.getElementById('keywords_select'),
    towns: document.getElementById('towns_select'),
    cinemas: document.getElementById('cinemas_select'),
    dates: document.getElementById('dates_select'),
    timesFrom: document.getElementById('timesFrom_select'),
    timesTo: document.getElementById('timesTo_select')
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
        setupScreeningFavoriteButtons()
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

    ids = execute_filters()

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
                .filter(cassette => {
                    const compare_with = selector_name === 'filmtypes' ? value : selectors.filmtypes.value;
                    return compare_with === '' ? true : cassette.filmtypes.includes( compare_with )
                })
                .filter(cassette => {
                    const compare_with = selector_name === 'genres' ? value : selectors.genres.value;
                    return compare_with === '' ? true : cassette.genres.includes( compare_with )
                })
                .filter(cassette => {
                    const compare_with = selector_name === 'keywords' ? value : selectors.keywords.value;
                    return compare_with === '' ? true : cassette.keywords.includes( compare_with )
                })
                .filter(screening => {
                    const compare_with = selector_name === 'dates' ? value : selectors.dates.value;
                    return compare_with === '' ? true : screening.dates.includes(compare_with)
                })
                // Kommenteeritud, sest 'Alates' ja 'Kuni' filtrid hakkavad teineteist tühistama 
                // .filter(screening => {
                //     const compare_with = selector_name === 'timesFrom' ? value : selectors.timesFrom.value;

                //     if (compare_with === '') {
                //         return true;
                //     }
                //     else {
                //         return screening.times.some((time) => time >= compare_with) 
                //             && screening.times.some((time) => time <= compare_with);
                //     }
                // })
                // .filter(screening => {
                //     const compare_with = selector_name === 'timesTo' ? value : selectors.timesTo.value;
                    
                //     if (compare_with === '') {
                //         return true;
                //     }
                //     else {
                //         const time = new Date(`2000-01-01T${compare_with.slice(1)}:00`);
                //         time.setHours(time.getHours() + 1);
                //         const compare_with_plus_one = "_" + time.toTimeString().slice(0, 5);

                //         return screening.times.some((time) => time <= compare_with) 
                //             && screening.times.some((time) => time < compare_with_plus_one);
                //     }
                // })
                .filter((screening) => { return search_input.value ? screening.text.includes(search_input.value.toLowerCase()) : true })
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
selectors.filmtypes.addEventListener('change', e => {
    toggleAll('filmtypes');
});

selectors.genres.addEventListener('change', e => {
    toggleAll('genres');
});

selectors.keywords.addEventListener('change', e => {
    toggleAll('keywords');
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

selectors.timesFrom.addEventListener('change', e => {
    toggleAll('timesFrom');
    updateToDates();
});

selectors.timesTo.addEventListener('change', e => {
    toggleAll('timesTo');
});

function updateToDates() {
    let timesFromVal = selectors.timesFrom.value;
    let timesToVal = selectors.timesTo.value;

    if (timesToVal != '' && timesFromVal != '' && timesFromVal > timesToVal) {
        selectors.timesTo.selectedIndex = 0;
        toggleAll('timesTo');
    }

    for (const option of selectors.timesTo.options) {
        if (option.value == '') {
            continue;
        }

        if (timesFromVal == '') {
            option.hidden = false;
        }
        else {
            option.hidden = timesFromVal > option.value;
        }
    }
}

function unselect_all() {
    search_input.value = '';
    selectors.programmes.selectedIndex = 0;
    selectors.languages.selectedIndex = 0;
    selectors.countries.selectedIndex = 0;
    selectors.subtitles.selectedIndex = 0;
    selectors.premieretypes.selectedIndex = 0;
    selectors.filmtypes.selectedIndex = 0;
    selectors.genres.selectedIndex = 0;
    selectors.keywords.selectedIndex = 0;
    selectors.towns.selectedIndex = 0;
    selectors.cinemas.selectedIndex = 0;
    selectors.dates.selectedIndex = 0;
    selectors.timesFrom.selectedIndex = 0;
    selectors.timesTo.selectedIndex = 0;
    nonetoshow.selectedIndex = 0;
    updateToDates();
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
            if (selectors.filmtypes.value) {
                return screening.filmtypes.includes(selectors.filmtypes.value)
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
            if (selectors.keywords.value) {
                return screening.keywords.includes(selectors.keywords.value)
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
            if (selectors.timesFrom.value) {
                return screening.times.some((time) => time >= selectors.timesFrom.value);
            } else {
                return true;
            }
        })
        .filter(screening => {
            if (selectors.timesTo.value) {
                return screening.times.some((time) => time <= selectors.timesTo.value);
            } else {
                return true;
            }
        })
        .filter(screening => screening.text.includes(search_input.value.toLowerCase()))
        .map(element => element.id.toString());
    // console.log(filtered);
    // console.log(filtered.map(element => element.id));
    return filtered
}


    // TODO: move this to _scripts/favorite.js
function setupScreeningFavoriteButtons () {
    const nslButtons = Array.from(document.getElementsByClassName('notmyscreening'))
    const slButtons = Array.from(document.getElementsByClassName('ismyscreening'))
    const currentScreeningIDs = Array.from(document.getElementById('screening_ids').value.split(','))
        .map(e => parseInt(e))

    if (getUser()) {
        const myScreenings = reloadUserScreenings()
        //- console.log({myScreenings, currentScreeningIDs})

        // unhide all fav buttons for currently favorited screenings
        currentScreeningIDs.filter(id => myScreenings.includes(id))
            .forEach(id => {
                document.getElementById(`s_${id}_is_fav`).style.display = ''
                document.getElementById(`s_${id}_is_not_fav`).style.display = 'none'
            })

        // unhide all no-fav buttons for currently unfavorited screenings
        currentScreeningIDs.filter(id => !myScreenings.includes(id))
            .forEach(id => {
                document.getElementById(`s_${id}_is_fav`).style.display = 'none'
                document.getElementById(`s_${id}_is_not_fav`).style.display = ''
            })

        // add event listeners to all fav buttons
        nslButtons.forEach(b => b.addEventListener('click', e => {
            let scrId = parseInt(b.id.split('_')[1])
            toggleFavouriteScreening('set', scrId)
        }))
        slButtons.forEach(b => b.addEventListener('click', e => {
            let scrId = parseInt(b.id.split('_')[1])
            toggleFavouriteScreening('unset', scrId)
        }))
    }
}
