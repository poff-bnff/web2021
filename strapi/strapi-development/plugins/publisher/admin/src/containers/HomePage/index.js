/*
 *
 * HomePage
 *
 */
import React, { memo, useState } from 'react';
// import PropTypes from 'prop-types';
import pluginId from '../../pluginId';
import './index.css';

import { UserContext, hasPermissions, request } from 'strapi-helper-plugin'




// const sendToLive = (site) =>{
// 	console.log("saaden lehe stagingust live-i  "+site)
// 	//päring minu cutom enpoint-i pihta???

// }

const HomePage = () => {
	const [publishResult, setPublishResult] = useState("Ootan käsklusi")
	const [errorStatus, setErrorStatus] = useState(false)
	const token = sessionStorage.getItem("jwtToken")
	const userInfo = sessionStorage.getItem("userInfo")

	const DoPublish = async (site) => {
	  // console.log(site)
	    const response = await fetch('http://localhost:1337/publisher/publish', {
	      method: 'POST',
	      headers: {
	      	'Content-Type': 'application/json'
	       },
	      body: JSON.stringify({site: site, userInfo: userInfo})
	    })


	    let myResult = await response.json();
	    console.log(myResult)
	    if(response.status === 200){
	    	setPublishResult(myResult.message)
	    }else if( response.status === 429){
	    	setErrorStatus(true)
		    if(Array.isArray(myResult.message)){
		    	myResult=myResult.message[0].messages[0]
		    	setPublishResult(myResult.message)
		    }
	    }else{
		    if(response.statusText && response.status){
		    	setPublishResult(`${response.status}: ${response.statusText}`)
		    }
	    }
	}
  return (
    <div className="container-main">
      <h1>Live-i saatmine</h1>
      <p>Saada leht stagingust live-i</p>
      <h2 className={ errorStatus ? 'error' : 'result-box'}>{publishResult}</h2>
      <div className="btn-container">
        <button className="live-btn" onClick={() => DoPublish("hoff.ee")}>Hõff LIVE</button>
      </div>
    </div>
  );
};

export default memo(HomePage);
