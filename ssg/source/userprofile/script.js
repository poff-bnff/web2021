const imgPreview = document.getElementById("imgPreview");
const formImageInput = document.getElementById("profileImg")

// This function returns true if user is logged in but redirects to login page if not.
requireLogin()

const submitForm = async (body) => {
    const headers = { Authorization: 'Bearer ' + localStorage.getItem('ID_TOKEN') }
    const url = `${huntAuthDomain}/api/profile`
    const options = { method: 'PUT', headers, body }
    return await fetch(url, options)
        .then(async response => {
            await reloadUser()
            loadUserInfo()
            return response.json()
        })
        .catch(error => {
            console.error('submitImage error', error)
        });
}

const submitField = async (DOMId) => {
    const field = document.getElementById(DOMId)
    if (field.getAttribute('changed') !== 'true') {
        console.log('submitField', field.name, field.value, field, 'not changed')
        return
    }
    console.log('submitField', field.name, field.value, field)
    const formData = new FormData()
    formData.append(field.name, field.value)
    await submitForm(formData)
    field.style.backgroundColor = 'white'
    field.setAttribute('changed', false)
}

const fieldChanged = (DOMId) => {
    const field = document.getElementById(DOMId)
    console.log('fieldChanged', field.name, field.value, field)
    field.style.backgroundColor = 'yellow'
    field.setAttribute('changed', true)
}

const onProfilePicChange = () => {
    const submitImage = async () => {
        const formData = new FormData()
        formData.append('picture', formImageInput.files[0])
        return await submitForm(formData)
    }

    const maxFileSize = 5 * 1024 * 1024 // MB
    const [minWidth, maxWidth, minHeight, maxHeight] = [200, 2000, 200, 2000]

    const file = formImageInput.files[0]
    console.log(`onProfilePicChange file name: ${file.name}`)
    console.log(`onProfilePicChange file type: ${file.type}`)
    console.log(`onProfilePicChange file size: ${(file.size / 1024 / 1024).toFixed(2)} MB`)
    if (!file.type.startsWith('image/')) {
      console.error('onProfilePicChange file is not an image.')
      return false
    }
    if (file.size / 1024 / 1024 > maxFileSize) {
      console.error(`onProfilePicChange file size is ${(file.size / 1024 / 1024).toFixed(2)} MB. Which is more than allowed ${maxFileSize / 1024 / 1024} MB.`)
      return false
    }
    console.log('onProfilePicChange file is all right.')

    const reader = new FileReader()
    reader.onload = (e) => {
        const img = new Image()
        img.onload = async () => {
            const [width, height] = [img.width, img.height]
            if (width < minWidth || width > maxWidth || height < minHeight || height > maxHeight) {
                console.error(`onProfilePicChange image size is not correct. width: ${width}, height: ${height}. Allowed range is ${minWidth}x${minHeight} - ${maxWidth}x${maxHeight}.`)
                return false
            }
            imgPreview.src = e.target.result // this sets the image preview
            // change image preview style to "not active"
            imgPreview.style.opacity = 0.5
            // TODO: here is a place to quietly send the image to the server
            if (await submitImage()) {
                imgPreview.style.opacity = 1
            }
        }
        img.src = e.target.result // this is needed to trigger img.onload
    }
    reader.readAsDataURL(file)
}


function loadUserInfo() {

    let webUser = getUser()
    const user_profile = webUser.user_profile

    if (webUser.profile_filled) {
        document.getElementById('profileFilledMessage').style.display = 'block'
    } else {
        document.getElementById('profileUnFilledMessage').style.display = 'block'

    }
    // console.log("täidan ankeedi " + webUser.name + "-i cognitos olevate andmetega.....")
    email.innerHTML = webUser.email
    if (user_profile) {
        if (user_profile.firstName) { firstName.value = user_profile.firstName }
        if (user_profile.lastName) { lastName.value = user_profile.lastName }
        if (user_profile.gender) { gender.value = user_profile.gender }
        if (user_profile.phoneNr) { phoneNr.value = user_profile.phoneNr }
        if (user_profile.birthdate) { dob.value = user_profile.birthdate }
    }

    if (user_profile) {
        if (user_profile.address) {
            let address = user_profile.address.split(", ")
            let riik = address[0]
            let linn = address[1]
            countrySelection.value = riik
            // countrySelection.onchange();
            citySelection.value = linn
        }

        if (pictureUrl = getProfilePicture()) {
            imgPreview.src = pictureUrl
        }
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


async function deleteAccount() {
    console.log('kustuta user, person jaab alles')
    if (isUserTokenValid()) {
        const token = localStorage.getItem('ID_TOKEN')
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

        const webUser = await getUser()
        let currentUserID = webUser.id
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

//
// ---- no functions below this line ----

loadUserInfo()
