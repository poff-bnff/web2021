const resetPswd = async () => {
    let resetPasswordButton = document.getElementById('signUpButton')
    let resetPasswordButtonInnerHTMLBackup = signUpButton.innerHTML
    resetPasswordButton.disable = true
    resetPasswordButton.innerHTML = '<i class="fa fa-spinner fa-spin"></i>'


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

    let response = await fetch(`${strapiDomain}/auth/reset-password`, requestOptions)
    response = await response.json()

    if (response.resetSuccess) {
        grid_resetPswd.style.display = 'none'
        backToLoginBtn.style.display = ''
        pswResetSuccessText.style.display = ''
    }
    resetPasswordButton.disable = false
    resetPasswordButton.innerHTML = resetPasswordButtonInnerHTMLBackup
}
