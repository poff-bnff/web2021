var pageURL = location.origin
var userprofilePageURL = pageURL + '/userprofile'
var userProfile
var validToken = false
var userProfileLoadedEvent = new CustomEvent('userProfileLoaded')
var strapiDomain = 'http://localhost:1337'


document.addEventListener('userProfileLoaded', function (e) {
    useUserData(userProfile)
    // console.log('User profile is loaded')
})


function buyerCheck() {

    if(!validToken) {
        //sisselogimata
        document.getElementById('directToLoginButton').style.display = 'block'
        // console.log("sisselogimata kasutaja on poes")
    }else{
        document.getElementById('directToLoginButton').style.display = 'none'

        if(userProfile.profile_filled && userProfile.picture === "this users picture is in S3"){
            //kõik olemas saab osta
            document.getElementById('buybutton').style.display = 'block'
            // console.log("kasutaja saab osta")
        }else {
            if(!userProfile.profile_filled){
                //profiil täitmata
                document.getElementById('directToFillProfile').style.display = 'block'
                // console.log("pooliku profiiliga kasutaja on poes")
            }else{
                //profiil täidetud, aga pilt puudu
                document.getElementById('directToaddPicture').style.display = 'block'
                // console.log("pildita kasutaja on poes")

            }
        }
    }
}


if(localStorage.getItem('BNFF_U_ACCESS_TOKEN')){
    var token = localStorage.getItem('BNFF_U_ACCESS_TOKEN')
    try{
        var base64Url = token.split('.')[1];
        var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        var jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        // var parsedToken = JSON.parse(jsonPayload)
        // console.log("token: ", parsedToken)
        var expDate = JSON.parse(jsonPayload).exp * 1000
        var now = new Date().getTime()

        // console.log("token aegub: " + expDate)
        // console.log("praegu on: " + now)

        if(now < expDate){
            validToken = true
        }else{
            validToken = false
        }
    }
    catch(err){
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
    loadUserProfileH()

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

function loadUserProfileH() {
    // console.log('laen cognitost kasutaja profiili....')
    var myHeaders = new Headers()
    myHeaders.append('Authorization', 'Bearer ' + localStorage.getItem('BNFF_U_ACCESS_TOKEN'))

    var requestOptions = {
        method: 'GET',
        headers: myHeaders,
        redirect: 'follow'
    }

    fetch('http://localhost:1337/users/me', requestOptions).then(function (response) {
        if (response.ok) {
            return response.json();
        }
        return Promise.reject(response);
    }).then(function (data) {
        userProfile = data
        document.dispatchEvent(userProfileLoadedEvent)
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



function saveUrl(){
    localStorage.setItem('preLoginUrl', window.location.href)
}




function useUserData(userProf){
    if(userProf.firstName){
        try{
            document.getElementById('tervitus').innerHTML = document.getElementById('tervitus').innerHTML + ', ' + userProf.firstName
        }catch(err){
            null
        }
    }else{
        try{
            document.getElementById('tervitus').innerHTML = document.getElementById('tervitus').innerHTML + ', ' + userProf.email
        }catch(err){
            null
        }
    }
    try{
        buyerCheck()
    }catch(err){
        null
    }
    try{
        loadMyFavFilms()
    }catch(err){
        // console.log(err)
        null
    }
    try{
        fetchMyPasses()
    }catch(err){
        null
    }
}

function logOut() {
    localStorage.removeItem('BNFF_U_ACCESS_TOKEN')
    localStorage.removeItem('ID_TOKEN')

    if (localStorage.getItem('REFRESH_TOKEN')){
        localStorage.removeItem('REFRESH_TOKEN')
    }
    localStorage.removeItem('preLoginUrl')
    localStorage.removeItem('USER_PROFILE')

    // console.log('LOGITUD VÄLJA')
    location.reload()

    // window.open(location.origin, '_self')
}

