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
      body: JSON.stringify({ site: site, userInfo: userInfo })
    });


    let { message, buildSite, messageType } = await response.json()
    messageType = messageType ? messageType : 'success'
    let title = buildSite.split('.')[0]

    if (title.match(/\b.o..\b/)) {
      title = title[0].concat('ö', title.slice(2))
    }

    if (response.status === 200) {
      console.log(response);
      strapi.notification.toggle({ type: messageType, message: `${message}`, title: title, timeout: 5000, blockTransition: false })
    } else if (response.status === 429) {
      if (Array.isArray(message)) {
        message = message[0].messages[0]
        strapi.notification.toggle({ type: messageType, message: `${message}`, title: title, timeout: 5000, blockTransition: false })
      };
    } else {
      if (response.statusText && response.status) {
        strapi.notification.toggle({ type: messageType, message: `${message}`, title: title, timeout: 5000, blockTransition: false })
      };
    };
  };

  if (token) {
    MakeRequest(token);
  } else {
    console.log("ei saa tokenit kätte :(");
  };
};

const BuildArchive = async (site, userInfo) => {
  console.log("Build archive")
  // post päring plugina back-i

  const token = await JSON.parse(sessionStorage.getItem("jwtToken")) || await JSON.parse(localStorage.getItem("jwtToken"));

  const MakeRequest = async () => {
    const response = await fetch(`${strapi.backendURL}/publisher/buildarchive`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ site: site, userInfo: userInfo })
    });

    let myResult = await response.json();

    if (response.status === 200) {
      strapi.notification.toggle({ type: myResult.type, message: `Arhiivi`, title: "Build archive", timeout: 5000, blockTransition: false })
    } else {
      if (response.statusText && response.status) {
        strapi.notification.toggle({ type: "warning", message: `Tekkis tundmatu viga`, title: "Build archive", timeout: 5000, blockTransition: false })
      };
    };
  };

  if (token) {
    MakeRequest(token);
  } else {
    console.log("ei saa tokenit kätte :(");
  };
}

const ButtonAndLog = ({ site, buttonText }) => {
  let userInfo
  if (sessionStorage.getItem("userInfo")) {
    userInfo = sessionStorage.getItem("userInfo")
  } else if (localStorage.getItem("userInfo")) {
    userInfo = localStorage.getItem("userInfo")
  } else {
    console.log("pole userinfot")
  }

  //title kohale viimane logi ja content kohale tabel logidest
  const superAdminRoleId = 1
  if (userInfo && JSON.parse(userInfo).roles.map(r => r.id).includes(superAdminRoleId)) {
    const sitesWithFilms = [
      'poff.ee',
      'justfilm.ee',
      'kinoff.poff.ee',
      'shorts.poff.ee',
      'kumu.poff.ee',
      'tartuff.ee',
      'oyafond.ee',
    ]
    const disabled = sitesWithFilms.includes(site) ? false : true
    const buttonArchiveText = disabled ? '' : 'ARCHIVE'
    const buttonArchiveColor = disabled ? '#f8f9fa' : '#F36C3F'

    return (
      <div className="btn-and-log">
        <Button color="primary" onClick={() => DoPublish(site, userInfo)}>{buttonText}</Button>&nbsp;
        <Button color="primary" style={{ width: '90px', background: buttonArchiveColor }} disabled={disabled} onClick={() => BuildArchive(site, userInfo)}>{buttonArchiveText}</Button>
        <LogsAccordion site={site} />
      </div>
    );
  } else {
    return (
      <div className="btn-and-log">
        <Button color="primary" onClick={() => DoPublish(site, userInfo)}>{buttonText}</Button>
        <LogsAccordion site={site} />
      </div>
    );
  }
};

export default ButtonAndLog;