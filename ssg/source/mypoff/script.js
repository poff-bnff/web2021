// This function returns true if user is logged in but redirects to login page if not.
requireLogin()

const loaderTemplate = document.getElementById('loaderTemplate')
var reloadProductsNeeded = false

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

    const reservedProducts = webUser.reserved_products.filter(p => p.owner === null)
    const myPasses = webUser.my_products.concat(reservedProducts)

    const reservedProductsCount = reservedProducts.length

    // console.log('passes ', my_passes)
    var my_passes_element = document.getElementById('my_passes')
    var ix = 0
    for (my_pass of myPasses) {
        ix++
        const qr_id = 'QR' + my_pass.code;

        var pass_template = document.getElementById('template_' + my_pass.product_category)

        if (pass_template) {
            var my_pass_element = pass_template.cloneNode(true)
            my_pass_element.setAttribute('ix', ix)
            my_passes_element.appendChild(my_pass_element)

            const passCodeElement = my_pass_element.querySelector('.passCode');
            const fullNameElement = my_pass_element.querySelector('.fullName');
            const profilePicElement = my_pass_element.querySelector('.profilePic');
            const qrCodeElement = my_pass_element.querySelector('.qrCode');
            qrCodeElement.id = qr_id;

            if (my_pass.owner) {
                passCodeElement.innerHTML = my_pass.code
                fullNameElement.innerHTML = userPerson.firstName + ' ' + userPerson.lastName
                profilePicElement.setAttribute('src', profilePicture)
                new QRCode(qr_id).makeCode(my_pass.code);
            } else {
                passCodeElement.style.display = 'none'
                fullNameElement.style.display = 'none'
                profilePicElement.style.display = 'none'
                my_pass_element.querySelector('.pass_desc').style.display = 'none'
                // qrCodeElement.style.display = 'none'
                const loaderElement = loaderTemplate.cloneNode(true);
                loaderElement.id = 'loader-' + ix;
                loaderElement.style.display = 'block';
                my_pass_element.replaceChild(loaderElement, qrCodeElement);
            }

            my_pass_element.style.display = 'block'
        }
    }
    if (reservedProductsCount > 0) {
        reloadProductsLoop(reservedProductsCount)
    } else {
        reloadProductsLoop(reservedProductsCount, 10)
    }
}

reloadProductsLoop = async (reservedProductsCount, times) => {
    console.log('reloadProductsLoop', reservedProductsCount, times)
    if (times !== undefined) {
        if (times === 0) {
            return
        }
        times--
        console.log('times', times)
    }

    setTimeout(async () => {
        reloadUser()
        let user = await getUser()
        let reservedProducts = user.reserved_products.filter(p => p.owner === null)
        console.log('reservedProducts', reservedProductsCount, reservedProducts.length)
        if (reservedProductsCount !== reservedProducts.length) {
            location.reload()
        } else {
            reloadProductsLoop(reservedProductsCount, times)
        }
    }, 2000)
}

reloadUser()
fetchMyPasses()
