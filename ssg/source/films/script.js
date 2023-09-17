const nslButton = document.getElementsByClassName('notshortlisted')[0]
const slButton = document.getElementsByClassName('isshortlisted')[0]
const currentFilmId = parseInt(document.getElementById('film_id').value)

if (getUser()) {
    const userFilms = getUser().My?.films?.map(f=>f.id) || []
    const currentFilmIsFavourite = userFilms.includes(currentFilmId)

    console.log(`currentFilmIsFavourite: ${currentFilmIsFavourite}, userFilms: ${userFilms}, currentFilmId: ${currentFilmId}`)
    if (currentFilmIsFavourite) {
        nslButton.style.display = 'none'
        slButton.style.display = ''
    } else {
        nslButton.style.display = ''
        slButton.style.display = 'none'
    }

    nslButton.addEventListener('click', e => {
        toggleFavouriteFilm('set')
    })
    slButton.addEventListener('click', e => {
        toggleFavouriteFilm('unset')
    })
}

function toggleFavouriteFilm(action) {
    const pushedButton = action === 'set' ? nslButton : slButton
    const pushedButtonInnerHTMLBeforeClick = pushedButton.innerHTML

    pushedButton.innerHTML = `<i class="fa fa-spinner fa-spin"></i>`
    pushedButton.disabled = true

    var myHeaders = new Headers()
    myHeaders.append("Authorization", 'Bearer ' + localStorage.getItem('ID_TOKEN'))

    var requestOptions = {
        method: 'PUT',
        headers: myHeaders,
        redirect: 'follow',
        body: currentFilmId
    };

    // `${strapiDomain}/users/favorites/`
    fetch(`${huntAuthDomain}/api/my/film`, requestOptions).then(function (response) {
        if (response.ok) {
            return response.json()
        }
        return Promise.reject(response)
    }).then(function (data) {
        if (action === 'set') {
            nslButton.style.display = 'none'
            slButton.style.display = ''
        } else {
            nslButton.style.display = ''
            slButton.style.display = 'none'
        }
        pushedButton.innerHTML = pushedButtonInnerHTMLBeforeClick
        pushedButton.disabled = false
        const webUser = getUser()
        webUser.My = data
        setUser(webUser)
    }).catch(function (error) {
        console.warn(error);
        pushedButton.innerHTML = 'Tekkis viga!'
    });
}
