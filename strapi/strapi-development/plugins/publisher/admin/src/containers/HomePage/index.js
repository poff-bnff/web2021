import React, { memo, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import pluginId from '../../pluginId';
import '../../assets/style.css';
import { UserContext, hasPermissions, request, useGlobalContext } from 'strapi-helper-plugin';



// Display a loader that will prevent the user from interacting with the application.
//strapi.lockApp()
//strapi.unlockApp()
//console.log("backendURL: ",strapi.backendURL)
//console.log("administration url: ",strapi.remoteURL)
// strapi.notification.toggle(config); https://strapi.io/documentation/developer-docs/latest/plugin-development/frontend-development.html#api
const DoPublish = async (site, userInfo) => {

    const response = await fetch(`${strapi.backendURL}/publisher/publish`, {
      method: 'POST',
      headers: {
      	'Content-Type': 'application/json'
       },
      body: JSON.stringify({site: site, userInfo: userInfo})
    })

    //link:{url:"/logs", label: "vaata logi"},

    let myResult = await response.json();
    console.log(myResult)
    if(response.status === 200){
		strapi.notification.toggle({type: "success", message: `${myResult.message}`, title: "HÕFF", timeout: 5000, blockTransition: false})
    }else if( response.status === 429){
    	// setErrorStatus(true)
	    if(Array.isArray(myResult.message)){
	    	myResult=myResult.message[0].messages[0]
	    	strapi.notification.toggle({type: "warning", message: `${myResult.message}`, title: "HÕFF", timeout: 5000, blockTransition: false})
	    	// setPublishResult(myResult.message)
	    }
    }else{
	    if(response.statusText && response.status){
	    	// setPublishResult(`${response.status}: ${response.statusText}`)
	    	strapi.notification.toggle({type: "warning", message: `${myResult.message}`, title: "HÕFF", timeout: 5000, blockTransition: false})
	    }
    }
}

const HomePage = () => {
  let userInfo
  if(sessionStorage.getItem("userInfo")){
    userInfo = sessionStorage.getItem("userInfo")
  }else if(localStorage.getItem("userInfo")){
    userInfo = localStorage.getItem("userInfo")
  }else{
    console.log("pole userinfot")
  }



  return (
    <div className="container-main">
      <h1>Live-i saatmine</h1>
     	 <div className="btn-container">
        	<button className='live-btn' onClick={() => DoPublish("hoff.ee", userInfo)}>Hõff LIVE</button>
          <button className='live-btn' onClick={() => DoPublish("kumu.poff.ee", userInfo)}>Kumu LIVE</button>
      </div>
    </div>
  );
};

export default memo(HomePage);
