
function validateEmail(element_id) {
    // console.log('emailv')
    var email = document.getElementById(element_id)
    var emailRe = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    if (!emailRe.test(String(email.value).toLowerCase())) {
        emailHelp.classList.remove("valid")
        emailHelp.classList.add("invalid")
        email.classList.add('invalidColor')
        return false
    }
    else {
        emailHelp.classList.remove("invalid")
        emailHelp.classList.add("valid")
        email.classList.remove('invalidColor')
        return true
    }
}

function validatePsw(element_id) {
    var psw = document.getElementById(element_id)
    if (psw.value === "") {
        pswHelp.classList.remove("valid")
        pswHelp.classList.add("invalid")
        psw.classList.add("invalidColor")
        return false
    }

    var pswdRe = /^.{8,}$/

    if (!pswdRe.test(String(psw.value))) {
        pswHelp.classList.remove("valid")
        pswHelp.classList.add("invalid")
        psw.classList.add("invalidColor")
        return true
    }
    else {
        pswHelp.classList.remove("invalid")
        psw.classList.remove("invalidColor")
        pswHelp.classList.add("valid")
        return true
    }
}

function validatePswRep(psw1_id, psw2_id) {
    var psw1 = document.getElementById(psw1_id)
    var psw2= document.getElementById(psw2_id)
    if (psw2.value === "") {
        psw2Help.classList.remove("valid")
        psw2Help.classList.add("invalid")
        psw2.classList.add("invalidColor")
        return false
    }

    if (psw1.value !== psw2.value) {
        psw2Help.classList.remove("valid")
        psw2Help.classList.add("invalid")
        psw2.classList.add("invalidColor")
        return false
    } else {
        psw2Help.classList.remove("invalid")
        psw2.classList.remove("invalidColor")
        psw2Help.classList.add("valid")
        return true
    }
}

function validateFirstName(element_id) {
    var firstName = document.getElementById(element_id)
    if (firstName.value == "" || firstName.value.length < 2 || !isNaN(firstName.value)) {
        firstNameHelp.classList.remove("valid")
        firstNameHelp.classList.add("invalid")
        firstName.classList.add('invalidColor')
        return false
    }
    firstNameHelp.classList.remove("invalid")
    firstNameHelp.classList.add("valid")
    firstName.classList.remove('invalidColor')
    return true
}

function validateLastName(element_id) {
    var lastName = document.getElementById(element_id)
    if (lastName.value === "" || lastName.value.length < 2 || !isNaN(lastName.value)) {
        lastNameHelp.classList.remove("valid")
        lastNameHelp.classList.add("invalid")
        lastName.classList.add('invalidColor')
        return false
    }
    lastNameHelp.classList.remove("invalid")
    lastNameHelp.classList.add("valid")
    lastName.classList.remove('invalidColor')
    return true
}


function validateGender(element_id) {
    var gender = document.getElementById(element_id)
    if (gender.value === "") {
        genderHelp.classList.remove("valid")
        genderHelp.classList.add("invalid")
        gender.classList.add("invalidColor")
        return false
    }

    if (gender.value !== "") {
        genderHelp.classList.remove("invalid")
        gender.classList.remove("invalidColor")
        genderHelp.classList.add("valid")
        return true
    }
}

function validateBDay(element_id) {
    var dob = document.getElementById(element_id)
    if (dob.value === "") {
        dobHelp.classList.remove("valid")
        dobHelp.classList.add("invalid")
        dob.classList.add("invalidColor")
        return false
    }

    var userAge = getAge(dob.value)
    if (userAge > 12 && userAge < 116) {
        dobHelp.classList.remove("invalid")
        dob.classList.remove("invalidColor")
        dobHelp.classList.add("valid")
        return true
    } else {
        dobHelp.classList.remove("valid")
        dobHelp.classList.add("invalid")
        dob.classList.add("invalidColor")
        return false
    }
}

function validateDate(element_id) {
    // console.log('validateDate ', element_id);

    var date = document.getElementById(element_id)
    var dateRe = new RegExp(
        '^(' +
        '([0-9]{4}-(0?[1-9]|1[012])-(0?[1-9]|[12][0-9]|3[01]))' + // 1977-11-23
        '|((0[1-9]|1[012])[- \\/.](0[1-9]|[12][0-9]|3[01])[- \\/.](19|20)[0-9][0-9])' + // 11-19-2004 11/19/2004 11.19.2004
        '|((0[1-9]|[12][0-9]|3[01])[- \\/.](0[1-9]|1[012])[- \\/.](19|20)[0-9][0-9])'+  // 19-11-2004 ...
        ')$'
        )
    if (date.value === "") {
        dateHelp.classList.remove("valid")
        dateHelp.classList.add("invalid")
        date.classList.add("invalidColor")
        return false
    }
    if (!dateRe.test(String(date.value) )) {
        dateHelp.classList.remove("valid")
        dateHelp.classList.add("invalid")
        date.classList.add("invalidColor")
        return true
    }
    else {
        dateHelp.classList.remove("invalid")
        date.classList.remove("invalidColor")
        dateHelp.classList.add("valid")
        return true
    }
}

function validatePhoneNr(element_id) {
    var phoneNr = document.getElementById(element_id)
    if (phoneNr.value === "") {

        phoneNrHelp.classList.remove("valid")
        phoneNrHelp.classList.add("invalid")
        phoneNr.classList.add("invalidColor")
        return false
    }

    // because of https://bit.ly/37WS3X5
    var phoneRe = /^[0-9]{7,15}$/

    if (!phoneRe.test(String(phoneNr.value))) {
        phoneNrHelp.classList.remove("valid")
        phoneNrHelp.classList.add("invalid")
        phoneNr.classList.add("invalidColor")
        return true
    }
    else {
        phoneNrHelp.classList.remove("invalid")
        phoneNr.classList.remove("invalidColor")
        phoneNrHelp.classList.add("valid")
        return true
    }

}

function validateCountry(element_id) {
    var country = document.getElementById(element_id)
    if (country.value === "") {
        country.classList.remove("c_valid")
        country.classList.add("c_invalid")
        country.value = "Elukoha riik"
        return false
    }

    if (country.value) {
        country.classList.remove("c_invalid")
        country.classList.add("c_valid")
        return true
    }
}

function validateCity(element_id) {
    var city = document.getElementById(element_id)
    if (city.value === "") {
        city.classList.remove("c_valid")
        city.classList.add("c_invalid")
        return false
    }
    // console.log(city.value);
    if (city.value) {
        city.classList.remove("c_invalid")
        city.classList.add("c_valid")
        return true
    }
}

function getAge(dob) {
    var today = new Date()
    var birthDate = new Date(dob)

    var age = today.getFullYear() - birthDate.getFullYear()
    var m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age = age - 1;
    }
    return age;
}

function styleGenderList(){
    gender.classList.remove("invalid")
    gender.options[3].classList.add("invalid")
}
