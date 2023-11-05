reloadUser()
reloadUserScreenings()

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
