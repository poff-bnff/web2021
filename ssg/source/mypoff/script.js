// This function returns true if user is logged in but redirects to login page if not.
requireLogin()

const loaderTemplate = document.getElementById('loaderTemplate')

async function fetchMyPasses() {

    const webUser = await getUser()
    let userPerson
    let profilePicture
    if (webUser.user_profile && webUser.user_profile.picture) {
        userPerson = webUser.user_profile
        profilePicture = `${strapiDomain}${userPerson.picture.url}`
    } else {
        return
    }
    var reservedProducts = webUser.reserved_products.filter(p => p.owner === null)
    var myPasses = webUser.my_products.concat(reservedProducts)


    // console.log('passes ', my_passes)
    var my_passes_element = document.getElementById('my_passes')
    var ix = 0
    for (my_pass of myPasses) {
        ix++

        var pass_template = document.getElementById('template_' + my_pass.product_category)

        if (pass_template) {
            var my_pass_element = pass_template.cloneNode(true)

            if (my_pass.owner) {
                for (const childNode of my_pass_element.childNodes) {
                    if (childNode.className === 'passCode') {
                        childNode.innerHTML = my_pass.code
                    }
                }
            }

            for (const childNode of my_pass_element.childNodes) {
                if (childNode.className === 'fullName') {
                    childNode.innerHTML = userPerson.firstName + ' ' + userPerson.lastName
                }
            }

            const profilePicElement = my_pass_element.querySelector('.profilePic');
            if (profilePicElement) {
                profilePicElement.setAttribute('src', profilePicture)
            }

            my_pass_element.setAttribute('ix', ix)
            my_pass_element.style.display = 'block'

            my_passes_element.appendChild(my_pass_element)

            const qrCodeElement = my_pass_element.querySelector('.qrCode');
            if (qrCodeElement) {
                if (my_pass.owner) {
                    const qr_id = 'QR' + my_pass.code;
                    qrCodeElement.id = qr_id;
                    new QRCode(qr_id).makeCode(my_pass.code);
                } else { // replace with a copy of loaderTemplate
                    const loaderElement = loaderTemplate.cloneNode(true);
                    loaderElement.id = 'loader-' + ix;
                    loaderElement.style.display = 'block';
                    qrCodeElement.parentNode.replaceChild(loaderElement, qrCodeElement);
                }
            }
        }
    }
}

reloadUser()
fetchMyPasses()

// keep reloading user every 0.5 seconds and log out user products

// setInterval(() => {
//     reloadUser()
//     console.log(getUser().my_products)
//     // fetchMyPasses()
// }, 500)

