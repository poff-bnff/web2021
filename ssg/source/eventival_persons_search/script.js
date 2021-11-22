const search_input = document.getElementById('search');
const nonetoshow = document.getElementById('nonetoshow');
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);


const selectors = {
    types: document.getElementById('types_select'),
    companies: document.getElementById('companies_select'),
    roles: document.getElementById('roles_select'),
    countries: document.getElementById('countries_select'),
    projects: document.getElementById('projects_select'),
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
    let cards = document.querySelectorAll('[class="person"]')
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
                    const compare_with = selector_name === 'companies' ? value : selectors.companies.value;
                    return compare_with === '' ? true : screening.companies.includes(compare_with)
                })
                .filter(screening => {
                    const compare_with = selector_name === 'roles' ? value : selectors.roles.value;
                    return compare_with === '' ? true : screening.roles.includes(compare_with)
                })
                .filter(screening => {
                    const compare_with = selector_name === 'countries' ? value : selectors.countries.value;
                    return compare_with === '' ? true : screening.countries.includes(compare_with)
                })
                .filter(screening => {
                    const compare_with = selector_name === 'projects' ? value : selectors.projects.value;
                    return compare_with === '' ? true : screening.projects.includes(compare_with)
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

selectors.companies.addEventListener('change', e => {
    toggleAll('companies');
});

selectors.roles.addEventListener('change', e => {
    toggleAll('roles');
});
selectors.countries.addEventListener('change', e => {
    toggleAll('countries');
});
selectors.projects.addEventListener('change', e => {
    toggleAll('projects');
});

function unselect_all() {
    search_input.value = '';
    selectors.types.selectedIndex = 0;
    selectors.companies.selectedIndex = 0;
    selectors.roles.selectedIndex = 0;
    selectors.countries.selectedIndex = 0;
    selectors.projects.selectedIndex = 0;
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
            if (selectors.companies.value) {
                return screening.companies.includes(selectors.companies.value)
            } else {
                return true
            }
        })
        .filter(screening => {
            if (selectors.roles.value) {
                return screening.roles.includes(selectors.roles.value)
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
            if (selectors.projects.value) {
                return screening.projects.includes(selectors.projects.value)
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


