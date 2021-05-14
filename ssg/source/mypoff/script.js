
if (!validToken) {
    window.open(`${location.origin}/${langpath}login`, '_self')
    saveUrl()
}

async function fetchMyPasses() {

    let res = await fetch(`https://api.poff.ee/profile/picture_down`, {
        method: "GET",
        headers: {
            Authorization: "Bearer " + localStorage.getItem("BNFF_U_ACCESS_TOKEN"),
        },
    });
    let profilePicture = await res.json();

    var my_passes = userProfile.userpasses
    // console.log('passes ', my_passes)
    var my_passes_element = document.getElementById('my_passes')
    var ix = 0
    for (my_pass of my_passes) {
        ix++

        var pass_template = document.getElementById('template_' + my_pass.categoryId)
        var my_pass_element = pass_template.cloneNode(true)

        for (const childNode of my_pass_element.childNodes) {
            if (childNode.className === 'passCode') {
                childNode.innerHTML = my_pass.code
            }
        }

        for (const childNode of my_pass_element.childNodes) {
            if (childNode.className === 'fullName') {
                childNode.innerHTML = userProfile.name + ' ' + userProfile.family_name
            }
        }

        for (const childNode of my_pass_element.childNodes) {
            if (childNode.className === 'profilePic') {
                childNode.setAttribute('src', profilePicture.url)
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



