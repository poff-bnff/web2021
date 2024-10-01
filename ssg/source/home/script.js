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

