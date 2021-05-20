import React, { memo, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import ButtonAndLog from "./HomePageContent/ButtonAndLog";
import { Header } from '@buffetjs/custom';
import '../../assets/style.css';
import Container from '../../components/Container';
import Button from '../../components/Button';

const DoBuildFull = async() => {
	console.log("full build")
	// post päring plugina back-i
 
    let userInfo
    console.log(userInfo)
    if(sessionStorage.getItem("userInfo")){
        userInfo = sessionStorage.getItem("userInfo")
    }else if(localStorage.getItem("userInfo")){
        userInfo = localStorage.getItem("userInfo")
    }else{
        console.log("pole userinfot")
    }
    console.log(userInfo)
    const token = await JSON.parse(sessionStorage.getItem("jwtToken")) || await JSON.parse(localStorage.getItem("jwtToken"));

    const MakeRequest = async () => {
      const response = await fetch(`${strapi.backendURL}/publisher/fullbuild`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
         },
        body: JSON.stringify({userInfo: userInfo})
      });

      let myResult = await response.json();

      // if(response.status === 200){
      // strapi.notification.toggle({type: "success", message: `${myResult.message}`, title: "HÕFF", timeout: 5000, blockTransition: false})
      // }else if( response.status === 429){
      //   if(Array.isArray(myResult.message)){
      //     myResult=myResult.message[0].messages[0]
      //     strapi.notification.toggle({type: "warning", message: `${myResult.message}`, title: "HÕFF", timeout: 5000, blockTransition: false})
      //   };
      // }else{
      //   if(response.statusText && response.status){
      //     strapi.notification.toggle({type: "warning", message: `${myResult.message}`, title: "HÕFF", timeout: 5000, blockTransition: false})
      //   };
      // };
    };

    if(token){
      MakeRequest(token);
    }else{
      console.log("ei saa tokenit kätte :(");
    };
}

const HomePage = () => {

  return (
    <Container>
    <Header title={{ label: 'Live-i saatmine' }} content="kopeerib staging lehe live-i"/>
     	 	<ButtonAndLog site="hoff.ee" buttonText="HÕFF LIVE"/>
     	 	<ButtonAndLog site="kumu.poff.ee" buttonText="KUMU LIVE"/>
     	 	<ButtonAndLog site="filmikool.poff.ee" buttonText="FILMIKOOL LIVE"/>
     	 	<ButtonAndLog site="poff.ee" buttonText="PÖFF LIVE"/>
     	 	<ButtonAndLog site="industry.poff.ee" buttonText="INDUSTRY LIVE"/>
     	 	<ButtonAndLog site="justfilm.ee" buttonText="JUSTFILM LIVE"/>
     	 	<ButtonAndLog site="kinoff.ee" buttonText="KINOFF LIVE"/>
     	 	<ButtonAndLog site="shorts.poff.ee" buttonText="SHORTS LIVE"/>
     	 	{/**<Button color="primary" onClick={() => DoBuildFull()}>Full build</Button>**/}
    </Container>
  );
};

export default memo(HomePage);
