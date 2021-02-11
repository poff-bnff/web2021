function loadMyFavFilms() {
    // console.log("FAVO: oled sisse loginud")
    try {
        document.getElementById('loggedOutFavouriteStatus').style.display = 'none'
    } catch (error) {
        null
    }
    try {
        toggleFavButtons(userProfile.shortlist.map(function (item) { return item.cassette_id }))
    } catch (error) {
        null
    }
    try {
        toggleMyCalButtons(userProfile.myCal)
    } catch (error) {
        null
    } try{
        toggleSavedScreeningsButtons(userProfile.savedscreenings)

        // Käivitab kaartide kuvamise kontrolli vastavalt filtritele ja lemmikute olemasolul ka vastavalt nendele
        toggleAll()

    } catch (error) {
        null
    }




}

function toggleFavButtons(shortlist_array) {
    // console.log('toggleFavButtons')

    var isshortlisted_buttons = document.getElementsByClassName('isshortlisted')
    // console.log(isshortlisted_buttons)
    // console.log(shortlist_array)

    for (i = 0; i < isshortlisted_buttons.length; i++) {
        var film_id = isshortlisted_buttons[i].id.split('_')[0]
        // console.log(film_id, shortlist_array.includes(film_id));
        if (shortlist_array.includes(film_id)) {
            isshortlisted_buttons[i].style.display = 'block'
            document.getElementById(film_id + '_cassette_id').style.display = 'block'

        }
        else {
            isshortlisted_buttons[i].style.display = 'none'
        }
    }

    var notshortlisted_buttons = document.getElementsByClassName('notshortlisted')
    // console.log(notshortlisted_buttons);

    for (i = 0; i < notshortlisted_buttons.length; i++) {
        var film_id = notshortlisted_buttons[i].id.split('_')[0]
        if (shortlist_array.includes(film_id)) {
            notshortlisted_buttons[i].style.display = 'none'
        }
        else {
            notshortlisted_buttons[i].style.display = 'block'
        }
    }

}

function toggleSavedScreeningsButtons(savedScreenings) {
    // console.log('toggleSavedScreeningsButtons')

    var savedScreeningIds = []
    for (j = 0; j < savedScreenings.length; j++) {
        savedScreeningIds.push(savedScreenings[j].screeningId)
    }

    // console.log('savedScreeningIds ', savedScreeningIds)
    // console.log('toggleSavedScreeningsButtons')
    // console.log('savedScreenings ', savedScreenings)

    var isSavedScreening_buttons = document.getElementsByClassName('issavedscreening')
    // console.log(isSavedScreening_buttons)

    for (i = 0; i < isSavedScreening_buttons.length; i++) {
        var screening_id = isSavedScreening_buttons[i].id.split('_')[0]
        if (savedScreeningIds.includes(screening_id)) {
            isSavedScreening_buttons[i].style.display = 'block'
            // try{
            // document.getElementById(screening_id + '_screening_id').style.display = 'block'
            // }
            // catch(err){null}
        }
        else {
            try {
                isSavedScreening_buttons[i].style.display = 'none'
            } catch (error) {
                null
            }
        }
    }

    var notSavedScreening_buttons = document.getElementsByClassName('notsavedscreening')
    // console.log(notshortlisted_buttons);

    for (i = 0; i < notSavedScreening_buttons.length; i++) {
        var screening_id = notSavedScreening_buttons[i].id.split('_')[0]
        if (savedScreeningIds.includes(screening_id)) {
            notSavedScreening_buttons[i].style.display = 'none'
        }
        else {
            notSavedScreening_buttons[i].style.display = 'block'
        }
    }


}


function toggleMyCalButtons (myCalEvents){
    // console.log(myCalEvents)

    var isMyEventBtns = document.getElementsByClassName('remove_from_calendar_button')


    for (i=0; i<isMyEventBtns.length; i++){
        var eventId = isMyEventBtns[i].id.split('_')[0]

        if (myCalEvents.includes(eventId)){
            // console.log(2)
            document.getElementById(eventId + '_inMyCalendar').style.display = ''
            try {
            document.getElementById(eventId).style.display = ''
            }
            catch(err){null}
        }
        else {
            try{
            document.getElementById(eventId + '_notInMyCalendar').style.display = ''
            }
            catch(err){null}
        }
    }
}


function saveFilmAsFavourite(movieId) {
    // console.log('saveFilmAsFavourite')

    // var addBtnfilmCard = document.getElementById('nupp')
    // console.log(addBtnfilmCard);

    if (window.location.href === location.origin + '/filmid') {
        // addBtnfilmCard = document.getElementById(movieId + 'nupp')
    }

    if (true) {

        var myHeaders = new Headers();
        myHeaders.append("Authorization", 'Bearer ' + localStorage.getItem('ACCESS_TOKEN'));

        var requestOptions = {
            method: 'PUT',
            headers: myHeaders,
            redirect: 'follow'
        };

        fetch('https://api.poff.ee/favourite/' + movieId, requestOptions).then(function (response) {
            if (response.ok) {
                return response.json();
            }
            return Promise.reject(response);
        }).then(function (data) {
            if (data.ok) {
                document.getElementById(movieId + '_not_shortlisted').style.display = 'none'
                document.getElementById(movieId + '_is_shortlisted').style.display = 'block'
            }
        }).catch(function (error) {
            console.warn(error);
        });
    }
}

function saveScreeningAsFavourite(screeningId, screeningTitle, screeningTime) {
    // console.log('screeningId ', screeningId)
    // console.log('screeningTitle ', screeningTitle)
    // console.log('screeningTime ', screeningTime)

    var screening = {
        id: screeningId,
        screeningTitle: screeningTitle,
        screeningTime: screeningTime
    }


    // var myHeaders = new Headers();
    // myHeaders.append("Authorization", 'Bearer ' + localStorage.getItem('ACCESS_TOKEN'));

    var requestOptions = {
        method: 'PUT',
        // headers: myHeaders,
        redirect: 'follow',
        headers: {
            Authorization: 'Bearer ' + localStorage.getItem('ACCESS_TOKEN'),
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(screening)

    };

    // console.log(requestOptions)

    fetch('https://api.poff.ee/favourite/' + screeningId, requestOptions).then(function (response) {
        if (response.ok) {
            return response.json();
        }
        return Promise.reject(response);
    }).then(function (data) {
        if (data.ok) {
            document.getElementById(screeningId + '_not_savedscreening').style.display = 'none'
            document.getElementById(screeningId + '_is_savedscreening').style.display = 'block'
        }
    }).catch(function (error) {
        console.warn(error);
    });
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
        // myHeaders.append("Authorization", 'Bearer ' + localStorage.getItem('ACCESS_TOKEN'));

        var requestOptions = {
            method: 'PUT',
            // headers: myHeaders,
            redirect: 'follow',
            headers: {
                Authorization : 'Bearer ' + localStorage.getItem('ACCESS_TOKEN'),
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


function removeFilm(movieId) {
    var myHeaders = new Headers();

    myHeaders.append("Authorization", 'Bearer ' + localStorage.getItem('ACCESS_TOKEN'));

    var requestOptions = {
        method: 'DELETE',
        headers: myHeaders,
        redirect: 'follow'
    };


    fetch('https://api.poff.ee/favourite/' + movieId, requestOptions).then(function (response) {
        if (response.ok) {
            return response.json();
        }
        return Promise.reject(response);
    }).then(function (data) {
        // console.log(data)
        if (data.ok) {
            try {
                document.getElementById(movieId + '_not_shortlisted').style.display = 'block'
                document.getElementById(movieId + '_is_shortlisted').style.display = 'none'
            }
            catch (err) {
                null
            }
            try {
                document.getElementById(movieId + '_cassette_id').style.display = 'none'
            }
            catch (err) {
                null
            }
        }
    }).catch(function (error) {
        console.warn(error);
    });
}

function removeScreening(screeningId) {
    // console.log('removeScreening ', screeningId)

    var myHeaders = new Headers();

    myHeaders.append("Authorization", 'Bearer ' + localStorage.getItem('ACCESS_TOKEN'));

    var requestOptions = {
        method: 'DELETE',
        headers: myHeaders,
        redirect: 'follow'
    };


    fetch('https://api.poff.ee/favourite/' + 'screening_' + screeningId, requestOptions).then(function (response) {
        if (response.ok) {
            return response.json();
        }
        return Promise.reject(response);
    }).then(function (data) {
        // console.log(data)
        if (data.ok) {
            try {
                // console.log(screeningId + '_is_savedscreening')
                document.getElementById(screeningId + '_is_savedscreening').style.display = 'none'
                document.getElementById(screeningId + '_not_savedscreening').style.display = 'block'
            }
            catch (err) {
                null
            }
            try {
                document.getElementById(screeningId).style.display = 'none'
            }
            catch (err) {
                null
            }
        }
    }).catch(function (error) {
        console.warn(error);
    });
}


function removeEvent(eventId) {
    // console.log('removeEvent eventId ', eventId)

    var myHeaders = new Headers();

    myHeaders.append("Authorization", 'Bearer ' + localStorage.getItem('ACCESS_TOKEN'));

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
            if (!document.getElementById(eventId + '_notInMyCalendar')){
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


function changeToRemove(eventId){
    document.getElementById(eventId).innerHTML = 'remove'
    document.getElementById(eventId).style.color = 'red'
    // document.getElementById(eventId).setAttribute("onclick", "javascript: sayHello(this.id);return false")


}

function revertRemove(eventId){
    document.getElementById(eventId).innerHTML = 'In my calendar'
    document.getElementById(eventId).style.color = 'rgba(255, 255, 255, 0.96)'

}
