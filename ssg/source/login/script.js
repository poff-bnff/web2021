// console.log("eelmine leht oli", document.referrer)
// console.log(langpath)

//info kasutajale kui suunatakse tagasi lemmikutest, profiili vaatest või minu
if ([`${location.origin}/userprofile`, `${location.origin}/en/userprofile`, `${location.origin}/ru/userprofile`].includes(document.referrer)) {
    // console.log("tulid profiilist")
    document.getElementById('fromUserProfile').style.display = 'block'
}
if ([`${location.origin}/minupoff`, `${location.origin}/en/mypoff`, `${location.origin}/ru/moipoff`].includes(document.referrer)) {
    // console.log("tulid oma passidest")
    // console.log(self.mypoff.path)
    document.getElementById('fromMyPoff').style.display = 'block'
}
if ([`${location.origin}/favourite`, `${location.origin}/en/favourite`, `${location.origin}/ru/favourite`].includes(document.referrer)) {
    // console.log("tulid Lemmikutest")
    document.getElementById('fromFavo').style.display = 'block'
}

if (window.location.hash) {
    const [provider] = window.location.hash.substr(1).split('?')
    const search = window.location.hash.split('?')[1]
    const tokenInfo = search.split('&')
    const token = {}
    for (const inf of tokenInfo) {
        token[inf.split('=')[0]] = inf
    }
    fetchJWTandProfileFromStrapi(token.access_token, provider)
}

async function fetchJWTandProfileFromStrapi(access_token, provider) {

    console.log(access_token);
    console.log(provider);

    const strapiFetchUrl = `${strapiDomain}/auth/${provider}/callback?${access_token}`

    let response = await fetch(strapiFetchUrl)
    response = await response.json();

    if (response.user && response.jwt) {
        const JWT = response.jwt
        storeAuthentication(JWT)
        return
    }

    if (response.statusCode !== 200) {
        errorNotificationBar.style.display = ''
        errorNotificationBar.innerHTML = errorNotificationBar.innerHTML + ` "${response.message.message}"` + `<a onclick='closeMe(this)'> ×</a>`
    }
}

// salvesta timestamp
//kasutaja nimi
// autentimis päring api vastu (email ja parool, sinna, tagasi token ja timestamp

async function storeAuthentication(access_token, id_token) {
    localStorage.setItem('ACCESS_TOKEN', access_token)
    localStorage.setItem('ID_TOKEN', id_token)
    await loadUserProfile()
}


async function loginViaStrapi() {
    console.log('emailpswd');
    unfilledErrorMsg.style.display = 'none'
    unConfirmed.style.display = 'none'
    noUserOrWrongPwd.style.display = 'none'



    if (loginUsername.value && loginPassword.value && validateEmail('loginUsername')) {

        let authenticationData = {
            identifier: document.getElementById("loginUsername").value,
            password: document.getElementById("loginPassword").value
        }

        let response = await fetch(`${strapiDomain}/auth/local`, {
            method: 'POST',
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(authenticationData)
        });
        response = await response.json()

        if (response.user && response.jwt) {
            const JWT = response.jwt
            storeAuthentication(JWT)
        } else if (response.statusCode !== 200) {
            const strapiError = response.message[0].messages[0].message
            switch (strapiError) {
                case ('Your account email is not confirmed'):
                    document.getElementById('unConfirmed').style.display = 'block'
                    break;
                case ('Identifier or password invalid.'):
                    document.getElementById('noUserOrWrongPwd').style.display = 'block'

            }
        }
    } else {
        unfilledErrorMsg.style.display = 'block'
    }
}


async function loadUserProfile() {
    // console.log('loadUserProfile');
    let userProfile

    let response = await fetch(`${strapiDomain}/users/me`, {
        method: 'GET',
        headers: {
            Authorization: 'Bearer ' + localStorage.getItem('ACCESS_TOKEN'),
        },
    });
    userProfile = await response.json()
    // console.log(userProfile);
    checkIfUserProfFilled(userProfile)

}


function checkIfUserProfFilled(userProfile) {
    // console.log('checkIfUserProfFilled');
    // console.log(userProfile.profileFilled);

    if (userProfile.profileFilled) {
        // console.log(userProfile.profileFilled)
        // console.log('profile filled')
        redirectToPreLoginUrl()
    }
    else if (!userProfile.profileFilled) {
        // console.log(userProfile.profileFilled)
        // console.log('profile not filled')
        window.open(`${pageURL}/userprofile`, '_self')

    }
}


function redirectToPreLoginUrl() {
    if (localStorage.getItem('url')) {
        let url = localStorage.getItem('url')
        localStorage.removeItem('url')
        window.open(url, '_self')
    }
    else {
        window.open(pageURL, '_self')
    }
}


async function providerLogin(provider) {
    // console.log('providerLogin ' + provider);

    window.open(`https://api.poff.ee/auth/${provider}`, '_self')

    var requestOptions = {
        method: 'GET',
        redirect: 'follow'
    }

    let response = await fetch(`https://api.poff.ee/auth/${provider}`, requestOptions)

    let response2 = await response.json()
    // console.log(response2)

    window.open(response2.providerUrl, '_self')
}

function directToSignup() {
    window.open(`${location.origin}/signup`, '_self')
}


function doResetPassword() {
    // console.log('reset');
    forgotPasswordBtn.style.display = 'none'
    sendPswdResetCodeBtn.style.display = 'block'
    document.getElementById('loginMessage').style.display = 'none'
    document.getElementById('password').style.display = 'none'
    document.getElementById('loginFB').style.display = 'none'
    document.getElementById('loginG').style.display = 'none'
    document.getElementById('loginE').style.display = 'none'
    document.getElementById('loginBtn').style.display = 'none'
    document.getElementById('signUpBtn').style.display = 'none'

    document.getElementById('pswdResetMessage').style.display = 'block'
}


function doSaveNewPswd() {
    // console.log('resetting');
    resetPasswordBtn.style.display = 'none'
    document.getElementById('passwordRep').style.display = 'none'
    document.getElementById('forgotPasswordBtn').style.display = 'none'
    document.getElementById('pswdResetEnterNewMessage').style.display = 'none'
    document.getElementById('pswdResetCompletedMessage').style.display = 'block'
    document.getElementById('loginBtn').style.display = 'block'
    document.getElementById('loginPassword').value = ''
    sendResetCode()

}



function doSendResetCode() {
    document.getElementById('userName').style.display = 'none'
    document.getElementById('currentUsername').style.display = 'block'
    document.getElementById('currentUsername').innerHTML = loginUsername.value
    sendPswdResetCodeBtn.style.display = 'none'

    // console.log('sendResetCode');
    // console.log(loginUsername.value);
    sendResetCode()
}


async function sendResetCode() {
    let authenticationData

    // console.log(loginUsername.value);
    // console.log(resetCode.value);


    if (resetCode.value) {
        authenticationData = {
            loginUsername: loginUsername.value,
            code: resetCode.value,
            newPswd: loginPasswordRep.value
        }
    }
    else if (loginUsername.value) {
        authenticationData = {
            loginUsername: document.getElementById("loginUsername").value
        }
    }

    var requestOptions = {
        method: 'POST',
        redirect: 'follow',
        body: JSON.stringify(authenticationData)
    }

    let response = await fetch(`https://api.poff.ee/profile/pswd`, requestOptions)

    // console.log(await response.json())

    if (resetCode.value) {
        return
    }

    document.getElementById('forgotPasswordBtn').style.display = 'none'
    document.getElementById('resetCodeBox').style.display = 'block'
    document.getElementById('pswdResetMessage').style.display = 'none'
    document.getElementById('pswdResetCodeMessage').style.display = 'block'

}

function askForNewPassword() {
    document.getElementById('password').style.display = 'block'
    document.getElementById('passwordRep').style.display = 'block'
    document.getElementById('resetCodeBox').style.display = 'none'
    document.getElementById('pswdResetCodeMessage').style.display = 'none'
    document.getElementById('pswdResetEnterNewMessage').style.display = 'block'
    resetPasswordBtn.style.display = 'block'
}

function closeMe(elem) {
    elem.parentNode.style.display = 'none'
}

