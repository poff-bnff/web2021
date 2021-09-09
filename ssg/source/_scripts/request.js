async function createRequest(requestCase, requestBody) {
    const request = { options: {} }
    const lang = localStorage.getItem('lang')

    switch (requestCase) {
        case ('social'):
            const { provider, access_token } = getAccessTokenWithProvider()
            request.route = `/auth/${provider}/callback?${access_token}`
            request.options.method = 'GET'
            break;
        case ('local'):
            const authenticationData = {
                identifier: document.getElementById("loginUsername").value,
                password: document.getElementById("loginPassword").value
            }
            request.route = `/auth/local/${lang}`
            request.options.method = 'POST'
            request.options.headers = {
                "Content-Type": "application/json"
            }
            request.body = JSON.stringify(authenticationData)
            break;
        case ('profile'):
            request.route = '/users/me'
            request.options.method = 'GET'
            request.options.headers = {
                Authorization: 'Bearer ' + localStorage.getItem('BNFF_U_ACCESS_TOKEN'),
            }
            break;
        case ('profPicture'):

            formData = new FormData()
            formData.append('files', profile_pic_to_send)

            request.route = '/upload/'
            request.options.method = 'POST'
            request.options.body = formData
            break;
        case ('register'):
            request.route = `/auth/local/register/${lang}`
            request.options.method = 'POST'
            request.options.headers = {
                "Content-Type": "application/json"
            }
            request.options.body = JSON.stringify(requestBody)
            break;
    }
    return request
}

async function requestFromStrapi(request) {
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


function handleRegResponse(response) {
    return response
}