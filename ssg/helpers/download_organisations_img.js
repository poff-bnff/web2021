const http = require('http')
const fs = require('fs')
const yaml = require('js-yaml')
const fetch = require('node-fetch')
const STRAPIDATA = yaml.safeLoad(fs.readFileSync(`source/_fetchdir/strapiData.yaml`, 'utf8'))['Organisation']

const {parallelLimit} = require('async')

var strapiPath = 'http://' + process.env['StrapiHostPoff2021']
var savePath = 'assets/img/dynamic/img_org/'

loadYaml(readYaml);

function loadYaml(readYaml) {
    var doc = '';
    try {
        doc = STRAPIDATA

    } catch (e) {
        console.log(e);
    }
    fs.mkdir(`${savePath}`, err => {
        if (err) {
        }
    })
    readYaml(doc);
}

const delay = (ms) => {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve()
        }, ms)
    })
}
function retryFetch (url, fetchOptions={}, retries=3, retryDelay=1000) {
    return new Promise((resolve, reject) => {
        const wrapper = n => {
            fetch(url, fetchOptions)
                .then(res => { resolve(res) })
                .catch(async err => {
                    if(n > 0) {
                        console.log(`retrying ${n}`)
                        await delay(retryDelay)
                        wrapper(--n)
                    } else {
                        reject(err)
                    }
                })
        }

        wrapper(retries)
    })
}

function downloadsMaker(url, dest) {
    return function(parallelCB) {
        retryFetch(url)
        .then(res => {
            const callback = parallelCB
            const dest_stream = fs.createWriteStream(dest)
            res.body.pipe(dest_stream)
            process.stdout.write('.')
            callback(null, url)
        })
    }
}

function readYaml(doc) {
    process.stdout.write('Organisations pics ')
    let parallelDownloads = []
    // console.log(doc);
            for (const i in doc) {
                const logo = doc[i]
                if ('logoWhite' in logo && 'url' in logo.logoWhite){
                    let imgPathW = logo.logoWhite.url;
                    let imgFileName = imgPathW.split('/')[imgPathW.split('/').length - 1]
                    let url = `${strapiPath}${imgPathW}`
                    let dest = `${savePath}${imgFileName}`
                    parallelDownloads.push( downloadsMaker(url, dest) )
                }

                if ('logoColour' in logo && 'url' in logo.logoColour){
                    let imgPathC = logo.logoColour.url;
                    let imgFileName = imgPathC.split('/')[imgPathC.split('/').length - 1]
                    let url = `${strapiPath}${imgPathC}`
                    let dest = `${savePath}${imgFileName}`
                    parallelDownloads.push( downloadsMaker(url, dest) )
                }

                if ('logoBlack' in logo && 'url' in logo.logoBlack){
                    let imgPathB = logo.logoBlack.url;
                    let imgFileName = imgPathB.split('/')[imgPathB.split('/').length - 1]
                    let url = `${strapiPath}${imgPathB}`
                    let dest = `${savePath}${imgFileName}`
                    parallelDownloads.push( downloadsMaker(url, dest) )
                }
            }

    // console.log(parallelDownloads);
    parallelLimit(
        parallelDownloads,
        10,
        function(err, results) {
            if (err) {
                console.log(err)
            }
            console.log(' ' + results.length + ' files downloaded.')
        }
    )
}

