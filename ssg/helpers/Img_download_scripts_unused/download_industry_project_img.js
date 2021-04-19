const fs = require('fs')
const yaml = require('js-yaml')
const fetch = require('node-fetch')

const {parallelLimit} = require('async')
// teeb sama välja, mis
// const parallelLimit = require('async').parallelLimit


var strapiPath = 'https://' + process.env['StrapiHostPoff2021']
var savePath = 'assets/img/dynamic/img_industry_projects/'

loadYaml(readYaml)

function loadYaml(readYaml) {
    var doc = ''
    try {
        doc = yaml.load(fs.readFileSync(`source/_fetchdir/industryprojects.et.yaml`, 'utf8'))

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
    process.stdout.write('Industry project images ')
    let parallelDownloads = []

    for (project of doc) {
        if (project.contactCompany) {
            if (project.contactCompany.logoWhite) {
                var imgPath = project.contactCompany.logoWhite.url
                var imgFileName = imgPath.split('/')[imgPath.split('/').length - 1]
                if (imgPath) {
                    let url = `${strapiPath}${imgPath}`
                    let dest = `${savePath}${imgFileName}`
                    parallelDownloads.push( downloadsMaker(url, dest) )
                }
            }
            if (project.contactCompany.logoColour) {
                var imgPath = project.contactCompany.logoColour.url
                var imgFileName = imgPath.split('/')[imgPath.split('/').length - 1]
                if (imgPath) {
                    let url = `${strapiPath}${imgPath}`
                    let dest = `${savePath}${imgFileName}`
                    parallelDownloads.push( downloadsMaker(url, dest) )
                }
            }
            if (project.contactCompany.logoBlack) {
                var imgPath = project.contactCompany.logoBlack.url
                var imgFileName = imgPath.split('/')[imgPath.split('/').length - 1]
                if (imgPath) {
                    let url = `${strapiPath}${imgPath}`
                    let dest = `${savePath}${imgFileName}`
                    parallelDownloads.push( downloadsMaker(url, dest) )
                }
            }
        }

        if (project.images && project.images.length) {
            for (image of project.images) {
                var imgPath = image.url
                var imgFileName = imgPath.split('/')[imgPath.split('/').length - 1]
                if (imgPath) {
                    let url = `${strapiPath}${imgPath}`
                    let dest = `${savePath}${imgFileName}`
                    parallelDownloads.push( downloadsMaker(url, dest) )
                }
            }
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
