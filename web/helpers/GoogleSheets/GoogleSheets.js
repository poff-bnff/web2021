const fs = require('fs')
const readline = require('readline')
const { google } = require('googleapis')

process.chdir(__dirname)


async function connect() {

    // t88kataloogiks skripti kataloog

    // If modifying these scopes, delete token.json.
    const SCOPES = ['https://www.googleapis.com/auth/spreadsheets']
    // The file token.json stores the user's access and refresh tokens, and is
    // created automatically when the authorization flow completes for the first
    // time.

    // Load client secrets from a local file.
    const CREDENTIALS_PATH = 'credentials.json'
    const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH))
    const {client_secret, client_id, redirect_uris} = credentials.installed
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0])

    // Check if we have previously stored a token.
    const TOKEN_PATH = 'token.json'
    const token = await getToken()
    oAuth2Client.setCredentials(token)
    return oAuth2Client

    async function getToken() {
        if(fs.existsSync(TOKEN_PATH)) {
            return JSON.parse(fs.readFileSync(TOKEN_PATH))
        } else {
            return await getNewToken(oAuth2Client)
        }
    }

    /**
     * Get and store new token after prompting for user authorization, and then
     * execute the given callback with the authorized OAuth2 client.
     * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
     * @param {getEventsCallback} callback The callback for the authorized client.
     */
    async function getNewToken(oAuth2Client) {
        const authUrl = oAuth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: SCOPES,
        })
        console.log('Authorize this app by visiting this url:', authUrl)
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        })
        rl.question('Enter the code from that page here: ', async (code) => {
            rl.close()
            await oAuth2Client.getToken(code, (err, token) => {
                if (err) return console.error('Error while trying to retrieve access token', err)
                // Store the token to disk for later program executions
                fs.writeFileSync(TOKEN_PATH, JSON.stringify(token))
                return token
            })
        })
    }
}

Write = async (sheet_id, range, values) => {
    const auth = await connect()
    const sheets = google.sheets({ version: 'v4', auth })
    sheets.spreadsheets.values.get(
        {
            spreadsheetId: '1kc6Fcx5kd5_DwQr_haATahTHhsjajZpsoea8Zc7oKFM',
            range: 'Sheet1!a3',
        }, (err, res) => {
            if (err) return console.log('The API returned an error: ' + err)
            console.log(res.data.values)
        }
    )
    sheets.spreadsheets.values.update(
        {
            spreadsheetId: sheet_id,
            range: range,
            valueInputOption: 'RAW',
            resource: { values: values }
        }, (err, res) => {
            if (err) return console.log('The API returned an error: ' + err)
            console.log(res.data)
        }
    )
}
module.exports.Write = Write

// const values = [
//     ['FOO','bar','baz'],
//     ['FOO2','bar','baz'],
//     ['FOO3','bar','baz']
// ]
// Write('1kc6Fcx5kd5_DwQr_haATahTHhsjajZpsoea8Zc7oKFM', 'Sheet1!a4', values)
