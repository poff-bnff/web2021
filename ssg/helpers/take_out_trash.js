const fs = require('fs')
const yaml = require('js-yaml')
const path = require('path')
const { getModel } = require("./strapiQuery.js")
const { spin } = require("./spinner")

// const dirPath =  path.join(__dirname, '..', 'source')

// fs.mkdirSync(path.join(dirPath, '_fetchdir'), { recursive: true })
// fs.mkdirSync(path.join(dirPath, 'strapidata'), { recursive: true })

// const DOMAIN = process.env['DOMAIN'] || false
// const modelFile = path.join(__dirname, '..', 'docs', 'datamodel.yaml')
// const DATAMODEL = yaml.safeLoad(fs.readFileSync(modelFile, 'utf8'))


async function TakeOutTrash (data, model, dataPath) {
    const isObject = (o) => { return typeof o === 'object' && o !== null }
    const isArray = (a) => { return Array.isArray(a) }

    // console.log('Grooming', dataPath, data)
    // console.log('Grooming', dataPath, data, model)
    // eeldame, et nii data kui model on objektid

    const keysToCheck = Object.keys(data)
    let report = {'trash':[], 'keepers':[], 'nobrainers':[]}
    for (const key of keysToCheck) {
        if (isEmpty(data[key])) { delete(data[key]); continue }
        // console.log(key, model)
        // console.log('key', key)
        if (['id', '_path', '_model'].includes(key)) {
            report.nobrainers.push(key)
            // console.log('Definately keep', key, 'in', dataPath)
            continue
        }
        if (!model.hasOwnProperty(key)) {
            report.trash.push(key)
            // console.log('Trash', key, 'in', dataPath)
            delete(data[key])
            continue
        }
        report.keepers.push(key)
        // console.log('Keep', key, 'in', dataPath, data[key])
        let nextData = data[key]
        const nextModel = model[key]

        if (isArray(nextData) ^ isArray(nextModel)) { // bitwise OR - XOR: true ^ false === false ^ true === true
            console.log('next', nextData, key)
            throw new Error('Data vs model mismatch. Both should be array or none of them.')
        }
        if (isArray(nextData) && isArray(nextModel)) {
            let filtered = []
            for (const nd of nextData) {
                // console.log('nd,', nd, key);
                if (isEmpty(nd)) {
                    // console.log(nd, 'on tyhi')
                    continue
                }
                // console.log('lisan', nd);
                filtered.push(nd)
                TakeOutTrash(nd, nextModel[0], key)
            }
            if(filtered.length === 0) {
                // console.log('on tyhi kyll');
                delete(data[key])
            } else {
                data[key] = filtered
            }
        } else if (isObject(nextData) && isObject(nextModel)) {
            TakeOutTrash(data[key], nextModel, key)
        }
    }
    return data
    // console.log('Reporting', dataPath, report)
}

exports.TakeOutTrash = TakeOutTrash