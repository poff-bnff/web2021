let profileImageToSend = "empty"
let galleryImageToSend = {}
let audioFileToSend = "empty"
let galleryCounter = 0
let profEducationCounter = 0
let roleAtFilmCounter = 0
let tagLookingForCounter = 0
let filmographyCounter = 0

if (validToken) {
    loadUserInfo()
} else {
    // document.getElementById('logInStatus').style.display = ''
    // window.open(`${location.origin}/${langpath}login`, '_self')
    // saveUrl()
}

async function getUserProfile() {
    let response = await fetch(`${strapiDomain}/users/me`, {
        method: "GET",
        headers: {
            Authorization: "Bearer " + localStorage.getItem("BNFF_U_ACCESS_TOKEN"),
        },
    });
    let userProfile = await response.json()
    console.log({ userProfile })

    return userProfile
}

async function getPersonForm() {
    let response = await fetch(`${strapiDomain}/users/getPersonForm`, {
        method: "GET",
        headers: {
            Authorization: "Bearer " + localStorage.getItem("BNFF_U_ACCESS_TOKEN"),
        },
    });
    let personOnForm = await response.json()
    console.log({ personOnForm })

    return personOnForm

}

getPersonForm()

async function loadUserInfo() {

    let userProfile = await getUserProfile()
    const profile = userProfile.user_profile

    if (profile) {
        document.getElementById('thisPersonProfile').style.display = ''
        document.getElementById('logInStatus').style.display = 'none'
        document.getElementById('loadingStatus').style.display = 'none'
        // At least one profession required, thus add one field on every reload
        addNextRoleAtFilm()
        addNextTagLookingFor()
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

    console.log('o_lang', otherlang.value)

    // Prof education data processing
    let profEducationData = []
    let profEducationElements = document.querySelectorAll('[id^="education"]')
    for (let index = 0; index < profEducationElements.length; index++) {
        const element = profEducationElements[index];
        profEducationData.push(
            {
                type_of_work: element.getElementsByClassName('type_of_work')[0].value || null,
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

    // Filmographies data processing
    let filmographiesData = []
    let filmographiesElements = document.querySelectorAll('[id^="filmographies"]')
    for (let index = 0; index < filmographiesElements.length; index++) {
        const element = filmographiesElements[index];
        filmographiesData.push(
            {
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
        firstName: firstName.value,
        lastName: lastName.value,
        // role_at_films: roleatfilm.value || null,
        gender: gender.value,
        dateOfBirth: dateofbirth.value,
        native_lang: nativelang.value,
        other_lang: [...otherlang.options].filter(x => x.selected).map(x => x.value) || null,
        phoneNr: phoneNr.value || null,
        eMail: eMail.value || null,
        repr_org_name: repr_org_name.value || null,
        repr_org_url: repr_org_url.value || null,
        repr_p_name: repr_p_name.value || null,
        repr_phone: repr_phone.value || null,
        repr_email: repr_email.value || null,
        dateOfBirth: dateofbirth.value || null,
        native_lang: nativelang.value || null,
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
        // text_looking_for: looking_for.value || null,
        address: {
            country: addrCountry.value || null,
            county: addrCounty.value || null,
            municipality: addrMunicipality.value || null,
            popul_place: addr_popul_place.value || null,
            street_name: addr_street_name.value || null,
            address_number: addrHouseNumber.value || null,
            appartment: addrApptNumber.value || null,
            postal_code: addrPostalCode.value || null,
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
        filmographies: filmographiesData.concat(profEducationData),

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

    // console.log("kasutaja profiil mida saadan ", personToSend);

    let response = await (await fetch(`${strapiDomain}/users/personForm`, {
        method: 'POST',
        headers: {
            Authorization: 'Bearer ' + localStorage.getItem('BNFF_U_ACCESS_TOKEN')
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
        // dateofbirth.value = ''
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
        galleryImageToSend = {}
        profileImg.value = ''
        document.getElementsByClassName('imgPreview')[0].src = '/assets/img/static/Hunt_Kriimsilm_2708d753de.jpg'

        profEducationData = []
        roleAtFilmData = []
        tagLookingForData = []
        filmographiesData = []

        profEducationCounter = 0
        roleAtFilmCounter = 0
        tagLookingForCounter = 0
        filmographyCounter = 0

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

    if (!validateRequiredField("dateofbirth", "dateofbirth")) {
        errors.push('dateofbirth')
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
    } else if (type === 'dateofbirth') {
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

function deleteGalleryImage(elementToDelete) {
    const elementToBeDeleted = document.getElementById(elementToDelete);
    elementToBeDeleted.remove()
    if (galleryImageToSend[elementToDelete]) {
        delete galleryImageToSend[elementToDelete]
    }
}

function addNextRoleAtFilm() {
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

    roleAtFilmCounter = roleAtFilmCounter + 1
}


function addNextTagLookingFor() {
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

    tagLookingForCounter = tagLookingForCounter + 1
}

function addNextEducation() {
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

    profEducationCounter = profEducationCounter + 1
}

function addNextFilmographyWork() {
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

    filmographyCounter = filmographyCounter + 1
}

function removeElement(id, required = false, requiredElementName = null) {
    const theElement = document.getElementById(id);

    if (required && requiredElementName) {
        let requiredCount = document.getElementsByClassName(requiredElementName)
        console.log('requiredCount', requiredCount);
        if (requiredCount.length >= 2) {
            theElement.remove()
            removeInvalidClass(theElement, theElement.getElementsByClassName('help')[0])
        } else {
            addInvalidClass(theElement, theElement.getElementsByClassName('help')[0])
        }
    } else {
        theElement.remove()
    }
}

