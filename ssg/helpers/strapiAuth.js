const https = require('https')


async function strapiAuth() {

    return new Promise((resolve, reject) => {
        const postData = {
            identifier: process.env['StrapiUserName'],
            password: process.env['StrapiPassword']
        }

        const options = {
            hostname: process.env['StrapiHostPoff2021'],
            path: '/auth/local',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        }

        const request = https.request(options, (response) => {
            response.setEncoding('utf8')
            let tokenStr = ''
            response.on('data', function (chunk) {
                tokenStr += chunk
            })

            response.on('end', function () {
                tokenStr = JSON.parse(tokenStr)['jwt']
                resolve(tokenStr)
            })
        })

        request.on('error', reject)
        request.write(JSON.stringify(postData))
        request.end()
    })
}
exports.strapiAuth = strapiAuth
