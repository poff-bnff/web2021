$(function () {
    var doit
    var windowResized = function () {
        $('#navigation img').addClass('d-none')
        $('#navigation p').addClass('d-none')

        if ($(window).width() > 1200) {
            if ($(window).height() > 800) {
                $('#navigation p').removeClass('d-none')
                $('#navigation img').removeClass('d-none')
            } else if ($(window).height() > 600) {
                $('#navigation img').removeClass('d-none')
            }
        } else {
            if ($(window).height() > 1200) {
                $('#navigation p').removeClass('d-none')
                $('#navigation img').removeClass('d-none')
            } else if ($(window).height() > 800) {
                $('#navigation img').removeClass('d-none')
            }
        }

        if ($(window).width() < 768) {
            $('#navigation').removeClass('fixed-bottom')
            $('#text').removeClass('desktop')
            $('#text').css('height', '')
        } else {
            $('#navigation').addClass('fixed-bottom')
            $('#text').addClass('desktop')
            $('#text').css('height', ($(window).height() - $('#navigation').outerHeight(true)) + 'px')
        }

        if ($(window).width() < 576) {
            $('.nav-title').css('height', '')
        } else {
            var tallest = 0

            $('.nav-title').css('height', '')
            $('.nav-title').each(function () {
                var eleHeight = $(this).outerHeight(true)
                tallest = eleHeight > tallest ? eleHeight : tallest
            })

            $('.nav-title').css('height', tallest + 'px')
        }

        $('#text-text').css('height', '')
        if ($('#text-text').outerHeight(true) < $('#text-search').outerHeight(true)) {
            $('#text-text').css('height', $('#text-search').outerHeight(true) + 'px')
        }
    }

    $(window).on('load', function () {
        windowResized()
    })

    $(window).on('resize', function () {
        clearTimeout(doit)

        doit = setTimeout(windowResized, 100)
    })
})
