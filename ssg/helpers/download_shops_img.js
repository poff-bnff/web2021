const fs = require('fs')
const yaml = require('js-yaml')
const {parallelLimit} = require('async')
const fetch = require('node-fetch')


const strapiPath = 'http://' + process.env['StrapiHost']
const savePath = 'assets/img/dynamic/img_shop/'

loadYaml('et', readYaml);
loadYaml('en', readYaml);
loadYaml('ru', readYaml);

function loadYaml(lang, readYaml) {
    var doc = '';
    try {
        doc = yaml.safeLoad(fs.readFileSync(`source/_fetchdir/shops.${lang}.yaml`, 'utf8'));

    } catch (e) {
        console.log(e);
    }
    fs.mkdir(`${savePath}`, err => {
        if (err) {
        }
    });
    fs.mkdir(`${savePath}${lang}`, err => {
        if (err) {
        }
    });
    readYaml(lang, doc);
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
            process.stdout.write('.')
            res.body.pipe(dest_stream)
            callback(null, url)
        })
    }
}

process.stdout.write('Shops pics ')
function readYaml(lang, doc) {
    let parallelDownloads = []

    if (doc.length) {
        for (shop of doc) {
            if (shop.prodCatList) {
                for (prodCatList of shop.prodCatList) {
                    if (prodCatList.orderedProductCategories) {
                        for (orderedProductCategory of prodCatList.orderedProductCategories) {
                            if (orderedProductCategory.product_category && orderedProductCategory.product_category.images) {
                                let images = orderedProductCategory.product_category.images
                                fs.mkdirSync(`${savePath}${lang}`, {recursive: true})

                                if (images.imageDefault) {
                                    let imgPath = images.imageDefault.url
                                    let imgFileName = imgPath.split('/')[imgPath.split('/').length - 1]
                                    let url = `${strapiPath}${imgPath}`
                                    let dest = `${savePath}${lang}/${imgFileName}`
                                    parallelDownloads.push( downloadsMaker(url, dest) )
                                }
                                if (images.image) {
                                    let imgPath = images.image.url
                                    let imgFileName = imgPath.split('/')[imgPath.split('/').length - 1]
                                    let url = `${strapiPath}${imgPath}`
                                    let dest = `${savePath}${lang}/${imgFileName}`
                                    parallelDownloads.push( downloadsMaker(url, dest) )
                                }
                            }
                        }
                    }
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

