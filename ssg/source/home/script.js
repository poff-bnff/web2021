window.onscroll = function () {
    lastKnownScrollPosition = window.scrollY
    if(window.scrollY == 0){
        if(jQuery("#supporter-popup").css("display") == "none"){
            //console.log("Show!")
            jQuery("#supporter-popup").fadeIn()
        }
    }
    else if(window.scrollY > 0){
        if(jQuery("#supporter-popup").css("display") != "none"){
            //console.log("Hide!")
            jQuery("#supporter-popup").fadeOut()
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const header = document.querySelector('header');
    let lastScrollTop = 0;

    window.addEventListener('scroll', () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

      if (scrollTop > lastScrollTop && scrollTop > 100) {
        header.classList.add('hide-on-scroll');
      } else {
        header.classList.remove('hide-on-scroll');
      }

      lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
    });
  });

