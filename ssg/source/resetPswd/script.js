const resetPswd = () => {

    const qs = window.location.search;
    const urlParams = new URLSearchParams(qs)
    const code = urlParams.get('code')


    const body = {
        password: psw.value,
        passwordConfirmation: psw2.value,
        code: code
    }

    console.log(body);

    var requestOptions = {
        method: 'POST',
        body: JSON.stringify(body)
    }

    console.log(requestOptions);
    fetch(`${strapiDomain}/auth/reset-password`, requestOptions)
}