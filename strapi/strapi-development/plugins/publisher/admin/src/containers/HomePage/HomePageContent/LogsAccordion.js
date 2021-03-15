import React, { useState, useEffect, useRef } from 'react';
import { Table, List, ListRow} from '@buffetjs/core';
import moment from 'moment';
import Chevron from "./Chevron";
import "./Accordion.css";
import { List as StyledList, LoadingIndicator } from '@buffetjs/styles';


const LogsAccordion = ({site}) => {

  const [setActive, setActiveState] = useState("");
  const [setHeight, setHeightState] = useState("0px");
  const [setRotate, setRotateState] = useState("accordion__icon");

  const content = useRef(null);

  const toggleAccordion = () => {
    setActiveState(setActive === "" ? "active" : "");
    setHeightState(setActive === "active" ? "0px" : `400px`);
    setRotateState(setActive === "active" ? "accordion__icon" : "accordion__icon rotate");
  };

  const [logs, setLogs] = useState({data: []});
  const [lastLog, setLastLog] = useState({data: []});
  useEffect ( () => {GetLogs()}, []);

  const GetLogs = async () => {
    const token = await JSON.parse(sessionStorage.getItem("jwtToken")) || await JSON.parse(localStorage.getItem("jwtToken"));

    const MakeRequest = async (token) => {
    // console.log("MakeRequest'is token: " + token)
    const response = await fetch(`${strapi.backendURL}/publisher/logs/${site}`,
      { method: 'GET',
        timeout: 0,
        headers: {
          'Authorization': `Bearer ${token}`
        }});
    const logsFromApi = await response.json();
    const sortedLogs = logsFromApi.sort((a, b) => b.id - a.id);
    const restrucLogs = sortedLogs.map((oneLogEntry) => {
      const user = `${oneLogEntry.admin_user.firstname} ${oneLogEntry.admin_user.lastname}`;
      const start = moment(oneLogEntry.start_time).format('HH:mm DD.MM.YY');
      let end;
      if(oneLogEntry.end_time) {
        end = moment(oneLogEntry.end_time).format('HH:mm DD.MM.YY')
      } else {
        end = '¯\\_( ͡ᵔ ͜ʖ ͡ᵔ)_/¯'
      };

      return {user: user,
              start_time: start,
              end_time: end,
              error_code: oneLogEntry.error_code
            };
    });

    setLogs({data: restrucLogs});
    setLastLog({data: [restrucLogs[0]]});
    };

    if(token){
      MakeRequest(token);
    }else{
      console.log("ei saa tokenit kätte :(");
    };
  };

const headers = {data: [{user: "kasutaja", start_time: "algas", end_time: "lõppes", error_code: "error"}]};


  return (
    <div className="accordion__section">
      <button className={`accordion ${setActive}`} onClick={toggleAccordion}>
        {setActive ? (<List items={headers.data}/>) : (<List items={lastLog.data}/>)}
        <Chevron className={`${setRotate}`} width={10} fill={"#777"} />
      </button>
      <div style={{ maxHeight: `${setHeight}` }} className="accordion__content">
        <List items={logs.data} className="logs"/>
      <div className="accordion__text"/>
      </div>
    </div>

  );
};

export default LogsAccordion;