requireLogin()
let personId = null
let organisation = null
let state = {}

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

const fillPersonForm =  (person) => {
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

// ------------------------------------ new
async function showSection(sectionName) {
    document.querySelectorAll('.addProSection').forEach((section) => section.style.display = 'none');
    const visibleSection = document.getElementsByClassName(sectionName)[0];
    visibleSection.style.display = 'block';
    visibleSection.style.opacity = 1;
    visibleSection.style.pointerEvents = 'all';

    if (sectionName == 'organisationprofile') {
        organisation = await fetchOrganisation()
        fillOrganisationForm(organisation)
        console.log('Organisation: ', organisation)
    } else if (sectionName == 'userprofile') {
        const person = await fetchPerson()
        fillPersonForm(person)
        console.log('Person: ', person)
    }
}

document.querySelectorAll('.duplicate_gallery_fields').forEach(function (button) {
    button.addEventListener('click', duplicateLastGalleryElement)
});

function duplicateLastGalleryElement(event) {
    const cloneable_elements = event.currentTarget.closest('fieldset').querySelector('.sub_form')
    const cloneable_element = cloneable_elements[cloneable_elements.length - 1]
    duplicateElement(cloneable_element)
    if (cloneable_element.hasAttribute('data-max-repeatable-elements') && (cloneable_elements.length+1) >= cloneable_element.getAttribute('data-max-repeatable-elements')) {
        event.currentTarget.closest('.fieldset_grid_two_column').style.display = 'none'
    }
};

function  duplicatePreviousElement(event) {
    let fieldsElement = event.currentTarget.previousSibling
    if (!fieldsElement) {
        const elements = fieldsElement = event.currentTarget.closest('fieldset').querySelectorAll('.sub_form')
        fieldsElement = elements[elements.length - 1]
    }
    duplicateElement(fieldsElement)
};

function duplicateElement(element) {
    const newElement = element.cloneNode(true)
    newElement.querySelector('.remove_fields').addEventListener('click', remove_fields)
    reset_fields(newElement)
    element.after(newElement)
    return newElement
}

document.querySelectorAll('.remove_fields').forEach(function (button) {
    button.addEventListener('click', remove_fields)
});

function remove_fields(el) {
    const fieldset = el.currentTarget.closest('fieldset');
    const count = fieldset.querySelectorAll('.remove_fields').length
    if (count > 1) {
        el.currentTarget.closest('.sub_form').remove()
    } else if (fieldset.querySelector('.fields')){
        hideFieldsetFields(el)
    } else if (el.currentTarget.closest('.sub_form')){
        el.currentTarget.closest('.sub_form').querySelector('select').value = 'default_value'
    } else {
        reset_fields(fieldset)
    }
};

function reset_fields(element) {
    element.querySelectorAll('input[type="file"], input[type="text"], input[type="text"], input[type="select"], input[type="hidden"], input[type="checkbox"]').forEach(el =>  el.value = "" );
    element.querySelectorAll('.imgPreview').forEach(el => { el.src = el.getAttribute('data-placeholder-img'); el.setAttribute('data-is-deleted', true) });
    element.querySelectorAll('audio').forEach(el => { el.style.display = 'none';  el.src = ''});
    element.querySelectorAll('.error').forEach(el => el.innerHTML = '')
}

document.querySelectorAll('.show_form_fields').forEach(function (button) {
    button.addEventListener('click', function (event) {
        showFormFields(event)
    });
});

function showFormFields(event) {
    const fieldset = event.currentTarget.closest('fieldset')
    fieldset.classList.add('opened')
}

function showFilmoGraphyFields(event) {
    event.currentTarget.closest('fieldset').querySelector('.filmography_form.template').style.display = 'block'
}

document.querySelectorAll('.hide_fieldset_fields').forEach(function (button) {
    button.addEventListener('click', hideFieldsetFields);
});

document.querySelector('[name="org_country"]').addEventListener('input', event => {
    const show_dropdown_fields = event.target.options[event.target.selectedIndex].text == 'Estonia'
    document.querySelectorAll('[name="org_county"], [name="org_municipality"]').forEach(el => el.style.display = show_dropdown_fields ? 'block' : 'none');
    document.querySelectorAll('[name="org_add_county"], [name="org_add_municipality"]').forEach(el => el.style.display = show_dropdown_fields ? 'none' : 'block');
})

function hideFieldsetFields(el) {
    const fieldset = el.currentTarget.closest('fieldset')
    fieldset.classList.remove('opened')
    reset_fields(fieldset)
}

const fetchOrganisation = async () => {
    const accessToken = localStorage.getItem('ID_TOKEN')
    const headers = { Authorization: `Bearer ${accessToken}` }
    let url = `${huntAuthDomain}/api/organisation`
    const response = await fetch(url, { headers })
    const data = await response.json()
    return data
}

function setSelectByFieldName(domElement, values, fieldName) {
    if (values === null || values === undefined) {
        return
    }

    if (!Array.isArray(values)) {
        if (typeof values === 'object') {
            values = [values]
        } else {
            values = [{ id: values }]
        }
    }
    let lastElement = domElement.querySelector(`[name^="${fieldName}"]:last-of-type`)
    values = values.filter(val => lastElement.querySelector(`[value="${val.id}"]`));
    for (let i = 0; i < values.length; i++) {
        let value = values[i];
        if (i === 0) {
            lastElement.value = value.id
            lastElement.dispatchEvent(new Event('input', { 'bubbles': false }))
        } else {
            let newChild = lastElement.closest('.sub_form').cloneNode(true)
            newChild.querySelector('select').value = value.id
            newChild.querySelector('.remove_fields').addEventListener('click', remove_fields)
            lastElement.closest('.sub_form').after(newChild)
        }
    }
}

document.querySelectorAll('.organisationprofile .textarea textarea').forEach(function (textarea) {
    textarea.addEventListener('input', event => updateTextareaCounter(event.target));
});

document.querySelector('.organisationprofile [name^="org_name_en"]').addEventListener('input', function (event) {
    document.querySelector(`.organisationprofile [name^="profile_url"]`).value = "https://industry.poff.ee/" + slugify(event.target.value)
});


function updateTextareaCounter(textarea) {
    let charCount = textarea.value.length
    const maxCount = textarea.closest('.textarea').querySelector('.maximum_count').innerHTML
    if (charCount > maxCount) {
        textarea.value = textarea.value.substring(0, maxCount)
        charCount = maxCount
    }
    textarea.closest('.textarea').querySelector('.current_count').innerHTML = charCount
}

async function saveOrganisationForm() {
    document.getElementById('savingStatus').style.display = 'block'

    let saveOrganisationButton = document.getElementById(`saveOrganisationButton`)
    saveOrganisationButton.disabled = true
    let previousInnerHTML = saveOrganisationButton.innerHTML
    saveOrganisationButton.innerHTML = `<i class="fa fa-spinner fa-spin"></i>`

    if (isFormValid(document.querySelector('.organisationprofile'), getOrganisationFields())) {
        const organisationData = collectFormData(document.querySelector('.organisationprofile'), getOrganisationFields())
        sendOrganisation(organisationData)
    }
    saveOrganisationButton.disabled = false
    saveOrganisationButton.innerHTML = `<i class="fa fa-spinner fa-spin"></i>`
}

async function sendOrganisation(organisationData) {
    console.log("Send organisation: ", organisationData)

    const formData = new FormData()
    if (organisationData.new_files) {
        Object.entries(organisationData.new_files).forEach(([key, file]) => {
            formData.append(`files.${key}`, file, file.file)
        });
        delete organisationData.new_files
    }

    formData.append('data', JSON.stringify(organisationData))

    let response = await fetch(`${huntAuthDomain}/api/organisation`, {
        method: 'PUT',
        headers: {
            Authorization: 'Bearer ' + localStorage.getItem('ID_TOKEN')
        },
        body: formData
    })
    console.log('Organisation save response: ', response)
    if (response.id !== 'undefned') {
        return response
    }
}

function saveFilmoGraphyChanges()
{
    let organisationData = {}
    if (typeof state.filmographies !== 'undefined') {
        organisationData['filmographies'] = state['filmographies']
        const response = sendOrganisation(organisationData)
    }
}

function isFormValid(formElement, fields) {
    let firstInvalidElement = false
    for (let field_name in fields) {
        element = formElement.querySelector(`[name="${field_name}"]`)
        if (element && element.hasAttribute('data-validate')) {
            if (!validateField(element) && firstInvalidElement === false) {
                firstInvalidElement = element
            }
        }
    }

    if (firstInvalidElement) {
        firstInvalidElement.scrollIntoView(true)
    }

    return firstInvalidElement === false
}


function collectFormData(formElement, fields) {
    const formData = {new_files: {}}
    for (var field_name in fields) {
        const conf = fields[field_name]

        if (conf.collectFunction !== undefined) {
            conf.collectFunction(field_name, conf, formData, formElement)
        } else if (conf.type == 'checkbox') {
            formData[conf.field] = formElement.querySelector(`[name="${field_name}"]`).checked ? 1 : 0
        } else if (conf.type == 'select') {
            const ids = Array.from(formElement.querySelectorAll(`[name="${field_name}"]`)).map(el => parseInt(el.value)).filter(el => !isNaN(el))
            formData[conf.field] = (conf.sendType == 'int') ? ids[0] : ids
        } else if (conf.type == 'collection') {
            formData[conf.field] = collectFormData(formElement.querySelector(`.${field_name}`), conf.fields)
        } else {
            formData[conf.field] = formElement.querySelector(`[name="${field_name}"]`).value
        }
    }

    return formData
}

function collectGalleryData(field_name, conf, orgToSend, formElement)
{
    orgToSend['images'] = []
    const images = formElement.querySelectorAll('.gallery')
    for (let index = 0; index < images.length; index++) {
        const imageElement = images[index]
        const id = imageElement.querySelector(`[name="id"]`).value

        const metadata = generateImageMetadataJson(imageElement)
        const files = imageElement.querySelector(`[name="${field_name}"]`).files
        if (files.length) {
            orgToSend['new_files'][`images.new.img.${index}`] = files[0]
            orgToSend[`files.images.new.metadata.${index}`] = metadata
            orgToSend['images'].push(`|${index}|`)
        } else {
            orgToSend['images'].push(id)
            if (isImageMetaDataChanged(id, metadata)) {
                orgToSend[`files.images.changed.metadata.${id}`] = metadata
            }
        }
    };
}

function collectStill(field_name, conf, orgToSend, formElement) {
    const imageElement = formElement.querySelector(`[name="${field_name}"]`).closest('.fieldset_grid')
    const files = formElement.querySelector(`[name="${field_name}"]`).files

    if (files.length) {
        orgToSend[conf.field] = files[0]
    } else {
        const imgPreviewElement = imageElement.querySelector('.imgPreview')
        if (imgPreviewElement.hasAttribute('data-is-deleted')) {
            orgToSend[`deleted_img_${field_name}`] = true
        }
    }
}


function collectImgData(field_name, conf, orgToSend, formElement) {
    const imageElement = formElement.querySelector(`[name="${field_name}"]`).closest('.fieldset_grid')
    const files = formElement.querySelector(`[name="${field_name}"]`).files
    const imageMetadata = generateImageMetadataJson(imageElement)
    orgToSend[`metadata_${field_name}`] = imageMetadata

    if (files.length) {
        orgToSend['new_files'][conf.field] = files[0]
    } else {
        const imgPreviewElement = imageElement.querySelector('.imgPreview')
        if (imgPreviewElement.hasAttribute('data-is-deleted')) {
            orgToSend[`deleted_img_${field_name}`] = true
        }
    }
}

function collectAudioreelData(field_name, conf, orgToSend, formElement) {
    const audioreelElement = formElement.querySelector(`[name="${field_name}"]`).closest('.fieldset_grid, .fieldset_grid_two_column, .fieldset_grid_one_column')
    const files = formElement.querySelector(`[name="${field_name}"]`).files

    if (files.length) {
        orgToSend['new_files'][conf.field] = files[0]
    } else {
        const audioreelPreview = audioreelElement.querySelector('#audioreel_preview')
        if (audioreelPreview.style.display == 'none') {
            orgToSend['deleted_audioreel'] = true
        }
    }
}

function slugify(text) {
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')           // Replace spaces with -
        .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
        .replace(/\-\-+/g, '-')         // Replace multiple - with single -
        .replace(/^-+/, '')             // Trim - from start of text
        .replace(/-+$/, '');            // Trim - from end of text
}

function isImageMetaDataChanged(id, newMetadata) {
    for (let index = 0; index < organisation.images.length; index++) {
        if (organisation.images[index].id == id) {
            return newMetadata != organisation.images[index].caption
        }
    }
    return false
}

function fillFilmographies(domElement, val, fieldName) {
    showFilmographies(val)
}

function collectFilmographies(field_name, conf, formData, formElement) {
    if (typeof state.filmographies !== undefined) {
        formData['filmographies'] = state['filmographies']
    }
}

function showFilmographies(filmographies)
{
    const filmographiesElement = document.querySelector(".filmographies .list")
    const onGoingProjectsElement = document.querySelector(".on_going_projects .list")

    filmographiesElement.innerHTML = ""
    onGoingProjectsElement.innerHTML = ""

    const template = document.querySelector('.filmographies .filmography_row_template .filmography')
    for (let i = 0; i < filmographies.length; i++) {
        let filmography = template.cloneNode(true)

        let role_at_film = ''
        if (filmographies[i].role_at_films[0]) {
            role_at_film = filmography.querySelector('.role_at_film').innerHTML.replace('%role_at_film%', filmographies[i].role_at_films[0].roleName.en)
        }
        filmography.querySelector('.role_at_film').innerHTML = role_at_film

        if (filmographies[i].is_ongoing) {
            filmography.querySelector('strong').innerHTML = filmography.querySelector('strong').innerHTML.replace('%nr%', onGoingProjectsElement.childNodes.length + 1).replace('%work_name%', filmographies[i].work_name)
            filmography.querySelector('button').setAttribute('onclick', `toggleFilmoGraphy(event, "${filmographies[i].id}", "ongoing")`)

            filmography.querySelector('.is_featured_project').remove()

            onGoingProjectsElement.appendChild(filmography)

            onGoingProjectsElement.closest('.on_going_projects').style.display = 'block';
            onGoingProjectsElement.closest('fieldset').classList.add('opened')
        } else {
            filmography.querySelector('strong').innerHTML = filmography.querySelector('strong').innerHTML.replace('%nr%', filmographiesElement.childNodes.length + 1).replace('%work_name%', filmographies[i].work_name)
            filmography.querySelector('button').setAttribute('onclick', `toggleFilmoGraphy(event, "${filmographies[i].id}", "completed")`)

            if (filmographies[i].is_featured) {
                filmography.querySelector('.is_featured_project').querySelector('input').checked = true
            }

            filmographiesElement.appendChild(filmography)

            filmographiesElement.closest('.filmographies').style.display = 'block';
            filmographiesElement.closest('fieldset').classList.add('opened')
        }
    }
}

function toggleIsFeatured(event)
{
    event.currentTarget.closest('.filmography_form').classList.toggle("is_featured_filmography", event.currentTarget.checked);
}

function toggleFilmoGraphy(event, id, type)
{
    if (event.currentTarget.classList.contains('opened')) {
        event.currentTarget.classList.remove('opened')
        event.currentTarget.closest('.filmography').querySelector('.filled_filmography .filmography_form').remove()
    } else {
        event.currentTarget.classList.add('opened')
        const formFields = 'type' == 'ongoing' ? getOnGoingFilmographyFields() : getFilmographyFields()

        const targetElement = event.currentTarget.closest('.filmography').querySelector('.filled_filmography')
        const data = getFilmoGraphyById(id);
        const subForm = event.currentTarget.closest('fieldset').querySelector('.filmography_form.template').cloneNode(true)
        subForm.classList.remove('template')
        subForm.classList.toggle('is_featured_filmography', !data.is_ongoing && data.is_featured)
        subForm.style.display = 'block'
        targetElement.append(subForm)
        fillFields(targetElement, formFields, data)
    }
}

function getOnGoingFilmographyFields()
{
    return  {
        org_ongoing_project_type_of_work: {
            field: 'type_of_work',
            type: 'select',
            sendType: 'int'
        },
        org_ongoing_project_role_at_films: {
            field: 'role_at_films',
            type: 'select'
        },
        org_ongoing_project_work_name: {
            field: 'work_name',
        },
        org_ongoing_project_work_url: {
            field: 'work_url',
        },
        org_ongoing_project_decsription_en: {
            field: 'decsription_en',
        },
        org_ongoing_project_status: {
            field: 'project_statuses',
            type: 'select'
        },
        org_ongoing_project_tag_looking_fors: {
            field: 'tag_looking_fors',
            type: 'select'
        },
        id: {
            field: 'id'
        }
    }
}

function getFilmographyFields() {
    return {
        org_filmography_type_of_work: {
            field: 'type_of_work',
            type: 'select',
            sendType: "int"
        },
        org_filmography_role_at_films: {
            field: 'role_at_films',
            type: 'select'
        },
        org_filmography_year_from: {
            field: 'year_from',
        },
        org_filmography_year_to: {
            field: 'year_to',
        },
        org_filmography_work_name: {
            field: 'work_name',
            required: true
        },
        org_filmography_work_url: {
            field: 'work_url',
        },
        org_filmography_runtime: {
            field: 'runtime',
        },
        org_filmography_org_name: {
            field: 'org_name',
        },
        org_filmography_org_url: {
            field: 'org_url',
        },
        org_filmography_decsription_en: {
            field: 'decsription_en',
        },
        org_filmography_is_featured: {
            field: 'is_featured',
            type: 'checkbox'
        },

        org_filmography_is_featured: {
            field: 'is_featured',
            type: 'checkbox'
        },

        stills: {
            field: 'stills',
            fillFunction: fillStill,
            collecttFunction: collectStill
        },
        id: {
            field: 'id'
        },
    }
}


function sendFilmography(event, is_ongoing = true) {
    const fieldset = event.currentTarget.closest('.filmography_form')
    const fields = is_ongoing ? getOnGoingFilmographyFields(): getFilmographyFields()
    if (!isFormValid(fieldset, fields)) {
        return;
    }
    data = collectFormData(fieldset, fields)
    data['is_ongoing'] = is_ongoing ? 1:0

    if (!state.filmography) {
        state.filmographies = organisation['filmographies']
    }
    data['id'] = parseInt(data['id'])

    if (isNaN(data['id'])) {
        state.filmographies.push(data)
    } else {
        state['filmographies'] = state['filmographies'].map((filmography) => {
            if (filmography['id'] == data['id']) {
                return data
            } else {
                return filmography
            }
        })
    }

    saveFilmoGraphyChanges()

    //showFilmographies(state['filmographies']) //TODO ei saa uuendada kõiki kui mitu filmilahti
    const form = event.currentTarget.closest('.filmography_form')
    if (form.classList.contains('template')) {
        form.style.display = 'none'
    } else {
        form.remove()
    }
}

function removeFilmography(event)
{
    const id = event.currentTarget.closest('.filmography_form').querySelector(`[name="id"]`).value
    if (id) {
        if (!state.filmography) {
            state.filmographies = organisation['filmographies']
        }
        state['filmographies'] = state['filmographies'].filter((filmography) => filmography['id'] != id)
        saveFilmoGraphyChanges()
    }

    //showFilmographies(state['filmographies']) //TODO ei saa uuendada kõiki kui mitu filmilahti
    const form = event.currentTarget.closest('.filmography_form')
    if (form.classList.contains('template')) {
        form.style.display = 'none'
    } else {
        form.remove()
    }
}

function getFilmoGraphyById(id) {
    for (let i = 0; i < organisation['filmographies'].length; i++) {
        if (organisation['filmographies'][i].id == id) {
            return organisation['filmographies'][i];
        }
    }
    return {}
}

function validateField(element) {
    const rules = element.getAttribute('data-validate')
    if (rules === null) {
        return true
    }
    const errors = validate(element, rules.split('|'));
    const errorEl = element.closest('.form_group').querySelector('.error')
    errorEl.innerHTML = (errors) ? errors.join('<br />') : '';
    return errors.length === 0
}

function validate(field, validators) {
    const errors = [];
    const fieldValue = field.value
    validators.forEach(validator => {
        if (validator == 'required' && fieldValue == "") {
            errors.push(translate('validationErrorRequiredField'))
        } else if (validator == 'at-least-one-option-selected') {
            const values = Array.from(field.closest('.form_group').querySelectorAll(`[name="${field.name}"]`)).map(el => parseInt(el.value)).filter(el => !isNaN(el))
            if (!values.length) {
                errors.push(translate('validationErrorRequiredField'))
            }
        } else if (validator == 'is-valid-eployees-count' && fieldValue != "" && !/^\d{1,5}$/.test(fieldValue)) {
            errors.push(translate('validationErrorEmployeesCount'))
        } else if (validator == 'is-valid-img-year'  && fieldValue != "" && !/^(19|20)\d{2}$/.test(fieldValue)) {
            errors.push(translate('validationErrorInvalidImageYear'))
        } else if (validator == 'is-email' && (!/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(fieldValue))) {
            errors.push(translate('validationErrorEmail'))
        } else if (validator == 'is-phone-nr' &&  fieldValue != "" && !/^[+]?[\s./0-9]*[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/g.test(fieldValue)) {
            errors.push(translate('validationErrorPhone'))
        } else if (validator == 'is-showreel' && fieldValue != ""){
            const youtubeRegex = /(?:(?:https?:)?\/\/)?(?:(?:www|m)\.)?(?:(youtube(?:-nocookie)?\.com|youtu.be))(?:\/(?:[\w\-]+\?v=|embed\/|live\/|v\/)?)([\w\-]+)(?:\S+)?/
            const vimeoRegex = /(?:http|https)?:?\/?\/?(?:www\.)?(?:player\.)?(vimeo\.com)\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|video\/|)(\d+)(?:|\/\?)/
            if (!youtubeRegex.test(fieldValue) && !vimeoRegex.test(fieldValue)) {
                errors.push(translate('validationErrorShowreel'))
            }
        }
    });
    return errors
}

const getOrganisationFields = () =>  {
    return  {
        org_name_en: {
            field: 'name_en',
        },
        org_h_rate_from: {
            field: 'h_rate_from',
        },
        org_h_rate_to: {
            field: 'h_rate_to',
        },
        org_role_at_films: {
            field: 'orderedRaF',
            type: 'custom',
            fillFunction: fillOrderedRaF,
            collectFunction: collectOrderedRaf,
        },

        filmographies: {
            field: 'filmographies',
            type: 'custom',
            fillFunction: fillFilmographies,
            collectFunction: collectFilmographies
        },

        org_employees_n: {
            field: 'employees_n',
        },
        org_languages: {
            field: 'languages',
            type: 'select',
        },
        org_creative_gate_relations: {
            field: 'people',
            type: 'select'
        },
        org_description_en: {
            field: 'description_en',
        },
        org_skills_en: {
            field: 'skills_en',
        },
        org_tag_looking_fors: {
            field: 'tag_looking_fors',
            type: 'select',
        },
        org_acc_imdb: {
            field: 'acc_imdb',
        },
        org_acc_efis: {
            field: 'acc_efis',
        },
        org_acc_instagram: {
            field: 'acc_instagram',
        },
        org_acc_fb: {
            field: 'acc_fb',
        },
        org_acc_other: {
            field: 'acc_other',
        },
        org_acc_youtube: {
            field: 'acc_youtube',
        },
        org_acc_vimeo: {
            field: 'acc_vimeo',
        },
        org_webpage_url: {
            field: 'webpage_url',
        },
        org_email: {
            field: 'eMail',
        },
        org_phone_nr: {
            field: 'phoneNr',
        },

        addr_coll: {
            type: 'collection',
            field: 'addr_coll',
            fields: {
                id: {
                    field: 'id'
                },
                org_country: {
                    field: 'country',
                    type: "select",
                    sendType: "int"
                },
                org_county: {
                    field: 'county',
                    type: "select",
                    sendType: "int"
                },

                org_municipality: {
                    field: 'municipality',
                    type: "select",
                    sendType: "int"
                },

                org_add_county: {
                    field: 'add_county',
                },

                org_add_municipality: {
                    field: 'add_municipality',
                },

                org_populated_place: {
                    field: 'popul_place',
                },
                org_street_name: {
                    field: 'street_name',
                },
                org_address_number: {
                    field: 'street_name',
                },
                org_appartment: {
                    field: 'appartment',
                },
                org_postal_code: {
                    field: 'postal_code',
                }
            }
        },

        org_client_name: {
            field: 'clients',
            type: 'custom',
            fillFunction: fillClients,
            collectFunction: collectClients
        },
        org_showreel: {
            field: 'showreel',
        },

        org_audioreel: {
            field: 'audioreel',
            type: 'audioreel',
            collectFunction: collectAudioreelData
        },
        logoColour: {
            field: 'logoColour',
            type: 'img',
            collectFunction: collectImgData
        },
        profile_img: {
            field: 'profile_img',
            type: 'img',
            collectFunction: collectImgData

        },
        images: {
            field: 'images',
            type: 'gallery',
            collectFunction: collectGalleryData
        },
        org_ok_to_contact: {
            field: "ok_to_contact",
            type: "checkbox"
        }
    }
}

const fillOrganisationForm = (organisation) => {
    fillFields(document.querySelector('.organisationprofile'), getOrganisationFields(), organisation)
}

function getImageMetaData(field)
{
    let data = {};
    try {
        data = JSON.parse(field)
        if (typeof data !== "object" || data == null) {
            data = {}
        }
    } catch (e) {
        data = {}
    }

    return {
        caption: data.caption ?? "",
        photographer: data.photographer ?? "",
        img_year: data.img_year ?? ""
    }
}

function generateImageMetadataJson(imageElement)
{
    return JSON.stringify({
        caption: imageElement.querySelector(`[name="caption"]`).value,
        photographer: imageElement.querySelector(`[name="photographer"]`).value,
        img_year: imageElement.querySelector(`[name="img_year"]`).value
    })
}

function fillStill(imgEl, val, fieldName)
{
    if (!Array.isArray(val) || val.length < 1) {
        return
    }
    val = val[0]
    imgEl.querySelector('.imgPreview').src = `https://assets.poff.lan/img/${val.hash}${val.ext}`
}

function fillImage(imgEl, val)
{
    if (val === null) {
        return;
    }
    const metaData = getImageMetaData(val.caption)
    imgEl.querySelector(`[name="caption"]`).value = metaData.caption
    imgEl.querySelector(`[name="photographer"]`).value = metaData.photographer
    imgEl.querySelector(`[name="img_year"]`).value = metaData.img_year
    imgEl.querySelector('.imgPreview').src = `https://assets.poff.lan/img/${val.hash}${val.ext}`
    if (imgEl.querySelector(`[name="id"]`)) {
        imgEl.querySelector(`[name="id"]`).value = val.id
    }
}

function fillAudioreel(htmlElement, val) {
    if (val && val.hash && val.ext) {
        htmlElement.querySelector('#audioreel_preview').src = `https://assets.poff.lan/img/${val.hash}${val.ext}`
        htmlElement.querySelector('#audioreel_preview').style.display = "block"
    }
}

function fillFields(domElement, fields, data) {
    for (var field_name in fields) {
        const conf = fields[field_name]
        let val = data[conf.field]

        if (conf.fillFunction) {
            conf.fillFunction(domElement, val, field_name)
        } else if (fields[field_name].type == 'select') {
            setSelectByFieldName(domElement, val, field_name)
        } else if (fields[field_name].type == 'img') {
            fillImage(domElement.querySelector(`[name="${field_name}"]`).closest('.fieldset_grid'), val)
        } else if (fields[field_name].type == 'audioreel') {
            fillAudioreel(domElement.querySelector(`[name="${field_name}"]`).closest('.fieldset_grid'), val)
        } else if (fields[field_name].type == 'gallery') {
            let galleryelement = domElement.querySelector('.gallery')
            for (let i = 0; i < val.length; i++) {
                fillImage(galleryelement, val[i])
                if (i < val.length - 1) {
                    galleryelement = duplicateElement(galleryelement)
                }
            }
        } else if (fields[field_name].type == 'checkbox') {
            domElement.querySelector(`[name="${field_name}"]`).checked = val;
        } else if (fields[field_name].type == 'collection') {
            fillFields(domElement.querySelector(`.${field_name}`), conf.fields, val)
        } else if (fields[field_name].type == 'custom') {
            conf.fillFunction(domElement, val, field_name)
        } else {
            domElement.querySelector(`[name="${field_name}"]`).value = val ?? ""
            domElement.querySelector(`[name="${field_name}"]`).dispatchEvent(new Event('input', { 'bubbles': false }))
        }
        if (val && ((typeof val != 'object' && val) || (typeof val == 'object' && Object.keys(val).length))) {
            const field = domElement.querySelector(`input[name="${field_name}"], select[name="${field_name}"]`)

            if (field) {
                if (domElement.querySelector('fieldset')) {
                    field.closest('fieldset').classList.add('opened')
                }
                //form.querySelectorAll('.fields').forEach(el => el.style.display = 'grid');
                //form.querySelectorAll('.buttons').forEach(el => el.style.display = 'none');
            }

        }
    }
}

function fillOrderedRaF(domElement, val, field_name)
{
    const sortedValues = val.sort((a, b) => a.order - b.order).map((e) => {return  { id: e.role_at_film.id } })
    setSelectByFieldName(domElement, sortedValues, field_name)
}

function collectOrderedRaf(field_name, conf, formData, formElement)
{
    formData[conf.field] = Array.from(formElement.querySelectorAll(`[name="${field_name}"]`)).filter(el => el.value != '').map((el, index) => { return { role_at_film: parseInt(el.value), order: index + 1} })
}

function fillClients(domElement, values, fieldName)
{
    return
    for (let i = 0; i < values.length; i++) {
        let value = values[i];
        let lastElement = domElement.querySelector(`[name^="${fieldName}"]:last-of-type`)
        if (i === 0) {
            lastElement.value = value.namePrivate
        } else {
            let newChild = lastElement.closest('.sub_form').cloneNode(true)
            newChild.querySelector(`[name^="${fieldName}"]`).value = value.namePrivate
            newChild.querySelector('.remove_fields').addEventListener('click', remove_fields)
            lastElement.closest('.sub_form').after(newChild)
        }
    }
}

function collectClients(field_name, conf, formData, formElement)
{
    return;
    const clients = Array.from(formElement.querySelectorAll(`[name="${field_name}"]`)).filter(el => el.value != '')
    console.log('clients', clients)
    for (let i = 0; i < clients.length; i++) {
        console.log('CLIENT:', clients[i].value)
    }
}

function isFieldHidden(field) {
    const el = field.closest('.fields')
    if (el) {
        return el.style.display == 'none'
    }
    return false;
}

function translate(template, variables = {}) {
    const element = document.querySelector(`#translationStrings .${template}`)
    if (!element) {
        return template
    }
    let text = element.innerHTML
    Object.entries(variables).forEach(([key, value]) => {
        text = text.replace(`%${key}%`, value)
    });
    return text
}

function previewImage(event) {
    const file = event.currentTarget.files[0]
    const imageElement = event.currentTarget.closest('.form_group')
    let error = imageElement.querySelector(".error")
    let previewElement = imageElement.getElementsByClassName('imgPreview')[0]

    if (!file.type.includes("image")) {
        error.innerHTML = translate('validatioErrorFileIsNotImage')
        previewElement.src = previewElement.getAttribute('data-placeholder-img')
        imageElement.querySelector('input[type="file"]').value = ''
    } else if (file.size / 1024 / 1024 > 5) {
        error.innerHTML = translate('validationErrorImageFileIsToBig', {size: (file.size / 1024 / 1024).toFixed(2)})
        previewElement.src = previewElement.getAttribute('data-placeholder-img')
        imageElement.querySelector('input[type="file"]').value = ''
    } else {
        error.innerHTML = ""
        var reader = new FileReader()
        reader.onload = function () {
            previewElement.src = reader.result
        }
        reader.readAsDataURL(file)
    }
}

function previewAudioreel(event) {
    const file = event.currentTarget.files[0]
    const audioreelElement = event.currentTarget.closest('.form_group')
    let error = audioreelElement.querySelector(".error")
    let previewElement = audioreelElement.querySelector('#audioreel_preview')

    if (!file.type.includes("audio")) {
        audioreelElement.querySelector('input[type="file"]').value = '';
        previewElement.src = '';
        previewElement.style.display = 'none';

        error.innerHTML = translate('validatioErrorFileIsNotAudio')
    } else if (file.size / 1024 / 1024 > 5) {
        audioreelElement.querySelector('input[type="file"]').value = '';
        previewElement.src = '';
        previewElement.style.display = 'none';

        error.innerHTML = translate('validationErrorAudioFileIsToBig', {size: (file.size / 1024 / 1024).toFixed(2)})
    } else {
        error.innerHTML = '';
        var reader = new FileReader()
        reader.onloadend = function (e) {
            previewElement.src = e.target.result;
            previewElement.style.display= 'block'
        };
        reader.readAsDataURL(file);
    }
}


//start sortable role_at_films fieds
Sortable.create(document.querySelector('.org_role_at_films'),  {
    handle: '.drag_me', // handle's class
    animation: 150,
    draggable: '.sub_form'
});

function refreshRowNumbers(el) {
    const nr_fields = el.querySelectorAll('.nr');
    for (let index = 0; index < nr_fields.length; index++) {
        nr_fields[index].innerHTML = `${index+1}.`
    }
}

const observer = new MutationObserver(function(mutationsList, observer) {
    refreshRowNumbers(document.querySelector('.org_role_at_films'))
});

observer.observe(document.querySelector('.org_role_at_films'), {characterData: false, childList: true, attributes: false});
//end sortable role_at_films fieds


; (async () => {
    requireLogin()
})()
