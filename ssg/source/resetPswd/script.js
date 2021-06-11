const resetPswd = () => {

    const qs = window.location.search;
    const urlParams = new URLSearchParams(qs)
    const code = urlParams.get('code')

    const headers = {
        "Content-Type" : 'application/json'
    }

    const data = {
        password: psw.value,
        passwordConfirmation: psw2.value,
        code: code
    }

    var requestOptions = {
        headers: headers,
        method: 'POST',
        body: JSON.stringify(data),
        redirect: 'follow'
    }

    console.log(requestOptions);
    fetch(`${strapiDomain}/auth/reset-password`, requestOptions)
}