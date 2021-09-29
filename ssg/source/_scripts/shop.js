
// console.log('referrer ', document.referrer)

function BuyProduct(categoryId) {

    var feedback = document.getElementById("feedback")
    if (paymentType === "valimata") {
        feedback.innerHTML = "Palun vali makseviis"
    } else {
        // console.log("ostad passi kategoorias " + categoryId)
        saveUrl()


        var myHeaders = new Headers();
        myHeaders.append('Authorization', 'Bearer ' + localStorage.getItem('BNFF_U_ACCESS_TOKEN'));


        // console.log(requestOptions)

        var mypoff
        if (langpath === 'en/') {
            mypoff = 'mypoff'
        } else if (langpath === 'ru/') {
            mypoff = 'moipoff'
        } else {
            mypoff = 'minupoff'
        }

        var requestBody = {}

        var fullHost = window.location.href.slice(0, window.location.href.indexOf("/", 8))

        requestBody.paymentMethodId = paymentType
        requestBody.categoryId = categoryId
        requestBody.return_url = fullHost + '/' + langpath + mypoff
        requestBody.cancel_url = window.location.href

        console.log({ requestBody });
        var requestOptions = {
            "method": 'PUT',
            "headers": myHeaders,
            "redirect": 'follow',
            "body": JSON.stringify(requestBody),
            "content-type": 'application/json'
        }

        // fetch('https://api.poff.ee/buy/' + categoryId + '?return_url=' + return_url + '&cancel_url=' + cancel_url, requestOptions).then(function (response) {
        fetch(`${strapiDomain}/users-permissions/users/buyproduct`, requestOptions).then(function (response) {
            if (response.ok) {
                return response.json();
            }
            return Promise.reject(response);
        }).then(function (data) {
            var errorMapping = {
                unauthorized: 'Tekkis viga! Õigused puuduvad',
                noCategoryId: 'Tekkis viga! Kategooria ID puudub',
                noPaymentMethodId: 'Tekkis viga! Maksemeetodi ID puudub',
                noItems: 'Hetkel ei ole võimalik seda tüüpi passi osta',
                reservationSaveFailed: 'Tekkis viga! Reserveeringu ebaõnnestumine',
                noPaymentMethod: 'Tekkis viga! Maksemeetod puudub',
            }

            if (data.code && data.case) { feedback.innerHTML = errorMapping[data.case] }
            window.open(data.url, '_self')


        }).catch(function (error) {
            console.warn(error);
        });

    }

}

var paymentType = "valimata"

function SelectPaymentType(id) {
    paymentType = id

    // console.log("sinu valitud makseviis on " + paymentType)
}

function Buy(productCode) {
    // console.log("ostad toote " + productCode + " ja maksad " + paymentType)
}

function GetPaymentLinks() {
    document.getElementById("buybutton").style.display = 'none'
    var links = document.getElementById("paymentLinks")
    var paybutton = document.getElementById("paybutton")

    var myHeaders = new Headers();
    myHeaders.append('Authorization', 'Bearer ' + localStorage.getItem('BNFF_U_ACCESS_TOKEN'));

    var requestOptions = {
        method: 'GET',
        headers: myHeaders,
        redirect: 'follow'
    }

    fetch(`${strapiDomain}/users-permissions/users/paymentmethods`, requestOptions).then(function (response) {
        if (response.ok) {
            return response.json();
        }
        return Promise.reject(response);
    }).then(function (data) {
        // console.log(data);
        var bankInfo = ""

        //pangalingid
        for (var i = 0; i < data.banklinks.length; i++) {
            if (data.banklinks[i].country === "ee") {
                var button = '<label><input type="radio" name="payment" value="' + data.banklinks[i].id + '"><img src=' + data.banklinks[i].logo + ' onClick=SelectPaymentType("' + data.banklinks[i].id + '") ></label>'
                bankInfo += button
            }
        }

        //credit cards
        for (var i = 0; i < data.cards.length; i++) {
            var button = '<label><input type="radio" name="payment" value="' + data.cards[i].id + '"><img src=' + data.cards[i].logo + ' onClick=SelectPaymentType("' + data.cards[i].id + '") ></label>'
            bankInfo += button
        }

        //other
        for (var i = 0; i < data.other.length; i++) {
            var button = '<label><input type="radio" name="payment" value="' + data.other[i].id + '"><img src=' + data.other[i].logo + ' onClick=SelectPaymentType("' + data.other[i].id + '") ></label>'
            bankInfo += button
        }
        links.innerHTML = bankInfo
        paybutton.style.display = "block"

    }).catch(function (error) {
        try {
            const productPagePriceBox = document.getElementById('productPagePriceBox')
            productPagePriceBox.innerHTML = `Ühenduse viga!`
            productPagePriceBox.style.display = ``
        } catch (error) { }
    });
}

function availability() {
    // document.getElementById("buybutton").style.display = 'none'
    // var links = document.getElementById("paymentLinks")
    // var paybutton = document.getElementById("paybutton")

    var requestOptions = {
        method: 'GET',
        redirect: 'follow'
    }

    fetch(`${strapiDomain}/products-availability/`, requestOptions).then(function (response) {
        if (response.ok) {
            return response.json();
        }
        return Promise.reject(response);
    }).then(function (data) {

        if (data.length) {
            data.map(p => {
                try {
                    const productElement = document.querySelector(`[productId="${p.id}"]`);
                    productElement.style.opacity = 1
                } catch (error) { }
                try {
                    const priceElement = document.querySelector(`[productIdPriceField="${p.id}"]`);
                    priceElement.innerHTML = `${p.price.toFixed(2)} €`
                } catch (error) { }
            })
            try {
                const productPagePriceBox = document.getElementById('productPagePriceBox')
                const productIdStrings = data.map(p => p.id.toString())
                if (productIdStrings.includes(productPagePriceBox.attributes.productId.value)) {
                    const thisProductPrice = data.filter(p => p.id.toString() === productPagePriceBox.attributes.productId.value)[0].price
                    const productPagePrice = document.getElementById('productPrice')
                    productPagePrice.innerHTML = `${thisProductPrice.toFixed(2)} €`
                } else {
                    productPagePriceBox.innerHTML = `Toode pole hetkel saadaval`
                }
                productPagePriceBox.style.display = ``

            } catch (error) { }
        } else {
            try {
                const productPagePriceBox = document.getElementById('productPagePriceBox')
                productPagePriceBox.innerHTML = `Toode pole hetkel saadaval`
                productPagePriceBox.style.display = ``
            } catch (error) { }
        }

    }).catch(function (error) {
        console.warn(error);
        const productElement = document.querySelectorAll(`[productId]`);
        const priceElement = document.querySelectorAll(`[productIdPriceField]`);
        for (let i = 0; i < priceElement.length; i++) {
            const element = priceElement[i];
            element.innerHTML = `<font color=red>Ühenduse viga!</font>`
        }

        try {
            const productPagePriceBox = document.getElementById('productPagePriceBox')
            productPagePriceBox.innerHTML = `Ühenduse viga!`
            productPagePriceBox.style.display = ``
        } catch (error) { }

    });
}

function directToLogin() {
    window.open(location.origin + '/login', '_self')
}

function directToUserProfile() {
    window.open(location.origin + '/userprofile', '_self')
}



