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
if (window.location.search) {
    setTimeout(function () { loginFlow('social') }, 0)
    // loginFlow('social')
}

// Email + pswd 'local' login
const loginViaLocal = () => {
    const usernameInput = document.getElementById("loginUsername")
    if (usernameInput.value && loginPassword.value && validateEmail("loginUsername")) {
        loginFlow('local')
    } else {
        unfilledErrorMsg.style.display = ''
    }
}

// Buttons
const loginViaProvider = (provider) => {
    let providerToLowerCase = provider.toLowerCase()
    localStorage.setItem('LOGIN_PROVIDER', providerToLowerCase)
    cleanUiMessages()
    setLang()

    if (provider === "local") {
        loginViaLocal()
    } else {
        provider = provider.toLowerCase()
        window.open(`${strapiDomain}/connect/${provider}`, '_self')
    }
}

function directToSignup() {
    window.open(`${location.origin}/${langpath}signup`, '_self')
}


// Login main
const loginFlow = async (provider) => {
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

    redirectToPreLoginUrl(userProfile)
}

// Services
const composeRequest = (requestCase) => {
    const request = { options: {} }
    const lang = localStorage.getItem('lang') || 'et'

    switch (requestCase) {
        case ('social'):
            const { provider, access_token } = getAccessTokenWithProvider()
            request.route = `/auth/${provider}/callback?access_token=${access_token}`
            request.options.method = 'GET'
            break;
        case ('local'):
            const authenticationData = {
                identifier: document.getElementById("loginUsername").value,
                password: document.getElementById("loginPassword").value
            }
            request.route = `/auth/local/login/${lang}`
            request.options.method = 'POST'
            request.options.headers = {
                "Content-Type": "application/json"
            }
            request.options.body = JSON.stringify(authenticationData)
            break;
        case ('profile'):
            request.route = '/users/me'
            request.options.method = 'GET'
            request.options.headers = {
                Authorization: 'Bearer ' + localStorage.getItem('BNFF_U_ACCESS_TOKEN'),
            }
            break;
    }
    return request
}

const fetchFromStrapi = async (request) => {
    try {
        let response = await fetch(`${strapiDomain}${request.route}`, request.options);
        response = await response.json()
        return response
    }
    catch (err) {
        document.getElementById('failedToFetch').style.display = ''
        cleanInputFields()
        return
    }
}

const handleResponse = (response) => {
    console.log('Login page handleResponse', response);
    if (response.jwt && response.user || response.id) return response

    if (response.statusCode !== 200) {
        const loginUsername = document.getElementById("loginUsername")

        if (loginUsername.value) {
            document.getElementById('emailUsed').style.display = ''
            emailUsed.innerHTML = loginUsername.value
        }

        // let strapiError = response.data[0].messages?.[0].id || response?.data.message || response?.message
        let strapiError = null
        if (response.message[0] && response.message[0].messages[0].id) {
            strapiError = response.message[0].messages[0].id
        }
        console.log('Login page handleResponse strapiError', strapiError);
        typeof strapiError !== 'string' ? strapiError = response.error : null

        switch (strapiError) {
            case ('Connect.error.accreditation'):
                document.getElementById('noAccreditation').style.display = ''
                break;
            case ('Auth.form.error.confirmed'):
                document.getElementById('unConfirmed').style.display = ''
                break;
            case ('Auth.form.error.invalid'):
                document.getElementById('noUserOrWrongPwd').style.display = ''
                break;
            case ('Auth.form.error.password.local'):
                document.getElementById('noUserOrWrongPwd').style.display = ''
                break;
            case ('Auth.form.error.invalid'):
                document.getElementById('noUserOrWrongPwd').style.display = ''
                break;
            case ('Merge provider to existing providers failed'):
                document.getElementById('mergeProvidersFailed').style.display = ''
                break;
            case ('No authorization header was found'):
                document.getElementById('authorizeRequestFailed').style.display = ''
                break;
            case ('pswdResetRequired'):
                doResetPassword('server')
                break;
            default:
                const errorNotifBar = document.getElementById('errorNotificationBar')
                errorNotifBar.style.display = ''
                errorNotifBar.innerHTML = errorNotificationBar.innerHTML + ` "${strapiError}"` + `<a onclick='closeMe(this.parentNode), clearMe(this.parentNode)'> ×</a>`
                break;
        }
        cleanInputFields()
        cleanUrl()
    }
}

const storeAuthentication = (access_token) =>
    localStorage.setItem('BNFF_U_ACCESS_TOKEN', access_token)

const redirectToPreLoginUrl = (userProfile) => {
    const preLoginUrl = localStorage.getItem('preLoginUrl')
    const currentlang = getCurrentLang()

    if (!industryPage && !userProfile.profileFilled) {
        window.open(`${pageURL}/${currentlang ? currentlang : ''}userprofile`, '_self')
        return
    }
    localStorage.removeItem('preLoginUrl')
    preLoginUrl ? window.open(preLoginUrl, '_self') : window.open(pageURL, '_self')
}

// Helpers:
const getAccessTokenWithProvider = () => {
    let provider = window.location.hostname === 'industry.poff.ee' ? 'eventivalindustry' : localStorage.getItem('LOGIN_PROVIDER')
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const access_token = urlParams.get('access_token')

    return {
        provider: provider,
        access_token: access_token
    }
}

const getCurrentLang = () => {
    let lang = localStorage.getItem('lang')
    lang !== 'et' ? lang = `${lang}/` : lang = ''
    return lang
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
    failedToFetch.style.display = 'none'
    mergeProvidersFailed.style.display = 'none'
    emailUsed.style.display = 'none'
    errorNotificationBar.style.display = 'none'
    clearMe(errorNotificationBar)
}

const clearMe = elem => elem.innerText = ''

const closeMe = elem => elem.style.display = 'none'

function doResetPassword(source) {
    forgotPasswordBtn.style.display = 'none'
    document.getElementById('loginMessage').style.display = 'none'
    document.getElementById('password').style.display = 'none'
    document.getElementById('login_some').style.display = 'none'
    document.getElementById('login_register').style.display = 'none'
    document.getElementById('loginBtn').style.display = 'none'
    document.getElementById('signUpBtn').style.display = 'none'
    sendPswdResetCodeBtn.style.display = ''
    document.getElementById('loginUsername').value = loginUsername.value
    if (source === 'user') {
        document.getElementById('pswdResetMessage').style.display = ''
    }
    else if (source === 'server') {
        document.getElementById('adminPswdResetMessage').style.display = ''
    }
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
    document.getElementById('currentUsername').innerHTML = document.getElementById("loginUsername").value
    sendPswdResetCodeBtn.style.display = 'none'

    sendResetCode()
}

async function sendResetCode() {
    const authenticationData = {
        email: document.getElementById("loginUsername").value,
        lang: langpath.substr(0, 2) || 'et'
    }

    var requestOptions = {
        method: 'POST',
        redirect: 'follow',
        body: JSON.stringify(authenticationData)
    }

    let response = await fetch(`${strapiDomain}/auth/forgot-password`, requestOptions)
    response = await response.json()
    console.log(response);

    document.getElementById('pswdResetMessage').style.display = 'none'
    document.getElementById('adminPswdResetMessage').style.display = 'none'
    document.getElementById('forgotPasswordBtn').style.display = 'none'

    if (response.error) {
        const errorNotifBar = document.getElementById('errorNotificationBar')
        const insertedUsername = document.getElementById('currentUsername')
        insertedUsername.style.display = 'none'
        errorNotifBar.style.display = ''
        errorNotifBar.innerHTML = errorNotificationBar.innerHTML + `Tekkis viga, palun veendu, et sisestasid õige e-maili aadressi (${insertedUsername.innerHTML})` + `<a onclick='closeMe(this.parentNode), clearMe(this.parentNode)'> ×</a>`

    } else {
        document.getElementById('pswdResetCodeSent').style.display = ''
    }
    document.getElementById('backToLoginBtn').style.display = ''


}