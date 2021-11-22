// Eemaldab screeningu 'broneeri' ja 'osta pilet' nupud kui screeningu dateTime on minevikus
try {
    var currentDate = new Date()
    var screeningButtons = document.querySelectorAll('[btn-type="screening"]')
    if (screeningButtons.length) {
        for (button of screeningButtons) {
            // ONLINE locationi puhul jäävad alles
            if (button.getAttribute('scrn-loc') !== '16') {
                var screeningDate = new Date(button.getAttribute('scrn-datetime'))
                if (currentDate > screeningDate) {
                    button.style.display = 'none'
                }
            }
        }
    }
} catch (error) {
    null
}
