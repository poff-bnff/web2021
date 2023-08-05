var pageURL = location.origin
// var userprofilePageURL = pageURL + '/userprofile'
var userProfile
var validToken = false
var userProfileLoadedEvent = new CustomEvent('userProfileLoaded')
let userProfileHasBeenLoaded = false


function buyerCheck() {
    console.log('buyerCheck', validToken);
    if (!validToken) {
        //sisselogimata
        document.getElementById('directToLoginButton').style.display = 'block'
        // console.log("sisselogimata kasutaja on poes")
    } else {
        document.getElementById('directToLoginButton').style.display = 'none'
        if (userProfile.profileFilled && userProfile.user_profile && userProfile.user_profile.picture) {
            console.log('buyerCheck, kõik olemas saab osta');

            //kõik olemas saab osta
            document.getElementById('buybutton').style.display = 'block'
            // console.log("kasutaja saab osta")
        } else {
            if (!userProfile.profileFilled) {
                //profiil täitmata
                document.getElementById('directToFillProfile').style.display = 'block'
                // console.log("pooliku profiiliga kasutaja on poes")
            } else {
                //profiil täidetud, aga pilt puudu
                document.getElementById('directToaddPicture').style.display = 'block'
                // console.log("pildita kasutaja on poes")

            }
        }
    }
}

async function userMe() {
    const accessToken = localStorage.getItem('ID_TOKEN')
    const headers = { Authorization: `Bearer ${accessToken}` }
    const url = `${huntAuthDomain}/api/me`

    return fetch(url, { headers })
      .then(response => response.json())
      .then(data => {
        userProfile = data
        console.log('inside userMe', data)
        document.dispatchEvent(userProfileLoadedEvent)
      })
      .catch(error => console.warn(error))
}

// TODO: this has to be made obsolete
function savePreLoginUrl() {
    localStorage.setItem('preLoginUrl', window.location.href)
}

function useUserData(userProf) {
    console.log('useUserData', userProf);

    // TODO: this doesnot belong here - has to be moved to specific pages
    if (!document.getElementById('tervitus').innerHTML.includes(', ')) {
        if (industryPage && userProf.provider.split(',').includes('eventivalindustry') && userProf.industry_profile && userProf.industry_profile.name) {
            try {
                document.getElementById('tervitus').innerHTML = document.getElementById('tervitus').innerHTML + ', ' + userProf.industry_profile.name
            } catch (err) {
                // null
            }
        } else if (userProf.user_profile && userProf.user_profile.firstName && userProf.provider) {
            try {
                document.getElementById('tervitus').innerHTML = document.getElementById('tervitus').innerHTML + ', ' + userProf.user_profile.firstName
            } catch (err) {
                // null
            }

        } else {
            try {
                document.getElementById('tervitus').innerHTML = document.getElementById('tervitus').innerHTML + ', ' + userProf.email
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

// ---- Self-executive functions ----

//
// This self-executive function makes sure that whenever jwt is passed to the url,
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
        localStorage.setItem('USER_PROFILE', JSON.stringify(userProfile))
        url.searchParams.delete('jwt')
        window.open(url.toString(), '_self')
    }
})()

console.log(`Hunter Auth Domain: ${huntAuthDomain}`)

//
// This self-executive function looks for
// ID_TOKEN in localStorage and if it is
// found, userMe() is called.
//
; (async function () {
    const idToken = localStorage.getItem('ID_TOKEN')
    console.log(`get ID_TOKEN: ${idToken}`)

    if (idToken !== null && idToken !== undefined && idToken !== '') {
        let user = await userMe()
        console.log(`User: ${user}`)
    }
    console.log('userMe() done')
})()

//
// ---- No functions below this line ----

// TODO: not used anywhere, please remove
const getCurrentLang = () => {
    let lang = localStorage.getItem('lang')
    lang !== 'et' ? lang = `${lang}/` : lang = ''
    return lang
}
document.addEventListener('userProfileLoaded', function (e) {
    useUserData(userProfile)
    // console.log('User profile is loaded')

    try {
        const restrictedElement = document.querySelector(`.restrictedcontent`);
        if (userProfileHasBeenLoaded) {
            if (restrictedElement && cType && cId && cSubType !== undefined && cLang !== undefined && cDomain) {
                restrictedcontent(restrictedElement)
            }
        } else {
            restrictedElement.innerHTML = "Oled sisse logimata"
        }
    } catch (error) { }
})

try {
    const productElement = document.querySelector(`[shopSection]`);
    if (productElement) {
        availability()
    }
} catch (error) { }

if (localStorage.getItem('ID_TOKEN')) {
    var token = localStorage.getItem('ID_TOKEN')
    try {
        var base64Url = token.split('.')[1];
        var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        var jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        var expDate = JSON.parse(jsonPayload).exp * 1000
        var now = new Date().getTime()

        if (now < expDate) {
            validToken = true
        } else {
            validToken = false
        }
    }
    catch (err) {
        //console.log(err)
        validToken = false
    }
}
// console.log("valid token?",validToken)

if (validToken) {
    try {
        document.getElementById('logOut').style.display = 'block'
        document.getElementById('logInName').style.display = 'block'
        document.getElementById('userProfile').style.display = 'block'
    } catch (error) {
    }
    userMe()

    try {
        document.getElementById('login_cond').style.display = 'none'
    } catch (error) {
    }
}

if (!validToken) {
    try {
        document.getElementById('logIn').style.display = 'block'
        document.getElementById('signUp').style.display = 'block'
    } catch (error) {
        null
    }
}



