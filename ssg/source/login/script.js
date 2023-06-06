checkLogin()
async function checkLogin() {
    // Login detected
    console.log('JUHHUUU!');
    if (window.location.search) {
        console.log('meh', window.location.search, typeof window.location.search);
        const queryString = window.location.search
        const queryParams = new URLSearchParams(queryString);
        if (queryParams.get('t')) {
            console.log(queryParams.get('t'), 'blaaaaaa');
            localStorage.setItem('BNFF_U_ACCESS_TOKEN', queryParams.get('t'))

            const userProfile = await userMe()
            console.log('JUUUUSER', typeof userProfile);
        }
    }
}

// async function userMe() {
//     // var myHeaders = new Headers();
//     // myHeaders.append("Authorization", "Bearer .eyJlbWFpbCI6InBlbm5hc3RlMDRAZ21haWwuY29tIiwiY29uZmlybWVkIjp0cnVlLCJwcm9maWxlIjp0cnVlLCJmaXJzdE5hbWUiOiJNYXJ0aW4iLCJsYXN0TmFtZSI6IlBlbm5hc3RlIiwiaWF0IjoxNjg0NDI4MjMwLCJuYmYiOjE2ODQ0MjgyMzAsImV4cCI6MTY4NTYzNzgzMCwic3ViIjoiMTQ1MDAifQ.fJhMCKXJMWEtwmDBOSQi6PdBlzZiO5fhRr2UqWmRGyY");

//     // var requestOptions = {
//     //     method: 'GET',
//     //     headers: myHeaders,
//     //     redirect: 'follow'
//     // };

//     const user = fetch("http://localhost:3000/api/me", { headers: { Authorization: `Bearer ${localStorage.getItem('BNFF_U_ACCESS_TOKEN')}` } })
//     // return user.result

//     fetch(`http://localhost:3000/api/me`, { headers: { Authorization: `Bearer ${localStorage.getItem('BNFF_U_ACCESS_TOKEN')}` } })
//     .then(function (response) {
//         if (response.ok) {
//             return response.json();
//         }
//         return Promise.reject(response);
//     }).then(async function (data) {
//         userProfile = data
//         document.dispatchEvent(userProfileLoadedEvent)
//         // console.log("cognitos olev profiil:")
//         // console.log(userProfile);

//     }).catch(function (error) {
//         console.warn(error);
//     });


// }

const redirectToPreLoginUrl = (userProfile) => {
    console.log('redirectToPreLoginUrl', userProfile);
    const preLoginUrl = localStorage.getItem('preLoginUrl')
    const currentlang = getCurrentLang()

    if (!industryPage && !userProfile.profileFilled) {
        window.open(`${pageURL}/${currentlang ? currentlang : ''}userprofile`, '_self')
        return
    }
    localStorage.removeItem('preLoginUrl')
    preLoginUrl ? window.open(preLoginUrl, '_self') : window.open(pageURL, '_self')
}
