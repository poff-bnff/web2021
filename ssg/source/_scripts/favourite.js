const userFilms = []
const userScreenings = []
const userCourseEvents = []

/*
 * Reload user's favourites from the localStorage
 * modify the global variables and return them, too.
 */

/* Films */
const reloadUserFilms = () => {
    if (!isUserTokenValid()) {
        return null
    }
    const My = getUser().My || {'films': []}
    const myFilms = My.films || []
    const myFilmIDs = myFilms.map(f => f.id)
    userFilms.splice(0, userFilms.length, ...myFilmIDs)
    return userFilms
}

/* Screenings */
const reloadUserScreenings = () => {
    if (!isUserTokenValid()) {
        return null
    }
    const My = getUser().My || {'screenings': []}
    const myScreenings = My.screenings || []
    const myScreeningIDs = myScreenings.map(f => f.id)
    userScreenings.splice(0, userScreenings.length, ...myScreeningIDs)
    return userScreenings
}

/* Course events */
const reloadUserCourseEvents = () => {
    if (!isUserTokenValid()) {
        return null
    }
    const My = getUser().My || {'course_events': []}
    const myCourseEvents = My.course_events || []
    const myCourseEventIDs = myCourseEvents.map(f => f.id)
    userCourseEvents.splice(0, userCourseEvents.length, ...myCourseEventIDs)
    return userCourseEvents
}

/*
 * Toggle user's favourites on the server
 * and renew the localStorage
 * and reload user's favourites.
 */

/* Films */
const toggleFavouriteFilm = (action, favId) => {
    const setButton = document.getElementById(`f_${favId}_is_not_fav`)
    const unsetButton = document.getElementById(`f_${favId}_is_fav`)

    const pushedButton = action === 'set' ? setButton : unsetButton
    // console.log({action, favId, setButton, unsetButton, pushedButton})
    const pushedButtonInnerHTMLBeforeClick = pushedButton.innerHTML

    pushedButton.innerHTML = `<i class="fa fa-spinner fa-spin"></i>`
    pushedButton.disabled = true

    var myHeaders = new Headers();
    myHeaders.append("Authorization", 'Bearer ' + localStorage.getItem('ID_TOKEN'));

    var requestOptions = {
        method: 'PUT',
        headers: myHeaders,
        redirect: 'follow',
        body: favId
    }

    fetch(`${huntAuthDomain}/api/my/film`, requestOptions).then(function (response) {
        if (response.ok) {
            return response.json()
        }
        return Promise.reject(response)
    }).then(function (data) {
        // console.log({
        //     'returned': data,
        //     'getUser()': getUser().My,
        //     'userFilms': userFilms})
        if (action === 'set') {
            setButton.style.display = 'none'
            unsetButton.style.display = ''
        } else {
            setButton.style.display = ''
            unsetButton.style.display = 'none'
        }
        pushedButton.innerHTML = pushedButtonInnerHTMLBeforeClick
        pushedButton.disabled = false
        setMy(data)
        reloadUserFilms()
        // console.log('reloadUserFilms', reloadUserFilms())
    }).catch(function (error) {
        console.warn(error)
        pushedButton.innerHTML = 'Tekkis viga!'
    })
}

/* Screenings */
const toggleFavouriteScreening = (action, favId) => {
    const setButton = document.getElementById(`s_${favId}_is_not_fav`)
    const unsetButton = document.getElementById(`s_${favId}_is_fav`)

    const pushedButton = action === 'set' ? setButton : unsetButton
    // console.log({action, favId, setButton, unsetButton, pushedButton})
    const pushedButtonInnerHTMLBeforeClick = pushedButton.innerHTML

    pushedButton.innerHTML = `<i class="fa fa-spinner fa-spin"></i>`
    pushedButton.disabled = true

    var myHeaders = new Headers();
    myHeaders.append("Authorization", 'Bearer ' + localStorage.getItem('ID_TOKEN'));

    var requestOptions = {
        method: 'PUT',
        headers: myHeaders,
        redirect: 'follow',
        body: favId
    };

    fetch(`${huntAuthDomain}/api/my/screening`, requestOptions).then(function (response) {
        if (response.ok) {
            return response.json();
        }
        return Promise.reject(response);
    }).then(function (data) {
        // console.log({
        //     'returned': data,
        //     'getUser()': getUser().My,
        //     'userScreenings': userScreenings
        // })
        if (action === 'set') {
            setButton.style.display = 'none'
            unsetButton.style.display = ''
        } else {
            setButton.style.display = ''
            unsetButton.style.display = 'none'
        }
        pushedButton.innerHTML = pushedButtonInnerHTMLBeforeClick
        pushedButton.disabled = false
        setMy(data)
        reloadUserScreenings()
        // console.log('reloadUserScreenings', reloadUserScreenings())
    }).catch(function (error) {
        console.warn(error)
        pushedButton.innerHTML = 'Tekkis viga!'
    })
}

/*
 * Set up favourite buttons.
 */

/* Films */
const setupFilmFavoriteButtons = () => {
    try {

    } catch (error) {
        console.log(error)
    }
}

/* Screenings */
const setupScreeningFavoriteButtons = () => {
    try {
        const nslButtons = Array.from(document.getElementsByClassName('notmyscreening'))
        const slButtons = Array.from(document.getElementsByClassName('ismyscreening'))
        const currentScreeningIDs = Array.from(document.getElementById('screening_ids').value.split(','))
            .map(e => parseInt(e))

        if (getUser()) {
            reloadUserScreenings()

            // unhide all fav buttons for currently favorited screenings
            currentScreeningIDs.filter(id => userScreenings.includes(id))
                .forEach(id => {
                    document.getElementById(`s_${id}_is_fav`).style.display = ''
                    document.getElementById(`s_${id}_is_not_fav`).style.display = 'none'
                })

            // unhide all no-fav buttons for currently unfavorited screenings
            currentScreeningIDs.filter(id => !userScreenings.includes(id))
                .forEach(id => {
                    document.getElementById(`s_${id}_is_fav`).style.display = 'none'
                    document.getElementById(`s_${id}_is_not_fav`).style.display = ''
                })

            // add event listeners to all fav buttons
            nslButtons.forEach(b => b.addEventListener('click', e => {
                let scrId = parseInt(b.id.split('_')[1])
                toggleFavouriteScreening('set', scrId)
            }))
            slButtons.forEach(b => b.addEventListener('click', e => {
                let scrId = parseInt(b.id.split('_')[1])
                toggleFavouriteScreening('unset', scrId)
            }))
        }
    } catch (error) {
        console.log(error)
    }
}
