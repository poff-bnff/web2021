const https = require('https')
const fs = require('fs')
const yaml = require('js-yaml')
const fetch = require('node-fetch')


const {parallelLimit} = require('async')

var strapiPath = 'https://' + process.env['StrapiHostPoff2021']
var savePath = 'assets/img/dynamic/img_supporters/'

loadYaml(readYaml);

function loadYaml(readYaml) {
    var doc = '';
    try {
        doc = yaml.safeLoad(fs.readFileSync(`source/_fetchdir/supporterspage.et.yaml`, 'utf8'))

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
    process.stdout.write('Supporter page pics ')
    let parallelDownloads = []
    // console.log(doc);
    if (doc.supporters) {
        for (const ix in doc.supporters) {
            const section = doc.supporters[ix]
            for (const i in section.supporter) {
                const logo = section.supporter[i]
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
        }
    }
    if (doc.socialGroup) {
        for (const ix in doc.socialGroup) {
            const group = doc.socialGroup[ix]
            for (const i in group.items) {
                const items = group.items[i]
                if ('svgMedia' in items && 'url' in items.svgMedia){
                    let imgPath = items.svgMedia.url;
                    let imgFileName = imgPath.split('/')[imgPath.split('/').length - 1]
                    let url = `${strapiPath}${imgPath}`
                    let dest = `${savePath}${imgFileName}`
                    parallelDownloads.push( downloadsMaker(url, dest) )
                }
            }
        }
    }
    if (doc.item) {
        for (const ix in doc.item) {
            const item = doc.item[ix]
            if ('image' in item && 'url' in item.image) {
                // console.log(item.image);
                let imgPath = item.image.url;
                let imgFileName = imgPath.split('/')[imgPath.split('/').length - 1]
                let url = `${strapiPath}${imgPath}`
                let dest = `${savePath}${imgFileName}`
                parallelDownloads.push( downloadsMaker(url, dest) )
            }
        }

        for (const ix in doc.item) {
            const item = doc.item[ix]
            for (const i in item.svgItem) {
                const media = item.svgItem[i]
                if('svgMedia' in media &&'url' in media.svgMedia) {
                    // console.log(media.svgMedia.url);
                    let imgPath = media.svgMedia.url;
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

