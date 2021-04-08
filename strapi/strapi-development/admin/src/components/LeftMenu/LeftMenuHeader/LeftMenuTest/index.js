import React, { useEffect, useState } from 'react';
const https = require('https');


import Wrapper from './Wrapper';

const LeftMenuTest = (props) => {

  let [things] = useState(null)

  useEffect(() => {
    console.log('LeftMenuTestIndex - useEffect');

    let myVar;

    function myFunction() {
      myVar = setInterval(fetchLogs, 3000);
    }

    let result = myFunction()

    if (result) {
      clearInterval(myVar);
    }


  }, []);

  return (
    <Wrapper>
      <p id='x'>{things}</p>
    </Wrapper>)
};


export default LeftMenuTest;



async function fetchLogs() {
  console.log('fetch');

  // let token = sessionStorage.getItem('jwtToken')

  var myHeaders = new Headers();
  const token = (sessionStorage.getItem('jwtToken')).replace(/"/g,'')
  myHeaders.append("Authorization", `Bearer ${token}`);

  var requestOptions = {
    method: 'GET',
    headers: myHeaders,
    redirect: 'follow'
  };

  let result = await fetch("http://localhost:1337/publisher/alllogs", requestOptions)
    .then(response => response.text())
    .then(result => result)
    .catch(error => console.log('error', error));

  result = JSON.parse(result)

  if (result.length < 1) {
    return false
  }

  if ((new Date(result[0].end_time)).getTime() - (new Date(result[0].start_time)).getTime() > 1000) {
    // clearInterval(myVar);
    setShownToUser(result[0])
    document.getElementById('x').innerHTML = result[0].end_time
    strapi.notification.toggle({ message: 'Your build of site ' + result[0].site + ' finished!', blockTransition: true, link: { url: `https://${result[0].site}`, label: 'See the result!' } })
  }
}




const setShownToUser = (log) => {
  console.log(log);

  const token = (sessionStorage.getItem('jwtToken')).replace(/"/g,'')
  myHeaders.append("Authorization", `Bearer ${token}`);
  var myHeaders = new Headers();
  myHeaders.append("Authorization", `Bearer ${token}`);
  myHeaders.append("Content-Type", "application/json");

  var raw = JSON.stringify({ shownToUser: true });

  var requestOptions = {
    method: 'PUT',
    headers: myHeaders,
    body: raw,
    redirect: 'follow'
  };

  fetch(`http://localhost:1337/publisher/updatelog/${log.id}`, requestOptions)
    .then(response => response.text())
    .then(result => console.log(result))
    .catch(error => console.log('error', error));


}
