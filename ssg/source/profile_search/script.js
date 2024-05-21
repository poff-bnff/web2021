const search_input = document.getElementById('search');
const listLength = document.getElementById('listLengthCount');
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const profilecategories = document.getElementsByName('selectedServiceCategories');
const servicesizes = document.getElementsByName('selectedServiceSize');


const selectors = {
    roleatfilms: document.getElementById('roleatfilms_select'),
    location: document.getElementById('location_select'),
    languages: document.getElementById('languages_select'),
    lookingfor: document.getElementById('lookingfor_select'),
}

function urlSelect() {
    if (urlParams.getAll.length) {
        for (const [ix, params] of urlParams) {
            const filterValue = decodeURIComponent(params);
            if (selectors[ix]) {
                for (const option of selectors[ix].options) {
                    if (option.innerHTML === params) {
                        selectors[ix].value = option.value
                    }
                }
            } else if (ix === 'profilecategories') {
                document.querySelector(`[name="selectedServiceCategories"][value="${filterValue}"]`).checked = true
            }
            else if (ix === 'servicesizes') {
                document.querySelector(`[name="selectedServiceSize"][value="${filterValue}"]`).checked = true
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

    const selectedprofilecategories = Array.from(profilecategories).filter(servicecategory => servicecategory.checked).map(servicecategory => servicecategory.value);

    selectedprofilecategories.forEach(servicecategory => {
        urlParameters.append('profilecategories', encodeURIComponent(servicecategory));
    })

    const selectedservicesizes = Array.from(servicesizes).filter(servicesize => servicesize.checked).map(servicesize => servicesize.value);

    selectedservicesizes.forEach(servicesize => {
        urlParameters.append('servicesizes', encodeURIComponent(servicesize));
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

    if (exclude_selector_name !== 'profilecategories') {
        Array.from(profilecategories).forEach(servicecategory => {
            let count = searcharray
                .filter(profiles => {
                    const compare_with = selectors.roleatfilms.value;
                    return compare_with === '' ? true : profiles.roleatfilms.includes(compare_with)
                })
                .filter(profiles => {
                    const compare_with = selectors.location.value;
                    return compare_with === '' ? true : profiles.location.includes(compare_with)
                })
                .filter(profiles => {
                    const compare_with = selectors.languages.value;
                    return compare_with === '' ? true : profiles.languages.includes(compare_with)
                })
                .filter(profiles => {
                    const compare_with = selectors.lookingfor.value;
                    return compare_with === '' ? true : profiles.lookingfor.includes(compare_with)
                })
                .filter(profiles => {
                    const compare_with = Array.from(servicesizes).filter(servicesize => servicesize.checked).map(servicesize => servicesize.value);
                    return compare_with.length === 0 ? true : profiles.servicesize.some(profiles_servicesize => compare_with.includes(profiles_servicesize))
                })
                .filter((profiles) => { return search_input.value ? profiles.text.includes(search_input.value.toLowerCase()) : true })
                .filter((profiles) => { return profiles.profilecategories.includes(servicecategory.value) })

                servicecategory.disabled = count.length === 0? true : false
        });
    }

    if (exclude_selector_name !== 'servicesizes') {
        Array.from(servicesizes).forEach(servicesize => {
            let count = searcharray
                .filter(profiles => {
                    const compare_with = selectors.roleatfilms.value;
                    return compare_with === '' ? true : profiles.roleatfilms.includes(compare_with)
                })
                .filter(profiles => {
                    const compare_with = selectors.location.value;
                    return compare_with === '' ? true : profiles.location.includes(compare_with)
                })
                .filter(profiles => {
                    const compare_with = selectors.languages.value;
                    return compare_with === '' ? true : profiles.languages.includes(compare_with)
                })
                .filter(profiles => {
                    const compare_with = selectors.lookingfor.value;
                    return compare_with === '' ? true : profiles.lookingfor.includes(compare_with)
                })
                .filter(profiles => {
                    const compare_with = Array.from(profilecategories).filter(servicecategory => servicecategory.checked).map(servicecategory => servicecategory.value);
                    return compare_with.length === 0 ? true : profiles.profilecategories.some(profiles_servicecategory => compare_with.includes(profiles_servicecategory))
                })
                .filter((profiles) => { return search_input.value ? profiles.text.includes(search_input.value.toLowerCase()) : true })
                .filter((profiles) => { return profiles.servicesize.includes(servicesize.value) })

                servicesize.disabled = count.length === 0? true : false
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
                .filter(profiles => {
                    const compare_with = selector_name === 'roleatfilms' ? value : selectors.roleatfilms.value;
                    return compare_with === '' ? true : profiles.roleatfilms.includes(compare_with)
                })
                .filter(profiles => {
                    const compare_with = Array.from(profilecategories).filter(servicecategory => servicecategory.checked).map(servicecategory => servicecategory.value);
                    return compare_with.length === 0 ? true : profiles.profilecategories.some(profiles_servicecategory => compare_with.includes(profiles_servicecategory))
                })
                .filter(profiles => {
                    const compare_with = Array.from(servicesizes).filter(servicesize => servicesize.checked).map(servicesize => servicesize.value);
                    return compare_with.length === 0 ? true : profiles.servicesize.some(profiles_servicesize => compare_with.includes(profiles_servicesize))
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

Array.from(profilecategories).forEach(servicecategory => servicecategory.addEventListener('change', e => {
    toggleAll('profilecategories');
}));

Array.from(servicesizes).forEach(servicesize => servicesize.addEventListener('change', e => {
    toggleAll('servicesizes');
}));

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
    Array.from(profilecategories).forEach((servicecategory) => servicecategory.checked = false);
    Array.from(servicesizes).forEach((servicesize) => servicesize.checked = false);
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
            const selected_profilecategories = Array.from(profilecategories).filter(servicecategory => servicecategory.checked).map(servicecategory => servicecategory.value);
            if (selected_profilecategories.length > 0) {
                return profiles.profilecategories.some(profiles_servicecategory => selected_profilecategories.includes(profiles_servicecategory))
            } else {
                return true
            }
        })
        .filter(profiles => {
            const selected_servicesizes = Array.from(servicesizes).filter(servicesize => servicesize.checked).map(servicesize => servicesize.value);
            if (selected_servicesizes.length > 0) {
                return profiles.servicesize.some(profiles_servicesize => selected_servicesizes.includes(profiles_servicesize))
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


