const fs = require('fs')
const yaml = require('js-yaml')
const path = require('path')

const strapiDataDirPath = path.join(__dirname, '..', 'source', '_domainStrapidata')
const strapiDataFilmPath = path.join(strapiDataDirPath, 'Film.yaml')
const strapiDataFilmUpdatesPath = path.join(strapiDataDirPath, 'Film_updates.yaml')
const strapiDataCassettePath = path.join(strapiDataDirPath, 'Cassette.yaml')
const strapiDataCassetteUpdatesPath = path.join(strapiDataDirPath, 'Cassette_updates.yaml')
const { timer } = require("./timer")
const { update } = require('lodash')
timer.start(__filename)

const JSONcopy = obj => JSON.parse(JSON.stringify(obj))

deleteFolderRecursive = path => {
    if (fs.existsSync(path)) {
        fs.readdirSync(path).forEach(function (file) {
            var curPath = path + "/" + file
            if (fs.lstatSync(curPath).isDirectory()) { // recurse
                deleteFolderRecursive(curPath)
            } else { // delete file
                fs.unlinkSync(curPath)
            }
        })
        fs.rmdirSync(path)
    }
}

function mergeStrapidataFilms() {
    timer.log(__filename, 'mergeStrapidata Films')

    if (!fs.existsSync(strapiDataFilmUpdatesPath)) {
        fs.writeFileSync(strapiDataFilmUpdatesPath, '[]')
    }

    let updates = yaml.load(fs.readFileSync(strapiDataFilmUpdatesPath, 'utf8'))
    if (updates.length > 0) {
        timer.log(__filename, `mergeStrapidata Films updates had ${updates.length} entries`)
        const base = yaml.load(fs.readFileSync(strapiDataFilmPath, 'utf8'))
            // convert array to object, so that we can use cassette.id as key
            .reduce((obj, item) => {
                obj[item.id] = item
                return obj
            }, {})
        timer.log(__filename, `mergeStrapidata Films base had ${Object.keys(base).length} entries`)
        updates = updates
            // do the same for updates
            .reduce((obj, item) => {
                obj[item.id] = item
                return obj
            }, {})
        timer.log(__filename, `mergeStrapidata Films updates had ${Object.keys(updates).length} entries`)
        // merge base and updates and convert back to array and write to Film.yaml
        let merged = Object.values(Object.assign({}, base, updates))
        timer.log(__filename, `mergeStrapidata Films merged had ${merged.length} entries`)
        fs.writeFileSync(strapiDataFilmPath, yaml.dump(merged))
        // empty Cassette_updates.yaml
        fs.writeFileSync(strapiDataFilmUpdatesPath, '[]')
        timer.log(__filename, `mergeStrapidata Films merged and saved to ${strapiDataFilmPath}`)
        timer.log(__filename, `mergeStrapidata Films updates emptied ${strapiDataFilmUpdatesPath}`)
    }
}

function loadStrapidataFilms() {
    mergeStrapidataFilms()
    return yaml.load(fs.readFileSync(strapiDataFilmPath, 'utf8'))
}

function mergeStrapidataCassettes() {
    mergeStrapidataFilms()
    if (!fs.existsSync(strapiDataCassetteUpdatesPath)) {
        fs.writeFileSync(strapiDataCassetteUpdatesPath, '[]')
    }

    let updates = yaml.load(fs.readFileSync(strapiDataCassetteUpdatesPath, 'utf8'))
    if (updates.length > 0) {
        timer.log(__filename, 'mergeStrapidata Cassettes')
        const base = yaml.load(fs.readFileSync(strapiDataCassettePath, 'utf8'))
            // convert array to object, so that we can use cassette.id as key
            .reduce((obj, item) => {
                obj[item.id] = item
                return obj
            }, {})
        timer.log(__filename, `mergeStrapidata Cassettes base had ${Object.keys(base).length} entries`)
        updates = updates
            // do the same for updates
            .reduce((obj, item) => {
                obj[item.id] = item
                return obj
            }, {})
        // merge base and updates and convert back to array and write to Cassette.yaml
        timer.log(__filename, `mergeStrapidata Cassettes updates had ${Object.keys(updates).length} entries`)
        let merged = Object.values(Object.assign({}, base, updates))
        timer.log(__filename, `mergeStrapidata Cassettes merged had ${merged.length} entries`)
        fs.writeFileSync(strapiDataCassettePath, yaml.dump(merged))
        // empty Cassette_updates.yaml
        fs.writeFileSync(strapiDataCassetteUpdatesPath, '[]')
        timer.log(__filename, `mergeStrapidata Cassettes merged and saved to ${strapiDataCassettePath}`)
        timer.log(__filename, `mergeStrapidata Cassettes updates emptied ${strapiDataCassetteUpdatesPath}`)
    }
    return yaml.load(fs.readFileSync(strapiDataCassettePath, 'utf8'))
}

function loadStrapidataCassettes() {
    mergeStrapidataCassettes()
    return yaml.load(fs.readFileSync(strapiDataCassettePath, 'utf8'))
}

exports.loadStrapidataCassettes = loadStrapidataCassettes
exports.loadStrapidataFilms = loadStrapidataFilms
exports.deleteFolderRecursive = deleteFolderRecursive
exports.JSONcopy = JSONcopy
