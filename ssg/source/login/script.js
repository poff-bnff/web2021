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


// External provider 'social' login 
if (window.location.hash) {
    setTimeout(function () { loginFlow('social') }, 0)
    // loginFlow('social')
}

// Buttons
function directToSignup() {
    window.open(`${location.origin}/signup`, '_self')
}

// Email + pswd 'local' login (button)
const loginViaLocal = () => {
    cleanUiMessages()
    if (loginUsername.value && loginPassword.value && validateEmail('loginUsername')) {
        loginFlow('local')
    } else {
        unfilledErrorMsg.style.display = ''
    }
}

// Login main
const loginFlow = async provider => {
    const authRequest = composeRequest(provider)
    const authResponse = await fetchFromStrapi(authRequest)
    if (!authResponse) return

    const authResult = handleResponse(authResponse)
    if (!authResult) return

    storeAuthentication(authResult.jwt)

    const userProfileRequest = composeRequest('profile')
    const userProfResponse = await fetchFromStrapi(userProfileRequest)
    if (!userProfResponse) return

    const userProfile = handleResponse(userProfResponse)
    if (!userProfile) return

    if (!userProfile.profileFilled) {
        window.open(`${pageURL}/userprofile`, '_self')
        return
    }
    redirectToPreLoginUrl()
}

// Services
const composeRequest = requestCase => {
    const request = {}

    switch (requestCase) {
        case ('social'):
            const { provider, access_token } = getAccessTokenWithProvider()
            request.route = `/auth/${provider}/callback?${access_token}`
            request.method = 'GET'
            break;
        case ('local'):
            const authenticationData = {
                identifier: document.getElementById("loginUsername").value,
                password: document.getElementById("loginPassword").value
            }
            request.route = '/auth/local'
            request.method = 'POST'
            request.headers = {
                "Content-Type": "application/json"
            }
            request.body = JSON.stringify(authenticationData)
            break;
        case ('profile'):
            request.route = '/users/me'
            request.method = 'GET'
            request.headers = {
                Authorization: 'Bearer ' + localStorage.getItem('BNFF_U_ACCESS_TOKEN'),
            }
            break;
    }
    return request
}

const fetchFromStrapi = async requestOptions => {
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
        document.getElementById('failedToFetch').style.display = ''
        cleanInputFields()
        return
    }
}

const handleResponse = response => {
    if (response.jwt && response.user || response.id) return response

    if (response.statusCode !== 200) {
        if (loginUsername.value) {
            document.getElementById('emailUsed').style.display = ''
            emailUsed.innerHTML = loginUsername.value
        }

        const strapiError = response.data[0]?.messages[0].id || response?.data.message || response.message 
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
            case ('No authorization header was found'):
                document.getElementById('authorizeRequestFailed').style.display = ''
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

const storeAuthentication = access_token =>
    localStorage.setItem('BNFF_U_ACCESS_TOKEN', access_token)

const redirectToPreLoginUrl = () => {
    const preLoginUrl = localStorage.getItem('preLoginUrl')
    localStorage.removeItem('preLoginUrl')
    
    preLoginUrl ? window.open(preLoginUrl, '_self') : window.open(pageURL, '_self')
}

// Helpers:
const getAccessTokenWithProvider = () => {
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

// Cleaners:
const cleanUrl = () =>
    window.location.hash = ''

const cleanInputFields = () => {
    document.getElementById("loginUsername").value = ''
    document.getElementById("loginPassword").value = ''
}

const cleanUiMessages = () => {
    unfilledErrorMsg.style.display = 'none'
    unConfirmed.style.display = 'none'
    noUserOrWrongPwd.style.display = 'none'
    errorNotificationBar.style.display = 'none'
    failedToFetch.style.display = 'none'
    mergeProvidersFailed.style.display = 'none'
    emailUsed.style.display = 'none'
}

const closeMe = elem =>
    elem.parentNode.style.display = 'none'





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
    sendReset
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
