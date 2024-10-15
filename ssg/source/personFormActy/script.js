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
    document.getElementById('loader').classList.add('loading')
    if (sectionName == 'organisationprofile') {
        organisation = await fetchOrganisation()
        fillOrganisationForm(organisation)
        console.log('Organisation: ', organisation)
    } else if (sectionName == 'userprofile') {
        const person = await fetchPerson()
        fillPersonForm(person)
        console.log('Person: ', person)
    }
    document.getElementById('loader').classList.remove('loading')
}

function addNewGalleryImage(event) {
    const fieldset = event.currentTarget.closest('fieldset')
    const images = fieldset.querySelectorAll('.gallery')
    duplicateElement(images[images.length-1])
    updateAddGalleryImageButtonVisibility(fieldset)
};

function removeGalleryImage(event) {
    const fieldset = event.currentTarget.closest('fieldset');
    const count = fieldset.querySelectorAll('.gallery').length
    if (count > 1) {
        const gallery = event.currentTarget.closest('.gallery')
        gallery.remove()
        updateAddGalleryImageButtonVisibility(fieldset)
    } else {
        hideFieldsetFields(event)
    }
};
function updateAddGalleryImageButtonVisibility(fieldset) {
    const galleryDiv = fieldset.querySelectorAll('.organisationprofile .gallery')
    const visibilitiy = (galleryDiv.length >=10) ? 'none' : 'block'

    document.getElementById('add_new_gallery_image').style.display = visibilitiy

}

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
    resetFields(newElement)
    element.after(newElement)
    return newElement
}

function removeFields(event) {
    removeDuplicateSelects(event.currentTarget.closest('.sub_form'))
}

function removeDuplicateSelects(subFormElement) {
    const domElement = subFormElement.closest('.form_group');
    if (domElement.querySelectorAll('.remove_fields').length > 1) {
        subFormElement.remove()
    } else {
        resetFields(event.currentTarget.closest('.sub_form'))
        if (subFormElement.hasAttribute('data-close-fieldset')) {
            domElement.closest('fieldset').classList.remove('opened')
        }
    }
}

function clearFields(event) {
    const fieldset_grid =  event.currentTarget.closest('.fieldset_grid');
    resetFields(fieldset_grid)
    if (event.currentTarget.hasAttribute('data-close-fieldset')) {
        fieldset_grid.closest('fieldset').classList.remove('opened')
    }
};

function removeStill(el) {
    resetFields(el.currentTarget.closest('.still'))
}

function resetFields(element) {
    element.querySelectorAll('input[type="file"], input[type="number"], input[type="text"], input[type="url"], select, input[type="hidden"], input[type="checkbox"], input[type="url"], textarea, input[list="name"]').forEach(el => el.value="" );
    element.querySelectorAll('.imgPreview').forEach(el => { el.src = el.getAttribute('data-placeholder-img'); el.setAttribute('data-is-deleted', true); el.removeAttribute('data-image-id') });
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

function showFilmographyFields(event) {
    const fieldset = event.currentTarget.closest('fieldset')
    fieldset.classList.add('opened')
    event.currentTarget.closest('fieldset').querySelector('.filmography_form.template').style.display = 'block'
}

function showClientFields(event) {
    const fieldset = event.currentTarget.closest('fieldset')
    fieldset.classList.add('opened')
    event.currentTarget.closest('fieldset').querySelector('.client_form.template').style.display = 'block'
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
    resetFields(fieldset)
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
    if (values === null || values === undefined ) {
        return
    }

    if (!Array.isArray(values)) {
        if (typeof values === 'object') {
            values = [values.id]
        } else {
            values = [values]
        }
    }
    if (typeof values[0] === 'object') {
        values = values.map( value => value.id)
    }

    let lastElement = domElement.querySelector(`[name^="${fieldName}"]:last-of-type`)
    values = values.filter(val => lastElement.querySelector(`[value="${val}"]`));
    for (let i = 0; i < values.length; i++) {
        let value = values[i];
        if (i === 0) {
            lastElement.value = value
            lastElement.dispatchEvent(new Event('input', { 'bubbles': false }))
        } else {
            let newChild = lastElement.closest('.sub_form').cloneNode(true)
            newChild.querySelector('select').value = value
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
    document.getElementById('loader').classList.add('loading')
    let saveOrganisationButton = document.getElementById(`saveOrganisationButton`)
    saveOrganisationButton.disabled = true

    if (isFormValid(document.querySelector('.organisationprofile'), getOrganisationFields())) {
        const organisationData = collectFormData(document.querySelector('.organisationprofile'), getOrganisationFields())
        const response = await sendOrganisation(organisationData)
        if (response) {
            showPopup(translate('messageOrganisationSaveSuccess'))
            document.getElementById('organisationProfileSent').style.display = "block"
        }
    }

    saveOrganisationButton.disabled = false
    document.getElementById('loader').classList.remove('loading')
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
    const data = await response.json()
    if (data.statusCode == 200 && data.organisation !== undefined) {
        organisation = await data.organisation
        state.newCollectionIds = await data.newCollectionIds
        return await data.organisation
    } else {
        showErrorMsg(translate('messageErrorOnSave'))
        return false
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

        if (conf.sendType === 'Integer') {
            if (Array.isArray(formData[conf.field])) {
                formData[conf.field] = formData[conf.field][0]
            }
            formData[conf.field] = isNaN(formData[conf.field]) ? null : parseInt(formData[conf.field])
        } else if (conf.sendType === 'url') {
            formData[conf.field] = addHttpsIfNoPrefix(formData[conf.field])
        }
    }

    return formData
}
function addHttpsIfNoPrefix(url) {
    if (url.toLowerCase().startsWith('http')) {
        return url
    }
    console.log('ADD URL PREFIX', url)
    return `https://${url}`
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
        orgToSend['new_files'][conf.field] = files[0]
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

function fillFilmographies(domElement, filmographies, fieldName) {
    const filmographiesElement = document.querySelector(".filmographies .list")
    const onGoingProjectsElement = document.querySelector(".on_going_projects .list")

    filmographiesElement.innerHTML = ""
    onGoingProjectsElement.innerHTML = ""

    for (let i = 0; i < filmographies.length; i++) {
        if (filmographies[i].is_ongoing) {
            const filmographyDiv = getFilmographySummaryRow(filmographies[i], onGoingProjectsElement.childNodes.length + 1)
            onGoingProjectsElement.appendChild(filmographyDiv)

            onGoingProjectsElement.closest('.on_going_projects').style.display = 'block';
            onGoingProjectsElement.closest('fieldset').classList.add('opened')
        } else {
            const filmographyDiv = getFilmographySummaryRow(filmographies[i], filmographiesElement.childNodes.length + 1)
            filmographiesElement.appendChild(filmographyDiv)

            filmographiesElement.closest('fieldset').classList.add('opened')
        }
    }
}

function collectFilmographies(field_name, conf, formData, formElement) {
    return
}

function updateFilmographyhSummaryRow(form, data) {
    let targetDiv = document.querySelector(".filmographies .list")
    if (data.is_ongoing) {
        targetDiv = document.querySelector(".on_going_projects .list")
    }
    const filmographyDiv = getFilmographySummaryRow(data, 'nr')

    updateCollectionSummaryRow(targetDiv, form, filmographyDiv)
}

function updateCollectionSummaryRow(targetDiv, form, rowDiv) {
    if (form.closest('.list')) {
        form.closest('.list').replaceChild(rowDiv, form.closest('.collection_entry'))
    } else {
        targetDiv.appendChild(rowDiv)
    }

    if (refreshRowNumbers(targetDiv) == 0) {
        targetDiv.closest('fieldset').classList.remove('opened')
    }
}

function getFilmographySummaryRow(filmography, index) {
    const template = document.querySelector('.filmographies .filmography_row_template .filmography')
    let filmographyDiv = template.cloneNode(true)

    let roleAtFilmDiv = ''
    if (filmography.role_at_films[0]) {
        let roleAtFilm = ''
        if (filmography.role_at_films[0].roleName) {
            roleAtFilm =  filmography.role_at_films[0].roleName.en
        } else {
            roleAtFilm = document.querySelector(`[name="org_filmography_role_at_films"] option[value="${filmography.role_at_films[0]}"]`).text
        }
        if (roleAtFilm) {
            roleAtFilmDiv = filmographyDiv.querySelector('.role_at_film').innerHTML.replace('%role_at_film%', roleAtFilm)
        }
    }
    filmographyDiv.querySelector('.role_at_film').innerHTML = roleAtFilmDiv

    filmographyDiv.querySelector('strong').innerHTML = filmographyDiv.querySelector('strong').innerHTML.replace('%nr%', index).replace('%work_name%', filmography.work_name)

    let type = 'completed'
    if (filmography.is_ongoing) {
        filmographyDiv.querySelector('.is_featured_project').remove()
        type = 'ongoing'
    } else {
        if (filmography.is_featured) {
            filmographyDiv.querySelector('.is_featured_project').querySelector('input').checked = true
        } else {
            filmographyDiv.querySelector('.is_featured_project').querySelector('span').remove()
        }
    }

    filmographyDiv.querySelector('button').setAttribute('onclick', `toggleFilmography(event, "${filmography.id}", "${type}")`)
    return filmographyDiv
}

function getClientSummaryRow(client, index) {
    const template = document.querySelector('.clients .client_row_template .client')
    let clientDiv = template.cloneNode(true)

    clientDiv.querySelector('strong').innerHTML = clientDiv.querySelector('strong').innerHTML.replace('%nr%', index).replace('%client_name%', client.name)
    clientDiv.querySelector('button').setAttribute('onclick', `toggleClient(event, "${client.id}")`)

    return clientDiv
}

function getAssetsUrl() {
    if (strapiDomain.includes('admin.poff.ee')) {
        return 'https://assets.poff.ee/img/'
    }
    return  `${strapiDomain}/uploads/`;
}

function toggleClient(event, id) {
    const form =  event.currentTarget.closest('.client').querySelector('.filled_client .client_form')
    if (event.currentTarget.classList.contains('opened')) {
        if (form.getAttribute('data-is-changed') === "false" || confirm(translate("collectionDataChanged"))) {
            event.currentTarget.classList.remove('opened')
            form.remove()
        }
    } else {
        event.currentTarget.classList.add('opened')
        const targetElement = event.currentTarget.closest('.client').querySelector('.filled_client')
        const data = organisation['clients'].find(client => id == client.id)
        const subForm = event.currentTarget.closest('fieldset').querySelector('.client_form.template').cloneNode(true)
        subForm.classList.remove('template')
        subForm.style.display = 'block'
        targetElement.appendChild(subForm)
        subForm.setAttribute('data-is-changed', false)

        subForm.addEventListener('input', function (event) {
            event.target.closest('.client_form').setAttribute('data-is-changed', true)
        });
        fillFields(subForm, getClientFields(), data)
    }
}

async function saveClient(event) {
    const form = event.target.closest('.client_form')
    const fields = getClientFields()
    if (!isFormValid(form, fields)) {
        return;
    }

    document.getElementById('loader').classList.add('loading')
    let saveOrganisationButton = document.getElementById(`saveOrganisationButton`)
    saveOrganisationButton.disabled = true

    data = collectFormData(form, fields)
    const result = await sendClient(data)

    if (result) {
        showSuccessMsg(translate('messageClientSaveSuccess'))
        const id = data.id ? data.id : state?.newCollectionIds?.client
        const client = organisation['clients'].find((element) => element.id == id)
        updateCollectionSummaryRow(document.querySelector(".clients .list"), form, getClientSummaryRow(client, 'nr'))
        if (!data.id) {
            closeClientForm(form)
        }
    }

    saveOrganisationButton.disabled = false
    document.getElementById('loader').classList.remove('loading')

}

function removeClient(event) {
    const form = event.currentTarget.closest('.client_form')
    const id = event.currentTarget.closest('.client_form').querySelector(`[name="id"]`).value
    if (id) {
        const clients = {
            'clients': organisation['clients'].filter((client) => client['id'] != id).map(client => client.id)
        }
        const result = sendOrganisation(clients)

        if (result) {
            closeClientForm(form)
        }
    } else {
        closeClientForm(form)
    }
}

function closeClientForm(form) {
    const fieldset = form.closest('fieldset')
    if (form.classList.contains('template')) {
        form.style.display = 'none'
        resetFields(form)
    } else {
        form.closest('.client').remove()
    }
    if (refreshRowNumbers(fieldset.querySelector('.list')) == 0) {
        fieldset.classList.remove('opened')
    }
}

function toggleIsFeatured(event) {
    event.currentTarget.closest('.filmography_form').classList.toggle("featured_filmography", event.currentTarget.checked);
}

function toggleFilmography(event, id, type) {
    const form = event.currentTarget.closest('.filmography').querySelector('.filled_filmography .filmography_form')
    const formFields = type == 'ongoing' ? getOnGoingFilmographyFields() : getFilmographyFields()
    const data = getFilmographyById(id);

    if (event.currentTarget.classList.contains('opened')) {
        if (form.getAttribute('data-is-changed') === "false" || confirm(translate("collectionDataChanged"))) {
            event.currentTarget.classList.remove('opened')
            form.remove()
        }
    } else {
        event.currentTarget.classList.add('opened')
        const targetElement = event.currentTarget.closest('.filmography').querySelector('.filled_filmography')
        const subForm = event.currentTarget.closest('fieldset').querySelector('.filmography_form.template').cloneNode(true)
        subForm.classList.remove('template')
        subForm.classList.toggle('featured_filmography', !data.is_ongoing && data.is_featured)
        subForm.style.display = 'block'
        subForm.setAttribute('data-is-changed', false)

        fillFields(subForm, formFields, data)
        subForm.addEventListener('input', function (event) {
            event.target.closest('.filmography_form').setAttribute('data-is-changed', true)
        });
        targetElement.appendChild(subForm)
    }
}


function getOnGoingFilmographyFields() {
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
            sendType: 'url',
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

function getClientFields() {
    return {
        url: {
            field: 'url',
            sendType: 'url',
        },
        description: {
            field: 'description',
        },
        name: {
            field: 'name',
        },
        id: {
            field: 'id'
        },
    }
}

function getFilmographyFields() {
    return {
        org_filmography_type_of_work: {
            field: 'type_of_work',
            type: 'select',
            sendType: "Integer"
        },
        org_filmography_role_at_films: {
            field: 'role_at_films',
            type: 'select'
        },
        org_filmography_year_from: {
            field: 'year_from',
            sendType: "Integer"
        },
        org_filmography_year_to: {
            field: 'year_to',
            sendType: "Integer"
        },
        org_filmography_work_name: {
            field: 'work_name',
        },
        org_filmography_work_url: {
            field: 'work_url',
            sendType: 'url',
        },
        org_filmography_runtime: {
            field: 'runtime',
            sendType: "Integer"
        },
        org_filmography_org_name: {
            field: 'org_name',
        },
        org_filmography_org_url: {
            field: 'org_url',
            sendType: 'url',
        },
        org_filmography_decsription_en: {
            field: 'decsription_en',
        },
        org_filmography_is_featured: {
            field: 'is_featured',
            type: 'checkbox'
        },

        stills: {
            field: 'stills',
            fillFunction: fillStill,
            collectFunction: collectStill
        },
        id: {
            field: 'id'
        },
    }
}


async function saveFilmography(event, is_ongoing = true) {
    const form = event.target.closest('.filmography_form')
    const fields = is_ongoing ? getOnGoingFilmographyFields(): getFilmographyFields()
    if (!isFormValid(form, fields)) {
        return;
    }

    document.getElementById('loader').classList.add('loading')
    let saveOrganisationButton = document.getElementById(`saveOrganisationButton`)
    saveOrganisationButton.disabled = true

    data = collectFormData(form, fields)
    data['is_ongoing'] = is_ongoing ? 1:0
    const result = await sendFilmography(data)

    if (result) {
        showSuccessMsg(translate('messageFilmographySaveSuccess'))
        const id = data.id ? data.id : state?.newCollectionIds?.filmography
        const filmography = organisation['filmographies'].find((element) => element.id == id)

        updateFilmographyhSummaryRow(form, filmography)
        if (!data.id) {
            closeFilmographyForm(form)
        }
    }

    saveOrganisationButton.disabled = false
    document.getElementById('loader').classList.remove('loading')
}

function sendClient(data) {
    const organisationData = {
        'client': data
    }
    return sendOrganisation(organisationData)
}

function sendFilmography(data)
{
    const organisationData = {}
    organisationData['new_files'] = data['new_files']
    delete data['new_files']
    organisationData['filmography'] = data
    return sendOrganisation(organisationData)
}

function removeFilmography(event) {
    const form = event.currentTarget.closest('.filmography_form')
    const id = event.currentTarget.closest('.filmography_form').querySelector(`[name="id"]`).value
    if (id) {
        const organisationData = {
            'filmographies': organisation['filmographies'].filter((filmography) => filmography['id'] != id).map(filmography => filmography.id)
        }
        const result = sendOrganisation(organisationData)

        if (result) {
            closeFilmographyForm(form)
        }
    } else {
        closeFilmographyForm(form)
    }
}

function closeFilmographyForm(form) {
    const fieldset = form.closest('fieldset')
    if (form.classList.contains('template')) {
        form.style.display = 'none'
        resetFields(form)
    } else {
        form.closest('.filmography').remove()
    }
    if (refreshRowNumbers(fieldset.querySelector('.list')) == 0) {
        fieldset.classList.remove('opened')
    }
}

function getFilmographyById(id) {
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

    let errorDiv = element.closest('.form_group').querySelector('.error')
    if (element.closest('label') && element.closest('label').querySelector('.error')) {
        errorDiv = element.closest('label').querySelector('.error')
    }
    errorDiv.innerHTML = (errors) ? errors.join('<br />') : '';
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
        } else if (validator == 'is-number-between-1-10000' && fieldValue != "" && !/^[1-9]\d{0,4}$/.test(fieldValue)) {
            errors.push(translate('validatinErrorInvalidNumberBetween1_10000'))
        } else if (validator == 'is-valid-year' && fieldValue != "" && !/^(19|20)\d{2}$/.test(fieldValue)) {
            errors.push(translate('validationErrorInvalidYear'))
        } else if (validator == 'is-email' && (!/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(fieldValue))) {
            errors.push(translate('validationErrorEmail'))
        } else if (validator == 'is-phone-nr' && fieldValue != "" && !/^[+]?[\s./0-9]*[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/g.test(fieldValue)) {
            errors.push(translate('validationErrorPhone'))
        } else if (validator == 'is-showreel' && fieldValue != "") {
            const youtubeRegex = /(?:(?:https?:)?\/\/)?(?:(?:www|m)\.)?(?:(youtube(?:-nocookie)?\.com|youtu.be))(?:\/(?:[\w\-]+\?v=|embed\/|live\/|v\/)?)([\w\-]+)(?:\S+)?/
            const vimeoRegex = /(?:http|https)?:?\/?\/?(?:www\.)?(?:player\.)?(vimeo\.com)\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|video\/|)(\d+)(?:|\/\?)/
            if (!youtubeRegex.test(fieldValue) && !vimeoRegex.test(fieldValue)) {
                errors.push(translate('validationErrorShowreel'))
            }
        } else if (validator == 'still-image') {
            const isFeatured = field.closest('.filmography_form').querySelector('input[name="org_filmography_is_featured"]').checked
            const imgPreview = field.closest('.form_group').querySelector('.imgPreview')
            if (isFeatured && field.files.length == 0 && !imgPreview.hasAttribute('data-image-id')) {
                errors.push(translate('validationErrorMissingStill'))
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
            sendType: 'url',
        },
        org_acc_efis: {
            field: 'acc_efis',
            sendType: 'url',
        },
        org_acc_instagram: {
            field: 'acc_instagram',
            sendType: 'url',
        },
        org_acc_fb: {
            field: 'acc_fb',
            sendType: 'url',
        },
        org_acc_other: {
            field: 'acc_other',
            sendType: 'url',
        },
        org_acc_youtube: {
            field: 'acc_youtube',
            sendType: 'url',
        },
        org_acc_vimeo: {
            field: 'acc_vimeo',
            sendType: 'url',
        },
        org_webpage_url: {
            field: 'webpage_url',
            sendType: 'url',
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
                    sendType: "Integer"
                },
                org_county: {
                    field: 'county',
                    type: "select",
                    sendType: "Integer"
                },

                org_municipality: {
                    field: 'municipality',
                    type: "select",
                    sendType: "Integer"
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
            collectFunction: collectAudioreelData,
            fillFunction: fillAudioreel
        },
        logoColour: {
            field: 'logoColour',
            collectFunction: collectImgData,
            fillFunction: fillImage
        },
        profile_img: {
            field: 'profile_img',
            collectFunction: collectImgData,
            fillFunction: fillImage

        },
        images: {
            field: 'images',
            collectFunction: collectGalleryData,
            fillFunction: fillGallery
        },
        ok_to_contact: {
            field: "ok_to_contact",
            type: "checkbox"
        }
    }
}

const fillOrganisationForm = (organisation) => {
    if (organisation.id) {
        fillFields(document.querySelector('.organisationprofile'), getOrganisationFields(), organisation)
    } else {
        showPopup(translate('errorOnOrganisationLoad'))
    }
}

function getImageMetaData(field) {
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

function generateImageMetadataJson(imageElement) {
    return JSON.stringify({
        caption: imageElement.querySelector(`[name="caption"]`).value,
        photographer: imageElement.querySelector(`[name="photographer"]`).value,
        img_year: imageElement.querySelector(`[name="img_year"]`).value
    })
}

function fillStill(imgEl, val, fieldName) {
    console.log(imgEl)
    if (!Array.isArray(val) || val.length < 1) {
        return
    }
    val = val[0]
    imgEl.querySelector('.imgPreview').src = `${getAssetsUrl()}${val.hash}${val.ext}`
    imgEl.querySelector('.imgPreview').setAttribute('data-image-id', val.id)
    imgEl.classList.add('preview_image_filled')

}

function fillImage(domElement, val, fieldName = false) {
    const imgEl = fieldName ? domElement.querySelector(`[name="${fieldName}"]`).closest('.fieldset_grid') : domElement
    const metaData = getImageMetaData(val.caption)
    imgEl.querySelector(`[name="caption"]`).value = metaData.caption
    imgEl.querySelector(`[name="photographer"]`).value = metaData.photographer
    imgEl.querySelector(`[name="img_year"]`).value = metaData.img_year
    imgEl.querySelector('.imgPreview').src = `${getAssetsUrl()}${val.hash}${val.ext}`
    if (imgEl.querySelector(`[name="id"]`)) {
        imgEl.querySelector(`[name="id"]`).value = val.id
    }
}

function fillGallery(domElement, val, fieldName) {
    let gallery = domElement.querySelector('.gallery')
    for (let i = 0; i < val.length; i++) {
        fillImage(gallery, val[i])
        if (i < val.length - 1) {
            gallery = duplicateElement(gallery)
        }
    }
}

function fillAudioreel(domElement , val, fieldName) {
    if (val && val.hash && val.ext) {
        const htmlElement = domElement.querySelector(`[name="${fieldName}"]`).closest('.fieldset_grid');
        htmlElement.querySelector('#audioreel_preview').src = `${getAssetsUrl()}${val.hash}${val.ext}`
        htmlElement.querySelector('#audioreel_preview').style.display = "block"
    }
}

function fillFields(domElement, fields, data) {
    for (var field_name in fields) {
        const conf = fields[field_name]
        let val = data[conf.field]

        if (conf.fillFunction) {
            if (val !== null && val !== undefined) {
                conf.fillFunction(domElement, val, field_name)
            }
        } else if (fields[field_name].type == 'select') {
            setSelectByFieldName(domElement, val, field_name)
        } else if (fields[field_name].type == 'checkbox') {
            domElement.querySelector(`[name="${field_name}"]`).checked = val;
        } else if (fields[field_name].type == 'collection') {
            if (val !== null && val !== undefined) {
                fillFields(domElement.querySelector(`.${field_name}`), conf.fields, val)
            }
        } else {
            domElement.querySelector(`[name="${field_name}"]`).value = val ?? ""
            domElement.querySelector(`[name="${field_name}"]`).dispatchEvent(new Event('input', { 'bubbles': false }))
        }
        if (val && ((typeof val != 'object' && val) || (typeof val == 'object' && Object.keys(val).length))) {
            const field = domElement.querySelector(`input[name="${field_name}"], select[name="${field_name}"]`)

            if (field) {
                if (domElement.querySelector('fieldset') || domElement.tagName.toLowerCase() == 'fieldset') {
                    field.closest('fieldset').classList.add('opened')
                }
            }
        }
    }
}

function fillOrderedRaF(domElement, val, field_name) {
    const sortedValues = val.sort((a, b) => a.order - b.order).map((e) => {return  { id: e.role_at_film.id } })
    setSelectByFieldName(domElement, sortedValues, field_name)
}

function collectOrderedRaf(field_name, conf, formData, formElement) {
    formData[conf.field] = Array.from(formElement.querySelectorAll(`[name="${field_name}"]`)).filter(el => el.value != '').map((el, index) => { return { role_at_film: parseInt(el.value), order: index + 1} })
}

function fillClients(domElement, clients, fieldName) {
    const clientsList = document.querySelector(".clients .list")
    clientsList.innerHTML = ""

    for (let i = 0; i < clients.length; i++) {
        const clientDiv = getClientSummaryRow(clients[i], clientsList.childNodes.length + 1)
        clientsList.appendChild(clientDiv)
        clientDiv.closest('fieldset').classList.add('opened')
    }
}

function collectClients(field_name, conf, formData, formElement)
{
    return;
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
        imageElement.classList.remove('preview_image_filled')
    } else if (file.size / 1024 / 1024 > 5) {
        error.innerHTML = translate('validationErrorImageFileIsToBig', {size: (file.size / 1024 / 1024).toFixed(2)})
        previewElement.src = previewElement.getAttribute('data-placeholder-img')
        imageElement.querySelector('input[type="file"]').value = ''
        imageElement.classList.remove('preview_image_filled')
    } else {
        error.innerHTML = ""
        var reader = new FileReader()
        reader.onload = function () {
            previewElement.src = reader.result
        }
        reader.readAsDataURL(file)
        imageElement.classList.add('preview_image_filled')

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

function refreshRowNumbers(element) {
    const nrFields = element.querySelectorAll('.nr');
    for (let index = 0; index < nrFields.length; index++) {
        nrFields[index].innerHTML = `${index+1}.`
    }
    return nrFields.length
}

const observer = new MutationObserver(function(mutationsList, observer) {
    refreshRowNumbers(document.querySelector('.org_role_at_films'))
});

observer.observe(document.querySelector('.org_role_at_films'), {characterData: false, childList: true, attributes: false});
//end sortable role_at_films fieds

function showSuccessMsg(message) {
    const notification = document.getElementById('alertSuccess')
    notification.innerHTML = message
    notification.style.display = 'block'
    setTimeout(()=>{notification.style.display = 'none';}, 5000);
}

function showErrorMsg(message) {
    const notification = document.getElementById('alertError')
    notification.innerHTML = message
    notification.style.display = 'block'
    setTimeout(()=>{notification.style.display = 'none';}, 5000);
}

function showPopup(message) {
    document.getElementById('infoPopup').querySelector('p').innerHTML = message
    document.getElementById('infoPopup').style.display = "block"
}

; (async () => {
    requireLogin()
})()
