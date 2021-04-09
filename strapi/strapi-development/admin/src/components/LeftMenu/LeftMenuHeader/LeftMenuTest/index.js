import { format } from 'path';
import React, { useEffect, useState } from 'react';
const https = require('https');


import Wrapper from './Wrapper';

const LeftMenuTest = (props) => {

  let [things] = useState(null)

  useEffect(() => {
    console.log('LeftMenuTestIndex - useEffect');

    let myVar;

    fetchLogs()
    function myFunction() {
      myVar = setInterval(fetchLogs, 20000);
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

  const token = (sessionStorage.getItem('jwtToken')).replace(/"/g,'')


  var myHeaders = new Headers();
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
  console.log(result);
  if (result.length < 1) {
    return false
  }

  if (result[0].end_time) {
    const paths = await fetchChangedSlug(result[0].build_args)
    console.log({paths});

    console.log(result[0].site);

    const formattedPaths = paths.map(a => {
      return {
        url: `https://${result[0].site}/${a}`,
        label: a
      }
    })

    console.log({formattedPaths});
    strapi.notification.toggle({
      message: 'Your build of site ' + result[0].site + ' finished, see the result:',
      blockTransition: true,
      link: formattedPaths
    })
    // setShownToUser(result[0])
  }
}




const setShownToUser = (log) => {
  console.log(log);

  const token = (sessionStorage.getItem('jwtToken')).replace(/"/g,'')

  var myHeaders = new Headers();
  myHeaders.append("Authorization", `Bearer ${token}`);
  myHeaders.append("Content-Type", "application/json");

  var raw = JSON.stringify({ shown_to_user: true });

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


const fetchChangedSlug = async (args) => {
  console.log(args);
  const [collectionType, id] = args.split(' ')

  var myHeaders = new Headers();
  myHeaders.append("Authorization", `Bearer ${token}`);

  var requestOptions = {
    method: 'GET',
    headers: myHeaders,
    redirect: 'follow'
  };

  let result = await fetch(`https://admin.poff.ee/${collectionType}s/${id}`, requestOptions)
    .then(response => response.text())
    .then(result => { return result })
    .catch(error => console.log('error', error));

  result = JSON.parse(result)
  console.log(result);

  const articleSlug = result.slug_et || result.slug_en || result.slug_ru
  
  const lang = result.slug_et ? 'et' : result.slug_en ? 'en' : result.slug_ru ? 'ru' : null
  const articleTypeSlugs = []

  for (const articleType of result.article_types) {
    console.log(1);
    for (const key in articleType) {
      console.log(2);
      if (key === `slug_${lang}`) {
        articleTypeSlugs.push(articleType[key])
      }
    }
  }

  const paths = []

  for (const articleTypeSlug of articleTypeSlugs) {
    paths.push(`${articleTypeSlug}/${articleSlug}`)
  }
  return paths
}
