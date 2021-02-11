let imgPreview = document.getElementById("imgPreview");
let profile_pic_to_send = "empty"

if (validToken) {
    loadUserInfo();
} else {
    window.open(`${location.origin}/${langpath}login`, '_self')
    saveUrl()
}

async function loadUserInfo() {
    let response = await fetch(`https://api.poff.ee/profile`, {
        method: "GET",
        headers: {
            Authorization: "Bearer " + localStorage.getItem("ACCESS_TOKEN"),
        },
    });
    let userProfile = await response.json();

    if (userProfile.profile_filled) {
        document.getElementById('profileFilledMessage').style.display = 'block'
    } else {
        document.getElementById('profileUnFilledMessage').style.display = 'block'

    }
    // console.log("täidan ankeedi " + userProfile.name + "-i cognitos olevate andmetega.....")
    email.innerHTML = userProfile.email
    if (userProfile.name) firstName.value = userProfile.name
    if (userProfile.family_name) lastName.value = userProfile.family_name
    if (userProfile.gender) gender.value = userProfile.gender
    if (userProfile.phone_number) phoneNr.value = userProfile.phone_number
    if (userProfile.birthdate) dob.value = userProfile.birthdate

    if (userProfile.address) {
        let address = userProfile.address.split(", ")
        let riik = address[0]
        let linn = address[1]
        citySelection.value = linn
        countrySelection.value = riik
    }

    if (userProfile.picture) {
        if (userProfile.picture !== "no profile picture saved") {
            let res = await fetch(`https://api.poff.ee/profile/picture_down`, {
                method: "GET",
                headers: {
                    Authorization: "Bearer " + localStorage.getItem("ACCESS_TOKEN"),
                },
            });
            let profilePicture = await res.json();
            imgPreview.src = profilePicture.url
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

    let userToSend = [
        { Name: "picture", Value: pictureInfo },
        { Name: "name", Value: firstName.value },
        { Name: "family_name", Value: lastName.value },
        { Name: "gender", Value: gender.value },
        { Name: "birthdate", Value: dob.value },
        { Name: "phone_number", Value: '+' + phoneNr.value },
        { Name: "address", Value: `${countrySelection.value}, ${citySelection.value}` },
    ];

    // console.log("kasutaja profiil mida saadan ", userToSend);

    let response = await (await fetch(`https://api.poff.ee/profile`, {
        method: 'PUT',
        headers: {
            Authorization: 'Bearer ' + localStorage.getItem('ACCESS_TOKEN')
        },
        body: JSON.stringify(userToSend)
    })).json()



    if (response.status) {
        document.getElementById('profileSent').style.display = 'block'
        if (localStorage.getItem('url')) {
            window.open(localStorage.getItem('url'), '_self')
            localStorage.removeItem('url')
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
    let linkResponse = await fetch(`https://api.poff.ee/profile/picture_up`, {
        method: 'GET',
        headers: {
            Authorization: 'Bearer ' + localStorage.getItem('ACCESS_TOKEN')
        },
    });
    data = await linkResponse.json()
    // console.log("saadud link on: ")
    // console.log(data.link)


    //saadab pildi
    // console.log('name ', profile_pic_to_send.name)

    const fileExt = profile_pic_to_send.name.split('.').pop()
    let contentType = 'image/' + fileExt
    // console.log(contentType)

    let requestOptions = {
        method: 'PUT',
        headers: {
            'Content-Type': contentType,
            'ACL': 'private'
        },
        body: profile_pic_to_send,
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
