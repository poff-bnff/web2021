const fs = require('fs')
const yaml = require('js-yaml')
const fetch = require('node-fetch')

const {parallelLimit} = require('async')
// teeb sama välja, mis
// const parallelLimit = require('async').parallelLimit


var strapiPath = 'https://' + process.env['StrapiHostPoff2021']
var savePath = 'assets/img/dynamic/img_persons/'

loadYaml(readYaml)

function loadYaml(readYaml) {
    var doc = ''
    try {
        doc = yaml.safeLoad(fs.readFileSync(`source/_fetchdir/teams.et.yaml`, 'utf8'))

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
    process.stdout.write('Team pics ')
    let parallelDownloads = []
    for (team of doc) {
        if (team.subTeam) {
            for (subTeam of team.subTeam) {
                if (subTeam.teamMember) {
                    for (teamMember of subTeam.teamMember) {
                        // console.log(teamMember.pictureAtTeam)
                        if (teamMember.pictureAtTeam && teamMember.pictureAtTeam.length > 0 && teamMember.pictureAtTeam[0].url) {
                            var imgPath = teamMember.pictureAtTeam[0].url
                            var imgFileName = imgPath.split('/')[imgPath.split('/').length - 1]
                        } else if (teamMember.person && teamMember.person.picture) {
                            var imgPath = teamMember.person.picture.url
                            var imgFileName = imgPath.split('/')[imgPath.split('/').length - 1]
                        }
                        if (imgPath) {
                            // download(`${strapiPath}${imgPath}`, `${savePath}${imgFileName}`, ifError)
                            let url = `${strapiPath}${imgPath}`
                            let dest = `${savePath}${imgFileName}`
                            parallelDownloads.push( downloadsMaker(url, dest) )
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
