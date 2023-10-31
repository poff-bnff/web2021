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
            errToUser('submitImage error', error)
        });
}

const submitField = async (DOMId) => {
    const field = document.getElementById(DOMId)
    if (field.getAttribute('changed') !== 'true') {
        return
    }
    field.classList.add('submitting')
    const formData = new FormData()
    formData.append(field.name, field.value)
    const submitted = await submitForm(formData)
    field.style.backgroundColor = 'white'
    field.setAttribute('changed', false)
    field.classList.remove('submitting')
    return submitted
}

const submitAll = async (buttonElement) => {
    buttonElement.classList.add('submitting')
    const form = findParentByClassName(buttonElement, 'form')
    const fields = form.querySelectorAll('input, select')
    const formData = new FormData()
    fields.forEach(field => {
        formData.append(field.name, field.value)
    })
    const submitted = await submitForm(formData)
    fields.forEach(field => {
        field.style.backgroundColor = 'white'
        field.setAttribute('changed', false)
    })
    console.log(submitted)
}

const backToFromYouCame = () => {
    const returnFromProfileUrl = localStorage.getItem('returnFromProfileUrl')
    if (returnFromProfileUrl) {
        localStorage.removeItem('returnFromProfileUrl')
        window.open(returnFromProfileUrl, '_self')
    }
}

const fieldChanged = (DOMId) => {
    const field = document.getElementById(DOMId)
    field.style.backgroundColor = 'yellow'
    field.setAttribute('changed', true)
}

const errToUser = (message) => {
    console.error(message)
    alert(message)
}

const onProfilePicChange = () => {
    const submitImage = async () => {
        const formData = new FormData()
        formData.append('picture', formImageInput.files[0])
        return await submitForm(formData)
    }

    const maxFileSize = 5 * 1024 * 1024 // MB
    const [minWidth, maxWidth, minHeight, maxHeight] = [200, 5000, 200, 5000]

    const file = formImageInput.files[0]
    console.log(`onProfilePicChange file name: ${file.name}`)
    console.log(`onProfilePicChange file type: ${file.type}`)
    console.log(`onProfilePicChange file size: ${(file.size / 1024 / 1024).toFixed(2)} MB`)
    if (!file.type.startsWith('image/')) {
      errToUser('onProfilePicChange file is not an image.')
      return false
    }
    if (file.size / 1024 / 1024 > maxFileSize) {
      errToUser(`onProfilePicChange file size is ${(file.size / 1024 / 1024).toFixed(2)} MB. Which is more than allowed ${maxFileSize / 1024 / 1024} MB.`)
      return false
    }
    console.log('onProfilePicChange file is all right.')

    const reader = new FileReader()
    reader.onload = (e) => {
        const img = new Image()
        img.onload = async () => {
            const [width, height] = [img.width, img.height]
            if (width < minWidth || width > maxWidth || height < minHeight || height > maxHeight) {
                errToUser(`onProfilePicChange image size is not correct. width: ${width}, height: ${height}. Allowed range is ${minWidth}x${minHeight} - ${maxWidth}x${maxHeight}.`)
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

async function loadUserInfo() {
    await reloadUser()

    let webUser = getUser()
    const user_profile = webUser.user_profile

    if (webUser.profileFilled) {
        document.getElementById('profileFilledMessage').style.display = 'block'
    } else {
        document.getElementById('profileUnFilledMessage').style.display = 'block'

    }
    // console.log("täidan ankeedi " + webUser.name + "-i cognitos olevate andmetega.....")
    email.innerHTML = webUser.email
    if (user_profile) {
        firstName.value = user_profile.firstName || ''
        lastName.value = user_profile.lastName || ''
        gender.value = user_profile.gender || ''
        phoneNr.value = user_profile.phoneNr || ''
        birthdate.value = user_profile.birthdate || ''
        let address = user_profile.address ? user_profile.address.split(", ") : ['', '']
        if (pictureUrl = getProfilePicture()) {
            imgPreview.src = pictureUrl
        }
    }
}

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
