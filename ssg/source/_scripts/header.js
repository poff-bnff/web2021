jQuery(document).ready(function() {
    // Hide header on scroll down, show on scroll up
    const $header = jQuery('header')
    if (!$header.length) return
    
    let lastScrollTop = 0
    
    jQuery(window).scroll(function() {
        const scrollTop = jQuery(window).scrollTop()
        const windowWidth = $(window).width()

        if (windowWidth > 1099) {
        
            if (scrollTop > lastScrollTop && scrollTop > 100) {
                $header.addClass('hide-on-scroll')
            } else {
                $header.removeClass('hide-on-scroll')
            }
        }else {
            $header.removeClass('hide-on-scroll')
        }
        
        lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
    })
    // Adjust org_menu items based on width
    function adjustOrgMenu() {
        const $menu = jQuery('.org_menu ul')
        if (!$menu.length) return
        
        $menu.find('.org_item.small').show()
        
        const $smallItems = $menu.find('.org_item.small')
        
        for (let i = $smallItems.length - 1; i >= 0; i--) {
            if ($menu[0].scrollWidth > $menu[0].clientWidth) {
                jQuery($smallItems[i]).hide()
            } else {
                break
            }
        }
    }
    
    adjustOrgMenu()
    const $menuToggle = jQuery('#main_menu_toggle')
    const $mainMenu = jQuery('.main_menu')

    // Untoggle main menu whebn resizing window above 1100px
    jQuery(window).on('load resize', function () {
        adjustOrgMenu()

        if (jQuery(window).width() > 1100) {
            $menuToggle.prop('checked', false);
            $mainMenu.show()
        }
    });
})

