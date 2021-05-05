const fs = require('fs')
const yaml = require('js-yaml')
const path = require('path')
const https = require('https')
const { strapiAuth } = require('./strapiAuth.js')
const { spin } = require("./spinner")

const STRAPI_URL = process.env['StrapiHostPoff2021']
const DATAMODEL_PATH = path.join(__dirname, '..', 'docs', 'datamodel.yaml')
const DATAMODEL = yaml.load(fs.readFileSync(DATAMODEL_PATH, 'utf8'))

var TOKEN = ''

async function strapiQuery(options, dataObject = false) {
    // spin.start()
    if (TOKEN === '') {
        TOKEN = await strapiAuth() // TODO: setting global variable is no a good idea
        // console.log('Bearer', TOKEN)
    }
    options.headers['Authorization'] = `Bearer ${TOKEN}`
    options['host'] = process.env['StrapiHostPoff2021']
    // options.timeout = 30000

    // console.log(options, JSON.stringify((dataObject) || ''))
    return new Promise((resolve, reject) => {
        const request = https.request(options, (response) => {
            response.setEncoding('utf8')
            let allData = ''
            response.on('data', function (chunk) {
                allData += chunk
                // process.stdout.write(spin())
            })
            response.on('end', async function () {
                // spin.stop()
                if (!options.full_model_fetch) {
                    process.stdout.write({GET:'?', PUT:'+', POST:'o', DELETE:'X'}[options.method])
                }
                if (response.statusCode === 200) {
                    resolve(JSON.parse(allData))
                // } else if (response.statusCode === 500) {
                //     console.log('\nStatus', response.statusCode, options, JSON.stringify((dataObject) || ''))
                //     let resolved = await strapiQuery(options, dataObject)
                //     resolve(resolved)
                } else {
                    console.log('\nStatus', response.statusCode, options, JSON.stringify((dataObject) || ''))
                    resolve([])
                }
            })
            response.on('error', function (thisError) {
                // spin.stop()
                console.log('\nE:1', thisError)
                reject(thisError)
            })
        })
        request.on('error', async function (thisError) {
            // spin.stop()
            if (thisError.code === 'ETIMEDOUT') {
                process.stdout.write('r')
                let resolved = await strapiQuery(options, dataObject)
                resolve(resolved)
            } else if (thisError.code === 'ECONNRESET') {
                process.stdout.write('r')
                let resolved = await strapiQuery(options, dataObject)
                resolve(resolved)
            } else {
                console.log('\nE:2', thisError)
                reject
            }
        })
        if (dataObject) {
            request.write(JSON.stringify(dataObject))
        }

        request.end()
    })
}

const isObject = item => {
    return (item && typeof item === 'object' && !Array.isArray(item))
}

async function getModel(model, filters={}) {
    if (! model in DATAMODEL) {
        console.log('WARNING: no such model: "', model, '".' )
        return false
    }
    if (! '_path' in DATAMODEL[model]) {
        console.log('WARNING: no path to model: "', model, '".' )
        return false
    }
    if (!isObject(filters)) {
        throw new TypeError('filters should be key-value object')
    }
    let full_model_fetch = false
    const t0 = new Date().getTime()

    if (JSON.stringify(filters) === JSON.stringify({})) {
        full_model_fetch = true
        process.stdout.write(`Fetching every ${model}`)
    }

    filters['_limit'] = '-1'
    let filter_str_a = []
    for (const [key, value] of Object.entries(filters)) {
        filter_str_a.push(key + '=' + encodeURIComponent(value).replace('%20','+'))
    }

    const _path = `https://${STRAPI_URL}${DATAMODEL[model]['_path']}`

    const options = {
        headers: { 'Content-Type': 'application/json' },
        path: `${_path}?${filter_str_a.join('&')}`,
        method: 'GET',
        full_model_fetch: full_model_fetch
    }
    if (filters.length) {
        console.log('=== getModel', filter, options)
    }
    const strapi_data = await strapiQuery(options)
    if (full_model_fetch) {
        process.stdout.write(`. [${new Date().getTime() - t0}ms]`)
    }
    return strapi_data
}

async function putModel(model, data) {
    if (! model in DATAMODEL) {
        console.log('WARNING: no such model: "', model, '".' )
        return false
    }
    if (! '_path' in DATAMODEL[model]) {
        console.log('WARNING: no path to model: "', model, '".' )
        return false
    }

    const _path = `https://${STRAPI_URL}${DATAMODEL[model]['_path']}`
    let results = []
    for (const element of data) {
        const options = {
            headers: { 'Content-Type': 'application/json' },
            path: _path + '/' + element.id,
            method: 'PUT'
        }
        // console.log('=== putModel', options, element)
        results.push(await strapiQuery(options, element))
    }
    return results
}

exports.strapiQuery = strapiQuery
exports.getModel = getModel
exports.putModel = putModel
