document.addEventListener("DOMContentLoaded", function () {
    // setTimeout(function () {
    //     const megamenuItems = document.querySelectorAll(".megamenu");

    //     console.log(megamenuItems);

    //     Array.from(megamenuItems).forEach(function (item) {
    //         item.addEventListener("mouseenter", function () {
    //             item.classList.add("show");
    //         });
    //         item.addEventListener("mouseleave", function () {
    //             item.classList.remove("show");
    //         });
    //     });
    // }, 100);

    const hamburger = document.getElementById('hamburger');
    const closeMenu = document.getElementById('close_menu');
    const langMenu = document.querySelector('.lang_menu');
    const megamenu = document.querySelector('.megamenu');
    const body = document.querySelector('body');
    let bodyScrollTop = 0;

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

    hamburger.addEventListener('click', function() {
        this.classList.remove('show');
        closeMenu.classList.add('show');
        langMenu.classList.add('show');
        megamenu.classList.add('show');
        lockBody();
    });

    closeMenu.addEventListener('click', function() {
        this.classList.remove('show');
        hamburger.classList.add('show');
        langMenu.classList.remove('show');
        megamenu.classList.remove('show');
        unlockBody();
    });
});
