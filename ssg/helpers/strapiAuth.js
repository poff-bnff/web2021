const http = require('http')


async function strapiAuth() {

    return new Promise((resolve, reject) => {
        const postData = {
            identifier: process.env['StrapiUserName'],
            password: process.env['StrapiPassword']
        }

        // console.log(process.env['StrapiHostPoff2021'])

        const options = {
            hostname: `localhost`, // process.env['StrapiHostPoff2021']
            port: 1337,
            path: '/auth/local',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
        }
        // console.log({options, postData})
        const request = http.request(options, (response) => {
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
