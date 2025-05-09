function showNotifierPopup(message) {
    console.log("showNotifierPopup: " + message)
    document.getElementById('notifierInfoPopup').querySelector('p').innerHTML = message
    document.getElementById('notifierInfoPopup').style.display = "block"
}

function hideNotifierPopup() {
    document.getElementById('notifierInfoPopup').style.display = "none"
}

function translateNotifier(template, variables = {}) {
    const element = document.querySelector(`#notifierStrings .${template}`)
    if (!element) {
        return template
    }
    let text = element.innerHTML
    Object.entries(variables).forEach(([key, value]) => {
        text = text.replace(`%${key}%`, value)
    });
    return text
}

window.addEventListener("load", function (event) {
    const url = new URL(window.location.href)
    const notifier = url.searchParams.get('notifier')
    if (notifier !== null && notifier !== undefined && notifier !== '') {
        url.searchParams.delete('notifier')
        history.replaceState(history.state, '', url.href)

        showNotifierPopup(translateNotifier(notifier))
    }
})
