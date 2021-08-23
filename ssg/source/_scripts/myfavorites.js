
function modifyFavourites(type, favId) {
    // console.log('removeScreening ', favId)
    let pushedButton
    let oppositeButton
    if (type === 'addScreening') {
        pushedButton = document.getElementById(`${favId}_not_savedscreening`)
        oppositeButton = document.getElementById(`${favId}_is_savedscreening`)
    }
    else if (type === 'rmScreening') {
        pushedButton = document.getElementById(`${favId}_is_savedscreening`)
        oppositeButton = document.getElementById(`${favId}_not_savedscreening`)
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


    fetch('https://dev.poff.ee/users/favorites/', requestOptions).then(function (response) {
        if (response.ok) {
            return response.json();
        }
        return Promise.reject(response);
    }).then(function (data) {
        console.log(data)
        if (data.my_screenings) {
            try {
                userProfile.my_screenings = data.my_screenings
                pushedButton.disable = false
                pushedButton.style.display = 'none'
                pushedButton.innerHTML = pushedButtonInnerHTMLBeforeClick
                if (oppositeButton) {
                    oppositeButton.style.display = 'grid'
                }
                toggleAll()
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
