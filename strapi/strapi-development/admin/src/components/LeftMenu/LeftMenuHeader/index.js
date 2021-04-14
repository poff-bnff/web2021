import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
const strapiHost = 'https://admin.poff.ee'

import Wrapper from './Wrapper';

const LeftMenuHeader = (props) => {

  useEffect(() => {

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
      <Link to="/" className="leftMenuHeaderLink">
      <span className="projectName" />
    </Link>
    </Wrapper>)
};


export default LeftMenuHeader;



async function fetchLogs() {

  const token = (sessionStorage.getItem('jwtToken')).replace(/"/g, '')


  var myHeaders = new Headers();
  myHeaders.append("Authorization", `Bearer ${token}`);

  var requestOptions = {
    method: 'GET',
    headers: myHeaders,
    redirect: 'follow'
  };

  let result = await fetch(`${strapiHost}/publisher/my-finished-build-logs`, requestOptions)
    .then(response => response.text())
    .then(result => result)
    .catch(error => console.log('error', error));

  result = JSON.parse(result)

  if (result.length < 1) {
    return false
  }

  result.map(async finishedLog => {
    let formattedPaths = [];
    if (finishedLog.build_args) {
      const paths = await fetchChangedSlug(finishedLog.build_args)

      formattedPaths = paths.map(a => {
        return {
          url: `https://${finishedLog.site}/${a}`,
          label: a
        }
      })
    }

    if (finishedLog.build_errors) {
      toggleErrorNotif(finishedLog, formattedPaths)
    } else {
      strapi.notification.toggle({
        message: 'Your build of site ' + finishedLog.site + ' finished, see the result:',
        blockTransition: true,
        link: formattedPaths
      })
    }
    setShownToUser(finishedLog)
  })
}




const setShownToUser = (log) => {

  const token = (sessionStorage.getItem('jwtToken')).replace(/"/g, '')

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

  fetch(`${strapiHost}/publisher/updatelog/${log.id}`, requestOptions)
    .then(response => response.text())
    .catch(error => console.log('error', error));


}


const fetchChangedSlug = async (args) => {
  const [collectionType, id] = args.split(' ')

  const token = (sessionStorage.getItem('jwtToken')).replace(/"/g, '')

  var myHeaders = new Headers();
  myHeaders.append("Authorization", `Bearer ${token}`);

  var requestOptions = {
    method: 'GET',
    headers: myHeaders,
    redirect: 'follow'
  };

  let result = await fetch(`${strapiHost}/${collectionType}/${id}`, requestOptions)
    .then(response => response.text())
    .then(result => { return result })
    .catch(error => console.log('error', error));

  result = JSON.parse(result)

  const slug = result.slug_et || result.slug_en || result.slug_ru

  const lang = result.slug_et ? 'et' : result.slug_en ? 'en' : result.slug_ru ? 'ru' : null
  const articleTypeSlugs = []
  const paths = []

  if (result.article_types) {
    for (const articleType of result.article_types) {
      for (const key in articleType) {
        if (key === `slug_${lang}`) {
          articleTypeSlugs.push(articleType[key])
        }
      }
    }


    for (const articleTypeSlug of articleTypeSlugs) {
      paths.push(`${articleTypeSlug}/${slug}`)
    }
    return paths
  }
  return [slug]
}


const toggleErrorNotif = (finishedLog, formattedPaths) => {

  formattedPaths.push({
    url: `${strapiHost}/admin/plugins/content-manager/collectionType/plugins::publisher.build_logs/${finishedLog.id}`,
    label: 'Click here for full error log.',
    color: '#ff5d00',
  })

  strapi.notification.toggle({
    type: 'warning',
    message: 'Your build of site ' + finishedLog.site + ' failed, unchanged content:',
    blockTransition: true,
    link: formattedPaths
  })
}

// import React from 'react';
// import { Link } from 'react-router-dom';

// import Wrapper from './Wrapper';

// const LeftMenuHeader = () => (
//   <Wrapper>
//     <Link to="/" className="leftMenuHeaderLink">
//       <span className="projectName" />
//     </Link>
//   </Wrapper>
// );

// export default LeftMenuHeader;
