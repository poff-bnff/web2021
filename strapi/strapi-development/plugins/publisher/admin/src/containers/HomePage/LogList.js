import React, { useState, useEffect } from 'react';
import '../../assets/style.css';

const LogList = ({site}) => {

	const [logs, setLogs] = useState({data: []});

	console.log(site);

	useEffect ( () => {
		GetLogs();
	}, []);

	const GetLogs = async () => {
		const response = await fetch(`${strapi.backendURL}/publisher/logs/${site}`, { method: 'GET'});
		const logsFromApi = await response.json();
		console.log(logsFromApi);
		const sortedLogs = logsFromApi.sort((a, b) => b.id - a.id);
		console.log(sortedLogs);
		setLogs({data: sortedLogs});

	};

	const formatDate = (date) => {
		const d= new Date(date);
		const weekdays = [ 'E', 'T', 'K', 'N', 'R', 'L', 'P' ]
		const formatedDate = `${weekdays[d.getDay()]}: ${d.getDate()}.${d.getMonth()+1}.${d.getFullYear()} ${d.getHours()}:${d.getMinutes()}`
		// console.log(formatedDate);
		return formatedDate;
	}


	return (

		<table className="log-table">
			<tbody>
				<tr className="log-labels">
					<th className="label">kasutaja</th>
					<th className="label">domeen</th>
					<th className="label">algas</th>
					<th className="label">lõppes</th>
				</tr>
				{logs.data.map((log) =>{
					const end = formatDate(log.endTime)
					const start = formatDate(log.startTime)

					return(<tr className="log-data" key ={log.id}>
						<td className="value">{log.user}</td>
						<td className="value">{log.site}</td>
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