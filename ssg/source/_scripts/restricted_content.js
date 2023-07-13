function restrictedcontent(element) {
    element.innerHTML = "Laetakse..."
    var myHeaders = new Headers();
    myHeaders.append('Authorization', 'Bearer ' + localStorage.getItem('BNFF_U_ACCESS_TOKEN'));
    myHeaders.append("Content-Type", "application/json");

    var raw = JSON.stringify({
        "cType": cType,
        "cId": cId,
        "cSubType": cSubType,
        "cLang": cLang,
        "cDomain": cDomain,
    });

    var requestOptions = {
        method: 'PUT',
        headers: myHeaders,
        body: raw,
        redirect: 'follow'
    };

    fetch(`${huntAuthDomain}/api/rolecheck`, requestOptions).then(function (response) {
        if (response.ok) {
            return response.json();
        }
        return Promise.reject(response);
    }).then(function (data) {
        if (data.data) {
            element.innerHTML = data.data
            nodeScriptReplace(document.getElementsByClassName(`restrictedcontent`)[0])

        } else {
            element.innerHTML = 'Lugemisõigused puuduvad'
        }
        console.log('data', data);
    }).catch(function (error) {
        console.log('error', error);
    });

}

