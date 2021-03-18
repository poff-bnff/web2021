import React, { useState, useEffect } from 'react';
import ListOfLogs from "./ListOfLogs";
import Button from '../../../components/Button';
import LogsAccordion from "./LogsAccordion";
import { Flex, Text } from '@buffetjs/core';



const DoPublish = async (site, userInfo) => {
	const token = await JSON.parse(sessionStorage.getItem("jwtToken")) || await JSON.parse(localStorage.getItem("jwtToken"));

	const MakeRequest = async () => {
	    const response = await fetch(`${strapi.backendURL}/publisher/publish`, {
	      method: 'POST',
	      headers: {
	      	'Authorization': `Bearer ${token}`,
	      	'Content-Type': 'application/json'
	       },
	      body: JSON.stringify({site: site, userInfo: userInfo})
	    });


	    let myResult = await response.json();

	    if(response.status === 200){
			strapi.notification.toggle({type: "success", message: `${myResult.message}`, title: "HÕFF", timeout: 5000, blockTransition: false})
	    }else if( response.status === 429){
		    if(Array.isArray(myResult.message)){
		    	myResult=myResult.message[0].messages[0]
		    	strapi.notification.toggle({type: "warning", message: `${myResult.message}`, title: "HÕFF", timeout: 5000, blockTransition: false})
		    };
	    }else{
		    if(response.statusText && response.status){
		    	strapi.notification.toggle({type: "warning", message: `${myResult.message}`, title: "HÕFF", timeout: 5000, blockTransition: false})
		    };
	    };
	};

	if(token){
      MakeRequest(token);
    }else{
      console.log("ei saa tokenit kätte :(");
    };
};

const ButtonAndLog = ({site, buttonText}) => {
	let userInfo
	if(sessionStorage.getItem("userInfo")){
		userInfo = sessionStorage.getItem("userInfo")
	}else if(localStorage.getItem("userInfo")){
		userInfo = localStorage.getItem("userInfo")
	}else{
		console.log("pole userinfot")
	}

	//title kohale viimane logi ja content kohale tabel logidest

	return (
		<div className="btn-and-log">
		    <Button color="primary" onClick={() => DoPublish(site, userInfo)}>{buttonText}</Button>
		    <LogsAccordion site={site}/>
          	<ListOfLogs site={site}/>
    	</div>
	);
};

export default ButtonAndLog;