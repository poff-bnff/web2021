const search_input = document.getElementById('search');
const nonetoshow = document.getElementById('nonetoshow');
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
var pageLoaded = false

// This function returns true if user is logged in but redirects to login page if not.
requireLogin()

document.onreadystatechange = () => {
    if (document.readyState === 'complete') {
        for (img of document.images) {
            img_src = img.src || ''
            if (img_src.includes('thumbnail_')) {
                    img.src = img_src.replace('thumbnail_', '')
            }
        }
    }
}

reloadUser()
const webUser = getUser()
console.log(`My screenings: ${webUser.My.screenings}`)
