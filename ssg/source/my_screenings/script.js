reloadUser()
reloadUserScreenings()

document.onreadystatechange = () => {
    const loading = document.getElementById('loading');
    if (document.readyState === 'complete') {
        setupScreeningFavoriteButtons()
        revealMyScreenings()
        for (img of document.images) {
            img_src = img.src || ''
            if (img_src.includes('thumbnail_')) {
                img.src = img_src.replace('thumbnail_', '')
            }
        }
    }
}

const revealMyScreenings = () => {
    userScreenings.forEach(screeningId => {
        const screeningCardE = document.getElementById(screeningId)
        if (screeningCardE) {
            // screeningCardE.classList.remove('d-none') // TODO: refactor to use classes
            screeningCardE.style.removeProperty('display')
        }
    })
}
