const fs = require('fs')
const yaml = require('js-yaml')
const path = require('path')
const {parallelLimit} = require('async')
const fetch = require('node-fetch')
const { values } = require('lodash')


const strapiPath = 'https://' + process.env['StrapiHostPoff2021']
const cassetteSavePath = path.join(__dirname, '..', 'assets', 'img', 'dynamic', 'img_films')
const filmSavePath = path.join(__dirname, '..', 'assets', 'img', 'dynamic', 'img_films')

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
            // console.log(dest);
            callback(null, url)
        })
    }
}

process.stdout.write('Cassettes and films pics ')
let parallelDownloads = []

var cassetteData = ''
try {
    const cassetteDataFile = path.join('source', '_fetchdir', `cassettes.en.yaml`)
    cassetteData = yaml.safeLoad(fs.readFileSync(cassetteDataFile, 'utf8'))
} catch (e) {
    console.log(e)
}

for (cassetteIx in cassetteData) {
    let values = cassetteData[cassetteIx]
    if (!values.dirSlug) {
        continue
    }

    const cassetteImgDir = path.join(cassetteSavePath, values.dirSlug)
    fs.mkdirSync( path.join(cassetteSavePath, values.dirSlug), {recursive: true} )



    if (values.media && values.media.stills && values.media.stills[0]) {
        for (stillIx in values.media.stills) {
            // console.log(values.media.stills[stillIx]);
            const imgPath = values.media.stills[stillIx].url
            const imgFileName = path.basename(imgPath)
            const url = `${strapiPath}${imgPath}`
            const dest = path.join(cassetteImgDir, imgFileName)
            parallelDownloads.push( downloadsMaker(url, dest) )
        }
    }

    if (values.media && values.media.posters && values.media.posters[0]) {
        for (posterIx in values.media.posters) {
            // console.log(values.media.stills[posterIx]);
            const imgPath = values.media.posters[posterIx].url
            const imgFileName = path.basename(imgPath)
            const url = `${strapiPath}${imgPath}`
            const dest = path.join(cassetteImgDir, imgFileName)
            parallelDownloads.push( downloadsMaker(url, dest) )
        }
    }

    if (values.films && values.films[0]) {
        for(filmIx in values.films) {
            let film = values.films[filmIx]
            if (!film.dirSlug) {
                continue
            }

            const filmImgDir = path.join(filmSavePath, film.dirSlug)
            fs.mkdirSync( path.join(filmSavePath, film.dirSlug), {recursive: true} )



            if (film.media && film.media.stills && film.media.stills[0]) {
                for (stillIx in film.media.stills) {
                    // console.log(film.media.stills[stillIx]);
                    const imgPath = film.media.stills[stillIx].url
                    const imgFileName = path.basename(imgPath)
                    const url = `${strapiPath}${imgPath}`
                    const dest = path.join(filmImgDir, imgFileName)
                    // console.log(film.title, film.dirSlug, url, dest);
                    parallelDownloads.push( downloadsMaker(url, dest) )
                }
            }

            if (film.media && film.media.posters && film.media.posters[0]) {
                for (posterIx in film.media.posters) {
                    // console.log(film.media.stills[posterIx]);
                    const imgPath = film.media.posters[posterIx].url
                    const imgFileName = path.basename(imgPath)
                    const url = `${strapiPath}${imgPath}`
                    const dest = path.join(filmImgDir, imgFileName)
                    parallelDownloads.push( downloadsMaker(url, dest) )
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

// function download(url, dest, parallelCB, retrys=5) {
//     let fileSizeInBytes = 0
//     if (fs.existsSync(dest)) {
//         const stats = fs.statSync(dest);
//         fileSizeInBytes = stats.size;
//     }
//     try {

//     } catch (error) {

//     }
//     http.get(url, function (response) {
//         const { statusCode } = response
//         if (response.headers["content-length"] !== fileSizeInBytes.toString()) {
//             // console.log(typeof(response.headers["content-length"]));
//             let file = fs.createWriteStream(dest);
//             response.pipe(file);
//             file.on('finish', function () {
//                 file.close(() => {
//                     // console.log('Try', retrys, `Downloaded: Article img ${url.split('/')[url.split('/').length - 1]} downloaded to ${dest} - ${response.headers["content-length"]} bytes`)
//                     setTimeout(() => {
//                         parallelCB(null, 'downloaded ' + url)
//                     }, 500)
//                 })
//             })
//         }else{
//             // console.log('Try', retrys, `Skipped: Article img ${url.split('/')[url.split('/').length - 1]} due to same exists`)
//             setTimeout(() => {
//                 parallelCB(null, 'skipped ' + url)
//             }, 500)
//         }
//     }).on('error', function (err) {
//         console.log('ERROR', url, err)
//         if (retrys > 0) {
//             download(url, dest, parallelCB, retrys-1)
//         }
//         parallelCB(err)
//     })
// }
