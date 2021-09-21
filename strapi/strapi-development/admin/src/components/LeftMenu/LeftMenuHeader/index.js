import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
const strapiHost = `${process.env['StrapiProtocol']}://${process.env['StrapiHost']}`
// const strapiHost = 'http://localhost:1337'

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

  const token = await getToken()

  if (token) {
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

      if (finishedLog.paths.articleTypeMissing){
        toggleSavedNotUpNotif(finishedLog)
        setShownToUser(finishedLog)
        return
      }

      let formattedPaths = [];
      if (finishedLog.build_args) {
        const paths = finishedLog.paths
        formattedPaths = paths.map(a => {
          return {
            url: `${finishedLog.site}${a}`,
            label: a.length ? a : finishedLog.stagingDomain
          }
        })
      }

      if (finishedLog.build_errors) {
        toggleErrorNotif(finishedLog, formattedPaths)
      }
      else if (finishedLog.action === 'delete') {
        toggleDeleteNotif(finishedLog)
      }
      else {
        strapi.notification.toggle({
          message: 'Your save of ' + finishedLog.stagingDomain + ' finished, see the result:',
          blockTransition: true,
          link: formattedPaths
        })
      }
      setShownToUser(finishedLog)
    })
  }
}




const setShownToUser = async (log) => {

  const token = await getToken()

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


const toggleSavedNotUpNotif = finishedLog => {

  const [collectionType, id] = finishedLog.build_args.split(" ")

  const link = {
    url: `${strapiHost}/admin/plugins/content-manager/collectionType/application::${collectionType}.${collectionType}/${id}`,
    label: `Click here to complete the article for new build!`,
    color: '#0097f7',
  }

  strapi.notification.toggle({
    type: 'info',
    message: `Your save of ${finishedLog.build_args} finished, not built! Error: Article type is required, but not selected.`,
    blockTransition: true,
    link: link
  })
}

const toggleErrorNotif = (finishedLog, formattedPaths) => {

  const [collectionType, id] = finishedLog.build_args.split(" ")

  formattedPaths.push({
    url: `${strapiHost}/admin/plugins/content-manager/collectionType/plugins::publisher.build_logs/${finishedLog.id}`,
    label: 'Click here for full error log.',
    color: '#ff5d00',
  },
  {
    url: `${strapiHost}/admin/plugins/content-manager/collectionType/application::${collectionType}.${collectionType}/${id}`,
    label: `Click here to complete the article for new build!`,
    color: '#ff5d00',
  })

  strapi.notification.toggle({
    type: 'warning',
    message: 'Your save of ' + finishedLog.stagingDomain + ' failed, unchanged content:',
    blockTransition: true,
    link: formattedPaths
  })
}

const toggleDeleteNotif = (finishedLog) => {

  const link = {
    url: finishedLog.site,
    label: finishedLog.stagingDomain,
  }

    strapi.notification.toggle({
    message: `Your delete of '${finishedLog.build_args}' finished:`,
    blockTransition: true,
    link: link
  })
}

const getToken = () => {
  const token = localStorage.getItem('jwtToken') || sessionStorage.getItem('jwtToken')
  if (token) {
    return token.replace(/"/g, '')
  } else {
    return null
  }
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
