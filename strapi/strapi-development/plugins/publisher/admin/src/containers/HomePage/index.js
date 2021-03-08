import React, { memo, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import ButtonAndLog from "./HomePageContent/ButtonAndLog";
import { Header } from '@buffetjs/custom';
import '../../assets/style.css';
import Container from '../../components/Container';


const HomePage = () => {

  return (
    <Container>
    <Header title={{ label: 'Live-i saatmine' }} content="kopeerib staging lehe live-i"/>
     	 	<ButtonAndLog site="hoff.ee" buttonText="HÕFF LIVE"/>
     	 	<ButtonAndLog site="kumu.poff.ee" buttonText="KUMU LIVE"/>
     	 	<ButtonAndLog site="filmikool.poff.ee" buttonText="FILMIKOOL LIVE"/>
    </Container>
  );
};

export default memo(HomePage);
