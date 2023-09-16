function toggleFavouriteFilm(action, favId) {
    console.log('toggleFavouriteFilm ', action, favId)
    const setButton = document.getElementById(`${favId}_not_shortlisted`)
    const unsetButton = document.getElementById(`${favId}_is_shortlisted`)

    const pushedButton = action === 'set' ? setButton : unsetButton
    const pushedButtonInnerHTMLBeforeClick = pushedButton.innerHTML

    pushedButton.innerHTML = `<i class="fa fa-spinner fa-spin"></i>`
    pushedButton.disable = true

    var myHeaders = new Headers();
    myHeaders.append("Authorization", 'Bearer ' + localStorage.getItem('ID_TOKEN'));

    var requestOptions = {
        method: 'PUT',
        headers: myHeaders,
        redirect: 'follow',
        body: favId
    };

    // `${strapiDomain}/users/favorites/`
    fetch(`${huntAuthDomain}/api/my/film`, requestOptions).then(function (response) {
        if (response.ok) {
            return response.json();
        }
        return Promise.reject(response);
    }).then(function (data) {
        console.log('toggle favorite film', favId, data)
        if (data.status === 'ok') {
            if (action === 'set') {
                setButton.style.display = 'none'
                unsetButton.style.display = ''
            } else {
                setButton.style.display = ''
                unsetButton.style.display = 'none'
            }
            pushedButton.innerHTML = pushedButtonInnerHTMLBeforeClick
        }
    }).catch(function (error) {
        console.warn(error);
        pushedButton.innerHTML = 'Tekkis viga!'
    });
}
