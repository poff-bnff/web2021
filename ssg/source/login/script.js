// console.log("eelmine leht oli", document.referrer)
// console.log(langpath)

//info kasutajale kui suunatakse tagasi lemmikutest, profiili vaatest või minu
if([`${location.origin}/userprofile`, `${location.origin}/en/userprofile`, `${location.origin}/ru/userprofile`].includes(document.referrer)){
    // console.log("tulid profiilist")
    document.getElementById('fromUserProfile').style.display = 'block'
}
if([`${location.origin}/minupoff`, `${location.origin}/en/mypoff`, `${location.origin}/ru/moipoff`].includes(document.referrer)){
    // console.log("tulid oma passidest")
    // console.log(self.mypoff.path)
    document.getElementById('fromMyPoff').style.display = 'block'
}
if([`${location.origin}/favourite`, `${location.origin}/en/favourite`, `${location.origin}/ru/favourite`].includes(document.referrer)){
    // console.log("tulid Lemmikutest")
    document.getElementById('fromFavo').style.display = 'block'
}


if (window.location.hash) {

    const [
        access_token,
        id_token,
        token_type,
        token_expires,
    ] = window.location.hash.substr(1).split('&')

    if ((window.location.hash).includes('Already+found+an+entry+for+username')) {
        let errorMessage = (window.location.hash).split('+')
        for (item of errorMessage) {
            // console.log(item)

            if (item.includes('google') || item.includes('facebook') || item.includes('eventival')) {
                item = item.split('_')
                let provider = item[0]
                // console.log(provider)
                providerLogin(provider)
            }
        }
        // console.log(errorMessage)
    }
    else if ((window.location.hash).includes('User+is+not+confirmed')){
        unConfirmed.style.display = 'block'
        window.location.hash = ''
    }

    else if (access_token && id_token) {
        storeAuthentication(access_token.split('=')[1], id_token.split('=')[1])
        window.location.hash = ''
    }
}

if (location.search) {
    getTokensForCode()

}

// salvesta timestamp
//kasutaja nimi
// autentimis päring api vastu (email ja parool, sinna, tagasi token ja timestamp

async function storeAuthentication(access_token, id_token) {
    localStorage.setItem('ACCESS_TOKEN', access_token)
    localStorage.setItem('ID_TOKEN', id_token)
    await loadUserProfile()
}


async function loginViaCognito() {
    unfilledErrorMsg.style.display = 'none'
    unConfirmed.style.display = 'none'
    wrongPswd.style.display = 'none'



    if (loginUsername.value && loginPassword.value && validateEmail('loginUsername')) {

        let authenticationData = {
            loginUsername: document.getElementById("loginUsername").value,
            password: document.getElementById("loginPassword").value
        }

        // console.log(authenticationData)

        let response = await fetch(`https://api.poff.ee/auth`, {
            method: 'POST',
            headers: {
                Authorization: 'Bearer ' + localStorage.getItem('ACCESS_TOKEN'),
            },
            body: JSON.stringify(authenticationData)
        });

        let response2 = await response.json()
        // console.log(response2)



        if (response2.email && !response2.confirmed) {
            // console.log(1)
            document.getElementById('unConfirmed').style.display = 'block'
            return
        }

        if (response2.noUserEmail && !response2.user) {
            // console.log(2)
            document.getElementById('noSuchUser').style.display = 'block'
            return
        }

        if (response2.message === 'Internal Server Error'){
            document.getElementById('wrongPswd').style.display = 'block'
            return
        }

        // console.log(response2)
        // console.log('authResponse ', response2.AccessToken)
        access_token = response2.AccessToken
        id_token = response2.IdToken

        storeAuthentication(access_token, id_token)
    } else {
        unfilledErrorMsg.style.display = 'block'

    }

}


async function loadUserProfile() {
    // console.log('loadUserProfile');
    let userProfile

    let response = await fetch(`https://api.poff.ee/profile`, {
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
    // console.log(userProfile.profile_filled);

    if (userProfile.profile_filled) {
        // console.log(userProfile.profile_filled)
        // console.log('profile filled')
        redirectToPreLoginUrl()
    }
    else if (!userProfile.profile_filled) {
        // console.log(userProfile.profile_filled)
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


async function getTokensForCode() {
    var requestOptions = {
        method: 'POST',
        redirect: 'follow'
    }

    let response = await fetch(`https://api.poff.ee/auth`, requestOptions)

    // console.log(await response.json)

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

