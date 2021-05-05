const https = require('https')
const fs = require('fs')
const yaml = require('js-yaml')
const fetch = require('node-fetch')


const {parallelLimit} = require('async')

var strapiPath = 'https://' + process.env['StrapiHostPoff2021']
var savePath = 'assets/img/dynamic/img_programmes/'

loadYaml(readYaml);

function loadYaml(readYaml) {
    var doc = '';
    try {
        doc = yaml.load(fs.readFileSync(`source/_fetchdir/programmes.et.yaml`, 'utf8'))

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
    process.stdout.write('Programmes img ')
    let parallelDownloads = []
    // console.log(doc);
    if (doc) {
        for (const ix in doc) {
            const section = doc[ix]
            let images = section.images
            if (images === undefined) {
                continue
            }

            for (const i in section.images) {
                const oneImage = section.images[i]
                if ('url' in oneImage){
                    let imgPath = oneImage.url;
                    let imgFileName = imgPath.split('/')[imgPath.split('/').length - 1]
                    let url = `${strapiPath}${imgPath}`
                    let dest = `${savePath}${imgFileName}`
                    parallelDownloads.push( downloadsMaker(url, dest) )
                }
            }
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

