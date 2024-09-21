window.addEventListener("load", function (event) {
    const url = new URL(window.location.href)
    const notifier = url.searchParams.get('notifier')
    if (notifier !== null && notifier !== undefined && notifier !== '') {
        url.searchParams.delete('notifier')
        history.replaceState(history.state, '', url.href)

        jQuery("#"+notifier).show()
        setTimeout(function() {
            jQuery("#"+notifier).fadeOut()
        }, 5000);
    }
})
