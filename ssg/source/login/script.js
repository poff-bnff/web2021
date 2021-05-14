// console.log("eelmine leht oli", document.referrer)
// console.log(langpath)

//info kasutajale kui suunatakse tagasi lemmikutest, profiili vaatest või minu
if ([`${location.origin}/userprofile`, `${location.origin}/en/userprofile`, `${location.origin}/ru/userprofile`].includes(document.referrer)) {
    // console.log("tulid profiilist")
    document.getElementById('fromUserProfile').style.display = ''
}
if ([`${location.origin}/minupoff`, `${location.origin}/en/mypoff`, `${location.origin}/ru/moipoff`].includes(document.referrer)) {
    // console.log("tulid oma passidest")
    // console.log(self.mypoff.path)
    document.getElementById('fromMyPoff').style.display = ''
}
if ([`${location.origin}/favourite`, `${location.origin}/en/favourite`, `${location.origin}/ru/favourite`].includes(document.referrer)) {
    // console.log("tulid Lemmikutest")
    document.getElementById('fromFavo').style.display = ''
}

// External provider login 
if (window.location.hash) {
    const authRequest = composeProvAuthRequest()
    loginFlow(authRequest)
}

// Email + pswd login
async function loginViaStrapi() {
    cleanUiMessages()
    if (loginUsername.value && loginPassword.value && validateEmail('loginUsername')) {
        const authRequest = composeLoginAuthRequest()
        loginFlow(authRequest)
    } else {
        unfilledErrorMsg.style.display = ''
    }
}

async function loginFlow(authRequest) {
    const authResponse = await fetchFromStrapi(authRequest)
    const authResult = handleAuthResponse(authResponse)

    if (authResult)
        storeAuthentication(authResult.jwt)
}

const cleanUiMessages = () => {
    unfilledErrorMsg.style.display = 'none'
    unConfirmed.style.display = 'none'
    noUserOrWrongPwd.style.display = 'none'
    errorNotificationBar.style.display = 'none'
    failedToFetch.style.display = 'none'
    mergeProvidersFailed.style.display = 'none'
}

const composeLoginAuthRequest = () => {

    const authenticationData = {
        identifier: document.getElementById("loginUsername").value,
        password: document.getElementById("loginPassword").value
    }
    const request = {
        route: '/auth/local',
        method: 'POST',
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(authenticationData)
    }

    return request
}

function composeProvAuthRequest() {
    const { provider, access_token } = getAccessTokenWithProvider()

    const request = {
        route: `/auth/${provider}/callback?${access_token}`,
        method: 'GET',
    }
    return request
}

function getAccessTokenWithProvider() {
    const [provider, search] = window.location.hash.substr(1).split('?')
    const tokenInfo = search.split('&')
    const token = {}
    for (const inf of tokenInfo) {
        token[inf.split('=')[0]] = inf
    }
    const access_token = token.access_token
    return {
        provider: provider,
        access_token: access_token
    }
}


async function fetchFromStrapi(requestOptions) {
    const { route, method, headers, body } = requestOptions

    try {
        let response = await fetch(`${strapiDomain}${route}`, {
            method: method,
            headers: headers,
            body: body
        });
        response = await response.json()
        return response
    }
    catch (err) {
        return { fetchErr: err }
    }
}

function handleAuthResponse(response) {

    if (response.fetchErr) {
        document.getElementById('failedToFetch').style.display = ''
        return
    }

    if (response.jwt && response.user) {
        return response
    } else if (response.statusCode !== 200) {
        const strapiError = response.data[0]?.messages[0].id || response.data.message
        console.log(strapiError);
        console.log(typeof (strapiError));
        console.log(strapiError == 'TypeError: Failed to fetch');
        switch (strapiError) {
            case ('Auth.form.error.confirmed'):
                document.getElementById('unConfirmed').style.display = ''
                break;
            case ('Auth.form.error.invalid'):
                document.getElementById('noUserOrWrongPwd').style.display = ''
                break;
            case ('Auth.form.error.password.local'):
                document.getElementById('noUserOrWrongPwd').style.display = ''
                break;
            case ('Merge provider to existing providers failed'):
                document.getElementById('mergeProvidersFailed').style.display = ''
                break;

            default:
                const errorNotifBar = document.getElementById('errorNotificationBar')
                errorNotifBar.style.display = ''
                errorNotifBar.innerHTML = errorNotificationBar.innerHTML + ` "${strapiError}"` + `<a onclick='closeMe(this)'> ×</a>`
                break;
        }
        cleanInputFields()
        cleanUrl()
    }
}

// salvesta timestamp
//kasutaja nimi
// autentimis päring api vastu (email ja parool, sinna, tagasi token ja timestamp

const cleanInputFields = () => {
    document.getElementById("loginUsername").value = ''
    document.getElementById("loginPassword").value = ''
}

const cleanUrl = () => {
    window.location.hash = ''

}
async function storeAuthentication(access_token, id_token) {
    localStorage.setItem('ACCESS_TOKEN', access_token)
    localStorage.setItem('ID_TOKEN', id_token)
    await loadUserProfile()
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

function directToSignup() {
    window.open(`${location.origin}/signup`, '_self')
}


function doResetPassword() {
    // console.log('reset');
    forgotPasswordBtn.style.display = 'none'
    sendPswdResetCodeBtn.style.display = ''
    document.getElementById('loginMessage').style.display = 'none'
    document.getElementById('password').style.display = 'none'
    document.getElementById('loginFB').style.display = 'none'
    document.getElementById('loginG').style.display = 'none'
    document.getElementById('loginE').style.display = 'none'
    document.getElementById('loginBtn').style.display = 'none'
    document.getElementById('signUpBtn').style.display = 'none'

    document.getElementById('pswdResetMessage').style.display = ''
}


function doSaveNewPswd() {
    // console.log('resetting');
    resetPasswordBtn.style.display = 'none'
    document.getElementById('passwordRep').style.display = 'none'
    document.getElementById('forgotPasswordBtn').style.display = 'none'
    document.getElementById('pswdResetEnterNewMessage').style.display = 'none'
    document.getElementById('pswdResetCompletedMessage').style.display = ''
    document.getElementById('loginBtn').style.display = ''
    document.getElementById('loginPassword').value = ''
    sendResetCode()

}



function doSendResetCode() {
    document.getElementById('userName').style.display = 'none'
    document.getElementById('currentUsername').style.display = ''
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
    document.getElementById('resetCodeBox').style.display = ''
    document.getElementById('pswdResetMessage').style.display = 'none'
    document.getElementById('pswdResetCodeMessage').style.display = ''

}

function askForNewPassword() {
    document.getElementById('password').style.display = ''
    document.getElementById('passwordRep').style.display = ''
    document.getElementById('resetCodeBox').style.display = 'none'
    document.getElementById('pswdResetCodeMessage').style.display = 'none'
    document.getElementById('pswdResetEnterNewMessage').style.display = ''
    resetPasswordBtn.style.display = ''
}

function closeMe(elem) {
    elem.parentNode.style.display = 'none'
}