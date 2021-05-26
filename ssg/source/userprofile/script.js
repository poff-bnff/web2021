let imgPreview = document.getElementById("imgPreview");
let profile_pic_to_send = "empty"

if (validToken) {
    loadUserInfo()
} else {
    window.open(`${location.origin}/${langpath}login`, '_self')
    saveUrl()
}

async function getUserProfile() {
        let response = await fetch(`http://localhost:1337/users/me`, {
        method: "GET",
        headers: {
            Authorization: "Bearer " + localStorage.getItem("BNFF_U_ACCESS_TOKEN"),
        },
    });
    let userProfile = await response.json()
    // console.log(userProfile)

    return userProfile 
}

async function loadUserInfo() {

    let userProfile = await getUserProfile()

    if (userProfile.profile_filled) {
        document.getElementById('profileFilledMessage').style.display = 'block'
    } else {
        document.getElementById('profileUnFilledMessage').style.display = 'block'

    }
    // console.log("täidan ankeedi " + userProfile.name + "-i cognitos olevate andmetega.....")
    email.innerHTML = userProfile.email
    if (userProfile.firstName) firstName.value = userProfile.firstName
    if (userProfile.lastName) lastName.value = userProfile.lastName
    if (userProfile.gender) gender.value = userProfile.gender
    if (userProfile.phoneNr) phoneNr.value = userProfile.phoneNr
    if (userProfile.birthdate) dob.value = userProfile.birthdate

    for (let provider of userProfile.externalProviders) {
        console.log(provider)
        if (provider.provider === ('Local')) password.style.display = ''
        if (provider.provider === ('Google')) google.style.display = ''
        if (provider.provider === ('Facebook')) facebook.style.display = ''

    }

    if (userProfile.address) {
        let address = userProfile.address.split(", ")
        let riik = address[0]
        let linn = address[1]
        countrySelection.value = riik
        citySelection.value = linn
    }

    if (userProfile.picture) {
        if (userProfile.picture !== "no profile picture saved") {
            imgPreview.src = `${strapiDomain}${userProfile.picture.url}`
        }
    }
}

async function sendUserProfile() {
    // console.log('updating user profile.....')

    //profile_pic_to_send= no profile picture saved
    //Kui pilt saadetakse siis profile_pic_to_send= this users picture is in S3

    let pictureInfo = "no profile picture saved"

    if (profile_pic_to_send !== "empty") {
        pictureInfo = 'this users picture is in S3'
        await uploadPic()
    } else if (userProfile.picture === 'this users picture is in S3') {
        pictureInfo = 'this users picture is in S3'
    }

    let userToSend = {
        // picture: pictureInfo,
        firstName: firstName.value,
        lastName: lastName.value,
        gender: gender.value,
        birthdate: dob.value,
        phoneNr: phoneNr.value,
        address: `${countrySelection.value}, ${citySelection.value}`
    }

    userToSend = JSON.stringify(userToSend)
    // console.log("kasutaja profiil mida saadan ", userToSend);

    let response = await (await fetch(`${strapiDomain}/users/me`, {
        method: 'PUT',
        headers: {
            Authorization: 'Bearer ' + localStorage.getItem('BNFF_U_ACCESS_TOKEN')
        },
        body: userToSend
    }))

    if (response.status === 200) {
        document.getElementById('profileSent').style.display = 'block'
        if (localStorage.getItem('preLoginUrl')) {
            window.open(localStorage.getItem('preLoginUrl'), '_self')
            localStorage.removeItem('preLoginUrl')
        }

    }

}

function validateaAndPreview(file) {
    let error = document.getElementById("imgError");
    // console.log(file)
    // Check if the file is an image.
    if (!file.type.includes("image")) {
        // console.log("File is not an image.", file.type, file);
        error.innerHTML = "File is not an image.";
    } else if (file.size / 1024 / 1024 > 5) {
        error.innerHTML = "Image can be max 5MB, uploaded image was " + (file.size/1024/1024).toFixed(2) + "MB"
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

async function uploadPic() {

    // console.log("uploading this file to S3....")
    // console.log(profile_pic_to_send)
    //küsib lingi kuhu pilti postitada
    
    data = {}
    data.link = `${strapiDomain}/upload`
    // console.log("saadud link on: ")
    // console.log(data.link)


    //saadab pildi
    // console.log('name ', profile_pic_to_send.name)

    const fileExt = profile_pic_to_send.name.split('.').pop()
    let contentType = 'image/' + fileExt
    // console.log(contentType)

    let files = profile_pic_to_send
    console.log(files);
    var formData = new FormData() 
    formData.append('files', files)
    formData.append('ref', 'user')
    formData.append('refId', userProfile.id)
    formData.append('field', 'picture')
    formData.append('source', 'users-permissions')
    
    console.log(formData);

    let requestOptions = {
        method: 'POST',
        headers: {
            Authorization: 'Bearer ' + localStorage.getItem('BNFF_U_ACCESS_TOKEN'),
        },
        body: formData,
        redirect: 'follow'
    };


    await fetch(data.link, requestOptions)

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
    console.log(provider)
    confirmDialog.style.display = 'none'
    if (provider === 'Facebook')
        window.open('https://www.facebook.com/login.php?next=https%3A%2F%2Fwww.facebook.com%2Fsettings%3Ftab%3Dapplications%26ref%3Dsettings', '_blank')
    if (provider === 'Google')
        window.open('https://myaccount.google.com/permissions', '_blank')
    doneAtProvider.innerHTML = doneAtProvider.innerHTML + ` '${provider.toUpperCase()}'`
    doneAtProvider.style.display = ''
}

async function deleteAccount() {
    console.log('kustuta user, person jaab alles')
    if (validToken) {

        const token = localStorage.getItem('BNFF_U_ACCESS_TOKEN')

        var myHeaders = new Headers();
        myHeaders.append("Authorization", `Bearer ${token}`);

        var requestOptions = {
            method: 'GET',
            headers: myHeaders,
            redirect: 'follow'
        };
        const response = await fetch(`http://localhost:1337/users/me`, requestOptions)

        console.log(response)
        
        // if (response.ok) {
        //     localStorage.clear()
        //     window.open(document.location.origin)
        // }

    }

}