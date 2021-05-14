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
    setTimeout(function () { loginFlow('social') }, 0)
    // loginFlow('social')
}

// Email + pswd login
const loginViaStrapi = () => {
    cleanUiMessages()
    if (loginUsername.value && loginPassword.value && validateEmail('loginUsername')) {
        loginFlow('local')
    } else {
        unfilledErrorMsg.style.display = ''
    }
}

const loginFlow = async provider => {
    const authRequest = composeAuthRequest(provider)
    const authResponse = await fetchFromStrapi(authRequest)
    const authResult = handleAuthResponse(authResponse)
    if (!authResult) return

    storeAuthentication(authResult.jwt)
    const usrProfileRequest = composeUsrProfileRequest()
    const usrProfResponse = await fetchFromStrapi(usrProfileRequest)
    const userProfile = handleProfResponse(usrProfResponse)
    if (!userProfile) return

    if (userProfile.profileFilled) redirectToPreLoginUrl()
    window.open(`${pageURL}/userprofile`, '_self')
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

const composeAuthRequest = provider => {
    const request = {}

    if (provider === 'social') {
        const { provider, access_token } = getAccessTokenWithProvider()
        request.route = `/auth/${provider}/callback?${access_token}`
        request.method = 'GET'
    }
    if (provider === 'local') {
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
    }
    return request
}

const composeUsrProfileRequest = () => {
    const request = {
        route: '/users/me',
        method: 'GET',
        headers: {
            Authorization: 'Bearer ' + localStorage.getItem('BNFF_U_ACCESS_TOKEN'),
        }
    }
    return request
}

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
        console.log(err);
        return { fetchErr: err }
    }
}

const handleAuthResponse = response => {
    if (response.fetchErr) {
        document.getElementById('failedToFetch').style.display = ''
        return
    }
    if (response.jwt && response.user) return response

    if (response.statusCode !== 200) {
        if (loginUsername.value) {
            document.getElementById('emailUsed').style.display = ''
            emailUsed.innerHTML = loginUsername.value
        }

        const strapiError = response.data[0]?.messages[0].id || response.data.message
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

const handleProfResponse = response => {
    return response
}

const cleanInputFields = () => {
    document.getElementById("loginUsername").value = ''
    document.getElementById("loginPassword").value = ''
}

const cleanUrl = () =>
    window.location.hash = ''

const storeAuthentication = access_token =>
    localStorage.setItem('BNFF_U_ACCESS_TOKEN', access_token)

const redirectToPreLoginUrl = () => {
    const preLoginUrl = localStorage.getItem('url')
    if (!preLoginUrl) window.open(pageURL, '_self')

    localStorage.removeItem('url')
    window.open(url, '_self')
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

const closeMe = elem =>
    elem.parentNode.style.display = 'none'
