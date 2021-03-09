function includeMenuHTML() {
    var z, i, elmnt, file, xhttp;
    z = document.getElementsByClassName("main_menu_includer");
    for (i = 0; i < z.length; i++) {
        elmnt = z[i];
        file = elmnt.getAttribute("include-html-menu");
        if (file) {
            /* Make an HTTP request using the attribute value as the file name: */
            xhttp = new XMLHttpRequest();
            xhttp.onreadystatechange = function () {
                if (this.readyState == 4) {
                    var parentElement = elmnt.parentElement

                    parentElement.removeChild(elmnt)
                    var login_section_element = document.getElementById('user_menu_hidden');
                    var login_section_html = login_section_element ? login_section_element.innerHTML : '';
                    if (this.status == 200) { parentElement.innerHTML = parentElement.innerHTML + this.responseText + login_section_html; }
                    if (this.status == 404) { parentElement.innerHTML = parentElement.innerHTML + "Page not found." + login_section_html; }

                    var login_section_html_parent = login_section_html.parentElement || null
                    if (login_section_html_parent) {
                        login_section_html_parent.removeChild(login_section_html)
                    }

                }
            }
            xhttp.open("GET", file, true);
            xhttp.send();
            /* Exit the function: */
            return;
        }
    }
}
