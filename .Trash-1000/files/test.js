const { google } = require('googleapis')
const keys = require('./c_secret.json')

function readSheet(result, model_name, sheet_id, sheet_name, callback) {
	
	const client = new google.auth.JWT(
		keys.client_email, 
		null,
		keys.private_key,
		['https://www.googleapis.com/auth/spreadsheets']
	)

	client.authorize(async function(err, tokens) {
		
		if (err) {
			console.log(err)
			return
		} else {
			// console.log(sheet_id)
			console.log('Result dump to spreadsheet "From_Strapi" by ', result.updated_by.firstname, "", result.updated_by.lastname)

			let data = await googleSheetsRun(client, result, model_name, sheet_id, sheet_name)
			callback(data)
			

		}
	})
}

async function googleSheetsRun(cl, result, model_name, sheet_id, sheet_name) {
	const googleSheetsAPI = google.sheets({
		version: 'v4',
		auth: cl
	})
	let options = {
		spreadsheetId: sheet_id,
		range: sheet_name
	}
	let data = await googleSheetsAPI.spreadsheets.values.get(options)

	let valueList = data.data.values
	let headers = valueList[0]
	// console.log(valueList[0])

	let do_update = false
	for (let object of valueList) {
		if (parseInt(object[0]) === result.id && object[1] === model_name) {
			object[2] = JSON.stringify(result)
			do_update = true
		}

	}

	let res
	if (do_update) {
		const updateOptions = {
			spreadsheetId: sheet_id,
			range: sheet_name,
			valueInputOption: 'USER_ENTERED',
			resource: {
				values: valueList
			}
		}
		res = await googleSheetsAPI.spreadsheets.values.update(updateOptions)
	} else {
		let append_values = JSON.stringify(result)
		// console.log(append_values)

		const appendOptions = {
			spreadsheetId: sheet_id,
			range: sheet_name,
			valueInputOption: 'USER_ENTERED',
			resource: {
				values: [
					[result.id, model_name, append_values]
				]
			}


		}
		res = await googleSheetsAPI.spreadsheets.values.append(appendOptions)

	}

	// console.log(valueList)
	// delete result.created_by
	// delete result.updated_by
	// delete result.created_at
	// delete result.updated_at

	return valueList
}


async function update_sheets(result, model_name, sheet_id, sheet_name) {

	await readSheet(result, model_name, sheet_id, sheet_name, async function (sheetInfo) {
		// console.log('sheetInfo', sheetInfo)

	})
}

exports.readSheet = readSheet
exports.update_sheets = update_sheets
