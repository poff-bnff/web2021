import React, { useState, useEffect } from 'react';
import '../../assets/style.css';
import moment from 'moment';

const LogList = ({site}) => {

	const [logs, setLogs] = useState({data: []});

	// console.log(site);

	useEffect ( () => {
		GetLogs();
	}, []);

	const GetLogs = async () => {
		const response = await fetch(`${strapi.backendURL}/publisher/logs/${site}`, { method: 'GET'});
		const logsFromApi = await response.json();
		// console.log(logsFromApi);
		const sortedLogs = logsFromApi.sort((a, b) => b.id - a.id);
		// console.log(sortedLogs);
		setLogs({data: sortedLogs});

	};


	return (

		<table className="log-table">
			<tbody>
				<tr className="log-labels">
					<th className="label">kasutaja</th>
					<th className="label">algas</th>
					<th className="label">lõppes</th>
				</tr>
				{logs.data.map((log) =>{
					const end = moment(log.endTime).format('HH:mm DD.MM.YY')
					const start = moment(log.startTime).format('HH:mm DD.MM.YY')

					return(<tr className="log-data" key ={log.id}>
						<td className="value">{log.user}</td>
						<td className="value">{start}</td>
						<td className="value">{end}</td>
					</tr>)
					}
				)}
			</tbody>
		</table>
	);
};

export default LogList;