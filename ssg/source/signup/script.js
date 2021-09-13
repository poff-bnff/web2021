let profile_pic_to_send;
let signUpButton = document.getElementById('signUpButton')
let signUpButtonInnerHTMLBackup = signUpButton.innerHTML
// Event listeners
window.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
        signUp()
    }
})

// Buttons
const signUp = () => {
    const validForm = validateForm()
    if (validForm) {
        signUpButton.disable = true
        signUpButton.innerHTML = '<i class="fa fa-spinner fa-spin"></i>'
        setLang()
        registerUser()
    }
}

// Register main
const registerUser = async () => {
    // let profile_pic_to_send = "no profile picture saved"

    // if (!imgPreview.src.search("/assets/img/static/Hunt_Kriimsilm_2708d753de.jpg")) {
    //     profile_pic_to_send = "profile picture saved to S3"
    // }

    const newUser = collectFormData()
    // if (newUser.picture) {
    //     const pictureRequest = createRequest('profPicture', newUser.picture)
    //     console.log({ pictureRequest });
    //     const registerResponse = await requestFromStrapi(pictureRequest)
    //     console.log(registerResponse);

    // }
    const registerRequest = await createRequest('register', newUser)
    const registerResponse = await requestFromStrapi(registerRequest)
    const registerResult = handleRegResponse(registerResponse)
    directToNext(registerResult)
}

// Services
const directToNext = (registerResult) => {
    signUpButton.disable = false
    signUpButton.innerHTML = signUpButtonInnerHTMLBackup
    clearRegForm()
    if (registerResult.user && registerResult.user.email === email.value) {
        clearSocialAuthBtns()
        showRegConfirmation()

    } else if (registerResult.statusCode !== 200) {
        if (registerResult.message[0].messages[0].id = 'Auth.form.error.email.taken') {
            showAccountExists()
        }
    }
    scrollToTop()
}

const showRegConfirmation = () => {
    document.getElementById('profileSent').style.display = 'block'
    document.getElementById('profileDetails').innerHTML = email.value
    document.getElementById('loginButton').style.display = 'block'
}

const showAccountExists = () => {
    document.getElementById('profileInSystem').style.display = 'block'
    document.getElementById('loginButton').style.display = 'block'
}

const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'auto' });

//Helpers
const collectFormData = () => {

    // const personAsProfile = {
    //     firstName: firstName.value,
    //     lastName: lastName.value,
    //     gender: gender.value,
    //     birthdate: dob.value,
    //     phoneNr: phoneNr.value,
    //     address: `${countrySelection.value}, ${citySelection.value}`,
    // }

    const newUser = {
        // picture: profile_pic_to_send,
        username: email.value,
        email: email.value,
        password: psw.value,
        // personAsProfile: personAsProfile
    }
    return newUser
}

// Cleaners
const clearRegForm = () => {
    document.getElementById('registerTitle').style.display = 'none'
    document.getElementById('signupForm').style.display = 'none'
}

const clearSocialAuthBtns = () => document.getElementById('authButtons').style.display = 'none'

// function validateaAndPreview(file) {
//     let error = document.getElementById("imgError");
//     // console.log(file)
//     // Check if the file is an image.
//     if (!file.type.includes("image")) {
//         // console.log("File is not an image.", file.type, file);
//         error.innerHTML = "File is not an image.";
//     } else {
//         error.innerHTML = "";
//         //näitab pildi eelvaadet
//         var reader = new FileReader();
//         reader.onload = function () {
//             imgPreview.src = reader.result;
//         };
//         reader.readAsDataURL(file);
//         profile_pic_to_send = file
//     }
// }


function validateForm() {

    var errors = []

    if (document.getElementById('profileSent')) {
        document.getElementById('profileSent').style.display = 'none'
    }

    if (!validateEmail("email")) {
        errors.push('Missing or invalid email')

    }
    if (psw && !validatePsw("psw")) {
        errors.push('Missing or invalid password')
    }

    if (psw2 && !validatePswRep("psw", "psw2")) {
        errors.push('Missing or invalid password repeat')
    }

    // if (!validateFirstName("firstName")) {
    //     errors.push('Missing firstname')
    // }

    // if (!validateLastName("lastName")) {
    //     errors.push('Missing lastname')
    // }

    // if (!validateGender("gender")) {
    //     errors.push('Missing gender')
    // }

    // if (!validateBDay("dob")) {
    //     errors.push('Missing or invalid date of birth')
    // }
    // if (!validateDate("dob")) {
    //     errors.push('Missing or invalid date of birth wrong format')
    // }

    // if (!validatePhoneNr("phoneNr")) {
    //     errors.push('Missing phonenumber')
    // }

    // if (!validateCountry("countrySelection")) {
    //     errors.push('Missing country')
    // }

    // if (!validateCity("citySelection")) {
    //     errors.push('Missing city')
    // }

    // console.log(errors)
    if (errors.length === 0) {
        return true
    }
    return false
}
