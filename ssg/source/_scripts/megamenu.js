document.addEventListener("DOMContentLoaded", function () {
    // Variables for menu show/hide
    const hamburger = document.getElementById('hamburger');
    if (!hamburger) {
        console.log('No megamenu found');
        return;
    }
    const closeMenu = document.getElementById('close_menu');
    const topMenuRight = document.querySelector('.menu_top_right');
    const logo = document.querySelector('header.menu .logo');
    const header = document.querySelector('header.menu');
    // const langMenu = document.querySelector('.lang_menu');
    const megamenu = document.querySelector('.megamenu_wrapper');
    // Variables for locking/unlocking body when menu open
    const body = document.querySelector('body');
    let bodyScrollTop = 0;

    // Functions to lock/unlock body when menu open

    const lockBody = function() {
        if (window.scrollY) {
            bodyScrollTop = window.scrollY;
        }
        body.style.height = '100%';
        body.style.overflow = 'hidden';
    }

    const unlockBody = function() {
        body.style.height = '';
        body.style.overflow = '';
        window.scrollTo({
            left: 0,
            top: bodyScrollTop,
            behavior: 'instant'
        });
        bodyScrollTop = 0;
    }

    // Event listeners for menu show/hide

    hamburger.addEventListener('click', function() {
        this.classList.remove('show');
        logo.classList.remove('show');
        closeMenu.classList.add('show');
        topMenuRight.classList.add('show');
        megamenu.classList.add('show');
        header.classList.add('show');
        lockBody();
    });

    closeMenu.addEventListener('click', function() {
        this.classList.remove('show');
        logo.classList.add('show');
        hamburger.classList.add('show');
        topMenuRight.classList.remove('show');
        megamenu.classList.remove('show');
        header.classList.remove('show');
        unlockBody();
    });

    window.addEventListener('resize', function() {
        if (hamburger.classList.contains('show')) {
            return;
        }
        closeMenu.classList.remove('show');
        hamburger.classList.add('show');
        header.classList.remove('show');
        langMenu.classList.remove('show');
        megamenu.classList.remove('show');
        unlockBody();
    });

    // Event listeners for dropdowns
    setTimeout(() => {
        const toggleButtons = document.querySelectorAll('button.toggle_dropdown');
        Array.from(toggleButtons).forEach(function(button) {
            button.addEventListener('click', function() {
                this.parentElement.querySelector('ul').classList.toggle('show');
                this.previousSibling.classList.toggle('active');
            });
        });
    }, 100);

    setTimeout(() => {
        const toggleButtonsDesktop = document.querySelectorAll('button.toggle_dropdown_desktop');
        Array.from(toggleButtonsDesktop).forEach(function(button) {
            button.addEventListener('click', function() {
                this.parentElement.querySelector('ul').classList.toggle('show_desktop');
            });
        });
    }, 100);

    // Add megamenu / dropdown classes to element parents
    setTimeout(() => {
        const menuItems = document.querySelectorAll('li.menu_item');
        const megamenuWrapper = document.querySelector('.megamenu_wrapper');
        const megamenuElements = document.querySelectorAll('.megamenu_el > ul');
        Array.from(menuItems).forEach(function(menuItem) {
            if (menuItem.querySelector('.megamenu_el')) {
                menuItem.classList.add('megamenu');
            } else {
                menuItem.classList.add('dropdown');
            }
        });
        Array.from(megamenuElements).forEach(function(element) {
            const itemCount = element.childElementCount;
            if (itemCount > 6) {
                element.classList.add('two-columns');
            }
        });
        megamenuWrapper.classList.add('visible');
    }, 100);
});
