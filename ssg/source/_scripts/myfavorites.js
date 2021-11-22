function loadMyFavFilms() {
    // console.log("FAVO: oled sisse loginud")
    try {
        var allLoggedOutStatusMessages = document.querySelectorAll('[id=loggedOutFavouriteStatus]')
        for (let index = 0; index < allLoggedOutStatusMessages.length; index++) {
            const element = allLoggedOutStatusMessages[index];
            element.style.display = 'none'
        }
    } catch (error) {
        null
    }
    try {
        toggleFavButtons(userProfile.my_events, 'myEvents')
        toggleAll()

    } catch (error) {
        null
    }
    try {
        toggleFavButtons(userProfile.my_films, 'myFilms')
        toggleAll()

    } catch (error) {
        null
    }
    try {
        toggleMyCalButtons(userProfile.myCal)
    } catch (error) {
        null
    } try {
        toggleFavButtons(userProfile.my_screenings, 'myScreenings')

        // Käivitab kaartide kuvamise kontrolli vastavalt filtritele ja lemmikute olemasolul ka vastavalt nendele
        toggleAll()

    } catch (error) {
        null
    }
}

function modifyFavourites(type, favId) {
    // console.log('removeScreening ', favId)
    let pushedButton
    let oppositeButton
    let dataArrayName
    if (type === 'addScreening') {
        dataArrayName = 'my_screenings'
        pushedButton = document.getElementById(`${favId}_not_savedscreening`)
        oppositeButton = document.getElementById(`${favId}_is_savedscreening`)
    } else if (type === 'rmScreening') {
        dataArrayName = 'my_screenings'
        pushedButton = document.getElementById(`${favId}_is_savedscreening`)
        oppositeButton = document.getElementById(`${favId}_not_savedscreening`)
    } else if (type === 'addMyFilm') {
        dataArrayName = 'my_films'
        pushedButton = document.getElementById(`${favId}_not_shortlisted`)
        oppositeButton = document.getElementById(`${favId}_is_shortlisted`)
    } else if (type === 'rmMyFilm') {
        dataArrayName = 'my_films'
        pushedButton = document.getElementById(`${favId}_is_shortlisted`)
        oppositeButton = document.getElementById(`${favId}_not_shortlisted`)
    }else if (type === 'addMyEvent') {
        dataArrayName = 'my_events'
        pushedButton = document.getElementById(`${favId}_not_savedevent`)
        oppositeButton = document.getElementById(`${favId}_is_savedevent`)
    } else if (type === 'rmMyEvent') {
        dataArrayName = 'my_events'
        pushedButton = document.getElementById(`${favId}_is_savedevent`)
        oppositeButton = document.getElementById(`${favId}_not_savedevent`)
    }
    let pushedButtonInnerHTMLBeforeClick = pushedButton.innerHTML
    pushedButton.innerHTML = `<i class="fa fa-spinner fa-spin"></i>`
    pushedButton.disable = true

    var myHeaders = new Headers();

    myHeaders.append("Authorization", 'Bearer ' + localStorage.getItem('BNFF_U_ACCESS_TOKEN'));

    let queryInfo = {
        type: type,
        id: favId
    }

    var requestOptions = {
        method: 'PUT',
        headers: myHeaders,
        redirect: 'follow',
        body: JSON.stringify(queryInfo)
    };


    fetch(`${strapiDomain}/users/favorites/`, requestOptions).then(function (response) {
        if (response.ok) {
            return response.json();
        }
        return Promise.reject(response);
    }).then(function (data) {
        console.log(data)
        if (data[dataArrayName]) {
            try {
                userProfile[dataArrayName] = data[dataArrayName]
                pushedButton.disable = false
                pushedButton.style.display = 'none'
                pushedButton.innerHTML = pushedButtonInnerHTMLBeforeClick
                if (oppositeButton) {
                    oppositeButton.style.display = ''
                }
                try {
                    toggleAll()
                } catch (err) { null }
            }
            catch (err) {
                console.log(err);
            }
        }
    }).catch(function (error) {
        console.warn(error);
        pushedButton.innerHTML = 'Tekkis viga!'
    });
}

function getUniqueFavoritesArray(favoritesArray, type, objectName) {
    var prepareIds = favoritesArray
        .filter(favoriteList => favoriteList.type === type)
        .map(myFavorites => myFavorites[objectName])
        .flat()
        .map(obj => obj.id.toString())
    var uniqueIds = [...new Set(prepareIds)]
    return uniqueIds
}

function toggleFavButtons(favoriteCollection, type) {
    if (type === 'myFilms') {
        var savedIds = getUniqueFavoritesArray(favoriteCollection, 'favorite', 'cassettes')
        var isSavedButtons = document.getElementsByClassName('isshortlisted')
        var notSavedButtons = document.getElementsByClassName('notshortlisted')
    } else if (type === 'myScreenings') {
        var savedIds = getUniqueFavoritesArray(favoriteCollection, 'schedule', 'screenings')
        var isSavedButtons = document.getElementsByClassName('issavedscreening')
        var notSavedButtons = document.getElementsByClassName('notsavedscreening')
    } else if (type === 'myEvents') {
        var savedIds = getUniqueFavoritesArray(favoriteCollection, 'schedule', 'industry_events')
        var isSavedButtons = document.getElementsByClassName('issavedevent')
        var notSavedButtons = document.getElementsByClassName('notsavedevent')
    }

    for (i = 0; i < isSavedButtons.length; i++) {
        var film_id = isSavedButtons[i].id.split('_')[0]
        if (savedIds.includes(film_id)) {
            isSavedButtons[i].style.display = ''
        }
        else {
            isSavedButtons[i].style.display = 'none'
        }
    }


    for (i = 0; i < notSavedButtons.length; i++) {
        var film_id = notSavedButtons[i].id.split('_')[0]
        if (savedIds.includes(film_id)) {
            notSavedButtons[i].style.display = 'none'
        }
        else {
            notSavedButtons[i].style.display = ''
        }
    }

}
