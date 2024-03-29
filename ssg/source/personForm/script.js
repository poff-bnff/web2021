requireLogin()
let personId = null

// Non-trivial fields
const valueMap = {
    gender: 'gender.id',
    native_lang: 'native_lang.id',
    stature: 'stature.id',
    eye_colour: 'eye_colour.id',
    hair_colour: 'hair_colour.id',
    hair_length: 'hair_length.id',
    pitch_of_voice: 'pitch_of_voice.id',
    country: 'addr_coll.country',
    county: 'addr_coll.county',
    municipality: 'addr_coll.municipality',
    popul_place: 'addr_coll.popul_place',
    street_name: 'addr_coll.street_name',
    address_number: 'addr_coll.address_number',
    appartment: 'addr_coll.appartment',
    postal_code: 'addr_coll.postal_code',
}

const selectorMap = {
    gender: null,
    native_lang: null,
    stature: null,
    eye_colour: null,
    hair_colour: null,
    hair_length: null,
    pitch_of_voice: null,
    country: null,
}

const formFields = {
    email: [
        'eMail',
        'repr_email',
    ],
    year: [
        'year_from', // prof education
        'year_to',
    ],
    url: [
        'repr_org_url',
        'acc_imdb',
        'acc_efis',
        'acc_castupload',
        'acc_etalenta',
        'acc_instagram',
        'acc_fb',
        'acc_other',
        'showreel',
    ],
    phone: [
        'phoneNr',
        'repr_phone',
    ],
    number: [
        'weight_kg',
        'acting_age_from',
        'acting_age_to',
        'height_cm',
    ],
    text: [
        'firstName', // y
        'lastName', // y
        'gender', // y
        'repr_org_name',
        'repr_p_name',
        'native_lang',
        'stature', // y
        'eye_colour', // y
        'hair_colour',
        'hair_length',
        'pitch_of_voice',
        'bio_en',
        'skills_en',
        'looking_for',
        'country',
        'county',
        'municipality',
        'popul_place',
        'street_name',
        'address_number',
        'appartment',
        'postal_code',
    ],
    date: [
        'dateOfBirth',
    ]
}

const fillPersonForm = (person) => {
    const valueInPerson = (key) => {
        if ( valueMap[key] ) {
            const path = valueMap[key].split('.')
            let value = person
            for (let i = 0; i < path.length; i++) {
                value = value[path[i]]
            }
            return value
        } else {
            return person[key]
        }
    }

    const fill = () => {
        return {
            text: () => {
                for (let i = 0; i < formFields.text.length; i++) {
                    const field = formFields.text[i]
                    try {
                        if (selectorMap[field]) {
                            document.querySelector(`#${field} option[value="${valueInPerson(field)}"]`).selected=true
                        } else {
                            document.getElementById(field).value = valueInPerson(field)
                        }
                    } catch (error) {
                        console.log(`No text field in data with id ${field}`)
                    }
                }
            },
            email: () => {
                for (let i = 0; i < formFields.email.length; i++) {
                    const field = formFields.email[i]
                    try {
                        document.getElementById(field).value = person[field]
                    } catch (error) {
                        console.log(`No email field in data with id ${field}`)
                    }
                }
            },
            date: () => {
                for (let i = 0; i < formFields.date.length; i++) {
                    const field = formFields.date[i]
                    try {
                        document.getElementById(field).value = person[field]
                    } catch (error) {
                        console.log(`No date field in data with id ${field}`)
                    }
                }
            },
            url: () => {
                for (let i = 0; i < formFields.url.length; i++) {
                    const field = formFields.url[i]
                    try {
                        document.getElementById(field).value = person[field]
                    } catch (error) {
                        console.log(`No url field in data with id ${field}`)
                    }
                }
            },
            number: () => {
                for (let i = 0; i < formFields.number.length; i++) {
                    const field = formFields.number[i]
                    try {
                        document.getElementById(field).value = person[field]
                    } catch (error) {
                        console.log(`No number field in data with id ${field}`)
                    }
                }
            },
            phone: () => {
                for (let i = 0; i < formFields.phone.length; i++) {
                    const field = formFields.phone[i]
                    try {
                        document.getElementById(field).value = person[field]
                    } catch (error) {
                        console.log(`No phone field in data with id ${field}`)
                    }
                }
            },
        }
    }

    // Fill the fields with existing info
    fill().text()
    fill().email()
    fill().date()
    fill().url()
    fill().number()
    fill().phone()
    setRepeatableFields(person.role_at_films, addNextRoleAtFilm)
    setRepeatableFields(person.tag_looking_fors, addNextTagLookingFor)
    setRepeatableFields(person.other_lang, addNextOtherLang)
    const educations = person.filmographies.filter(f => f.type_of_work === 7)
    const filmographies = person.filmographies.filter(f => f.type_of_work !== 7)
    setRepeatableFields(educations, addNextEducation)
    setRepeatableFields(filmographies, addNextFilmographyWork)

    addExistingGalleryImages(person?.images)
    addExistingProfileImg(person.picture)

    function setRepeatableFields(fields, responsibleFunction) {
        for (let i = 0; i < fields.length; i++) {
            const field = fields[i];
            responsibleFunction(field)
        }
    }
    // add existing id's to hidden fields
    // addr_coll,
    if (person.addr_coll) {
        document.getElementById('addr_strapi_id').value = person.addr_coll.id
    }

}

// Get my person profile. If not found, create one
const fetchPerson = async () => {
    const accessToken = localStorage.getItem('ID_TOKEN')
    const headers = { Authorization: `Bearer ${accessToken}` }
    const url = `${huntAuthDomain}/api/person`

    const response = await fetch(url, { headers })
    const data = await response.json()
    personId = data.id
    return data
}

const finishedSave = (status) => {
    if (status === 200) {
        document.getElementById('personProfileSent').open = true
        scrollToElement("personProfileSent")
    }
}

// Self-invoking function to start the script
;(async () => {
    requireLogin()
    const person = await fetchPerson()
    console.log('person', person)
    fillPersonForm(person)
    document.getElementById('loadingStatus').style.display = 'none'
})()


// Martini kood
// sellest plokist tõstan ükshaaaval koodi ülespoole, kui tarvis
// ----------------------------
let profileImageToSend = "empty"
let galleryImageToSend = {}
let audioFileToSend = "empty"
let galleryCounter = 0
let galleryExistingImageCounter = 0
let roleAtFilmCounter = 0
let tagLookingForCounter = 0
let otherLangCounter = 0
let filmographiesToDelete = []
let existingGalleryImagesToDelete = []
let profileId = null
// ----------------------------


async function fillThePersonForm(person) {
    console.log('fillThePersonForm', person)
    // console.log('fillThePersonForm', JSON.stringify(person));
    delete person.country

    // Fill the fields with existing info
    setTextFieldsByID(person)
    setRepeatableFields(person.role_at_films, addNextRoleAtFilm)
    setRepeatableFields(person.tag_looking_fors, addNextTagLookingFor)
    setRepeatableFields(person?.other_lang, addNextOtherLang)
    setRepeatableFields(person?.filmographies?.filter(f => f.type_of_work.id === 7), addNextEducation)
    setRepeatableFields(person?.filmographies?.filter(f => f.type_of_work.id != 7), addNextFilmographyWork)

    // Display existing gallery images
    addExistingGalleryImages(person?.images)

    // Display existing profile image
    addExistingProfileImg(person.picture)

    if (person.addr_coll) {
        document.getElementById('addr_strapi_id').value = person.addr_coll.id
    }

    function setTextFieldsByID(obj) {
        for (let key in obj) {
            // console.log(key, isJsonString(obj[key]));
            if (obj.hasOwnProperty(key)) {
                try {
                    // console.log('SET: ', key, typeof key, obj[key], typeof obj[key]);
                    document.getElementById(key).value = obj[key]
                } catch (error) {
                    // console.log('SET FAIL: ', key, typeof key, obj[key]);
                }
            } else if (!Array.isArray(obj[key])) {
                // console.log(key, 'ARRAY');
                setTextFieldsByID(obj[key])
            }
        }
    }

    function setRepeatableFields(fields, responsibleFunction) {
        for (let i = 0; i < fields.length; i++) {
            const field = fields[i];
            responsibleFunction(field)
        }
    }
}

async function sendPersonProfile() {
    document.getElementById('savingStatus').style.display = 'block'

    // document.getElementById('personProfileSent').style.display = 'none'

    let saveProfileButton = document.getElementById(`saveProfileButton`)
    saveProfileButton.disabled = true
    let previousInnerHTML = saveProfileButton.innerHTML
    saveProfileButton.innerHTML = `<i class="fa fa-spinner fa-spin"></i>`

    // Role at films data processing
    let roleAtFilmData = []
    let roleAtFilmElements = document.querySelectorAll('[id^="filmRole"]')
    for (let index = 0; index < roleAtFilmElements.length; index++) {
        const element = roleAtFilmElements[index];
        roleAtFilmData.push(
            element.getElementsByClassName('role_at_film')[0].value,
        )
        element.remove()
    }

    // Tag Looking For data processing
    let tagLookingForData = []
    let tagLookingForElements = document.querySelectorAll('[id^="tagLookingElement"]')
    for (let index = 0; index < tagLookingForElements.length; index++) {
        const element = tagLookingForElements[index];
        tagLookingForData.push(
            element.getElementsByClassName('tag_looking_for')[0].value,
        )
        element.remove()
    }

    // Tag Looking For data processing
    let otherLangData = []
    let otherLangElements = document.querySelectorAll('[id^="otherLangElement"]')
    for (let index = 0; index < otherLangElements.length; index++) {
        const element = otherLangElements[index];
        otherLangData.push(
            element.getElementsByClassName('other_lang')[0].value,
        )
        element.remove()
    }

    // Prof education data processing
    let profEducationData = []
    let profEducationElements = selectElementsByRegex(educationElementRe) // document.querySelectorAll('[id^="education"]')
    for (let index = 0; index < profEducationElements.length; index++) {
        const element = profEducationElements[index]
        const eduData = {
            type_of_work: '7',
            year_from: element.getElementsByClassName('year_from')[0].value || null,
            year_to: element.getElementsByClassName('year_to')[0].value || null,
            org_name: element.getElementsByClassName('org_name')[0].value || null,
            org_department: element.getElementsByClassName('org_department')[0].value || null,
            degree: element.getElementsByClassName('degree')[0].value || null,
            org_url: element.getElementsByClassName('org_url')[0].value || null,
        }
        const strapiId = element.getElementsByClassName('strapi_id')[0].value
        if (strapiId) {
            eduData.id = strapiId
        }
        profEducationData.push( eduData )
        element.remove()
    }

    // Filmographies data processing
    let filmographiesData = []
    let filmographiesElements = selectElementsByRegex(filmographyElementRe) // document.querySelectorAll('[id^="filmographies"]')
    for (let index = 0; index < filmographiesElements.length; index++) {
        const element = filmographiesElements[index]
        const filmData = {
            type_of_work: element.getElementsByClassName('type_of_work')[0].value || null,
            role_at_films: element.getElementsByClassName('role_at_films')[0].value || null,
            year_from: element.getElementsByClassName('year_from')[0].value || null,
            year_to: element.getElementsByClassName('year_to')[0].value || null,
            work_name: element.getElementsByClassName('work_name')[0].value || null,
            work_url: element.getElementsByClassName('work_url')[0].value || null,
            actor_role: element.getElementsByClassName('actor_role')[0].value || null,
            org_name: element.getElementsByClassName('org_name')[0].value || null,
            org_url: element.getElementsByClassName('org_url')[0].value || null,
        }
        const strapiId = element.getElementsByClassName('strapi_id')[0].value
        if (strapiId) {
            filmData.id = strapiId
        }
        filmographiesData.push( filmData )
        element.remove()
    }

    let personToSend = {
        id: personId,
        firstName: firstName.value,
        lastName: lastName.value,
        // role_at_films: roleatfilm.value || null,
        gender: gender.value,
        dateOfBirth: dateOfBirth.value,
        phoneNr: phoneNr.value || null,
        eMail: eMail.value || null,
        repr_org_name: repr_org_name.value || null,
        repr_org_url: repr_org_url.value || null,
        repr_p_name: repr_p_name.value || null,
        repr_phone: repr_phone.value || null,
        repr_email: repr_email.value || null,
        dateOfBirth: dateOfBirth.value || null,
        native_lang: native_lang.value || null,
        acting_age_from: acting_age_from.value || null,
        acting_age_to: acting_age_to.value || null,
        height_cm: height_cm.value || null,
        weight_kg: weight_kg.value || null,
        stature: stature.value || null,
        eye_colour: eye_colour.value || null,
        hair_colour: hair_colour.value || null,
        hair_length: hair_length.value || null,
        pitch_of_voice: pitch_of_voice.value || null,
        acc_imdb: acc_imdb.value || null,
        acc_efis: acc_efis.value || null,
        acc_castupload: acc_castupload.value || null,
        acc_etalenta: acc_etalenta.value || null,
        acc_instagram: acc_instagram.value || null,
        acc_fb: acc_fb.value || null,
        acc_other: acc_other.value || null,
        showreel: showreel.value || null,
        bio_en: bio_en.value || null,
        skills_en: skills_en.value || null,
        looking_for: looking_for.value || null,
        addr_coll: {
            id: addr_strapi_id.value || null,
            country: country.value || null,
            county: county.value || null,
            municipality: municipality.value || null,
            popul_place: popul_place.value || null,
            street_name: street_name.value || null,
            address_number: address_number.value || null,
            appartment: appartment.value || null,
            postal_code: postal_code.value || null,
        },
        // filmographies: {
        //     // type_of_work: type_of_work.value || null,
        //     // year_from: year_from.value || null,
        //     // year_to: year_to.value || null,
        //     // org_name: org_name.value || null,
        //     // org_department: org_department.value || null,
        //     // org_url: org_url.value || null,
        //     // degree: degree.value || null,
        //     // work_name: work_name.value || null,
        //     // work_url: work_url.value || null,
        //     // actor_role: actor_role.value || null,
        //     // role_at_films: roleatfilm.value || null,
        // },
        // profEducations: profEducationData,
        role_at_films: roleAtFilmData,
        tag_looking_fors: tagLookingForData,
        other_lang: otherLangData,
        filmographies: filmographiesData.concat(profEducationData),
        filmographiesToDelete: filmographiesToDelete.length ? filmographiesToDelete : null,
        existingGalleryImagesToDelete: existingGalleryImagesToDelete.length ? existingGalleryImagesToDelete : null,

    }

    const formData = new FormData()

    // console.log('personToSend', personToSend)
    formData.append('data', JSON.stringify(personToSend))

    if (profileImageToSend !== "empty") {
        formData.append(`files.picture`, profileImageToSend, profileImageToSend.name)
    }

    if (audioFileToSend !== "empty") {
        formData.append(`files.audioreel`, audioFileToSend, audioFileToSend.name)
    }

    if (Object.keys(galleryImageToSend).length !== 0) {
        Object.keys(galleryImageToSend).map(key => {
            console.log('Gallery img', galleryImageToSend[key])
            formData.append(`files.images`, galleryImageToSend[key], galleryImageToSend[key].name)
        })
    }

    // Log form data
    // console.log('Formdata')
    // for (var pair of formData.entries()) {
    //     console.log(pair[0] + ', ' + pair[1]);
    // }

    console.log("kasutaja profiil mida saadan ", personToSend)

    let response = await (await fetch(`${huntAuthDomain}/api/person`, {
        method: 'PUT',
        headers: {
            Authorization: 'Bearer ' + localStorage.getItem('ID_TOKEN')
        },
        body: formData
    }))

    console.log(response)
    document.getElementById('savingStatus').style.display = 'none'

    console.log('Responsestatus', response.status)

    finishedSave(response.status)

    if (response.status === 200) {

        saveProfileButton.disabled = false
        saveProfileButton.innerHTML = previousInnerHTML

        let galleryImageForms = document.querySelectorAll('[id^="galleryImage"]')
        for (let index = 0; index < galleryImageForms.length; index++) {
            const element = galleryImageForms[index];
            element.remove()
        }
        galleryCounter = 0
        galleryExistingImageCounter = 0
        existingGalleryImagesToDelete = []
        galleryImageToSend = {}
        profileImg.value = ''
        document.getElementsByClassName('imgPreview')[0].src = '/assets/img/static/hunt_square_placeholder.jpg'

        profEducationData = []
        roleAtFilmData = []
        tagLookingForData = []
        otherLangData = []
        filmographiesData = []

        roleAtFilmCounter = 0
        tagLookingForCounter = 0
        otherLangCounter = 0
        filmographiesToDelete = []

        console.log('OK');
        document.getElementById('personProfileSent').open = true;

        // Scroll page to dialog
        scrollToElement("personProfileSent")

    }

    // reload page
    console.log('DONE')
}

function validatePersonForm() {
    console.log('validatePersonForm')
    const errors = []

    if (!validateRequiredField("firstName", "textLength")) {
        errors.push('firstName')
    }

    if (!validateRequiredField("lastName", "textLength")) {
        errors.push('lastName')
    }

    if (!validateRequiredField("gender", "gender")) {
        errors.push('gender')
    }

    if (!validateRequiredField("dateOfBirth", "dateOfBirth")) {
        errors.push('dateOfBirth')
    }

    if (document.getElementById('eMail').value.length > 0) {
        if (!validateEmail("eMail")) {
            errors.push('eMail')
        }
    }

    let roleAtFilmElements = document.querySelectorAll('[id^="filmRole"]') // document.querySelectorAll('[id^="filmRole"]')
    for (let index = 0; index < roleAtFilmElements.length; index++) {
        const element = roleAtFilmElements[index];
        if (!validateRepeatableFormPart(element.getElementsByClassName('role_at_film')[0], element.getElementsByClassName('help')[0])) {
            errors.push(element.id)
        }
    }

    let tagLookingForElements = document.querySelectorAll('[id^="tagLookingElement"]') // document.querySelectorAll('[id^="tagLookingElement"]')
    for (let index = 0; index < tagLookingForElements.length; index++) {
        const element = tagLookingForElements[index];
        if (!validateRepeatableFormPart(element.getElementsByClassName('tag_looking_for')[0], element.getElementsByClassName('help')[0])) {
            errors.push(element.id)
        }
    }

    const educationElements = selectElementsByRegex(/^education\d*$/) // document.querySelectorAll('[id^="education"]')
    for (let index = 0; index < educationElements.length; index++) {
        const element = educationElements[index];
        if (!validateRepeatableFormPart(element.getElementsByClassName('org_name')[0], element.getElementsByClassName('org_name_help')[0])) {
            errors.push(element.id)
        }
    }

    let filmographyElements = selectElementsByRegex(/^filmographies\d*$/) // document.querySelectorAll('[id^="filmographies"]')
    for (let index = 0; index < filmographyElements.length; index++) {
        const element = filmographyElements[index];
        if (!validateRepeatableFormPart(element.getElementsByClassName('type_of_work')[0], element.getElementsByClassName('type_of_work_help')[0])) {
            errors.push(element.id)
        }
        if (!validateRepeatableFormPart(element.getElementsByClassName('work_name')[0], element.getElementsByClassName('work_name_help')[0])) {
            errors.push(element.id)
        }
    }

    console.log('errors', errors)

    if (errors.length === 0) {
        console.log('KÕIKOK');
        sendPersonProfile()
    } else {
        scrollToElement(errors[0])
    }

    window.addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
            // console.log("ENTER")
            validatePersonForm()
        }
    })
}

function validateRequiredField(formFieldId = null, type = null) {
    console.log('validateRequiredField', formFieldId, type)
    let formField = document.getElementById(formFieldId)
    let formFieldHelp = document.getElementById(`${formFieldId}Help`)

    console.log('formFieldId', formFieldId, 'type', type)

    if (!type || type === 'textLength') {
        if (formField.value == "" || formField.value.length < 2 || !isNaN(formField.value)) {
            addInvalidClass(formField, formFieldHelp)
            return false
        } else {
            removeInvalidClass(formField, formFieldHelp)
            return true
        }
    } else if (type === 'gender') {
        if (formField.value === "") {
            addInvalidClass(formField, formFieldHelp)
            return false
        } else {
            removeInvalidClass(formField, formFieldHelp)
            return true
        }
    } else if (type === 'dateOfBirth') {
        console.log('BDAY', formField.value)
        if (formField.value === "") {
            addInvalidClass(formField, formFieldHelp)
            return false
        }

        var userAge = getAge(formField.value)
        if (userAge > 12 && userAge < 116) {
            removeInvalidClass(formField, formFieldHelp)
            return true
        } else {
            addInvalidClass(formField, formFieldHelp)
        }
    }
}

function validateRepeatableFormPart(selectElement, selectHelp) {
    console.log('selectElement', selectElement, 'selectHelp', selectHelp)
    if (selectElement.value === "") {
        addInvalidClass(selectElement, selectHelp)
        return false
    } else {
        removeInvalidClass(selectElement, selectHelp)
        return true
    }
}

function addInvalidClass(formField, formFieldHelp) {
    formFieldHelp.classList.remove("valid")
    formFieldHelp.classList.add("invalid")
    formField.classList.add('invalidColor')
}

function removeInvalidClass(formField, formFieldHelp) {
    formFieldHelp.classList.remove("invalid")
    formFieldHelp.classList.add("valid")
    formField.classList.remove('invalidColor')
}

function scrollToElement(elementId) {
    document.getElementById(elementId).scrollIntoView(false)
}

function validateImageAndPreview(file, imageElementId, type) {
    console.log('validateImageAndPreview', file, imageElementId, type)

    let error = document.getElementById("imgError")
    // Check if the file is an image.
    if (!file.type.includes("image")) {
        // console.log("File is not an image.", file.type, file);
        error.innerHTML = "File is not an image."
    } else if (file.size / 1024 / 1024 > 5) {
        error.innerHTML = "Image can be max 5MB, uploaded image was " + (file.size / 1024 / 1024).toFixed(2) + "MB"
    } else {
        error.innerHTML = ""
        // Preview
        var reader = new FileReader()
        reader.onload = function () {
            console.log('agasiia')
            let previewElement = document.getElementById(imageElementId).getElementsByClassName('imgPreview')[0]
            console.log('previewElement', previewElement)
            previewElement.src = reader.result
            console.log(previewElement)
        }
        reader.readAsDataURL(file)
        if (type === 'profile') {
            profileImageToSend = file
        } else if (type === 'gallery') {
            console.log(galleryCounter, galleryImageToSend)
            galleryImageToSend[imageElementId] = file
        }
    }
}

function validateAudioAndPreview(file) {
    console.log('validateAudioAndPreview', file)
    let error = document.getElementById("audioError")
    // Check if the file is an image.
    if (!file.type.includes("audio")) {
        // console.log("File is not an image.", file.type, file);
        error.innerHTML = "File is not an audio"
    } else if (file.size / 1024 / 1024 > 5) {
        error.innerHTML = "Audioreel can be max 5MB, uploaded audio was " + (file.size / 1024 / 1024).toFixed(2) + "MB"
    } else {
        error.innerHTML = "";
        // Preview
        var reader = new FileReader()
        reader.onload = function () {
            // let previewElement = document.getElementById(templateElement).getElementsByClassName('imgPreview')[0]
            // console.log('previewElement', previewElement);
            // previewElement.src = reader.result;
            // console.log(previewElement);
        };
        reader.readAsDataURL(file);
        audioFileToSend = file
    }
}

function addGalleryImage() {
    console.log('addGalleryImage')
    const galleryTemplate = document.getElementById('galleryTemplate')
    const clone = galleryTemplate.cloneNode(true)
    clone.id = `galleryImage${galleryCounter}`
    clone.style.display = ''
    document.getElementById('galleryTemplate').parentElement.appendChild(clone)
    let thisElement = document.getElementById(clone.id)

    thisElement.getElementsByClassName('galleryImg')[0].setAttribute('onchange', `validateImageAndPreview(this.files[0], "${clone.id}", "gallery")`)
    thisElement.getElementsByClassName('deleteGalleryImage')[0].setAttribute('onclick', `deleteGalleryImage("${clone.id}")`)

    galleryCounter = galleryCounter + 1
}

function addExistingGalleryImages(imagesData) {
    console.log('addExistingGalleryImages', imagesData)
    imagesData.map(img => {
        const galleryTemplate = document.getElementById('galleryTemplate')
        const clone = galleryTemplate.cloneNode(true)
        clone.id = `existingGalleryImage${galleryExistingImageCounter}`
        clone.style.display = ''
        document.getElementById('galleryTemplate').parentElement.appendChild(clone)
        let thisElement = document.getElementById(`existingGalleryImage${galleryExistingImageCounter}`)
        // Remove input field for image
        thisElement.getElementsByClassName('galleryImg')[0].remove()
        // Add existing image
        thisElement.getElementsByClassName('imgPreview')[0].src = `https://assets.poff.ee/img/${img.hash}${img.ext}`
        // thisElement.getElementsByClassName('imgPreview')[0].src = `http://localhost:1337/uploads/${img.hash}${img.ext}`
        // Remove input field for photographer (whole .form_group element)
        thisElement.getElementsByClassName('galleryImagePhotographer')[0].parentElement.remove()
        // Remove input field and label for photo year (whole .form_group element)
        thisElement.getElementsByClassName('galleryImageYear')[0].parentElement.remove()
        // Add photographer and year by thext
        const textElement = document.createElement("p")
        textElement.classList.add('d-none')
        const text = document.createTextNode(`${img.alternativeText} (${img.caption})`);
        textElement.appendChild(text);
        thisElement.appendChild(textElement);

        thisElement.getElementsByClassName('deleteGalleryImage')[0].setAttribute('onclick', `deleteGalleryImage("existingGalleryImage${galleryExistingImageCounter}", ${img.id})`)

        galleryExistingImageCounter = galleryExistingImageCounter + 1
    })
}

function addExistingProfileImg(imageData) {
    console.log('addExistingProfileImg', imageData)
    if (imageData) {
        const profileImgElement = document.getElementById('profileImage')
        const profileImgPreview = profileImgElement.getElementsByClassName('imgPreview')[0]
        profileImgPreview.src = `https://assets.poff.ee/img/${imageData.hash}${imageData.ext}`
        // profileImgPreview.src = `http://localhost:1337/uploads/${imageData.hash}${imageData.ext}`

        const profileImgLabel = profileImgElement.getElementsByClassName('person_profile_label')[0]
        profileImgLabel.innerHTML = `${profileImgLabel.innerHTML} (adding new image, replaces the current one)`

        const textElement = document.createElement("p")
        textElement.classList.add('d-none')
        const text = document.createTextNode(`${imageData.alternativeText} (${imageData.caption})`);
        textElement.appendChild(text);
        profileImgElement.appendChild(textElement);
    }
}

function deleteGalleryImage(elementToDelete, existingImageID = null) {
    console.log('deleteGalleryImage', elementToDelete, existingImageID)
    const elementToBeDeleted = document.getElementById(elementToDelete)
    elementToBeDeleted.remove()
    if (!existingImageID && galleryImageToSend[elementToDelete]) {
        delete galleryImageToSend[elementToDelete]
    }
    if (existingImageID) {
        existingGalleryImagesToDelete.push(existingImageID)
    }
}

function addNextRoleAtFilm(data = null) {
    console.log('addNextRoleAtFilm', data)
    const cloneElementPrefix = 'filmRole'
    const roleAtFilmTemplate = document.getElementById('roleAtFilmTemplate')
    const clone = roleAtFilmTemplate.cloneNode(true)
    clone.id = `${cloneElementPrefix}${roleAtFilmCounter}`
    clone.style.display = ''
    document.getElementById('roleAtFilmTemplate').parentElement.appendChild(clone)

    let thisElement = document.getElementById(`${cloneElementPrefix}${roleAtFilmCounter}`)
    let deleteButton = thisElement.getElementsByClassName('deleteButton')[0]
    deleteButton.classList.add(`delete${cloneElementPrefix}`)
    deleteButton.setAttribute('onclick', `removeElement("${cloneElementPrefix}${roleAtFilmCounter}", true, "delete${cloneElementPrefix}")`)

    // Fill with existing info
    if (data?.id) {
        thisElement.getElementsByClassName('role_at_film')[0].value = data.id
    }

    roleAtFilmCounter = roleAtFilmCounter + 1
}

function addNextTagLookingFor(data = null) {
    console.log('addNextTagLookingFor', data)
    const cloneElementPrefix = 'tagLookingElement'
    const tagLookingForTemplate = document.getElementById('tagLookingForTemplate')
    const clone = tagLookingForTemplate.cloneNode(true)
    clone.id = `${cloneElementPrefix}${tagLookingForCounter}`
    clone.style.display = ''
    document.getElementById('tagLookingForTemplate').parentElement.appendChild(clone)

    let thisElement = document.getElementById(`${cloneElementPrefix}${tagLookingForCounter}`)
    let deleteButton = thisElement.getElementsByClassName('deleteButton')[0]
    deleteButton.classList.add(`delete${cloneElementPrefix}`)
    deleteButton.setAttribute('onclick', `removeElement("${cloneElementPrefix}${tagLookingForCounter}", true, "delete${cloneElementPrefix}")`)

    // Fill with existing info
    if (data?.id) {
        thisElement.getElementsByClassName('tag_looking_for')[0].value = data.id
    }

    tagLookingForCounter = tagLookingForCounter + 1
}

function addNextOtherLang(data = null) {
    console.log('addNextOtherLang', data)
    const cloneElementPrefix = 'otherLangElement'
    const otherLangTemplate = document.getElementById('otherLangTemplate')
    const clone = otherLangTemplate.cloneNode(true)
    clone.id = `${cloneElementPrefix}${otherLangCounter}`
    clone.style.display = ''
    document.getElementById('otherLangTemplate').parentElement.appendChild(clone)

    let thisElement = document.getElementById(`${cloneElementPrefix}${otherLangCounter}`)
    let deleteButton = thisElement.getElementsByClassName('deleteButton')[0]
    deleteButton.classList.add(`delete${cloneElementPrefix}`)
    deleteButton.setAttribute('onclick', `removeElement("${cloneElementPrefix}${otherLangCounter}")`)

    // Fill with existing info
    if (data?.id) {
        thisElement.getElementsByClassName('other_lang')[0].value = data.id
    }

    otherLangCounter = otherLangCounter + 1
}

const educationElementPrefix = 'education'
const educationElementRe = /^education\d+$/
function addNextEducation(data = null) {
    const educationElementCounter = selectElementsByRegex(educationElementRe).length
    console.log('addNextEducation', {data, count: educationElementCounter})
    const profEducationTemplate = document.getElementById('profEducationTemplate')
    const clone = profEducationTemplate.cloneNode(true)
    clone.id = `${educationElementPrefix}${educationElementCounter}`
    clone.style.display = ''
    profEducationTemplate.parentElement.appendChild(clone)

    let deleteButton = clone.getElementsByClassName('deleteButton')[0]
    deleteButton.classList.add(`delete${educationElementPrefix}`)
    deleteButton.setAttribute('onclick', `removeElement("${clone.id}")`)

    // Fill with existing info
    if (data) {
        const dataKeys = Object.keys(data);
        dataKeys.map(k => {
            try {
                clone.getElementsByClassName(k)[0].value = data[k]
                // Add Strapi ID, if it exists, to hidden field
                if (data.id) {
                    clone.getElementsByClassName('strapi_id')[0].value = data.id
                }
            } catch (error) {
                null
            }
        })
    }
}

const filmographyElementPrefix = 'filmographies'
const filmographyElementRe = /^filmographies\d+$/
function addNextFilmographyWork(data = null) {
    const filmographyCounter = selectElementsByRegex(filmographyElementRe).length
    console.log('addNextFilmographyWork', {data, count: filmographyCounter})
    const filmographyTemplate = document.getElementById('filmographyTemplate')
    const clone = filmographyTemplate.cloneNode(true)
    clone.id = `${filmographyElementPrefix}${filmographyCounter}`
    clone.style.display = ''
    filmographyTemplate.parentElement.appendChild(clone)

    let deleteButton = clone.getElementsByClassName('deleteButton')[0]
    deleteButton.classList.add(`delete${filmographyElementPrefix}`)
    deleteButton.setAttribute('onclick', `removeElement("${clone.id}")`)

    // Fill with existing info
    if (data) {
        const dataKeys = Object.keys(data);
        dataKeys.map(k => {
            try {
                clone.getElementsByClassName(k)[0].value = typeof data[k] === 'object' && data[k] !== null ? data[k].id : data[k]
                // Add Strapi ID, if it exists, to hidden field
                if (data.id) {
                    clone.getElementsByClassName('strapi_id')[0].value = data.id
                    // Fill role_at_film for filmography as it is repeatable
                    if (k === 'role_at_films' && data[k][0]) {
                        clone.getElementsByClassName(k)[0].value = data[k][0].id
                    }
                }
            } catch (error) {
                null
            }
        })
    }
}

function removeElement(id, required = false, requiredElementName = null) {
    console.log('removeElement', id, required, requiredElementName)
    const theElement = document.getElementById(id)

    if (required && requiredElementName) {
        let requiredCount = document.getElementsByClassName(requiredElementName)
        console.log('requiredCount', requiredCount);
        if (requiredCount.length >= 2) {
            theElement.remove()
            removeFilmEduFromStrapi(theElement)
            removeInvalidClass(theElement, theElement.getElementsByClassName('help')[0])
        } else {
            addInvalidClass(theElement, theElement.getElementsByClassName('help')[0])
        }
    } else {
        theElement.remove()
        removeFilmEduFromStrapi(theElement)
    }
}

function removeFilmEduFromStrapi(theElement) {
    console.log('removeFilmEduFromStrapi', theElement)
    let strapiId
    try {
        strapiId = theElement.getElementsByClassName('strapi_id')[0].value
    } catch (error) { }
    if (strapiId > 0) {
        filmographiesToDelete.push(strapiId)
    }
}

function isJsonString(jsonString) {
    console.log('isJsonString', jsonString)
    return true
}

const samplePerson = {
    "id": 19576,
    "created_at": "2023-11-13T08:40:51.679Z",
    "updated_at": "2023-11-13T08:42:19.158Z",
    "firstName": "Mihkel",
    "lastName": "Putrinš",
    "gender": null,
    "phoneNr": null,
    "eMail": "mihkel@ww.ee",
    "dateOfBirth": null,
    "biography": null,
    "filmography": null,
    "profession": null,
    "firstNameLastName": "Mihkel Putrinš",
    "remoteId": null,
    "pageUrl": null,
    "user": null,
    "native_language": null,
    "height_cm": null,
    "weight_kg": null,
    "eye_colour": null,
    "hair_colour": null,
    "shoe_size": null,
    "stature": null,
    "pitch_of_voice": null,
    "eventival_id": null,
    "ev_account_email": null,
    "ev_contact_email": null,
    "ev_country": null,
    "ev_org_name": null,
    "ev_job_title": null,
    "bio_et": null,
    "bio_en": null,
    "bio_ru": null,
    "ev_professions": null,
    "ev_fow": null,
    "ev_img_url": null,
    "addr_coll": null,
    "hair_length": null,
    "native_lang": null,
    "showreel": null,
    "acting_age_from": null,
    "acting_age_to": null,
    "country": null,
    "acc_imdb": null,
    "acc_efis": null,
    "acc_castupload": null,
    "acc_instagram": null,
    "acc_fb": null,
    "acc_other": null,
    "webpage": null,
    "webpage_url": null,
    "slug_et": null,
    "slug_en": null,
    "slug_ru": null,
    "public": null,
    "repr_p_name": null,
    "repr_phone": null,
    "repr_email": null,
    "repr_org_name": null,
    "repr_org_url": null,
    "acc_etalenta": null,
    "skills_et": null,
    "skills_en": null,
    "skills_ru": null,
    "origin": null,
    "looking_for": null,
    "picture": {
      "id": 23721,
      "name": "emi_logu",
      "alternativeText": null,
      "caption": null,
      "width": 3121,
      "height": 1442,
      "formats": {
        "_big": {
          "ext": ".jpeg",
          "url": "/uploads/emi_logu_ebfdba7861_big.jpeg",
          "hash": "emi_logu_ebfdba7861_big",
          "mime": "image/jpeg",
          "name": "emi_big",
          "path": null,
          "size": 22.05,
          "width": 1041,
          "height": 481
        },
        "_med": {
          "ext": ".jpeg",
          "url": "/uploads/emi_logu_ebfdba7861_med.jpeg",
          "hash": "emi_logu_ebfdba7861_med",
          "mime": "image/jpeg",
          "name": "emi_med",
          "path": null,
          "size": 22.05,
          "width": 1041,
          "height": 481
        },
        "_small": {
          "ext": ".jpeg",
          "url": "/uploads/emi_logu_ebfdba7861_small.jpeg",
          "hash": "emi_logu_ebfdba7861_small",
          "mime": "image/jpeg",
          "name": "emi_small",
          "path": null,
          "size": 11.66,
          "width": 640,
          "height": 296
        },
        "thumbnail": {
          "ext": ".jpeg",
          "url": "/uploads/thumbnail_emi_logu_ebfdba7861.jpeg",
          "hash": "thumbnail_emi_logu_ebfdba7861",
          "mime": "image/jpeg",
          "name": "thumbnail_emi_logu",
          "path": null,
          "size": 3.45,
          "width": 245,
          "height": 113
        }
      },
      "hash": "emi_logu_ebfdba7861",
      "ext": ".jpeg",
      "mime": "image/jpeg",
      "size": 95.02,
      "url": "/uploads/emi_logu_ebfdba7861.jpeg",
      "previewUrl": null,
      "provider": "local",
      "provider_metadata": null,
      "created_at": "2023-11-13T08:42:06.948Z",
      "updated_at": "2023-11-13T08:42:06.948Z"
    },
    "profile_img": {
      "id": 23714,
      "name": "U_mihkel-putrinsh-gmail-com_18837",
      "alternativeText": null,
      "caption": null,
      "width": 300,
      "height": 300,
      "formats": {
        "_thumb_sq": {
          "ext": ".jpeg",
          "url": "/uploads/U_mihkel_putrinsh_gmail_com_18837_db6a0c0b15_thumb_sq.jpeg",
          "hash": "U_mihkel_putrinsh_gmail_com_18837_db6a0c0b15_thumb_sq",
          "mime": "image/jpeg",
          "name": "U_mihkel-putrinsh-gmail-com__thumb_sq",
          "path": null,
          "size": 3.11,
          "width": 100,
          "height": 100
        },
        "thumbnail": {
          "ext": ".jpeg",
          "url": "/uploads/thumbnail_U_mihkel_putrinsh_gmail_com_18837_db6a0c0b15.jpeg",
          "hash": "thumbnail_U_mihkel_putrinsh_gmail_com_18837_db6a0c0b15",
          "mime": "image/jpeg",
          "name": "thumbnail_U_mihkel-putrinsh-gmail-com_18837",
          "path": null,
          "size": 5.14,
          "width": 156,
          "height": 156
        }
      },
      "hash": "U_mihkel_putrinsh_gmail_com_18837_db6a0c0b15",
      "ext": ".jpeg",
      "mime": "image/jpeg",
      "size": 48.04,
      "url": "/uploads/U_mihkel_putrinsh_gmail_com_18837_db6a0c0b15.jpeg",
      "previewUrl": null,
      "provider": "local",
      "provider_metadata": null,
      "created_at": "2023-11-13T08:22:07.728Z",
      "updated_at": "2023-11-13T08:22:07.728Z"
    },
    "images": [
      {
        "id": 23722,
        "name": "emi_logu",
        "alternativeText": null,
        "caption": null,
        "width": 3121,
        "height": 1442,
        "formats": {
          "_big": {
            "ext": ".jpeg",
            "url": "/uploads/emi_logu_f4e7281a5c_big.jpeg",
            "hash": "emi_logu_f4e7281a5c_big",
            "mime": "image/jpeg",
            "name": "emi_big",
            "path": null,
            "size": 22.05,
            "width": 1041,
            "height": 481
          },
          "_med": {
            "ext": ".jpeg",
            "url": "/uploads/emi_logu_f4e7281a5c_med.jpeg",
            "hash": "emi_logu_f4e7281a5c_med",
            "mime": "image/jpeg",
            "name": "emi_med",
            "path": null,
            "size": 22.05,
            "width": 1041,
            "height": 481
          },
          "_small": {
            "ext": ".jpeg",
            "url": "/uploads/emi_logu_f4e7281a5c_small.jpeg",
            "hash": "emi_logu_f4e7281a5c_small",
            "mime": "image/jpeg",
            "name": "emi_small",
            "path": null,
            "size": 11.66,
            "width": 640,
            "height": 296
          },
          "thumbnail": {
            "ext": ".jpeg",
            "url": "/uploads/thumbnail_emi_logu_f4e7281a5c.jpeg",
            "hash": "thumbnail_emi_logu_f4e7281a5c",
            "mime": "image/jpeg",
            "name": "thumbnail_emi_logu",
            "path": null,
            "size": 3.45,
            "width": 245,
            "height": 113
          }
        },
        "hash": "emi_logu_f4e7281a5c",
        "ext": ".jpeg",
        "mime": "image/jpeg",
        "size": 95.02,
        "url": "/uploads/emi_logu_f4e7281a5c.jpeg",
        "previewUrl": null,
        "provider": "local",
        "provider_metadata": null,
        "created_at": "2023-11-13T08:42:12.961Z",
        "updated_at": "2023-11-13T08:42:12.961Z"
      },
      {
        "id": 23723,
        "name": "Membrane_Clarinet_7_Holes_E_16mm_Matrice",
        "alternativeText": null,
        "caption": null,
        "width": 2147,
        "height": 481,
        "formats": {
          "_big": {
            "ext": ".jpeg",
            "url": "/uploads/Membrane_Clarinet_7_Holes_E_16mm_Matrice_547a43d7ff_big.jpeg",
            "hash": "Membrane_Clarinet_7_Holes_E_16mm_Matrice_547a43d7ff_big",
            "mime": "image/jpeg",
            "name": "Membrane_Clarinet_7_Holes_E_16mm_Ma_big",
            "path": null,
            "size": 40.15,
            "width": 1920,
            "height": 430
          },
          "_med": {
            "ext": ".jpeg",
            "url": "/uploads/Membrane_Clarinet_7_Holes_E_16mm_Matrice_547a43d7ff_med.jpeg",
            "hash": "Membrane_Clarinet_7_Holes_E_16mm_Matrice_547a43d7ff_med",
            "mime": "image/jpeg",
            "name": "Membrane_Clarinet_7_Holes_E_16mm_Ma_med",
            "path": null,
            "size": 23.17,
            "width": 1280,
            "height": 287
          },
          "_small": {
            "ext": ".jpeg",
            "url": "/uploads/Membrane_Clarinet_7_Holes_E_16mm_Matrice_547a43d7ff_small.jpeg",
            "hash": "Membrane_Clarinet_7_Holes_E_16mm_Matrice_547a43d7ff_small",
            "mime": "image/jpeg",
            "name": "Membrane_Clarinet_7_Holes_E_16mm_Ma_small",
            "path": null,
            "size": 9.82,
            "width": 640,
            "height": 143
          },
          "thumbnail": {
            "ext": ".jpeg",
            "url": "/uploads/thumbnail_Membrane_Clarinet_7_Holes_E_16mm_Matrice_547a43d7ff.jpeg",
            "hash": "thumbnail_Membrane_Clarinet_7_Holes_E_16mm_Matrice_547a43d7ff",
            "mime": "image/jpeg",
            "name": "thumbnail_Membrane_Clarinet_7_Holes_E_16mm_Matrice",
            "path": null,
            "size": 2.6,
            "width": 245,
            "height": 55
          }
        },
        "hash": "Membrane_Clarinet_7_Holes_E_16mm_Matrice_547a43d7ff",
        "ext": ".jpeg",
        "mime": "image/jpeg",
        "size": 46.06,
        "url": "/uploads/Membrane_Clarinet_7_Holes_E_16mm_Matrice_547a43d7ff.jpeg",
        "previewUrl": null,
        "provider": "local",
        "provider_metadata": null,
        "created_at": "2023-11-13T08:42:16.274Z",
        "updated_at": "2023-11-13T08:42:16.274Z"
      }
    ],
    "audioreel": null,
    "organisations": [],
    "awardings": [],
    "festival_editions": [],
    "domains": [],
    "role_at_films": [],
    "other_lang": [],
    "tag_secrets": [],
    "industry_person_types": [],
    "tag_looking_fors": [],
    "filmographies": [],
    "industry_categories": []
}
