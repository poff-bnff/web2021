const search_input = document.getElementById('search')
const nonetoshow = document.getElementById('nonetoshow')
const queryString = window.location.search
const urlParams = new URLSearchParams(queryString)

reloadUser()
const userScreenings = []
const reloadUserScreenings = () => {
    if (!isUserTokenValid()) {
        return null
    }
    userScreenings.splice(0, userScreenings.length, ...getUser().My?.screenings?.map(s=>s.id) || [])
}
reloadUserScreenings()

function initializeFavorites() {
    const nslButtons = document.getElementsByClassName('notshortlisted')
    const slButtons = document.getElementsByClassName('isshortlisted')
    for (let i = 0; i < nslButtons.length; i++) {
        const id = nslButtons[i].id.split('_')[0]
        nslButtons[i].addEventListener('click', e => {
            toggleFavouriteScreening('set', id)
        })
        slButtons[i].addEventListener('click', e => {
            toggleFavouriteScreening('unset', id)
        })

        if (userScreenings.includes(parseInt(id))) {
            document.getElementById(id).style.display = ''
            nslButtons[i].style.display = 'none'
            slButtons[i].style.display = ''
        } else {
            nslButtons[i].style.display = ''
            slButtons[i].style.display = 'none'
        }
    }
}

document.onreadystatechange = () => {
    const loading = document.getElementById('loading');
    if (document.readyState === 'complete') {
        initializeFavorites()

        for (img of document.images) {
            img_src = img.src || ''
            if (img_src.includes('thumbnail_')) {
                img.src = img_src.replace('thumbnail_', '')
            }
        }
    }
}
