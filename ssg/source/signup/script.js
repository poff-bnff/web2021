if (validToken) {
    loadUserInfo();
}

async function loadUserInfo() {
    let response = await fetch(`https://api.poff.ee/profile`, {
        method: "GET",
        headers: {
            Authorization: "Bearer " + localStorage.getItem("ACCESS_TOKEN"),
        },
    });
    let userProfile = await response.json();

    // console.log('userProfile', userProfile)
    if (userProfile.address) {
        let address = userProfile.address.split(", ")
        let riik = address[0]
        let linn = address[1]
        citySelection.value = linn
        countrySelection.value = riik
    }

    firstName.value = userProfile.name;
    lastName.value = userProfile.family_name;
    email.value = userProfile.email;
    gender.value = userProfile.gender;
    if (userProfile.phone_number) {
        phoneNr.value = userProfile.phone_number;
    }
    dob.value = userProfile.birthdate;

    pswds.style.display = 'none'
}



async function sendNewUser() {
    // console.log('sending new user profile.....');

    let profile_pic_to_send= "no profile picture saved"

    if (!imgPreview.src.search("/assets/img/static/Hunt_Kriimsilm_2708d753de.jpg")){
        profile_pic_to_send= "profile picture saved to S3"
    }

    let userToSend = [
        { Name: "picture", Value: profile_pic_to_send },
        { Name: "email", Value: email.value },
        { Name: "name", Value: firstName.value },
        { Name: "family_name", Value: lastName.value },
        { Name: "gender", Value: gender.value },
        { Name: "birthdate", Value: dob.value },
        { Name: "phone_number", Value: '+' + phoneNr.value },
        { Name: "address", Value: `${countrySelection.value}, ${citySelection.value}` },
        { Name: "password", Value: psw.value }
    ];

    // console.log(userToSend);

    let response = await fetch(`https://api.poff.ee/profile`, {
        method: 'POST',
        headers: {
            Authorization: 'Bearer ' + localStorage.getItem('ACCESS_TOKEN')
        },
        body: JSON.stringify(userToSend)
    });
    response = await response.json()

    // console.log(response)

    if(response.Payload){
        //konto juba olemas
        // console.log(response.Payload)
        let providers = JSON.parse(response.Payload)
        document.getElementById('profileInSystem').style.display = 'block'
        document.getElementById('signupForm').style.display = 'none'
        document.getElementById('registerTitle').style.display = 'none'
        if(!providers.includes("facebook")){
            document.getElementById('fb').style.display = 'none'
        }
        if(!providers.includes("google")){
            document.getElementById('go').style.display = 'none'
        }
        if(!providers.includes("eventival")){
            document.getElementById('ev').style.display = 'none'
        }
        window.scrollTo({top: 0, behavior: 'smooth'});
    }

    if (!response.UserConfirmed && !response.Payload){
        //konto loomine õnnestus
        document.getElementById('signupForm').style.display = 'none'
        document.getElementById('registerTitle').style.display = 'none'
        document.getElementById('profileSent').style.display = 'block'
        document.getElementById('profileDetails').innerHTML =  email.value
        document.getElementById('loginButton').style.display = 'block'
        window.scrollTo({top: 0, behavior: 'smooth'});

    }
}


function validateaAndPreview(file) {
    let error = document.getElementById("imgError");
    // console.log(file)
    // Check if the file is an image.
    if (!file.type.includes("image")) {
        // console.log("File is not an image.", file.type, file);
        error.innerHTML = "File is not an image.";
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

    if (document.getElementById('profileSent')){
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
        sendNewUser()
    }
}

window.addEventListener("keydown", function (event) {
    if (event.key === "Enter"){
        // console.log("ENTER")
        validateForm()
    }
})
