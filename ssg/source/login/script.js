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
//     // myHeaders.append("Authorization", "Bearer ");

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

