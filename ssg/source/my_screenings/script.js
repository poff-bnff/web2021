reloadUser()
reloadUserScreenings()

function initializeFavorites() {
    const nslButtons = document.getElementsByClassName('notshortlisted')
    const slButtons = document.getElementsByClassName('isshortlisted')
    for (let i = 0; i < nslButtons.length; i++) {
        const id = nslButtons[i].id.split('_')[1]
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
