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
            const my_pass_element = pass_template.cloneNode(true)
            my_pass_element.setAttribute('ix', ix)
            my_pass_element.style.display = 'block'

            const passCodeElement = my_pass_element.querySelector('.passCode');
            const fullNameElement = my_pass_element.querySelector('.fullName');
            const profilePicElement = my_pass_element.querySelector('.profilePic');
            const qrCodeElement = my_pass_element.querySelector('.qrCode');

            if (my_pass.owner) {
                passCodeElement.innerHTML = my_pass.code
                fullNameElement.innerHTML = userPerson.firstName + ' ' + userPerson.lastName
                profilePicElement.setAttribute('src', profilePicture)
                const qr_id = 'QR' + my_pass.code;
                qrCodeElement.id = qr_id;
                new QRCode(qr_id).makeCode(my_pass.code);
            } else {
                passCodeElement.style.display = 'none'
                fullNameElement.style.display = 'none'
                profilePicElement.style.display = 'none'
                qrCodeElement.style.display = 'none'

                const loaderElement = loaderTemplate.cloneNode(true);
                loaderElement.id = 'loader-' + ix;
                loaderElement.style.display = 'block';
                my_pass_element.replaceChild(loaderElement, qrCodeElement);
            }

            my_passes_element.appendChild(my_pass_element)
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

