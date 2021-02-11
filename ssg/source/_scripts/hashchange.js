$(function () {
    $(window).on('hashchange', function () {
        if (location.hash) {
            $('.text-link').removeClass('active')
            $('.text-link[href="' + location.hash + '"]').addClass('active')

            $('.text-block').addClass('d-none')
            $(location.hash).removeClass('d-none')
        }
    })

    $(window).trigger('hashchange')
})
