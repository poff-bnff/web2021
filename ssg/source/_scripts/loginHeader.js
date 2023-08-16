var pageURL = location.origin
// var userprofilePageURL = pageURL + '/userprofile'
var userProfileLoadedEvent = new CustomEvent('userProfileLoaded')
let userProfileHasBeenLoaded = false

// TODO 1: @jaanleppik Siia palun pikem selgitus, mis tingimusi tuleb ostja
// juures kontrollida ja kuidas see funktsioon töötab
// Ärijuhtum 1: kui kasutaja on sisse logitud, aga tal on profiil täitmata, siis ...
// Ärijuhtum 2: kui kasutaja on sisse logitud, tal on profiil täidetud, aga tal puudub pilt, siis ...
// Ärijuhtum 3: kui kasutaja on sisse logitud, tal on profiil täidetud ja tal on pilt olemas, siis ...
// Ärijuhtum 4: kui kasutaja ei ole sisse logitud, siis ...
// Ärijuhtum 5: kui kasutaja ei ole sisse logitud, aga tal on profiil täitmata, siis ... (kas see on võimalik? ;)
// TODO 2: This function does not belong here - has to be moved to shop or similar
const buyerCheck = () => {
    document.getElementById('directToFillProfile').style.display = 'none'
    document.getElementById('buybutton').style.display = 'none'
    document.getElementById('directToLoginButton').style.display = 'none'

    // if we are in middle of login, its too early to decide about buyer
    const url = new URL(window.location.href)
    const jwt = url.searchParams.get('jwt')
    if (jwt !== null && jwt !== undefined && jwt !== '') {
        return false
    }

    if (!isUserTokenValid()) {
        //sisselogimata
        document.getElementById('directToLoginButton').style.display = 'block'
        // console.log("sisselogimata kasutaja on poes")
        return false
    }

    if (getProfilePicture()) {
        document.getElementById('buybutton').style.display = 'block'
        return true
    }

    document.getElementById('directToFillProfile').style.display = 'block'
    return false
}

// TODO: Investigate, what are best practices to make this function private to this file
const userMe = async () => {
    const accessToken = localStorage.getItem('ID_TOKEN')
    const headers = { Authorization: `Bearer ${accessToken}` }
    const url = `${huntAuthDomain}/api/me`

    const response = await fetch(url, { headers })
    const data = await response.json()
    // console.log('inside userMe', data)
    return data
}

// TODO: this has to be made obsolete
function savePreLoginUrl() {
    localStorage.setItem('preLoginUrl', window.location.href)
}

// TODO: this function is too abstract and does not belong here
//       should be torn to pieces and moved to specific pages
function useUserData() {
    const webUser = getUser()
    console.log('useUserData', webUser);

    // TODO: this doesnot belong here - has to be moved to specific pages
    if (!document.getElementById('tervitus').innerHTML.includes(', ')) {
        if (industryPage && webUser.provider.split(',').includes('eventivalindustry') && webUser.industry_profile && webUser.industry_profile.name) {
            try {
                document.getElementById('tervitus').innerHTML = document.getElementById('tervitus').innerHTML + ', ' + webUser.industry_profile.name
            } catch (err) {
                // null
            }
        } else if (webUser.user_profile && webUser.user_profile.firstName && webUser.provider) {
            try {
                document.getElementById('tervitus').innerHTML = document.getElementById('tervitus').innerHTML + ', ' + webUser.user_profile.firstName
            } catch (err) {
                // null
            }

        } else {
            try {
                document.getElementById('tervitus').innerHTML = document.getElementById('tervitus').innerHTML + ', ' + webUser.email
            } catch (err) {
                // null
            }
        }
    }
    try {
        buyerCheck()
    } catch (err) {

        // null
    }
    try {
        loadMyFavFilms()
    } catch (err) {

        // console.log(err)
        // null
    }
    try {
        userProfileHasBeenLoaded = true

        pageLoadingAndUserProfileFetched()
    } catch (err) {
        null
    }
    try {
        fetchMyPasses()
    } catch (err) {
        null
    }
}

function logOut() {
    localStorage.removeItem('ID_TOKEN')
    localStorage.removeItem('ID_TOKEN')

    if (localStorage.getItem('REFRESH_TOKEN')) {
        localStorage.removeItem('REFRESH_TOKEN')
    }
    localStorage.removeItem('preLoginUrl')
    localStorage.removeItem('USER_PROFILE')

    // console.log('LOGITUD VÄLJA')
    location.reload()

    // window.open(location.origin, '_self')
}

// This function returns true if user is logged in but redirects to login page if not.
const requireLogin = () => {
    if (isUserTokenValid()) {
        return true
    } else {
        const loginUrl = huntAuthDomain + '/?redirect_uri=' + window.location.href + '?jwt='
        window.open(loginUrl, '_self')
    }
}

const parseJWT = (token) => {
    try {
        const base64Url = token.split('.')[1]
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
        }).join(''))
        return JSON.parse(jsonPayload)
    } catch (err) {
        console.error(err)
        return null
    }
}

// TODO: not used anywhere, please remove
const getCurrentLang = () => {
    let lang = localStorage.getItem('lang')
    lang !== 'et' ? lang = `${lang}/` : lang = ''
    return lang
}

const getUser = () => {
    const webUser = localStorage.getItem('USER_PROFILE')
    if (webUser === null || webUser === undefined || webUser === '') {
        return null
    } else {
        return JSON.parse(webUser)
    }
}

const reloadUser = async () => {
    const webUser = await userMe()
    localStorage.setItem('USER_PROFILE', JSON.stringify(webUser))
    return webUser
}

const getProfilePicture = () => {
    const webUser = getUser()
    if (webUser !== null) {
        if (webUser.user_profile !== null) {
            if (webUser.user_profile.picture !== null) {
                return strapiDomain + webUser.user_profile.picture.url
            }
        }
    }
    return null
}

const isUserTokenValid = () => {
    const idToken = localStorage.getItem('ID_TOKEN');
    let validToken = false;
    if (idToken !== null && idToken !== undefined && idToken !== '') {
        const parsedToken = parseJWT(idToken);
        if (parsedToken !== null) {
            const expDate = parsedToken.exp * 1000;
            const now = new Date().getTime();
            if (now < expDate) {
                validToken = true;
            }
        }
    }
    return validToken;
}


// ---- Self-executing functions ----

//
// This self-executing function makes sure that whenever jwt is passed to the url,
// ID_TOKEN is set to localStorage, userMe() is called to fetch user profile and
// USER_PROFILE is set to localStorage. After that jwt is removed from the url
// and page is reloaded without jwt in the url.
//
; (async function () {
    const url = new URL(window.location.href)
    const jwt = url.searchParams.get('jwt')

    if (jwt !== null && jwt !== undefined && jwt !== '') {
        localStorage.setItem('ID_TOKEN', jwt)
        console.log(`set ID_TOKEN: ${jwt}`)
        let userProfile = await userMe()
        console.log(`set USER_PROFILE: ${JSON.stringify(userProfile)}`)
        localStorage.setItem('USER_PROFILE', JSON.stringify(userProfile))
        url.searchParams.delete('jwt')
        window.open(url.toString(), '_self')
    }
})()

//
// This self-executing function verifies ID_TOKEN in localStorage
// and if it is valid, userProfileLoadedEvent is dispatched.
// If it is not valid, it is removed from localStorage along
// with REFRESH_TOKEN and USER_PROFILE.
//
; (async function () {
    if (isUserTokenValid()) {
        document.dispatchEvent(userProfileLoadedEvent)
        try {
            document.getElementById('logOut').style.display = 'block'
            document.getElementById('logInName').style.display = 'block'
            document.getElementById('userProfile').style.display = 'block'
            document.getElementById('logIn').style.display = 'none'
        } catch (error) {
        }
    } else {
        localStorage.removeItem('ID_TOKEN')
        localStorage.removeItem('REFRESH_TOKEN')
        localStorage.removeItem('USER_PROFILE')
        try {
            document.getElementById('logOut').style.display = 'none'
            document.getElementById('logInName').style.display = 'none'
            document.getElementById('userProfile').style.display = 'none'
            document.getElementById('logIn').style.display = 'block'
        } catch (error) {
        }
    }

})()

//
// ---- No functions below this line ----

//
// If userProfileLoaded event is dispatched, this function is called.
//
document.addEventListener('userProfileLoaded', function (e) {
    try {
        const restrictedElement = document.querySelector(`.restrictedcontent`);
        if (userProfileHasBeenLoaded) {
            if ( restrictedElement
              && cType && cId && cSubType !== undefined
              && cLang !== undefined && cDomain) {
                restrictedcontent(restrictedElement)
            }
        } else {
            restrictedElement.innerHTML = "Oled sisse logimata"
        }
    } catch (error) { }

    // TODO: left here right now for compatibility reasons so that we can
    //       remove it from other places one by one
    useUserData()
})

