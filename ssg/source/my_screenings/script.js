reloadUser()
reloadUserScreenings()

function setupScreeningFavoriteButtons() {
    const nslButtons = Array.from(document.getElementsByClassName('notmyscreening'))
    const slButtons = Array.from(document.getElementsByClassName('ismyscreening'))
    const currentScreeningIDs = Array.from(document.getElementById('screening_ids').value.split(','))
        .map(e => parseInt(e))

    if (getUser()) {
        const myScreenings = reloadUserScreenings()
        //- console.log({myScreenings, currentScreeningIDs})

        // unhide all fav buttons for currently favorited screenings
        currentScreeningIDs.filter(id => myScreenings.includes(id))
            .forEach(id => {
                document.getElementById(`${id}`).style.display = ''
                document.getElementById(`s_${id}_is_fav`).style.display = ''
                document.getElementById(`s_${id}_is_not_fav`).style.display = 'none'
            })

        // unhide all no-fav buttons for currently unfavorited screenings
        currentScreeningIDs.filter(id => !myScreenings.includes(id))
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
}


document.onreadystatechange = () => {
    const loading = document.getElementById('loading');
    if (document.readyState === 'complete') {
        setupScreeningFavoriteButtons()

        for (img of document.images) {
            img_src = img.src || ''
            if (img_src.includes('thumbnail_')) {
                img.src = img_src.replace('thumbnail_', '')
            }
        }
    }
}
