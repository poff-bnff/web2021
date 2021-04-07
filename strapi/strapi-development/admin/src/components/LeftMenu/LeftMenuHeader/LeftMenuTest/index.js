import React, { useEffect, useState } from 'react';
const https = require('https');


import Wrapper from './Wrapper';

const LeftMenuTest = (props) => {

  let [things] = useState(null)

  useEffect(() => {
    console.log('LeftMenuTestIndex - useEffect');


    // setTimeout(() => {
    //   alert('hello')
    // }, 1000);

    async function fetchLogs() {

      // let token = sessionStorage.getItem('jwtToken')

      var myHeaders = new Headers();
      myHeaders.append("Authorization", `Bearer `);

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
      console.log(result);
      // console.log(result.end_time);

      if (result.length < 1){
        console.log('empty');
        clearInterval(myVar);
      }

      if ((new Date(result[0].end_time)).getTime() - (new Date(result[0].start_time)).getTime() > 1000) {
        clearInterval(myVar);
        console.log(helloTest())
        document.getElementById('x').innerHTML = result[0].end_time
        strapi.notification.toggle({message: 'Your build of site ' + result[0].site + ' finished!', blockTransition: true, link: {url: `https://${result[0].site}`, label: 'See the result!'}})
      }
    }

    let myVar;

    function myFunction() {
      myVar = setInterval(fetchLogs, 3000);
    }

    myFunction()
  }, []);

  return (
    <Wrapper>
      <p id='x'>{things}</p>
    </Wrapper>)
};


export default LeftMenuTest;


const setShownToUser = () => {

  var myHeaders = new Headers();
myHeaders.append("Authorization", "Bearer ");
myHeaders.append("Content-Type", "application/json");

var raw = JSON.stringify({"shownToUser":"true"});

var requestOptions = {
  method: 'POST',
  headers: myHeaders,
  body: raw,
  redirect: 'follow'
};

fetch("localhost:1337/publisher/alllogs", requestOptions)
  .then(response => response.text())
  .then(result => console.log(result))
  .catch(error => console.log('error', error));


}
