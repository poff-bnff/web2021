const fs = require('fs')
const yaml = require('js-yaml')
const path = require('path')

const modelFile = path.join(__dirname, '..', 'docs', 'datamodel.yaml')
const DATAMODEL = yaml.load(fs.readFileSync(modelFile, 'utf8'))

let MODELS = {}

function make_MODELS(minimodel) {
    const objDataDir = path.join(__dirname, '..', 'source', '_domainStrapidata')
    for (const property_name in minimodel) {
        const submodel = minimodel[property_name]
        const modelName = submodel.model_name

        if (DATAMODEL[modelName].hasOwnProperty('_path')) {
            MODELS[modelName] = yaml.load(fs.readFileSync(path.join(objDataDir, `${modelName}.yaml`), 'utf8'))
        } else {
            MODELS[modelName] = null
        }
        if (submodel.hasOwnProperty('expand')) {
            make_MODELS(submodel.expand)
        }
    }
}

function find_single_obj(minimodel, entries) {
    let entriesAreArray = true
    if (!Array.isArray(entries)) {
        entries = entries ? [entries] : []
        entriesAreArray = false
    }
    const objData = MODELS[minimodel.model_name]
    for (const ix in entries) {
        if (objData) {
            const e = entries[ix]

            const filtering = objData.filter(ob => {
                return ob.id === e.id
            })[0]

            if (filtering !== undefined) {
                entries[ix] = filtering
            }
        }

        if (minimodel.expand) {
            for (let property_name in minimodel.expand) {
                if (entries[ix].hasOwnProperty(property_name)) {
                    let ids = entries[ix][property_name]
                    // console.log('rec', property_name, minimodel.expand[property_name])
                    entries[ix][property_name] = find_single_obj(minimodel.expand[property_name], ids)
                }
            }
        }
    }
    if (entriesAreArray) {
        return entries.filter(a => a !== undefined)
    } else {
        return entries.filter(a => a !== undefined)[0]
    }

}

function fetchModel(modelData, minimodel) {
    // console.log('fetchModel', {minimodel})
    make_MODELS(minimodel)
    for (let single_obj of modelData) {

        for (let property_name in minimodel) {
            if (single_obj.hasOwnProperty(property_name)) {
                let ids = single_obj[property_name]
                single_obj[property_name] = find_single_obj(minimodel[property_name], ids)
            }
        }
    }

    return modelData
}

exports.fetchModel = fetchModel
