const { google } = require('googleapis')
const path = require('path')
const k_path = path.join(__dirname, 'sheets', '/c_secret.json')
const CSEmail= process.env['CSecretEmail']
const CSPKey= process.env['CSecretPrivateKey']
//const keys = require(k_path)

function readSheet(result, model_name, sheet_id, sheet_name, callback) {

	const client = new google.auth.JWT(
		CSEmail,
		null,
		CSPKey,
		['https://www.googleapis.com/auth/spreadsheets']
	)

	client.authorize(async function(err, tokens) {

		if (err) {
			console.log(err)
			return
		} else {
			// console.log(sheet_id)
			console.log('Result dump to spreadsheet "', sheet_name,'" by ', result?.updated_by?.firstname, "", result?.updated_by?.lastname)

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
		if (parseInt(object[5]) === result.id ) {
			object[0] = JSON.stringify(result)
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
					[append_values]
				]
			}


		}
		res = await googleSheetsAPI.spreadsheets.values.append(appendOptions)

	}

	// console.log(valueList)
	if(result.created_by?.id){
		delete result.created_by
	}
	if(result.updated_by?.id){
		delete result.updated_by
	}
	if(result.created_at) {
		delete result.created_at
	}
	if(result.updated_at) {
		delete result.updated_at
	}

	return valueList
}


 async function update_sheets(result, model_name, sheet_id, sheet_name) {

 	await readSheet(result, model_name, sheet_id, sheet_name, async function (sheetInfo) {
 		// console.log('sheetInfo', sheetInfo)
 	})
 }

exports.readSheet = readSheet
exports.update_sheets = update_sheets
