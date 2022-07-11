let https = require(process.env['StrapiProtocol'])
let strapiAddress = process.env['StrapiHost']
let strapiPort = process.env['StrapiPort']

async function strapiAuth() {

    return new Promise((resolve, reject) => {
        const postData = {
            identifier: process.env['StrapiUserName'],
            password: process.env['StrapiPassword']
        }

        const options = {
            hostname: strapiAddress,
            path: '/auth/local',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
        }

        if (process.env['StrapiProtocol'] !== 'https'){
            options.port = strapiPort
        }

        // console.log({options, postData})
        const request = https.request(options, (response) => {
            response.setEncoding('utf8')
            let tokenStr = ''
            response.on('data', function (chunk) {
                tokenStr += chunk
            })

            response.on('end', function () {
                try {
                    tokenStr = JSON.parse(tokenStr)['jwt']
                    resolve(tokenStr)
                } catch (err) {
                    for (let i = 0; i < 5; i++) {
                        console.log('!!!!!!!!!!!!!!!!!!!!!!!! ERROR, STRAPI IS DOWN !!!!!!!!!!!!!!!!!!!!!!!!');
                    }
                    reject
                }
            })

        })

        request.on('error', reject)
        request.write(JSON.stringify(postData))
        request.end()
    })
}
exports.strapiAuth = strapiAuth
