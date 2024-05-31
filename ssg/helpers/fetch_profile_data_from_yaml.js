const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');
const rueten = require('./rueten.js');
const { fetchModel } = require('./b_fetch.js')

const rootDir = path.join(__dirname, '..')
const domainSpecificsPath = path.join(rootDir, 'domain_specifics.yaml')
const DOMAIN_SPECIFICS = yaml.load(fs.readFileSync(domainSpecificsPath, 'utf8'))
const INDUSTRY_ORGANISATION_IN_EDITIONS = DOMAIN_SPECIFICS.industry_organisation_in_editions
const INDUSTRY_PERSON_IN_EDITIONS = DOMAIN_SPECIFICS.industry_person_in_editions
const MAIN_SERVICE_CATEGORIES = DOMAIN_SPECIFICS.main_service_categories
const ACTOR_ROLES = DOMAIN_SPECIFICS.actor_roles

const sourceDir = path.join(rootDir, 'source');
const fetchDir = path.join(sourceDir, '_fetchdir');
const strapiDataPathOrg = path.join(sourceDir, '_allStrapidata', 'Organisation.yaml');
const strapiDataPathPerson = path.join(sourceDir, '_allStrapidata', 'Person.yaml');
const strapiDataPathServiceCategory = path.join(sourceDir, '_allStrapidata', 'ServiceCategory.yaml');
const DOMAIN = process.env['DOMAIN'] || 'industry.poff.ee';
const SHORT_DESC_LENGTH = 100
const DATALIMIT = parseInt(process.env['ORGANISATIONLIMIT']) || 0

if (DOMAIN !== 'industry.poff.ee') {
    let emptyYAML = yaml.dump([], {
        'noRefs': true,
        'indent': '4'
    })
    fs.writeFileSync(path.join(fetchDir, `profiles.en.yaml`), emptyYAML, 'utf8')
    fs.writeFileSync(path.join(fetchDir, `search_profiles.en.yaml`), emptyYAML, 'utf8')
    fs.writeFileSync(path.join(fetchDir, `filters_profiles.en.yaml`), emptyYAML, 'utf8')
} else {
    let activeOrganisations = getActiveOrganisations()
    let activePersons = getActivePersons()
    const languages = DOMAIN_SPECIFICS.locales[DOMAIN]

    startProfileProcessing(languages, activePersons, activeOrganisations)
}

function startProfileProcessing(languages, activePersons, activeOrganisations) {
    for (lang of languages) {

        console.log(`Fetching ${DOMAIN} profiles ${lang} data`)

        const allProfileData = []
        const filteredProfiles = []

        let limit = DATALIMIT
        let counting = 0

        let uniqueId = 1

        for (const ix in activePersons) {
            if (limit !== 0 && counting === limit) break
            counting++

            let person = JSON.parse(JSON.stringify(activePersons[ix])) // deep copy, because rueten mutates the object
            person = rueten(person, lang) // TODO: rueten mutates the object, assignment is unnecessary

            let personSlug = person.slug
            // if slug is not defined, then skip this person
            if (!personSlug) {
                console.info(`Person ${person.id} has no slug, skipping`)
                continue
            }
            person.path = personSlug
            person.slug = personSlug

            person.filterName = person.firstNameLastName

            person.profileType = isActor(person) ? "Actor" : "Person"

            person.serviceSize = !isActor(person) ? "Freelancer" : ""

            person.shortDescription = person.bio ? person.bio.substr(0, SHORT_DESC_LENGTH) + "...": ""

            person.cardLocation = person.addr_coll ? getCardLocation(person.addr_coll) : ""

            person.uniqueId = uniqueId

            uniqueId++

            filteredProfiles.push(getListProfileData(person))
            allProfileData.push(person)
        }

        counting = 0

        for (const ix in activeOrganisations) {

            if (limit !== 0 && counting === limit) break
            counting++

            let organisation = JSON.parse(JSON.stringify(activeOrganisations[ix])) // deep copy, because rueten mutates the object
            organisation = rueten(organisation, lang) // TODO: rueten mutates the object, assignment is unnecessary

            let organisationSlug = organisation.slug
            // if slug is not defined, then skip this organisation
            if (!organisationSlug) {
                console.info(`Organisation ${organisation.id} has no slug, skipping`)
                continue
            }
            organisation.path = organisationSlug
            organisation.slug = organisationSlug

            organisation.filterName = organisation.name
            organisation.profileType = "Organisation"

            var sSize = ""
            if(organisation.employees_n > 0 && organisation.employees_n < 6){
                sSize = "1-5 employees"
            }
            else if(organisation.employees_n > 5 && organisation.employees_n < 11){
                sSize = "6-10 employees"
            }
            else if(organisation.employees_n > 10){
                sSize = "10+ employees"
            }
            organisation.serviceSize = sSize

            organisation.shortDescription = organisation.description ? organisation.description.substr(0, SHORT_DESC_LENGTH) + "...": ""

            organisation.uniqueId = uniqueId

            uniqueId++

            filteredProfiles.push(getListProfileData(organisation))
            allProfileData.push(organisation)
        }

        const yamlPath = path.join(fetchDir, `profiles.${lang}.yaml`)

        if (filteredProfiles.length === 0) {
            console.log(`No data for profiles, creating empty YAMLs`)
            fs.writeFileSync(yamlPath, '[]', 'utf8')
            fs.writeFileSync(path.join(fetchDir, `search_profiles.${lang}.yaml`), '[]', 'utf8')
            fs.writeFileSync(path.join(fetchDir, `filters_profiles.${lang}.yaml`), '[]', 'utf8')
            continue
        }

        filteredProfiles.sort((a, b) => `${a.filterName}`.localeCompare(`${b.filterName}`, lang))
        const filteredProfilesYAML = yaml.dump(filteredProfiles, { 'noRefs': true, 'indent': '4' });
        fs.writeFileSync(yamlPath, filteredProfilesYAML, 'utf8');
        console.log(`Fetched ${filteredProfiles.length} profiles for ${DOMAIN}`);

        generateProfileSearchAndFilterYamls(allProfileData, lang)
    }
}

function getListProfileData(profile) {
    let listProfileData = {}

    listProfileData.uniqueId = profile.uniqueId
    listProfileData.slug = profile.slug
    listProfileData.filterName = profile.filterName
    listProfileData.role_at_films = profile.role_at_films
    listProfileData.profileType = profile.profileType
    listProfileData.serviceSize = profile.serviceSize
    listProfileData.shortDescription = profile.shortDescription
    listProfileData.cardLocation = profile.addr_coll ? getCardLocation(profile.addr_coll) : ""
    if (profile.profileType === "Organisation") {
        if (profile.logoColour) {
            listProfileData.logoColour = profile.logoColour
        }
        else if (profile.logoBlack) {
            listProfileData.logoBlack = profile.logoBlack
        }
        else if (profile.logoWhite) {
            listProfileData.logoWhite = profile.logoWhite
        }
        else{
            listProfileData.picture = profile.picture
        }
    }

    else if (profile.profileType === "Actor" || profile.profileType === "Person") {
        listProfileData.picture = profile.picture
    }

    return listProfileData
}

function uppercase(value) {
    return value.charAt(0).toUpperCase() + value.slice(1);
}


function getKeyByValue(object, value) {
    return Object.keys(object).find(key => object[key] === value);
}

function generateProfileSearchAndFilterYamls(profiles, lang) {
    let filters = {
        roleatfilms: {},
        location: {},
        languages: {},
        lookingfor: {},
        profiletype: {},
        servicesize: {},
        profilecategories: {},
        maincategories: {},
        actorroles: {},
        nativelangs: {},
        otherlangs: {},
        genders: {},
        statures: {},
        eyecolours: {},
        haircolours: {},
        hairlengths: {},
        pitches: {},
    };

    filters.profiletype["actors"] = "actors"
    filters.profiletype["services"] = "services"

    let serviceCategories = getServiceCategories();

    for (const main of serviceCategories){
        let isMain = getKeyByValue(MAIN_SERVICE_CATEGORIES, main.id);
        if(isMain){
            filters.maincategories[isMain] = {id: main.id, serviceName: main.name_en, svg: main.svgCode};
        }
    }

    const profiles_search = profiles.map(profile => {
        let searchText = [
            profile.filterName,
            profile.eMail,
            profile.dateOfBirth,
            profile.profession,
            profile.webpage_url,
            profile.webpage_url,
            profile.bio,
            profile.description,
            profile.skills,
        ];

        for (const award of (profile.awardings || [])) {
            searchText.push(award.title);
        }

        for (const filmWork of (profile.filmographies || [])) {
            searchText.push(filmWork.work_name);
            searchText.push(filmWork.actor_role);
        }


        let roleatfilms = [];
        let profilecategories = [];
        for (const role of (profile.role_at_films || [])
            .sort(function (a, b) { return (a.order > b.order) ? 1 : ((b.order > a.order) ? -1 : 0); })
            || []) {
            const roleName = role.roleName;
            searchText.push(roleName);
            roleatfilms.push(roleName);
            filters.roleatfilms[roleName] = roleName;
            if(ACTOR_ROLES.includes(role.id)){
                filters.actorroles[roleName] = roleName;
            }
            for (const service of serviceCategories){
                if(!service.is_main_cat || service.is_main_cat != true){
                    if (service.role_at_films && service.role_at_films.some(el => el.id === role.id)){
                        const serviceName = service.name_en;
                        profilecategories.indexOf(serviceName) === -1 ? profilecategories.push(serviceName) : "";
                        filters.profilecategories[serviceName] = {id: service.id, serviceName: serviceName, svg: service.svgMedia};
                    }
                }
            }
        }

        let location = [];
        if (profile.addr_coll){
            if(profile.addr_coll.country && profile.addr_coll.country.name){
                let profileLocation = profile.addr_coll.country.name;
                location.push(profileLocation);
                filters.location[profileLocation] = profileLocation;

                if(profile.addr_coll.county && profile.addr_coll.county.name){
                    profileLocation += ", " + profile.addr_coll.county.name;
                    location.push(profileLocation);
                    filters.location[profileLocation] = profileLocation;
                }
            }
        }

        let lookingfor = [];
        for (const lookingTag of (profile.tag_looking_fors || [])) {
            let lookingForString = lookingTag.charAt(0).toUpperCase() + lookingTag.slice(1);
            searchText.push(lookingForString);
            lookingfor.push(lookingForString);
            filters.lookingfor[lookingForString] = lookingForString;
        }

        let languages = [];
        let nativelangs = [];
        let otherlangs = [];
        if (profile.profileType === "Organisation") {
            if (profile.languages) {
                for (const lang of profile.languages) {
                    languages.push(lang.name);
                    filters.languages[lang.name] = lang.name
                }
            }
        }
        else if (profile.profileType === "Actor" || profile.profileType === "Person") {
            if (profile.native_lang) {
                languages.push(profile.native_lang.name)
                filters.languages[profile.native_lang.name] = profile.native_lang.name;
                nativelangs.push(profile.native_lang.name)
                filters.nativelangs[profile.native_lang.name] = profile.native_lang.name;
            }

            if (profile.other_lang) {
                for (const olang of profile.other_lang) {
                    languages.push(olang.name);
                    filters.languages[olang.name] = olang.name
                    otherlangs.push(olang.name);
                    filters.otherlangs[olang.name] = olang.name
                }
            }
        }

        let profiletype = [];
        profiletype.push(profile.profileType === "Actor" ? "actors" : "services");

        let servicesize = []
        if (profile.serviceSize){
            servicesize.push(profile.serviceSize);
            filters.servicesize[profile.serviceSize] = profile.serviceSize
        }

        let genders = [];
        if (typeof profile.gender !== 'undefined') {
            genders.push(profile.gender);
            filters.genders[profile.gender] = profile.gender;
        }

        let statures = [];
        if (profile.stature) {
            let statureName = uppercase(profile.stature.name);
            statures.push(statureName);
            filters.statures[statureName] = statureName;
        }

        let eyecolours = [];
        if (profile.eye_colour) {
            let eyeColour = uppercase(profile.eye_colour.name)
            eyecolours.push(eyeColour);
            filters.eyecolours[eyeColour] = eyeColour;
        }

        let haircolours = [];
        if (profile.hair_colour) {
            let hairColour = uppercase(profile.hair_colour.name)
            haircolours.push(hairColour);
            filters.haircolours[hairColour] = hairColour;
        }

        let hairlengths = [];
        if (profile.hair_length) {
            let hairLength = uppercase(profile.hair_length.name)
            hairlengths.push(hairLength);
            filters.hairlengths[hairLength] = hairLength;
        }

        let pitches = [];
        if (profile.pitch_of_voice) {
            let pitchName = uppercase(profile.pitch_of_voice.name)
            pitches.push(pitchName);
            filters.pitches[pitchName] = pitchName;
        }

        let profileheight = '';
        if (profile.height_cm) {
            profileheight = profile.height_cm;
        }

        let profileweight = '';
        if (profile.weight_kg) {
            profileweight = profile.weight_kg;
        }

        let agefrom = '';
        if (profile.acting_age_from) {
            agefrom = profile.acting_age_from;
        }

        let ageto = '';
        if (profile.acting_age_to) {
            ageto = profile.acting_age_to;
        }

        return {
            id: profile.uniqueId,
            text: searchText.filter(elm => elm).join(' ').toLowerCase(),
            roleatfilms: roleatfilms,
            location: location,
            languages: languages,
            lookingfor: lookingfor,
            profiletype: profiletype,
            servicesize: servicesize,
            profilecategories: profilecategories,
            nativelangs: nativelangs,
            otherlangs: otherlangs,
            genders: genders,
            statures: statures,
            eyecolours: eyecolours,
            haircolours: haircolours,
            hairlengths: hairlengths,
            pitches: pitches,
            profileheight: profileheight,
            profileweight: profileweight,
            agefrom: agefrom,
            ageto: ageto,

        };
    });

    let sorted_filters = {
        roleatfilms: mSort(filters.roleatfilms),
        location: mSort(filters.location),
        languages: mSort(filters.languages),
        lookingfor: mSort(filters.lookingfor),
        profiletype: mSort(filters.lookingfor),
        servicesize: mSort(filters.servicesize),
        profilecategories: filters.profilecategories,
        maincategories: filters.maincategories,
        actorroles: filters.actorroles,
        nativelangs: mSort(filters.nativelangs),
        otherlangs: mSort(filters.otherlangs),
        genders: mSort(filters.genders),
        statures: mSort(filters.statures),
        eyecolours: mSort(filters.eyecolours),
        haircolours: mSort(filters.haircolours),
        hairlengths: mSort(filters.hairlengths),
        pitches: mSort(filters.pitches),
    };

    let searchYAML = yaml.dump(profiles_search, { 'noRefs': true, 'indent': '4' });
    fs.writeFileSync(path.join(fetchDir, `search_profiles.${lang}.yaml`), searchYAML, 'utf8');

    let filtersYAML = yaml.dump(sorted_filters, { 'noRefs': true, 'indent': '4' });
    fs.writeFileSync(path.join(fetchDir, `filters_profiles.${lang}.yaml`), filtersYAML, 'utf8');
}

function getServiceCategories() {
    const STRAPIDATA_SERVICECATEGORIES = yaml.load(fs.readFileSync(strapiDataPathServiceCategory, 'utf8'))

    const minimodel = {
        'role_at_films': {
            model_name: 'RoleAtFilm'
        },
        'svgMedia': {
            model_name: 'StrapiMedia'
        }
    }
    console.log(`Fetching ${DOMAIN} serviceCategory data`)
    const STRAPIDATA_ALL_SERVICECATEGORIES = fetchModel(STRAPIDATA_SERVICECATEGORIES, minimodel)
    console.log(`Fetched ${STRAPIDATA_ALL_SERVICECATEGORIES.length} ${DOMAIN} serviceCategory data`)

    return STRAPIDATA_ALL_SERVICECATEGORIES
}

function getCardLocation(address) {
    let location = ""
    if(address.municipality && address.municipality.name){
        location = address.municipality.name
    }
    else if(address.county && address.county.name){
        location = address.county.name
    }

    if(address.country && address.country.name){
        location += ", " + address.country.name
    }
    return location
}

function isActor(person) {
    let isActor = false
    if(person.role_at_films){
        for (const [key, role] of Object.entries(person.role_at_films)) {
            if(ACTOR_ROLES.includes(role.id)){
                isActor = true
            }
        }
    }
    return isActor
}

function getActivePersons() {
    const STRAPIDATA_PERSON = yaml.load(fs.readFileSync(strapiDataPathPerson, 'utf8'))

    const minimodel = {
        'gender': {
            model_name: 'Gender'
        },
        'addr_coll': {
            model_name: 'Address',
            expand: {
                'country': {
                    model_name: 'Country',
                },
                'county': {
                    model_name: 'County',
                },
                'municipality': {
                    model_name: 'Municipality'
                }
            }
        },
        'role_at_films': {
            model_name: 'RoleAtFilm'
        },
        'organisations': {
            model_name: 'Organisation'
        },
        'industry_categories': {
            model_name: 'IndustryCategory'
        },
        'eye_colour': {
            model_name: 'EyeColour'
        },
        'hair_colour': {
            model_name: 'HairColour'
        },
        'hair_length': {
            model_name: 'HairLength'
        },
        'shoe_size': {
            model_name: 'ShoeSize'
        },
        'pitch_of_voice': {
            model_name: 'PitchOfVoice'
        },
        'country': {
            model_name: 'Country'
        },
        'other_lang': {
            model_name: 'Language'
        },
        'native_lang': {
            model_name: 'Language'
        },
        'tag_secrets': {
            model_name: 'TagSecret'
        },
        'industry_person_types': {
            model_name: 'IndustryPersonType'
        },
        'stature': {
            model_name: 'Stature'
        },
        'filmographies': {
            model_name: 'Filmography',
            expand: {
                'tag_film_types': {
                    model_name: 'TagFilmType',
                },
                'role_at_films': {
                    model_name: 'RoleAtFilm',
                },
                'type_of_work': {
                    model_name: 'TypeOfWork'
                }
            }
        },
        'tag_looking_fors': {
            model_name: 'TagLookingFor'
        }
    }
    console.log(`Fetching ${DOMAIN} persons data`)
    const STRAPIDATA_ALL_PERSONS = fetchModel(STRAPIDATA_PERSON, minimodel)
    console.log(`Fetched ${STRAPIDATA_ALL_PERSONS.length} ${DOMAIN} persons data`)

    const activeCategories = Object.keys(INDUSTRY_PERSON_IN_EDITIONS)
    console.log('activeCategories', activeCategories)
    const activePersons = STRAPIDATA_ALL_PERSONS
        // filter out persons who have no festival_editions
        .filter(p => p.festival_editions && p.festival_editions.length)
        // set is_in_industry and is_in_creative and ... to true/false based on festival_editions of the person
        .map(p => {
            for (const [industryPersonInEdition, editionIds] of Object.entries(INDUSTRY_PERSON_IN_EDITIONS)) {
                // console.log('industryPersonInEdition', industryPersonInEdition, 'editionId', editionIds)
                p[industryPersonInEdition] = p.festival_editions.some(fe => editionIds.includes(fe.id))
            }
            return p
        })
        // filter out persons who are not in any active edition
        .filter(p => {
            return activeCategories.some(activeEdition => p[activeEdition])
        })
    console.log('activePersons', activePersons.length)
    return activePersons
}

function getActiveOrganisations() {
    const STRAPIDATA_ORGANISATION = yaml.load(fs.readFileSync(strapiDataPathOrg, 'utf8'))

    const minimodel = {
        'role_at_films': {
            model_name: 'RoleAtFilm'
        },
        'awardings': {
            model_name: 'Awarding'
        },
        'filmographies': {
            model_name: 'Filmography'
        },
        'clients': {
            model_name: 'Organisation'
        },
        'addr_coll': {
            model_name: 'Address',
            expand: {
                'country': {
                    model_name: 'Country'
                },
                'county': {
                    model_name: 'County'
                },
                'municipality': {
                    model_name: 'Municipality'
                }
            }
        },
        'country': {
            model_name: 'Country'
        },
        'tag_looking_fors': {
            model_name: 'TagLookingFor'
        },
        'languages': {
            model_name: 'Language'
        }
    }
    console.log(`Fetching ${DOMAIN} organisation data`)
    const STRAPIDATA_ALL_ORGANISATIONS = fetchModel(STRAPIDATA_ORGANISATION, minimodel)
    console.log(`Fetched ${STRAPIDATA_ALL_ORGANISATIONS.length} ${DOMAIN} organisation data`)

    const activeCategories = Object.keys(INDUSTRY_ORGANISATION_IN_EDITIONS)
    console.log('activeCategories', activeCategories)
    const activeOrganisations = STRAPIDATA_ALL_ORGANISATIONS
        // filter out organisations who have no festival_editions
        .filter(p => p.festival_editions && p.festival_editions.length)
        // set is_in_industry and is_in_creative and ... to true/false based on festival_editions of the organisation
        .map(p => {
            for (const [industryOrganisationInEdition, editionIds] of Object.entries(INDUSTRY_ORGANISATION_IN_EDITIONS)) {
                p[industryOrganisationInEdition] = p.festival_editions.some(fe => editionIds.includes(fe.id))
            }
            return p
        })
        // filter out organisations who are not in any active edition
        .filter(p => {
            return activeCategories.some(activeEdition => p[activeEdition])
        })
    console.log('activeOrganisations', activeOrganisations.length)
    return activeOrganisations
}

function mSort(to_sort) {
    // Töötav sorteerimisfunktsioon filtritele

    let sortable = []
    for (var item in to_sort) {
        sortable.push([item, to_sort[item]]);
    }

    sortable = sortable.sort(function (a, b) {
        try {
            const locale_sort = a[1].localeCompare(b[1], lang)
            return locale_sort
        } catch (error) {
            console.log('failed to sort', JSON.stringify({ a, b }, null, 4));
            throw new Error(error)
        }
    });

    var objSorted = {}
    for (let index = 0; index < sortable.length; index++) {
        const item = sortable[index];
        objSorted[item[0]] = item[1]
    }
    return objSorted
}
