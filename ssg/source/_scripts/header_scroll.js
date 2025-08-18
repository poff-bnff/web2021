jQuery(document).ready(function() {
    const $header = jQuery('header')
    if (!$header.length) return
    
    let lastScrollTop = 0
    
    jQuery(window).scroll(function() {
        const scrollTop = jQuery(window).scrollTop()
        const windowWidth = $(window).width()

        if (windowWidth > 800) {
        
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

    
    jQuery(window).on('load resize', function () {
        adjustOrgMenu();

        if (jQuery(window).width() > 800) {
            $menuToggle.prop('checked', false); 
            $mainMenu.show(); 
        }
    });
})

