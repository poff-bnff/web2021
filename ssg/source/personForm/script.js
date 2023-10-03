let profileImageToSend = "empty"
let galleryImageToSend = {}
let audioFileToSend = "empty"
let galleryCounter = 0
let galleryExistingImageCounter = 0
let profEducationCounter = 0
let roleAtFilmCounter = 0
let tagLookingForCounter = 0
let otherLangCounter = 0
let filmographyCounter = 0
let filmographiesToDelete = []
let existingGalleryImagesToDelete = []
let profileId = null

if (isUserTokenValid()) {
    loadUserInfo()
} else {
    document.getElementById('logInStatus').style.display = ''
    window.open(`${location.origin}/${langpath}login`, '_self')
    savePreLoginUrl()
}

// async function getPersonForm() {
//     let response = await fetch(`${strapiDomain}/users/getPersonForm`, {
//         method: "GET",
//         headers: {
//             Authorization: "Bearer " + localStorage.getItem("ID_TOKEN"),
//         },
//     });
//     let personOnForm = await response.json()
//     console.log({ personOnForm })

//     return personOnForm

// }

// getPersonForm()

async function loadUserInfo() {

    let userProfile = await getUser()
    const profile = userProfile.user_profile
    if (profile) {
        console.log('profile2', profile);

        if (userProfile.person) {
            await fillThePersonForm(userProfile.person)
            profileId = userProfile.person.id
        }

        if (!userProfile?.person?.role_at_films?.length) {
            addNextRoleAtFilm()
        }
        if (!userProfile?.person?.tag_looking_fors?.length) {
            addNextTagLookingFor()
        }
        if (!userProfile?.person?.other_lang?.length) {
            addNextOtherLang()
        }

        document.getElementById('thisPersonProfile').style.display = ''
        document.getElementById('logInStatus').style.display = 'none'
        document.getElementById('loadingStatus').style.display = 'none'
        // At least one profession required, thus add one field on every reload
    }

}

async function fillThePersonForm(person) {
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
            if (obj.hasOwnProperty(key) && !isJsonString(obj[key])) {
                try {
                    // console.log('SET: ', key, typeof key, obj[key], typeof obj[key]);
                    document.getElementById(key).value = obj[key]
                } catch (error) {
                    // console.log('SET FAIL: ', key, typeof key, obj[key]);
                }
            } else if (isJsonString(obj[key]) && !Array.isArray(obj[key])) {
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

    // document.getElementById('personProfileSent').style.display = 'none'

    let saveProfileButton = document.getElementById(`saveProfileButton`)
    saveProfileButton.disabled = true
    let previousInnerHTML = saveProfileButton.innerHTML
    saveProfileButton.innerHTML = `<i class="fa fa-spinner fa-spin"></i>`

    // let pictureInfo = "no profile picture saved"

    const formData = new FormData();

    // FORMAADIS " strapi muutuja nimi : vormi välja ID "

    // Prof education data processing
    let profEducationData = []
    let profEducationElements = document.querySelectorAll('[id^="education"]')
    for (let index = 0; index < profEducationElements.length; index++) {
        const element = profEducationElements[index];
        profEducationData.push(
            {
                strapi_id: element.getElementsByClassName('strapi_id')[0].value || null,
                type_of_work: '7',
                year_from: element.getElementsByClassName('year_from')[0].value || null,
                year_to: element.getElementsByClassName('year_to')[0].value || null,
                org_name: element.getElementsByClassName('org_name')[0].value || null,
                org_department: element.getElementsByClassName('org_department')[0].value || null,
                degree: element.getElementsByClassName('degree')[0].value || null,
                org_url: element.getElementsByClassName('org_url')[0].value || null,
            }
        )
        element.remove()
    }

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

    // Filmographies data processing
    let filmographiesData = []
    let filmographiesElements = document.querySelectorAll('[id^="filmographies"]')
    for (let index = 0; index < filmographiesElements.length; index++) {
        const element = filmographiesElements[index];
        filmographiesData.push(
            {
                strapi_id: element.getElementsByClassName('strapi_id')[0].value || null,
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
        )
        element.remove()
    }

    let personToSend = {
        id: profileId,
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
        address: {
            strapi_id: addr_strapi_id.value || null,
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

    formData.append('data', JSON.stringify(personToSend));

    if (profileImageToSend !== "empty") {
        formData.append(`files.picture`, profileImageToSend, profileImageToSend.name);
    }

    if (audioFileToSend !== "empty") {
        formData.append(`files.audioreel`, audioFileToSend, audioFileToSend.name);
    }

    if (Object.keys(galleryImageToSend).length !== 0) {
        Object.keys(galleryImageToSend).map(key => {
            console.log('Gallery img', galleryImageToSend[key]);
            formData.append(`files.images`, galleryImageToSend[key], galleryImageToSend[key].name);
        })
    }

    // Log form data
    console.log('Formdata:');
    for (var pair of formData.entries()) {
        console.log(pair[0] + ', ' + pair[1]);
    }

    console.log("kasutaja profiil mida saadan ", personToSend);

    let response = await (await fetch(`${strapiDomain}/users/personForm`, {
        method: 'POST',
        headers: {
            Authorization: 'Bearer ' + localStorage.getItem('ID_TOKEN')
        },
        body: formData
    }))

    console.log(response);

    console.log('Responsestatus', response.status);

    if (response.status === 200) {

        saveProfileButton.disabled = false
        saveProfileButton.innerHTML = previousInnerHTML
        // firstName.value = ''
        // lastName.value = ''
        // gender.value = ''
        // dateOfBirth.value = ''
        // phoneNr.value = ''
        // eMail.value = ''
        // addrCountry.value = ''
        // addrCounty.value = ''
        // addrMunicipality.value = ''
        // addr_popul_place.value = ''
        // addr_street_name.value = ''
        // addrHouseNumber = ''
        // addrApptNumber = ''
        // addrPostalCode = ''

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
        document.getElementsByClassName('imgPreview')[0].src = '/assets/img/static/Hunt_Kriimsilm_2708d753de.jpg'

        profEducationData = []
        roleAtFilmData = []
        tagLookingForData = []
        otherLangData = []
        filmographiesData = []

        profEducationCounter = 0
        roleAtFilmCounter = 0
        tagLookingForCounter = 0
        otherLangCounter = 0
        filmographyCounter = 0
        filmographiesToDelete = []

        console.log('OK');
        document.getElementById('personProfileSent').open = true;

        // Scroll page to dialog
        scrollToElement("personProfileSent")

        // dialog.showModal()
        // document.getElementById('personProfileSent').style.display = ''
        // if (localStorage.getItem('preLoginUrl')) {
        //     window.open(localStorage.getItem('preLoginUrl'), '_self')
        //     localStorage.removeItem('preLoginUrl')
        // }

    }
}

function validatePersonForm() {

    const errors = []

    // if (document.getElementById('personProfileSent')) {
    //     document.getElementById('personProfileSent').style.display = 'none'
    // }

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

    let roleAtFilmElements = document.querySelectorAll('[id^="filmRole"]')
    for (let index = 0; index < roleAtFilmElements.length; index++) {
        const element = roleAtFilmElements[index];
        if (!validateRepeatableFormPart(element.getElementsByClassName('role_at_film')[0], element.getElementsByClassName('help')[0])) {
            errors.push(element.id)
        }
    }

    let tagLookingForElements = document.querySelectorAll('[id^="tagLookingElement"]')
    for (let index = 0; index < tagLookingForElements.length; index++) {
        const element = tagLookingForElements[index];
        if (!validateRepeatableFormPart(element.getElementsByClassName('tag_looking_for')[0], element.getElementsByClassName('help')[0])) {
            errors.push(element.id)
        }
    }

    let educationElements = document.querySelectorAll('[id^="education"]')
    for (let index = 0; index < educationElements.length; index++) {
        const element = educationElements[index];
        if (!validateRepeatableFormPart(element.getElementsByClassName('org_name')[0], element.getElementsByClassName('org_name_help')[0])) {
            errors.push(element.id)
        }
    }

    let filmographyElements = document.querySelectorAll('[id^="filmographies"]')
    for (let index = 0; index < filmographyElements.length; index++) {
        const element = filmographyElements[index];
        if (!validateRepeatableFormPart(element.getElementsByClassName('type_of_work')[0], element.getElementsByClassName('type_of_work_help')[0])) {
            errors.push(element.id)
        }
        if (!validateRepeatableFormPart(element.getElementsByClassName('work_name')[0], element.getElementsByClassName('work_name_help')[0])) {
            errors.push(element.id)
        }
    }

    console.log('errors', errors);

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
    console.log(formFieldId);
    let formField = document.getElementById(formFieldId)
    let formFieldHelp = document.getElementById(`${formFieldId}Help`)

    console.log('formFieldId', formFieldId, 'type', type);

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
        console.log('BDAY', formField.value);
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
    console.log('selectElement', selectElement, 'selectHelp', selectHelp);
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
    document.getElementById(elementId).scrollIntoView(false);
}

function validateImageAndPreview(file, templateElement, type) {
    console.log('aga');

    let error = document.getElementById("imgError");
    // Check if the file is an image.
    if (!file.type.includes("image")) {
        // console.log("File is not an image.", file.type, file);
        error.innerHTML = "File is not an image.";
    } else if (file.size / 1024 / 1024 > 5) {
        error.innerHTML = "Image can be max 5MB, uploaded image was " + (file.size / 1024 / 1024).toFixed(2) + "MB"
    } else {
        error.innerHTML = "";
        // Preview
        var reader = new FileReader();
        reader.onload = function () {
            console.log('agasiia');
            let previewElement = document.getElementById(templateElement).getElementsByClassName('imgPreview')[0]
            console.log('previewElement', previewElement);
            previewElement.src = reader.result;
            console.log(previewElement);
        };
        reader.readAsDataURL(file);
        if (type === 'profile') {
            profileImageToSend = file
        } else if (type === 'gallery') {
            console.log(galleryCounter, galleryImageToSend);
            galleryImageToSend[templateElement] = file
        }
    }
}

function validateAudioAndPreview(file) {

    let error = document.getElementById("audioError");
    // Check if the file is an image.
    if (!file.type.includes("audio")) {
        // console.log("File is not an image.", file.type, file);
        error.innerHTML = "File is not an audio";
    } else if (file.size / 1024 / 1024 > 5) {
        error.innerHTML = "Audioreel can be max 5MB, uploaded audio was " + (file.size / 1024 / 1024).toFixed(2) + "MB"
    } else {
        error.innerHTML = "";
        // Preview
        var reader = new FileReader();
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
    const galleryTemplate = document.getElementById('galleryTemplate');
    const clone = galleryTemplate.cloneNode(true);
    clone.id = `galleryImage${galleryCounter}`
    clone.style.display = ''
    document.getElementById('galleryTemplate').parentElement.appendChild(clone)
    let thisElement = document.getElementById(`galleryImage${galleryCounter}`)

    thisElement.getElementsByClassName('galleryImg')[0].setAttribute('onchange', `validateImageAndPreview(this.files[0], "galleryImage${galleryCounter}", "gallery")`)
    thisElement.getElementsByClassName('deleteGalleryImage')[0].setAttribute('onclick', `deleteGalleryImage("galleryImage${galleryCounter}")`)

    galleryCounter = galleryCounter + 1
}

function addExistingGalleryImages(imagesData) {
    imagesData.map(img => {
        const galleryTemplate = document.getElementById('galleryTemplate');
        const clone = galleryTemplate.cloneNode(true);
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
        const textElement = document.createElement("p");
        const text = document.createTextNode(`${img.alternativeText} (${img.caption})`);
        textElement.appendChild(text);
        thisElement.appendChild(textElement);

        thisElement.getElementsByClassName('deleteGalleryImage')[0].setAttribute('onclick', `deleteGalleryImage("existingGalleryImage${galleryExistingImageCounter}", ${img.id})`)

        galleryExistingImageCounter = galleryExistingImageCounter + 1
    })
}

function addExistingProfileImg(imageData) {
    if (imageData) {
        const profileImgElement = document.getElementById('profileImage');
        const profileImgPreview = profileImgElement.getElementsByClassName('imgPreview')[0]
        profileImgPreview.src = `https://assets.poff.ee/img/${imageData.hash}${imageData.ext}`
        // profileImgPreview.src = `http://localhost:1337/uploads/${imageData.hash}${imageData.ext}`

        const profileImgLabel = profileImgElement.getElementsByClassName('person_profile_label')[0]
        profileImgLabel.innerHTML = `${profileImgLabel.innerHTML} (adding new image, replaces the current one)`

        const textElement = document.createElement("p");
        const text = document.createTextNode(`${imageData.alternativeText} (${imageData.caption})`);
        textElement.appendChild(text);
        profileImgElement.appendChild(textElement);
    }
}

function deleteGalleryImage(elementToDelete, existingImageID = null) {
    const elementToBeDeleted = document.getElementById(elementToDelete);
    elementToBeDeleted.remove()
    if (!existingImageID && galleryImageToSend[elementToDelete]) {
        delete galleryImageToSend[elementToDelete]
    }
    if (existingImageID) {
        existingGalleryImagesToDelete.push(existingImageID)
    }
}

function addNextRoleAtFilm(data = null) {
    const cloneElementPrefix = 'filmRole'
    const roleAtFilmTemplate = document.getElementById('roleAtFilmTemplate');
    const clone = roleAtFilmTemplate.cloneNode(true);
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
    const cloneElementPrefix = 'tagLookingElement'
    const tagLookingForTemplate = document.getElementById('tagLookingForTemplate');
    const clone = tagLookingForTemplate.cloneNode(true);
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
    const cloneElementPrefix = 'otherLangElement'
    const otherLangTemplate = document.getElementById('otherLangTemplate');
    const clone = otherLangTemplate.cloneNode(true);
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

function addNextEducation(data = null) {
    const cloneElementPrefix = 'education'
    const profEducationTemplate = document.getElementById('profEducationTemplate');
    const clone = profEducationTemplate.cloneNode(true);
    clone.id = `${cloneElementPrefix}${profEducationCounter}`
    clone.style.display = ''
    document.getElementById('profEducationTemplate').parentElement.appendChild(clone)

    let thisElement = document.getElementById(`${cloneElementPrefix}${profEducationCounter}`)

    let deleteButton = thisElement.getElementsByClassName('deleteButton')[0]
    deleteButton.classList.add(`delete${cloneElementPrefix}`)
    deleteButton.setAttribute('onclick', `removeElement("${cloneElementPrefix}${profEducationCounter}")`)

    // Fill with existing info
    if (data) {
        const dataKeys = Object.keys(data);
        dataKeys.map(k => {
            try {
                thisElement.getElementsByClassName(k)[0].value = data[k]
                // Add Strapi ID, if it exists, to hidden field
                if (data.id) {
                    thisElement.getElementsByClassName('strapi_id')[0].value = data.id
                }
            } catch (error) {
                null
            }
        })
    }

    profEducationCounter = profEducationCounter + 1
}

function addNextFilmographyWork(data = null) {
    const cloneElementPrefix = 'filmographies'
    const filmographyTemplate = document.getElementById('filmographyTemplate');
    const clone = filmographyTemplate.cloneNode(true);
    clone.id = `${cloneElementPrefix}${filmographyCounter}`
    clone.style.display = ''
    document.getElementById('filmographyTemplate').parentElement.appendChild(clone)

    let thisElement = document.getElementById(`${cloneElementPrefix}${filmographyCounter}`)

    let deleteButton = thisElement.getElementsByClassName('deleteButton')[0]
    deleteButton.classList.add(`delete${cloneElementPrefix}`)
    deleteButton.setAttribute('onclick', `removeElement("${cloneElementPrefix}${filmographyCounter}")`)

    // Fill with existing info
    if (data) {
        const dataKeys = Object.keys(data);
        dataKeys.map(k => {
            try {
                thisElement.getElementsByClassName(k)[0].value = typeof data[k] === 'object' && data[k] !== null ? data[k].id : data[k]
                // Add Strapi ID, if it exists, to hidden field
                if (data.id) {
                    thisElement.getElementsByClassName('strapi_id')[0].value = data.id
                    // Fill role_at_film for filmography as it is repeatable
                    if (k === 'role_at_films' && data[k][0]) {
                        thisElement.getElementsByClassName(k)[0].value = data[k][0].id
                    }
                }
            } catch (error) {
                null
            }
        })
    }

    filmographyCounter = filmographyCounter + 1
}

function removeElement(id, required = false, requiredElementName = null) {
    const theElement = document.getElementById(id);

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
    let strapiId
    try {
        strapiId = theElement.getElementsByClassName('strapi_id')[0].value
    } catch (error) { }
    if (strapiId > 0) {
        filmographiesToDelete.push(strapiId)
    }
}

function isJsonString(jsonString) {
    try {
        var o = jsonString;

        // Handle non-exception-throwing cases:
        // Neither JSON.parse(false) or JSON.parse(1234) throw errors, hence the type-checking,
        // but... JSON.parse(null) returns null, and typeof null === "object",
        // so we must check for that, too. Thankfully, null is falsey, so this suffices:
        if (o && typeof o === "object") {
            return true;
        }
    }
    catch (e) { }

    return false;
};
