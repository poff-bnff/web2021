let imageToSend = "empty"

if (validToken) {
    loadUserInfo()
} else {
    document.getElementById('logInStatus').style.display = ''
    window.open(`${location.origin}/${langpath}login`, '_self')
    saveUrl()
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

async function loadUserInfo() {

    let userProfile = await getUserProfile()
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

    let personToSend = {
        firstName: firstName.value,
        lastName: lastName.value,
        gender: gender.value,
        phoneNr: phoneNr.value,
        eMail: eMail.value,
        address: {
            country: addrCountry.value,
            county: addrCounty.value,
            municipality: addrMunicipality.value,
            popul_place: addr_popul_place.value,
            street_name: addr_street_name.value,
            address_number: addrHouseNumber.value,
            appartment: addrApptNumber.value,
            postal_code: addrPostalCode.value,
        }
    }

    formData.append('data', JSON.stringify(personToSend));

    if (imageToSend !== "empty") {
        formData.append(`files.picture`, imageToSend, imageToSend.name);
    }

    // Log form data
    console.log('Formdata:');
    for (var pair of formData.entries()) {
        console.log(pair[0] + ', ' + pair[1]);
    }

    personToSend = JSON.stringify(personToSend)
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
        console.log('Responsestaaatus väga timm');
        document.getElementById('personProfileSent').style.display = ''
        if (localStorage.getItem('preLoginUrl')) {
            window.open(localStorage.getItem('preLoginUrl'), '_self')
            localStorage.removeItem('preLoginUrl')
        }
    }

    saveProfileButton.disabled = false
    saveProfileButton.innerHTML = previousInnerHTML
    firstName.value = ''
    lastName.value = ''
    gender.value = ''
    phoneNr.value = ''
    eMail.value = ''
    addrCcountry.value = ''
    addrCounty.value = ''
    addrMunicipality.value = ''
    addr_popul_place.value = ''
    addr_street_name.value = ''
    addrHouseNumber = ''
    addrApptNumber = ''
    addrPostalCode = ''

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

function validateImageAndPreview(file) {
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
            imgPreview.src = reader.result;
        };
        reader.readAsDataURL(file);
        imageToSend = file

    }
}
