

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

    let personGender
    if (gender.value === 'male') {
        personGender = 2
    } else if (gender.value === 'female') {
        personGender = 3
    } else {
        personGender = 4
    }

    let personToSend = {
        // picture: pictureInfo,
        firstName: firstName.value,
        lastName: lastName.value,
        gender: personGender,
        profile_img: profile_img.value,
        photographer: photographer.value,
        img_year: img_year.value
    }

    if (profile_pic_to_send !== "empty") {
        formData.append(`files.picture`, profile_pic_to_send, profile_pic_to_send.name);
    }
    formData.append('data', JSON.stringify(personToSend));

    // Log form data
    console.log('Formdata:');
    for (var pair of formData.entries()) {
        console.log(pair[0] + ', ' + pair[1]);
    }

    personToSend = JSON.stringify(personToSend)
    // console.log("kasutaja profiil mida saadan ", personToSend);

    let response = await (await fetch(`${strapiDomain}/people`, {
        method: 'POST',
        headers: {
            Authorization: 'Bearer ' + localStorage.getItem('BNFF_U_ACCESS_TOKEN')
        },
        body: formData
    }))

    if (response.status === 200) {
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
