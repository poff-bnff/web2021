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
    let lastScrollTop = 0

    window.addEventListener('scroll', () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

      if (scrollTop > lastScrollTop && scrollTop > 100) {
        header.classList.add('hide-on-scroll')
      } else {
        header.classList.remove('hide-on-scroll')
      }

      lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
    })

    function adjustMenu() {
      const menu = document.querySelector('.org_menu')
      if (!menu) return

      menu.querySelectorAll('.org_item.small').forEach(item => item.style.display = '')

      const smallItems = Array.from(menu.querySelectorAll('.org_item.small'))

      for (let i = smallItems.length - 1; i >= 0; i--) {
        if (menu.scrollWidth > menu.clientWidth) { 
          smallItems[i].style.display = 'none'
        } else {
          break
        }
      }
    }

  adjustMenu()
  window.addEventListener('load', adjustMenu)
  window.addEventListener('resize', adjustMenu)
})
