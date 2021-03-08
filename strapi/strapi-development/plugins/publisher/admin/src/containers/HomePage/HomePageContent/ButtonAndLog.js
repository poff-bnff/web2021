import React, { useState, useEffect } from 'react';
import ListOfLogs from "./ListOfLogs";
import Button from '../../../components/Button';
import { Flex, Text } from '@buffetjs/core';



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
    // console.log(myResult)
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

const ButtonAndLog = ({site, buttonText}) => {
	let userInfo
	if(sessionStorage.getItem("userInfo")){
		userInfo = sessionStorage.getItem("userInfo")
	}else if(localStorage.getItem("userInfo")){
		userInfo = localStorage.getItem("userInfo")
	}else{
		console.log("pole userinfot")
	}

	return (
		<Flex justifyContent='jusify-content' alignItems="normal" className="buttons">
		    <Button color="primary" onClick={() => DoPublish(site, userInfo)}>{buttonText}</Button>
          	{/**<ListOfLogs site={site}/>**/}
    	</Flex>
	);
};

export default ButtonAndLog;