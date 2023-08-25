document.addEventListener("DOMContentLoaded", function () {
    // Variables for menu show/hide
    const hamburger = document.getElementById('hamburger');
    const closeMenu = document.getElementById('close_menu');
    const header = document.querySelector('header.menu');
    const langMenu = document.querySelector('.lang_menu');
    const megamenu = document.querySelector('.megamenu');
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
        closeMenu.classList.add('show');
        header.classList.add('show');
        langMenu.classList.add('show');
        megamenu.classList.add('show');
        lockBody();
    });

    closeMenu.addEventListener('click', function() {
        this.classList.remove('show');
        hamburger.classList.add('show');
        header.classList.remove('show');
        langMenu.classList.remove('show');
        megamenu.classList.remove('show');
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
                this.nextSibling.classList.toggle('show');
                this.previousSibling.classList.toggle('active');
            });
        });
    }, 100);

    // Add megamenu / dropdown classes to element parents
    setTimeout(() => {
        const dropdowns = document.querySelectorAll('li.menu_item');
        Array.from(dropdowns).forEach(function(dropdown) {
            if (dropdown.querySelector('.megamenu_el')) {
                dropdown.classList.add('megamenu');
            } else {
                dropdown.classList.add('dropdown');
            }
        });
    }, 100);
});
