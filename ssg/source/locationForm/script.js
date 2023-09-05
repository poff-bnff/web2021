let profileImageToSend = "empty"
let galleryImageToSend = {}
let galleryCounter = 0

if (isUserTokenValid()) {
    loadUserInfo()
} else {
    document.getElementById('logInStatus').style.display = ''
    window.open(`${location.origin}/${langpath}login`, '_self')
    savePreLoginUrl()
}

async function loadUserInfo() {

    let userProfile = await getUser()
    const profile = userProfile.user_profile

    if (profile) {
        document.getElementById('thisPersonProfile').style.display = ''
        document.getElementById('logInStatus').style.display = 'none'
        document.getElementById('loadingStatus').style.display = 'none'
    }

}

async function sendPersonProfile() {

    document.getElementById('personProfileSent').style.display = 'none'

    let saveProfileButton = document.getElementById(`saveProfileButton`)
    saveProfileButton.disabled = true
    let previousInnerHTML = saveProfileButton.innerHTML
    saveProfileButton.innerHTML = `<i class="fa fa-spinner fa-spin"></i>`

    // let pictureInfo = "no profile picture saved"

    const formData = new FormData();

    // FORMAADIS " strapi muutuja nimi : vormi välja ID "

    console.log('o_lang', otherlang.value )

    let personToSend = {
        firstName: firstName.value,
        lastName: lastName.value,
        role_at_films: roleatfilm.value || null,
        gender: gender.value,
        dateOfBirth: dateofbirth.value,
        native_lang: nativelang.value,
        other_lang: otherlang.value || null,
        phoneNr: phoneNr.value || null,
        eMail: eMail.value || null,
        repr_org_name: repr_org_name.value || null,
        repr_org_url: repr_org_url.value || null,
        repr_p_name: repr_p_name.value || null,
        repr_phone: repr_phone.value || null,
        repr_email: repr_email.value || null,
        dateOfBirth: dateofbirth.value || null,
        native_lang: nativelang.value || null,
        other_lang: otherlang.value || null,
        acting_age_from: acting_age_from.value || null,
        acting_age_to: acting_age_to.value || null,
        height_cm: height_cm.value || null,
        weight_kg: weight_kg.value || null,
        stature: stature.value || null,
        eye_colour: eye_colour.value || null,
        hair_colour: hair_colour.value || null,
        hair_length: hair_length.value|| null,
        pitch_of_voice: pitch_of_voice.value || null,
        acc_imdb: acc_imdb.value || null,
        acc_efis: acc_efis.value || null,
        acc_castupload: acc_castupload.value || null,
        acc_etalenta: acc_etalenta.value || null,
        acc_instagram: acc_instagram.value || null,
        acc_fb: acc_fb.value || null,
        acc_other: acc_other.value || null,
        // videoreel: videoreel.value || null,
        // audioreel: audioreel.value || null,
        // bio_en: bio_en.value || null,
        skills_en: skills_en.value || null,
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
        filmographies: {
            // type_of_work: type_of_work.value || null,
            // year_from: year_from.value || null,
            // year_to: year_to.value || null,
            // org_name: org_name.value || null,
            // org_department: org_department.value || null,
            // org_url: org_url.value || null,
            // degree: degree.value || null,
            // work_name: work_name.value || null,
            // work_url: work_url.value || null,
            // actor_role: actor_role.value || null,
            // role_at_films: roleatfilm.value || null,
        }
    }

    formData.append('data', JSON.stringify(personToSend));

    if (profileImageToSend !== "empty") {
        formData.append(`files.picture`, profileImageToSend, profileImageToSend.name);
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
            Authorization: 'Bearer ' + localStorage.getItem('ID_TOKEN')
        },
        body: formData
    }))

    console.log(response);

    console.log('Responsestatus', response.status);

    if (response.status === 200) {
        document.getElementById('personProfileSent').style.display = ''
        if (localStorage.getItem('preLoginUrl')) {
            window.open(localStorage.getItem('preLoginUrl'), '_self')
            localStorage.removeItem('preLoginUrl')
        }
    }

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

}

function validatePersonForm() {

    var errors = []

    if (document.getElementById('personProfileSent')) {
        document.getElementById('personProfileSent').style.display = 'none'
    }

    if (!validateFirstName("firstName")) {
        errors.push('Missing firstname')
    }

    if (!validateLastName("lastName")) {
        errors.push('Missing lastname')
    }

    if (!validateGender("gender")) {
        errors.push('Missing gender')
    }

    // console.log(errors)
    if (errors.length === 0) {
        console.log('KÕIKOK');
        sendPersonProfile()
    }

    window.addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
            // console.log("ENTER")
            validatePersonForm()
        }
    })
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
