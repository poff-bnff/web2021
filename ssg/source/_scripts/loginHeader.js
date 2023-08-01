var pageURL = location.origin
// var userprofilePageURL = pageURL + '/userprofile'
var userProfile
var validToken = false
var userProfileLoadedEvent = new CustomEvent('userProfileLoaded')
let userProfileHasBeenLoaded = false

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


if (localStorage.getItem('BNFF_U_ACCESS_TOKEN')) {
    var token = localStorage.getItem('BNFF_U_ACCESS_TOKEN')
    try {
        var base64Url = token.split('.')[1];
        var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        var jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        // var parsedToken = JSON.parse(jsonPayload)
        // console.log("token: ", parsedToken)
        var expDate = JSON.parse(jsonPayload).exp * 1000
        var now = new Date().getTime()

        console.log("token aegub: " + expDate)
        console.log("praegu on: " + now)

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
    // loadEmptyUserProfile()
}

// function loadUserProfileH() {
//     // console.log('laen cognitost kasutaja profiili....')
//     var myHeaders = new Headers()
//     myHeaders.append('Authorization', 'Bearer ' + localStorage.getItem('BNFF_U_ACCESS_TOKEN'))

//     var requestOptions = {
//         method: 'GET',
//         headers: myHeaders,
//         redirect: 'follow'
//     }

//     fetch(`${strapiDomain}/users/me`, requestOptions).then(function (response) {
//         if (response.ok) {
//             return response.json();
//         }
//         return Promise.reject(response);
//     }).then(function (data) {
//         userProfile = data
//         document.dispatchEvent(userProfileLoadedEvent)
//         // console.log("cognitos olev profiil:")
//         // console.log(userProfile);

//     }).catch(function (error) {
//         console.warn(error);
//     });
// }

async function userMe() {

    fetch(`${huntAuthDomain}/api/me`, { headers: { Authorization: `Bearer ${localStorage.getItem('BNFF_U_ACCESS_TOKEN')}` } })
    .then(function (response) {
        if (response.ok) {
            return response.json();
        }
        return Promise.reject(response);
    }).then(function (data) {
        userProfile = data
        console.log('DATA', data);
        document.dispatchEvent(userProfileLoadedEvent)
        redirectToPreLoginUrl(userProfile)

        // console.log("cognitos olev profiil:")
        // console.log(userProfile);

    }).catch(function (error) {
        console.warn(error);
    });


}

function loadEmptyUserProfile() {
    // console.log('loadEmptyUserProfile')

    var requestOptions = {
        method: 'GET',
        redirect: 'follow'
    }

    fetch('https://api.poff.ee/profile', requestOptions).then(function (response) {
        if (response.ok) {
            return response.json();
        }
        return Promise.reject(response);
    }).then(function (data) {
        // console.log('data ', data);
        userProfile = {
            sub: data.ip,
            name: 'Wolf'
        }
        document.dispatchEvent(userProfileLoadedEvent)
        // console.log("cognitos olev profiil:")
        // console.log(userProfile);

    }).catch(function (error) {
        console.warn(error);
    });
}

function savePreLoginUrl() {
    localStorage.setItem('preLoginUrl', window.location.href)
}

function useUserData(userProf) {
    console.log('useUserData', userProf);

    if (industryPage && userProf.provider.split(',').includes('eventivalindustry') && userProf.industry_profile && userProf.industry_profile.name) {
        try {
            document.getElementById('tervitus').innerHTML = document.getElementById('tervitus').innerHTML + ', ' + userProf.industry_profile.name
            console.log('Siia jõuab 1');
        } catch (err) {
            console.log('Siia ei jõua 1', err);
            // null
        }
    } else if (userProf.user_profile && userProf.user_profile.firstName && userProf.provider) {
        try {
            console.log('Siia jõuab 2');
            document.getElementById('tervitus').innerHTML = document.getElementById('tervitus').innerHTML + ', ' + userProf.user_profile.firstName
        } catch (err) {
            console.log('Siia ei jõua 2', err);

            // null
        }

    } else {
        try {
            console.log('Siia jõuab 3');
            document.getElementById('tervitus').innerHTML = document.getElementById('tervitus').innerHTML + ', ' + userProf.email
        } catch (err) {
            console.log('Siia ei jõua 3', err);

            // null
        }
    }
    try {
        console.log('Siia jõuab 4');
        buyerCheck()
    } catch (err) {
        console.log('Siia ei jõua 4', err);

        // null
    }
    try {
        console.log('Siia jõuab 5');
        loadMyFavFilms()
    } catch (err) {
        console.log('Siia ei jõua 5', err);

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
    localStorage.removeItem('BNFF_U_ACCESS_TOKEN')
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

const getCurrentLang = () => {
    let lang = localStorage.getItem('lang')
    lang !== 'et' ? lang = `${lang}/` : lang = ''
    return lang
}

//
// This self-executive function makes sure
// that whenever jwt is passed to the url,
// ID_TOKEN is set to localStorage and page
// is reloaded without jwt
//
(function() {
    const url = new URL(window.location.href)
    const jwt = url.searchParams.get('jwt')

    if (jwt !== null && jwt !== undefined && jwt !== '') {
        localStorage.setItem('ID_TOKEN', jwt)
        // redirect to same page without jwt
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
(function() {
    const idToken = localStorage.getItem('ID_TOKEN')
    console.log(`ID_TOKEN: ${idToken}`)

    if (idToken !== null && idToken !== undefined && idToken !== '') {
        let user = userMe()
        console.log(`User: ${user}`)
    }
})()
