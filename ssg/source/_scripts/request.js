function createRequest (requestCase, requestBody) {
    const request = {}
    const lang = localStorage.getItem('lang')

    switch (requestCase) {
        case ('social'):
            const { provider, access_token } = getAccessTokenWithProvider()
            request.route = `/auth/${provider}/callback?${access_token}`
            request.method = 'GET'
            break;
        case ('local'):
            const authenticationData = {
                identifier: document.getElementById("loginUsername").value,
                password: document.getElementById("loginPassword").value
            }
            request.route = `/auth/local/${lang}`
            request.method = 'POST'
            request.headers = {
                "Content-Type": "application/json"
            }
            request.body = JSON.stringify(authenticationData)
            break;
        case ('profile'):
            request.route = '/users/me'
            request.method = 'GET'
            request.headers = {
                Authorization: 'Bearer ' + localStorage.getItem('BNFF_U_ACCESS_TOKEN'),
            }
            break;
        case ('profPicture'):

            formData = new FormData()
            formData.append('files', profile_pic_to_send)

            request.route = '/upload/'
            request.method = 'POST'
            request.body = formData
            break;
        case ('register'):
            request.route = `/auth/local/register/${lang}`
            request.method = 'POST'
            request.headers = {
                "Content-Type": "application/json"
            }
            request.body = JSON.stringify(requestBody)
            break;
    }
    return request
}

const requestFromStrapi = async requestOptions => {
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
        document.getElementById('failedToFetch').style.display = ''
        cleanInputFields()
        return
    }
}


const handleRegResponse = response => {
return response
}