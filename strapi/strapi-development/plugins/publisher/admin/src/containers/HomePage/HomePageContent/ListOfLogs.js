import React, { useState, useEffect } from 'react';
import { Table } from '@buffetjs/core';
import moment from 'moment';

const ListOfLogs = ({ site }) => {

  const [logs, setLogs] = useState({ data: [] });
  useEffect(() => { GetLogs() }, []);

  const GetLogs = async () => {
    const response = await fetch(`${strapi.backendURL}/publisher/logs/${site}`, { method: 'GET' });
    const logsFromApi = await response.json();
    console.log(logsFromApi);
    const sortedLogs = logsFromApi.sort((a, b) => b.id - a.id);
    const restrucLogs = sortedLogs.map((oneLogEntry) => {
      const log_id = oneLogEntry.id
      const user = `${oneLogEntry.admin_user.firstname} ${oneLogEntry.admin_user.lastname}`
      const start = oneLogEntry.start_time ? moment(oneLogEntry.start_time).format('HH:mm DD.MM.YY') : 'järjekorras'
      const type = `${oneLogEntry.type} `
      let end
      if (oneLogEntry.end_time) {
        end = moment(oneLogEntry.end_time).format('HH:mm DD.MM.YY')
      }
      else {
        end = '¯\\_( ͡ᵔ ͜ʖ ͡ᵔ)_/¯'
      }
      return {
        log_id: log_id,
        user: user,
        start_time: start,
        end_time: end,
        type: type
      }
    })
    setLogs({ data: restrucLogs });
  };

  const headers = [
    {
      name: 'log id',
      value: 'log_id',
      isSortEnabled: true,
    },
    {
      name: 'kasutaja',
      value: 'user',
      isSortEnabled: true,
    },
    {
      name: 'algas',
      value: 'start_time',
      isSortEnabled: true,
    },
    {
      name: 'lõppes',
      value: 'end_time',
      isSortEnabled: true,
    },
    {
      name: 'tegevus',
      value: 'type',
      isSortEnabled: true,
    },
    {
      name: 'end-status',
      value: 'type',
      isSortEnabled: true,
    },
  ];


  // {    <Table headers={headers} rows={logs.data} className="logs"
  //     onClickRow={(e, data) => {
  //         console.log(data.user);
  //         alert('You have just clicked ' + data.user);
  //       }}/>}

  return (
    <Table headers={headers} rows={logs.data} className="logs" />

  );
};

export default ListOfLogs;
