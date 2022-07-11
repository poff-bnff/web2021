function refresh () {
    window.location.reload()
}

function redirectTo (page) {
    console.log(page);
    window.open(page, '_self')
}

const setLang = () => {
    let lang = window.location.pathname.split('/')[1]
    if (['login', 'signup'].includes(lang)) { lang = 'et' }
    localStorage.setItem('lang', lang)
}

// const setLang = () => {
//     let lang = window.location.pathname.split('/')[1]
//     if (['login', 'signup'].includes(lang)) lang = 'et'
//     localStorage.setItem('lang', lang)
// }