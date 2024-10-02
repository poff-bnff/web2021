const search_input = document.getElementById('search');
const listLength = document.getElementById('listLengthCount');
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const profilecategories = document.getElementsByName('selectedServiceCategories');
const servicesizes = document.getElementsByName('selectedServiceSize');
const profiletypes = document.getElementsByName('profileType');
const rangeFiltersBox = document.getElementById('range_filters');

const rangefilters = {
    agefrom: document.getElementById('actingAgeFrom'),
    ageto: document.getElementById('actingAgeTo'),
    heightfrom: document.getElementById('actingHeightFrom'),
    heightto: document.getElementById('actingHeightTo'),
    weightfrom: document.getElementById('actingWeightFrom'),
    weightto: document.getElementById('actingWeightTo'),
}

const selectors = {
    roleatfilms: document.getElementById('roleatfilms_select'),
    location: document.getElementById('location_select'),
    languages: document.getElementById('languages_select'),
    nativelangs: document.getElementById('nativelangs_select'),
    otherlangs: document.getElementById('otherlangs_select'),
    lookingfor: document.getElementById('lookingfor_select'),
    genders: document.getElementById('genders_select'),
    statures: document.getElementById('statures_select'),
    eyecolours: document.getElementById('eyecolours_select'),
    haircolours: document.getElementById('haircolours_select'),
    hairlengths: document.getElementById('hairlengths_select'),
    pitches: document.getElementById('pitches_select'),
    itypes: document.getElementById('itypes_select'),
    icategories: document.getElementById('icategories_select'),
}

const serviceFilters = {
    languages: document.getElementById('languages_select'),
    lookingfor: document.getElementById('lookingfor_select'),
    servicesize: document.getElementById('servicesize_select'),
}

const actorFilters = {
    nativelangs: document.getElementById('nativelangs_select'),
    otherlangs: document.getElementById('otherlangs_select'),
    genders: document.getElementById('genders_select'),
    statures: document.getElementById('statures_select'),
    eyecolours: document.getElementById('eyecolours_select'),
    haircolours: document.getElementById('haircolours_select'),
    hairlengths: document.getElementById('hairlengths_select'),
    pitches: document.getElementById('pitches_select'),
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
            }
            else if (rangefilters[ix]){
                rangefilters[ix].value = filterValue
            }
            else if(ix === 'search'){
                search_input.value = filterValue
            }
            else if (ix === 'profilecategories') {
                document.querySelector(`[name="selectedServiceCategories"][value="${filterValue}"]`).checked = true
            }
            else if (ix === 'servicesizes') {
                document.querySelector(`[name="selectedServiceSize"][value="${filterValue}"]`).checked = true
            }
            else if (ix === 'profiletype') {
                document.querySelector(`[name="profileType"][value="${filterValue}"]`).checked = true
                switchView(filterValue);
            }
        }
        toggleAll();
    }
}

const setSearchParams =  () => {
    let urlParameters = new URLSearchParams();

    if(search_input.value){
        urlParameters.append('search', encodeURIComponent(search_input.value.toLowerCase()));
    }

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

    const selectedprofiletype = Array.from(profiletypes).filter(profiletype => profiletype.checked).map(profiletype => profiletype.value);

    selectedprofiletype.forEach(profiletype => {
        urlParameters.append('profiletype', encodeURIComponent(profiletype));
    })

    for (const input in rangefilters) {
        if (rangefilters[input].value) {
            urlParameters.append(input, encodeURIComponent(rangefilters[input].value))
        }
    }

    const urlParametersString = urlParameters.toString();

    let page = `${window.location.protocol}//${window.location.host}${window.location.pathname}`
    if (urlParametersString.length) {
        window.history.pushState('', '', `${page}?${urlParametersString}`);
    } else {
        window.history.pushState('', document.title, page);
    }
}

document.onreadystatechange = () => {
    const loadingBlock = document.getElementById('loading');
    const filtersBlock = document.getElementById('filters');
    const activeFestivalSelect = document.getElementById('active_festival_profile_type_selection');
    const activeFestivalBlock = document.getElementById('industry_filters');

    if (document.readyState === 'complete') {
        switchView('default')
        urlSelect()
        filtersBlock.style.display = "grid"
        loadingBlock.style.display = "none"
        if(filters.activefestivalprofiles){
            activeFestivalSelect.style.display = "block"
            activeFestivalBlock.style.display = "block"
        }
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

function rangeFilter(valueFrom, valueTo, searchFrom, searchTo) {
    if(!valueFrom){
        return false;
    }

    if(!valueTo){
        valueTo = valueFrom;
    }

    if(!searchFrom){
        searchFrom = 0
    }

    if(!searchTo){
        searchTo = 999
    }

    return searchFrom <= valueTo && searchTo >= valueFrom;
}

function arrayWithBaseFilters() {
    return searcharray
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
            const compare_with = selectors.nativelangs.value;
            return compare_with === '' ? true : profiles.nativelangs.includes(compare_with)
        })
        .filter(profiles => {
            const compare_with = selectors.otherlangs.value;
            return compare_with === '' ? true : profiles.otherlangs.includes(compare_with)
        })
        .filter(profiles => {
            const compare_with = selectors.lookingfor.value;
            return compare_with === '' ? true : profiles.lookingfor.includes(compare_with)
        })
        .filter(profiles => {
            const compare_with = selectors.genders.value;
            return compare_with === '' ? true : profiles.genders.includes(compare_with)
        })
        .filter(profiles => {
            const compare_with = selectors.statures.value;
            return compare_with === '' ? true : profiles.statures.includes(compare_with)
        })
        .filter(profiles => {
            const compare_with = selectors.eyecolours.value;
            return compare_with === '' ? true : profiles.eyecolours.includes(compare_with)
        })
        .filter(profiles => {
            const compare_with = selectors.haircolours.value;
            return compare_with === '' ? true : profiles.haircolours.includes(compare_with)
        })
        .filter(profiles => {
            const compare_with = selectors.hairlengths.value;
            return compare_with === '' ? true : profiles.hairlengths.includes(compare_with)
        })
        .filter(profiles => {
            const compare_with = selectors.pitches.value;
            return compare_with === '' ? true : profiles.pitches.includes(compare_with)
        })
        .filter(profiles => {
            const compare_with = selectors.itypes.value;
            return compare_with === '' ? true : profiles.itypes.includes(compare_with)
        })
        .filter(profiles => {
            const compare_with = selectors.icategories.value;
            return compare_with === '' ? true : profiles.icategories.includes(compare_with)
        })
        .filter(profiles => {
            const compare_with = Array.from(profiletypes).filter(profiletype => profiletype.checked).map(profiletype => profiletype.value);
            return compare_with.length === 0 ? true : profiles.profiletype.some(profiles_profiletype => compare_with.includes(profiles_profiletype))
        })
        .filter(profiles => {
            if(rangefilters.agefrom.value || rangefilters.ageto.value){
                return rangeFilter(profiles.agefrom, profiles.ageto, rangefilters.agefrom.value, rangefilters.ageto.value)
            } else {
                return true
            }
        })
        .filter(profiles => {
            if(rangefilters.heightfrom.value || rangefilters.heightto.value){
                return rangeFilter(profiles.profileheight, false, rangefilters.heightfrom.value, rangefilters.heightto.value)
            } else {
                return true
            }
        })
        .filter(profiles => {
            if(rangefilters.weightfrom.value || rangefilters.weightto.value){
                return rangeFilter(profiles.profileweight, false, rangefilters.weightfrom.value, rangefilters.weightto.value)
            } else {
                return true
            }
        })
        .filter((profiles) => { return search_input.value ? profiles.text.includes(search_input.value.toLowerCase()) : true })
}

function toggleFilters(exclude_selector_name) {

    if (exclude_selector_name !== 'profilecategories') {
        Array.from(profilecategories).forEach(servicecategory => {
            let baseArray = arrayWithBaseFilters();
            let filtered = baseArray
                .filter(profiles => {
                    const compare_with = Array.from(servicesizes).filter(servicesize => servicesize.checked).map(servicesize => servicesize.value);
                    return compare_with.length === 0 ? true : profiles.servicesize.some(profiles_servicesize => compare_with.includes(profiles_servicesize))
                })
                .filter((profiles) => { return profiles.profilecategories.includes(servicecategory.value) })

            servicecategory.disabled = filtered.length === 0? true : false
        });
    }

    if (exclude_selector_name !== 'servicesizes') {
        Array.from(servicesizes).forEach(servicesize => {
            let baseArray = arrayWithBaseFilters();
            let filtered = baseArray
                .filter(profiles => {
                    const compare_with = Array.from(profilecategories).filter(servicecategory => servicecategory.checked).map(servicecategory => servicecategory.value);
                    return compare_with.length === 0 ? true : profiles.profilecategories.some(profiles_servicecategory => compare_with.includes(profiles_servicecategory))
                })
                .filter((profiles) => { return profiles.servicesize.includes(servicesize.value) })

                servicesize.disabled = filtered.length === 0? true : false
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
                    const compare_with = Array.from(profiletypes).filter(profiletype => profiletype.checked).map(profiletype => profiletype.value);
                    return compare_with.length === 0 ? true : profiles.profiletype.some(profiles_profiletype => compare_with.includes(profiles_profiletype))
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
                    const compare_with = selector_name === 'nativelangs' ? value : selectors.nativelangs.value;
                    return compare_with === '' ? true : profiles.nativelangs.includes(compare_with)
                })
                .filter(profiles => {
                    const compare_with = selector_name === 'otherlangs' ? value : selectors.otherlangs.value;
                    return compare_with === '' ? true : profiles.otherlangs.includes(compare_with)
                })
                .filter(profiles => {
                    const compare_with = selector_name === 'lookingfor' ? value : selectors.lookingfor.value;
                    return compare_with === '' ? true : profiles.lookingfor.includes(compare_with)
                })
                .filter(profiles => {
                    const compare_with = selector_name === 'genders' ? value : selectors.genders.value;
                    return compare_with === '' ? true : profiles.genders.includes(compare_with)
                })
                .filter(profiles => {
                    const compare_with = selector_name === 'statures' ? value : selectors.statures.value;
                    return compare_with === '' ? true : profiles.statures.includes(compare_with)
                })
                .filter(profiles => {
                    const compare_with = selector_name === 'eyecolours' ? value : selectors.eyecolours.value;
                    return compare_with === '' ? true : profiles.eyecolours.includes(compare_with)
                })
                .filter(profiles => {
                    const compare_with = selector_name === 'haircolours' ? value : selectors.haircolours.value;
                    return compare_with === '' ? true : profiles.haircolours.includes(compare_with)
                })
                .filter(profiles => {
                    const compare_with = selector_name === 'hairlengths' ? value : selectors.hairlengths.value;
                    return compare_with === '' ? true : profiles.hairlengths.includes(compare_with)
                })
                .filter(profiles => {
                    const compare_with = selector_name === 'pitches' ? value : selectors.pitches.value;
                    return compare_with === '' ? true : profiles.pitches.includes(compare_with)
                })
                .filter(profiles => {
                    const compare_with = selector_name === 'itypes' ? value : selectors.itypes.value;
                    return compare_with === '' ? true : profiles.itypes.includes(compare_with)
                })
                .filter(profiles => {
                    const compare_with = selector_name === 'icategories' ? value : selectors.icategories.value;
                    return compare_with === '' ? true : profiles.icategories.includes(compare_with)
                })
                .filter(profiles => {
                    if(rangefilters.agefrom.value || rangefilters.ageto.value){
                        return rangeFilter(profiles.agefrom, profiles.ageto, rangefilters.agefrom.value, rangefilters.ageto.value)
                    } else {
                        return true
                    }
                })
                .filter(profiles => {
                    if(rangefilters.heightfrom.value || rangefilters.heightto.value){
                        return rangeFilter(profiles.profileheight, false, rangefilters.heightfrom.value, rangefilters.heightto.value)
                    } else {
                        return true
                    }
                })
                .filter(profiles => {
                    if(rangefilters.weightfrom.value || rangefilters.weightto.value){
                        return rangeFilter(profiles.profileweight, false, rangefilters.weightfrom.value, rangefilters.weightto.value)
                    } else {
                        return true
                    }
                })
                .filter((profiles) => { return search_input.value ? profiles.text.includes(search_input.value.toLowerCase()) : true })
                .length


            option.disabled = count ? false : true

        }

    }

}

function switchView(type){
    transferLanguages(type)
    if(type == 'actors'){
        for (sFilterName in serviceFilters) {
            serviceFilters[sFilterName].style.display = 'none';
        }
        for (aFilterName in actorFilters) {
            actorFilters[aFilterName].style.display = '';
        }
        rangeFiltersBox.style.display = '';
        Array.from(servicesizes).forEach((servicesize) => servicesize.checked = false);
        selectors.lookingfor.selectedIndex = 0;
        selectors.languages.selectedIndex = 0;
    }
    else if(type == 'services' || type == 'activefestival' || type == 'default'){
        for (sFilterName in serviceFilters) {
            serviceFilters[sFilterName].style.display = '';
        }
        for (aFilterName in actorFilters) {
            actorFilters[aFilterName].style.display = 'none';
            actorFilters[aFilterName].selectedIndex = 0;
        }
        rangeFiltersBox.style.display = 'none';
        for (input in rangefilters) {
            rangefilters[input].value = '';
        }
    }

    toggleServiceVisibility();
}

function selectHasValue(select, value){
    let has = false;
    for (i = 0; i < select.length; ++i){
        if (select.options[i].value == value){
          has = true;
        }
    }
    return has;
}

function transferLanguages(type){
    if(type == 'actors'){
        if(selectors.languages.value){
            if(selectHasValue(selectors.nativelangs, selectors.languages.value)){
                selectors.nativelangs.value = selectors.languages.value;
            }
            else if(selectHasValue(selectors.otherlangs, selectors.languages.value)){
                selectors.otherlangs.value = selectors.languages.value;
            }
        }
    }
    else if(type == 'services' || type == 'default'){
        let changed = false;
        if(selectors.nativelangs.value){
            if(selectHasValue(selectors.languages, selectors.nativelangs.value)){
                selectors.languages.value = selectors.nativelangs.value;
                changed = true;
            }
        }

        if(selectors.otherlangs.value && !changed){
            if(selectHasValue(selectors.languages, selectors.otherlangs.value)){
                selectors.languages.value = selectors.otherlangs.value;
            }
        }
    }
}

function toggleServiceVisibility(){
    Array.from(profilecategories).forEach(servicecategory => {
        let count = searcharray
            .filter(profiles => {
                const compare_with = Array.from(profiletypes).filter(profiletype => profiletype.checked).map(profiletype => profiletype.value);
                return compare_with.length === 0 ? true : profiles.profiletype.some(profiles_profiletype => compare_with.includes(profiles_profiletype))
            })
            .filter((profiles) => { return profiles.profilecategories.includes(servicecategory.value) })

        if(count.length === 0){
            servicecategory.checked = false;
            servicecategory.parentNode.style.display = 'none';
        }
        else{
            servicecategory.parentNode.style.display = '';
        }
    });
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

Array.from(profiletypes).forEach(profiletype => profiletype.addEventListener('change', e => {
    switchView(e.target.value);
    toggleAll('profiletypes');
}));

for (input in rangefilters) {
    ['keyup', 'change'].forEach(function(event) { rangefilters[input].addEventListener(event, e => {
        toggleAll('ranges');
    });});
}

selectors.roleatfilms.addEventListener('change', e => {
    toggleAll('roleatfilms');
    if(e.target.value in filters.actorroles){
        Array.from(profiletypes).forEach(profiletype => {
            if(profiletype.value == 'actors'){
                profiletype.checked = true;
            }
        });
        switchView('actors')
        toggleAll()
    }
});

selectors.location.addEventListener('change', e => {
    toggleAll('location');
});

selectors.languages.addEventListener('change', e => {
    toggleAll('languages');
});

selectors.nativelangs.addEventListener('change', e => {
    toggleAll('nativelangs');
});

selectors.otherlangs.addEventListener('change', e => {
    toggleAll('otherlangs');
});

selectors.lookingfor.addEventListener('change', e => {
    toggleAll('lookingfor');
});

selectors.genders.addEventListener('change', e => {
    toggleAll('genders');
});

selectors.statures.addEventListener('change', e => {
    toggleAll('statures');
});

selectors.eyecolours.addEventListener('change', e => {
    toggleAll('eyecolours');
});

selectors.haircolours.addEventListener('change', e => {
    toggleAll('haircolours');
});

selectors.hairlengths.addEventListener('change', e => {
    toggleAll('hairlengths');
});

selectors.pitches.addEventListener('change', e => {
    toggleAll('pitches');
});

selectors.itypes.addEventListener('change', e => {
    toggleAll('itypes');
});

selectors.icategories.addEventListener('change', e => {
    toggleAll('icategories');
});

function clear_all() {
    Array.from(profiletypes).forEach((profiletype) => profiletype.checked = false);
    switchView('default');
    search_input.value = '';
    Array.from(profilecategories).forEach((servicecategory) => servicecategory.checked = false);
    Array.from(servicesizes).forEach((servicesize) => servicesize.checked = false);
    for (selector_name in selectors) {
        selectors[selector_name].selectedIndex = 0;
    }

    for (input in rangefilters) {
        rangefilters[input].value = '';
    }

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
            const selected_profiletypes = Array.from(profiletypes).filter(profiletype => profiletype.checked).map(profiletype => profiletype.value);
            if (selected_profiletypes.length > 0) {
                return profiles.profiletype.some(profiles_profiletype => selected_profiletypes.includes(profiles_profiletype))
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
            if (selectors.nativelangs.value) {
                return profiles.nativelangs.includes(selectors.nativelangs.value)
            } else {
                return true
            }
        })
        .filter(profiles => {
            if (selectors.otherlangs.value) {
                return profiles.otherlangs.includes(selectors.otherlangs.value)
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
        .filter(profiles => {
            if (selectors.genders.value) {
                return profiles.genders.includes(selectors.genders.value)
            } else {
                return true
            }
        })
        .filter(profiles => {
            if (selectors.statures.value) {
                return profiles.statures.includes(selectors.statures.value)
            } else {
                return true
            }
        })
        .filter(profiles => {
            if (selectors.eyecolours.value) {
                return profiles.eyecolours.includes(selectors.eyecolours.value)
            } else {
                return true
            }
        })
        .filter(profiles => {
            if (selectors.haircolours.value) {
                return profiles.haircolours.includes(selectors.haircolours.value)
            } else {
                return true
            }
        })
        .filter(profiles => {
            if (selectors.hairlengths.value) {
                return profiles.hairlengths.includes(selectors.hairlengths.value)
            } else {
                return true
            }
        })
        .filter(profiles => {
            if (selectors.pitches.value) {
                return profiles.pitches.includes(selectors.pitches.value)
            } else {
                return true
            }
        })
        .filter(profiles => {
            if (selectors.itypes.value) {
                return profiles.itypes.includes(selectors.itypes.value)
            } else {
                return true
            }
        })
        .filter(profiles => {
            if (selectors.icategories.value) {
                return profiles.icategories.includes(selectors.icategories.value)
            } else {
                return true
            }
        })
        .filter(profiles => {
            if(rangefilters.agefrom.value || rangefilters.ageto.value){
                return rangeFilter(profiles.agefrom, profiles.ageto, rangefilters.agefrom.value, rangefilters.ageto.value)
            } else {
                return true
            }
        })
        .filter(profiles => {
            if(rangefilters.heightfrom.value || rangefilters.heightto.value){
                return rangeFilter(profiles.profileheight, false, rangefilters.heightfrom.value, rangefilters.heightto.value)
            } else {
                return true
            }
        })
        .filter(profiles => {
            if(rangefilters.weightfrom.value || rangefilters.weightto.value){
                return rangeFilter(profiles.profileweight, false, rangefilters.weightfrom.value, rangefilters.weightto.value)
            } else {
                return true
            }
        })
        .filter(profiles => profiles.text.includes(search_input.value.toLowerCase()))
        .map(element => element.id.toString());
    return filtered
}


