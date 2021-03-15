import React, { memo, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import ButtonAndLog from "./HomePageContent/ButtonAndLog";
import { Header } from '@buffetjs/custom';
import '../../assets/style.css';
import Container from '../../components/Container';
import Button from '../../components/Button';

const DoBuildFull = () => {
	console.log("full build")
	//post päring plugina back-i
	   //  const response = await fetch(`${strapi.backendURL}/publisher/publish`, {
    //   method: 'POST',
    //   headers: {
    //   	'Content-Type': 'application/json'
    //    },
    //   body: JSON.stringify({site: site, userInfo: userInfo})
    // })
}




const HomePage = () => {

  return (
    <Container>
    <Header title={{ label: 'Live-i saatmine' }} content="kopeerib staging lehe live-i"/>
     	 	<ButtonAndLog site="hoff.ee" buttonText="HÕFF LIVE"/>
     	 	<ButtonAndLog site="kumu.poff.ee" buttonText="KUMU LIVE"/>
     	 	<ButtonAndLog site="filmikool.poff.ee" buttonText="FILMIKOOL LIVE"/>
     	 	{/**<Button color="primary" onClick={() => DoBuildFull()}>Full build</Button>**/}
    </Container>
  );
};

export default memo(HomePage);
