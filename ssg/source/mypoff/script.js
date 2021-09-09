
if (!validToken) {
    window.open(`${location.origin}/${langpath}login`, '_self')
    saveUrl()
}

async function fetchMyPasses() {

    let userPerson
    let profilePicture
    if (userProfile.users_person && userProfile.users_person.picture) {
        userPerson = userProfile.users_person
        profilePicture = `https://dev.poff.ee${userPerson.picture.url}`
    } else {
        return
    }
    var my_passes = userProfile.my_products
    // console.log('passes ', my_passes)
    var my_passes_element = document.getElementById('my_passes')
    var ix = 0
    for (my_pass of my_passes) {
        ix++

        var pass_template = document.getElementById('template_' + my_pass.product_category)
        var my_pass_element = pass_template.cloneNode(true)

        for (const childNode of my_pass_element.childNodes) {
            if (childNode.className === 'passCode') {
                childNode.innerHTML = my_pass.code
            }
        }

        for (const childNode of my_pass_element.childNodes) {
            if (childNode.className === 'fullName') {
                childNode.innerHTML = userPerson.firstName + ' ' + userPerson.lastName
            }
        }

        for (const childNode of my_pass_element.childNodes) {
            if (childNode.className === 'profilePic') {
                childNode.setAttribute('src', profilePicture)
            }
        }

        my_pass_element.setAttribute('ix', ix)
        my_pass_element.style.display = 'block'

        my_passes_element.appendChild(my_pass_element)

        for (const childNode of my_pass_element.childNodes) {
            const qr_id = 'QR' + my_pass.code;
            if (childNode.className === 'qrCode') {
                childNode.id = qr_id
                var qrcode = new QRCode(qr_id)
                qrcode.makeCode(my_pass.code)
            }
        }
    }
}



