const fs = require('fs')
const yaml = require('js-yaml')
const path = require('path')

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
    const strapiDataFilmPath = path.join(strapiDataDirPath, 'Film.yaml')
    const strapiDataFilmUpdatesPath = path.join(strapiDataDirPath, 'Film_updates.yaml')
    if (fs.existsSync(strapiDataFilmUpdatesPath)) {
        const base = yaml.load(fs.readFileSync(strapiDataFilmPath, 'utf8'))
            // convert array to object, so that we can use cassette.id as key
            .reduce((obj, item) => {
                obj[item.id] = item
                return obj
            }, {})
        let updates = yaml.load(fs.readFileSync(strapiDataFilmUpdatesPath, 'utf8'))
            // do the same for updates
            .reduce((obj, item) => {
                obj[item.id] = item
                return obj
            }, {})
        // merge base and updates and convert back to array and write to Film.yaml
        let merged = Object.values(Object.assign({}, base, updates))
        fs.writeFileSync(strapiDataFilmPath, yaml.dump(merged))
        // delete Cassette_updates.yaml
        fs.unlinkSync(strapiDataFilmUpdatesPath)
    }
}

function mergeAndLoadCassettes() {
    mergeStrapidataFilms()
    const strapiDataCassettePath = path.join(strapiDataDirPath, 'Cassette.yaml')
    const strapiDataCassetteUpdatesPath = path.join(strapiDataDirPath, 'Cassette_updates.yaml')
    if (fs.existsSync(strapiDataCassetteUpdatesPath)) {
        const base = yaml.load(fs.readFileSync(strapiDataCassettePath, 'utf8'))
            // convert array to object, so that we can use cassette.id as key
            .reduce((obj, item) => {
                obj[item.id] = item
                return obj
            }, {})
        let updates = yaml.load(fs.readFileSync(strapiDataCassetteUpdatesPath, 'utf8'))
            // do the same for updates
            .reduce((obj, item) => {
                obj[item.id] = item
                return obj
            }, {})
        // merge base and updates and convert back to array and write to Cassette.yaml
        let merged = Object.values(Object.assign({}, base, updates))
        fs.writeFileSync(strapiDataCassettePath, yaml.dump(merged))
        // delete Cassette_updates.yaml
        fs.unlinkSync(strapiDataCassetteUpdatesPath)
    }
    return yaml.load(fs.readFileSync(strapiDataCassettePath, 'utf8'))
}

exports.mergeAndLoadCassettes = mergeAndLoadCassettes
exports.deleteFolderRecursive = deleteFolderRecursive
exports.JSONcopy = JSONcopy
