const fs = require('fs')
const yaml = require('js-yaml')
const fetch = require('node-fetch')
const STRAPIDATA = yaml.load(fs.readFileSync(`source/_fetchdir/strapiData.yaml`, 'utf8'))['Person']


const {parallelLimit} = require('async')
// teeb sama välja, mis
// const parallelLimit = require('async').parallelLimit


var strapiPath = 'https://' + process.env['StrapiHostPoff2021']
var savePath = 'assets/img/dynamic/img_persons/'

loadYaml(readYaml)

function loadYaml(readYaml) {
    var doc = ''
    try {
        doc = STRAPIDATA
    } catch (e) {
        console.log(e)
    }
    fs.mkdir(`${savePath}`, err => {
        if (err) {
        }
    })
    readYaml(doc)
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

// Read more about closures: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Closures
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
    process.stdout.write('Persons pics ')
    let parallelDownloads = []
    for (person of doc) {

        // console.log(person.pictureAtTeam)
        if (person.picture && person.picture.url) {
            var imgPath = person.picture.url
            var imgFileName = imgPath.split('/')[imgPath.split('/').length - 1]
        }
        if (imgPath) {
            // download(`${strapiPath}${imgPath}`, `${savePath}${imgFileName}`, ifError)
            let url = `${strapiPath}${imgPath}`
            let dest = `${savePath}${imgFileName}`
            parallelDownloads.push( downloadsMaker(url, dest) )
        }

    }
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
