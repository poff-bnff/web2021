import React, { memo, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import pluginId from '../../pluginId';
import '../../assets/style.css';
import { UserContext, hasPermissions, request, useGlobalContext } from 'strapi-helper-plugin';
import ButtonAndLog from "./ButtonAndLog";


const HomePage = () => {

  return (
    <div className="container-main">
      <h1>Live-i saatmine</h1>
     	 <div className="btn-container">
     	 	<ButtonAndLog site="hoff.ee" buttonText="HÕFF LIVE"/>
     	 	<ButtonAndLog site="kumu.poff.ee" buttonText="KUMU LIVE"/>
     	 	<ButtonAndLog site="filmikool.poff.ee" buttonText="FILMIKOOL LIVE"/>
      	</div>
    </div>
  );
};

export default memo(HomePage);
