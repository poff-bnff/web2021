function toggleFavouriteScreening(action, favId) {
    const setButton = document.getElementById(`s_${favId}_is_not_fav`)
    const unsetButton = document.getElementById(`s_${favId}_is_fav`)

    const pushedButton = action === 'set' ? setButton : unsetButton
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
        if (action === 'set') {
            setButton.style.display = 'none'
            unsetButton.style.display = ''
        } else {
            setButton.style.display = ''
            unsetButton.style.display = 'none'
        }
        pushedButton.innerHTML = pushedButtonInnerHTMLBeforeClick
        pushedButton.disabled = false
        const webUser = getUser()
        webUser.My = data
        setUser(webUser)
        reloadUserScreenings()
    }).catch(function (error) {
        console.warn(error);
        pushedButton.innerHTML = 'Tekkis viga!'
    });
}

function toggleFavouriteFilm(action, favId) {
    const setButton = document.getElementById(`f_${favId}_is_not_fav`)
    const unsetButton = document.getElementById(`f_${favId}_is_fav`)

    const pushedButton = action === 'set' ? setButton : unsetButton
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

    fetch(`${huntAuthDomain}/api/my/film`, requestOptions).then(function (response) {
        if (response.ok) {
            return response.json();
        }
        return Promise.reject(response);
    }).then(function (data) {
        if (action === 'set') {
            setButton.style.display = 'none'
            unsetButton.style.display = ''
        } else {
            setButton.style.display = ''
            unsetButton.style.display = 'none'
        }
        pushedButton.innerHTML = pushedButtonInnerHTMLBeforeClick
        pushedButton.disabled = false
        const webUser = getUser()
        webUser.My = data
        setUser(webUser)
        reloadUserFilms()
    }).catch(function (error) {
        console.warn(error);
        pushedButton.innerHTML = 'Tekkis viga!'
    });
}


function toggleMyCalButtons(myCalEvents) {
    // console.log(myCalEvents)

    var isMyEventBtns = document.getElementsByClassName('remove_from_calendar_button')


    for (i = 0; i < isMyEventBtns.length; i++) {
        var eventId = isMyEventBtns[i].id.split('_')[0]

        if (myCalEvents.includes(eventId)) {
            // console.log(2)
            document.getElementById(eventId + '_inMyCalendar').style.display = ''
            try {
                document.getElementById(eventId).style.display = ''
            }
            catch (err) { null }
        }
        else {
            try {
                document.getElementById(eventId + '_notInMyCalendar').style.display = ''
            }
            catch (err) { null }
        }
    }
}

function calendarfile(id) {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/calendar;charset=utf-8,' + document.getElementById('cal_' + id).innerText);
    // data:text/calendar;charset=utf-8
    element.setAttribute('download', 'IndustryEvent_' + id + '.ics');

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}

function addToMyCal(eventId) {
    calendarfile(eventId)
    // console.log('eventId ', eventId)




    // var myHeaders = new Headers();
    // myHeaders.append("Authorization", 'Bearer ' + localStorage.getItem('ID_TOKEN'));

    var requestOptions = {
        method: 'PUT',
        // headers: myHeaders,
        redirect: 'follow',
        headers: {
            Authorization: 'Bearer ' + localStorage.getItem('ID_TOKEN'),
        },

    };

    // console.log(requestOptions)

    fetch('https://api.poff.ee/favourite/' + 'event_' + eventId, requestOptions).then(function (response) {
        if (response.ok) {
            return response.json();
        }
        return Promise.reject(response);
    }).then(function (data) {
        if (data.ok) {
            document.getElementById(eventId + '_notInMyCalendar').style.display = 'none'
            document.getElementById(eventId + '_inMyCalendar').style.display = ''
        }
    }).catch(function (error) {
        console.warn(error);
    });
}

function removeEvent(eventId) {
    // console.log('removeEvent eventId ', eventId)

    var myHeaders = new Headers();

    myHeaders.append("Authorization", 'Bearer ' + localStorage.getItem('ID_TOKEN'));

    var requestOptions = {
        method: 'DELETE',
        headers: myHeaders,
        redirect: 'follow'
    };


    fetch('https://api.poff.ee/favourite/' + 'event_' + eventId, requestOptions).then(function (response) {
        if (response.ok) {
            return response.json();
        }
        return Promise.reject(response);
    }).then(function (data) {
        // console.log(data)
        if (data.ok) {
            try {
                // console.log(2)
                // console.log(eventId)
                // console.log(document.getElementById(eventId + '_notInMyCalendar'))
                document.getElementById(eventId + '_notInMyCalendar').style.display = ''
                document.getElementById(eventId + '_inMyCalendar').style.display = 'none'
            }
            catch (err) {
                null
            }
            if (!document.getElementById(eventId + '_notInMyCalendar')) {
                try {
                    document.getElementById(eventId.split('_')[0]).style.display = 'none'
                }
                catch (err) {
                    null
                }
            }
        }
    }).catch(function (error) {
        console.warn(error);
    });
}


function changeToRemove(eventId) {
    document.getElementById(eventId).innerHTML = 'remove'
    document.getElementById(eventId).style.color = 'red'
    // document.getElementById(eventId).setAttribute("onclick", "javascript: sayHello(this.id);return false")


}

function revertRemove(eventId) {
    document.getElementById(eventId).innerHTML = 'In my calendar'
    document.getElementById(eventId).style.color = 'rgba(255, 255, 255, 0.96)'

}
