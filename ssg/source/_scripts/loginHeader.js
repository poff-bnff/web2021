const pageURL = location.origin
// const userprofilePageURL = pageURL + '/userprofile'
const userProfileLoadedEvent = new CustomEvent('userProfileLoaded')

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
    userProfileHasBeenLoaded = true
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

    try {
        buyerCheck()
    } catch (err) {}
    try {
        pageLoadingAndUserProfileFetched()
    } catch (err) {}
    try {
        fetchMyPasses()
    } catch (err) {}
}

function logOut() {
    localStorage.removeItem('ID_TOKEN')
    localStorage.removeItem('ID_TOKEN')

    if (localStorage.getItem('REFRESH_TOKEN')) {
        localStorage.removeItem('REFRESH_TOKEN')
    }
    localStorage.removeItem('preLoginUrl')
    localStorage.removeItem('USER_PROFILE')

    // redirect to home page
    window.open(location.origin, '_self')
}

// Use wherever you need to restrict content to logged in users
// and/or users with complete profile and/or users with profile picture
const webUserLevel = () => {
    let level = 'notLoggedIn'
    if (isUserTokenValid()) {
        level = 'loggedIn'
        if (isUserProfileComplete()) {
            level = 'profileComplete'
            if (getProfilePicture()) {
                level = 'pictureUploaded'
            }
        }
    }
    return level
}

// This function returns true if user is logged in but redirects to login page if not.
const requireLogin = () => {
    if (isUserTokenValid()) {
        return true
    }
    const loginUrl = huntAuthDomain + '/?redirect_uri=' + window.location.href + '?jwt='
    window.open(loginUrl, '_self')
}

const requireEventivalLogin = () => {
    if (isUserTokenValid()) {
        return true
    }
    const loginUrl = huntAuthDomain + '/?provider=eventival&redirect_uri=' + window.location.href + '?jwt='
    window.open(loginUrl, '_self')
}

const redirectToProfile = () => {
    localStorage.setItem('returnFromProfileUrl', window.location.href)
    window.open('/userprofile', '_self')
}

// This function returns:                  This function redirects to profile page if:
// - true, if user has complete profile    - user is logged in and
// - false, if user has not logged in      - has incomplete profile
const requireProfile = async () => {
    if (!isUserTokenValid()) {
        return false
    }
    if (!getUser()) {
        await reloadUser()
    }
    if (isUserProfileComplete()) {
        return true
    }
    // if already on profile page, do not redirect
    if (window.location.pathname.substring(0,12) === '/userprofile') {
        return false
    }
    redirectToProfile()
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

const setMy = (my) => {
    const user = Object.assign(getUser(), { My: my });
    localStorage.setItem('USER_PROFILE', JSON.stringify(user))
}

const setUser = (user) => {
    localStorage.setItem('USER_PROFILE', JSON.stringify(user))
}

const reloadUser = async () => {
    if (!isUserTokenValid()) {
        return null
    }
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

const isUserProfileComplete = () => {
    const webUser = getUser()
    if (webUser &&
        webUser.user_profile &&
        webUser.user_profile.firstName &&
        webUser.user_profile.lastName &&
        webUser.user_profile.birthdate &&
        webUser.user_profile.email &&
        webUser.user_profile.phoneNr) {
      return true;
    }

    return false
}

const getCourseEventVideoUrl = async (courseEventId) => {
    const videoProviderUrls = {
        'videolevels.com': 'https://videolevels.com/embed/',
        'vimeo': 'https://player.vimeo.com/video/',
        'youtube': 'https://www.youtube.com/embed/'
    }
    const accessToken = localStorage.getItem('ID_TOKEN')
    const headers = { Authorization: `Bearer ${accessToken}` }
    const url = `${huntAuthDomain}/api/validate/eventUrl?${courseEventId}`
    return fetch(url, { headers })
        .then(response => {
            return response.json()
        })
        .then(data => {
            console.log({'U': url, 'D': data})
            const videoProvider = data.videoProvider
            const videoId = data.videoId
            return videoProviderUrls[videoProvider] + videoId
        })
        .catch(error => {
            console.error({'U': url, 'E': error})
            return false
        })
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
        await reloadUser()
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
    const logInButton = document.getElementById('logIn')
    const logOutButton = document.getElementById('logOut')
    const userProfileButton = document.getElementById('userProfile')
    const myEventsButton = document.getElementById('myEvents')
    if (isUserTokenValid()) {
        document.dispatchEvent(userProfileLoadedEvent)
        if (logInButton) {
            logInButton.style.display = 'none'
        }
        if (logOutButton) {
            logOutButton.style.display = 'block'
        }
        if (userProfileButton) {
            userProfileButton.style.display = 'block'
        }
        if (myEventsButton) {
            myEventsButton.style.display = 'block'
        }
    } else {
        localStorage.removeItem('ID_TOKEN')
        localStorage.removeItem('REFRESH_TOKEN')
        localStorage.removeItem('USER_PROFILE')
        if (logInButton) {
            logInButton.style.display = 'block'
        }
        if (logOutButton) {
            logOutButton.style.display = 'none'
        }
        if (userProfileButton) {
            userProfileButton.style.display = 'none'
        }
        if (myEventsButton) {
            myEventsButton.style.display = 'none'
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

