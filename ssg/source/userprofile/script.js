let imgPreview = document.getElementById("imgPreview");
let profile_pic_to_send = "empty"

if (validToken) {
    loadUserInfo()
} else {
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

    if (userProfile.profile_filled) {
        document.getElementById('profileFilledMessage').style.display = 'block'
    } else {
        document.getElementById('profileUnFilledMessage').style.display = 'block'

    }
    // console.log("täidan ankeedi " + userProfile.name + "-i cognitos olevate andmetega.....")
    email.innerHTML = userProfile.email
    if (profile) {
        if (profile.firstName) { firstName.value = profile.firstName }
        if (profile.lastName) { lastName.value = profile.lastName }
        if (profile.gender) { gender.value = profile.gender }
        if (profile.phoneNr) { phoneNr.value = profile.phoneNr }
        if (profile.birthdate) { dob.value = profile.birthdate }
    }

    for (let provider of userProfile.externalProviders) {
        // console.log(provider)
        if (provider.provider === ('Google')) google.style.display = ''
        if (provider.provider === ('Facebook')) facebook.style.display = ''
    }

    if (userProfile.provider.includes('local')) password.style.display = ''

    if (profile) {
        if (profile.address) {
            let address = profile.address.split(", ")
            let riik = address[0]
            let linn = address[1]
            countrySelection.value = riik
            countrySelection.onchange();
            citySelection.value = linn
        }

        if (profile.picture) {
            imgPreview.src = `${strapiDomain}${profile.picture.url}`
        }
    }
}

async function sendUserProfile() {
    // console.log('updating user profile.....')

    //profile_pic_to_send= no profile picture saved
    //Kui pilt saadetakse siis profile_pic_to_send= this users picture is in S3

    let saveProfileButton = document.getElementById(`saveProfileButton`)
    saveProfileButton.disabled = true
    let previousInnerHTML = saveProfileButton.innerHTML
    saveProfileButton.innerHTML = `<i class="fa fa-spinner fa-spin"></i>`

    let pictureInfo = "no profile picture saved"

    const request = new XMLHttpRequest();

    const formData = new FormData();

    let userToSend = {
        // picture: pictureInfo,
        firstName: firstName.value,
        lastName: lastName.value,
        gender: gender.value,
        birthdate: dob.value,
        phoneNr: phoneNr.value,
        address: `${countrySelection.value}, ${citySelection.value}`,
    }

    if (profile_pic_to_send !== "empty") {
        formData.append(`files.picture`, profile_pic_to_send, profile_pic_to_send.name);
    }
    formData.append('data', JSON.stringify(userToSend));

    // Log form data
    console.log('Formdata:');
    for (var pair of formData.entries()) {
        console.log(pair[0] + ', ' + pair[1]);
    }

    // if (profile_pic_to_send !== "empty") {
    //     pictureInfo = 'this users picture is in S3'
    //     console.log('SENDING PIC!');

    //     // let picUploadResult = await uploadPic()
    //     // let picId = picUploadResult[0].id
    //     // userToSend.picture = picId
    // } else if (userProfile.picture === 'this users picture is in S3') {
    //     pictureInfo = 'this users picture is in S3'
    // }

    // userToSend = JSON.stringify(userToSend)
    // // console.log("kasutaja profiil mida saadan ", userToSend);

    let response = await (await fetch(`${strapiDomain}/users/updateme`, {
        method: 'PUT',
        headers: {
            Authorization: 'Bearer ' + localStorage.getItem('BNFF_U_ACCESS_TOKEN')
        },
        body: formData
    }))

    if (response.status === 200) {
        document.getElementById('profileSent').style.display = 'block'
        if (localStorage.getItem('preLoginUrl')) {
            window.open(localStorage.getItem('preLoginUrl'), '_self')
            localStorage.removeItem('preLoginUrl')
        }
    }

    saveProfileButton.disabled = false
    saveProfileButton.innerHTML = previousInnerHTML

}

function validateaAndPreview(file) {
    let error = document.getElementById("imgError");
    // console.log(file)
    // Check if the file is an image.
    if (!file.type.includes("image")) {
        // console.log("File is not an image.", file.type, file);
        error.innerHTML = "File is not an image.";
    } else if (file.size / 1024 / 1024 > 5) {
        error.innerHTML = "Image can be max 5MB, uploaded image was " + (file.size / 1024 / 1024).toFixed(2) + "MB"
    } else {
        error.innerHTML = "";
        //näitab pildi eelvaadet
        var reader = new FileReader();
        reader.onload = function () {
            imgPreview.src = reader.result;
        };
        reader.readAsDataURL(file);
        profile_pic_to_send = file

    }
}

function validateForm() {

    var errors = []

    if (document.getElementById('profileSent')) {
        document.getElementById('profileSent').style.display = 'none'
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

    if (!validateBDay("dob")) {
        errors.push('Missing or invalid date of birth')
    }

    if (!validateDate("dob")) {
        errors.push('Missing or invalid date of birth wrong format')
    }

    if (!validatePhoneNr("phoneNr")) {
        errors.push('Missing phonenumber')
    }

    if (!validateCountry("countrySelection")) {
        errors.push('Missing country')
    }

    if (!validateCity("citySelection")) {
        errors.push('Missing city')
    }

    // console.log(errors)
    if (errors.length === 0) {
        sendUserProfile()
    }
}

window.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
        // console.log("ENTER")
        validateForm()
    }
})

displayRemoveBtn = button => {
    button.style.display = 'none'
    const removeBtnId = 'remove_' + button.id
    document.getElementById(removeBtnId).style.display = ''
}

displayProviderBtn = button => {
    button.style.display = 'none'
    const providerBtnId = button.id.split('_')[1]
    console.log(providerBtnId)
    document.getElementById(providerBtnId).style.display = ''
}

redirectToProvider = (button, provider) => {
    authProviders.style.display = 'none'
    providerToRemove = ''
    providerToRemove = provider
    console.log('redirectToProvider')
    console.log(button);
    console.log(provider);
    confirmDialog.innerHTML = confirmDialog.innerHTML + ` '${provider.toUpperCase()}'`
    removeProviderWarning.style.display = ''
    // if(provider === 'facebook') window.open('https://www.facebook.com/index.php?next=https%3A%2F%2Fwww.facebook.com%2Fsettings%3Ftab%3Dapplications%26ref%3Dsettings')
    // if(provider === 'facebook') window.open('https://www.facebook.com/settings?tab=applications&ref=settings')
}

openProvider = (provider) => {
    console.log('displayFBOptions')
    // console.log(provider)
    confirmDialog.style.display = 'none'
    if (provider === 'Facebook') {
        window.open('https://www.facebook.com/login.php?next=https%3A%2F%2Fwww.facebook.com%2Fsettings%3Ftab%3Dapplications%26ref%3Dsettings', '_blank')
    }
    if (provider === 'Google') {
        window.open('https://myaccount.google.com/permissions', '_blank')
    }
    if (provider === 'local') {
        console.log('local loco')
    }
    doneAtProvider.innerHTML = doneAtProvider.innerHTML + ` '${provider.toUpperCase()}'`
    doneAtProvider.style.display = ''
}

async function deleteAccount() {
    console.log('kustuta user, person jaab alles')
    if (validToken) {
        const token = localStorage.getItem('BNFF_U_ACCESS_TOKEN')
        // console.log(token)

        var myHeaders = new Headers();
        myHeaders.append("Authorization", `Bearer ${token}`);
        // console.log('Headers 133', myHeaders)

        var requestOptions = {
            method: 'DELETE',
            headers: myHeaders,
            redirect: 'follow'
        };
        // console.log('RO', requestOptions)

        const userProfile = await getUserProfile()
        let currentUserID = userProfile.id
        const response = await fetch(`${strapiDomain}/users/${currentUserID}`, requestOptions)

        console.log(response.status)
        if (response.ok) {
            localStorage.clear()
            location.replace(document.location.origin)
        }
        if (response.status === 401) {
            wrongUserMassage.style.display = ''
            setTimeout(function () {

                localStorage.clear()
                location.replace(document.location.origin)
            }, 5000);
        }

    }

}

function displayDeleteConfirmText(del_id) {
    // console.log(del_id.id)
    deleteConfirmMessage.style.display = ''
}

function displayDeleteConfirmTextOut(del_id) {
    // console.log(del_id.id)
    deleteConfirmMessage.style.display = 'none'
}
