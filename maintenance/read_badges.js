const EVENTIVAL_API_TOKEN = process.env.EVENTIVAL_API_TOKEN
const EVENTIVAL_EDITION = process.env.EVENTIVAL_EDITION || '27th'
const EVENTIVAL_HOST = 'bo.eventival.com'
const EVENTIVAL_PATH = `/poff/${EVENTIVAL_EDITION}/api/people`

const https = require('https')

async function readBadges(emailAddress) {

    return new Promise((resolve, reject) => {
        const options = {
            hostname: EVENTIVAL_HOST,
            path: `${EVENTIVAL_PATH}?account_email=${emailAddress}`,
            method: 'GET',
            headers: {
                'x-api-key': EVENTIVAL_API_TOKEN
            }
        }

        const request = https.request(options, (response) => {
            response.setEncoding('utf8')
            let responseBody = ''
            response.on('data', function (chunk) {
                responseBody += chunk
            })

            response.on('end', function () {
                try {
                    responseJSON = JSON.parse(responseBody)[0]['badges']
                        .filter(badge => !badge['cancelled'])
                        .map(badge => {
                            return {
                                type: badge['type'],
                                barcode: badge['barcode'],
                                validity_dates: badge['validity_dates']
                            }
                        })
                    resolve(responseJSON)
                } catch (err) {
                    console.log('foo', err)
                    reject
                }
            })

        })
        request.on('error', (e) => {
            console.error('EEE*', e)
            reject
        })
        request.end()
    })
}


// await readBadges('jaan.leppik@poff.ee')
const main = async () => {
    const badges = await readBadges('jaan.leppik@poff.ee')
    console.log(badges)
}

main()