const fs = require('fs')
const yaml = require('js-yaml')
const path = require('path')
const { getModel } = require("./strapiQuery.js")
const { spin } = require("./spinner")

const dirPath = path.join(__dirname, '..', 'source')
const fetchDirPath = path.join(dirPath, '_fetchdir')
const allStrapidatapath = path.join(dirPath, '_allStrapidata')

fs.mkdirSync(fetchDirPath, { recursive: true })
fs.mkdirSync(allStrapidatapath, { recursive: true })

const DOMAIN = process.env['DOMAIN'] || false
const modelFile = path.join(__dirname, '..', 'docs', 'datamodel.yaml')
const DATAMODEL = yaml.load(fs.readFileSync(modelFile, 'utf8'))

for (const key in DATAMODEL) {
    if (DATAMODEL.hasOwnProperty(key)) {
        const element = DATAMODEL[key]
        if (element.hasOwnProperty('_path')) {
            element['_modelName'] = key
        }
    }
}

let checkDomain = function(element) {
    if (!DOMAIN) {
        return true
    }
    // kui on domain, siis element['domains'] = [domain]
    if (element['domain'] && !element['domains']){
        element['domains'] = [element['domain']]
    }

    if (element['domains'] === undefined) {
        // console.log(3)
        return true
    }

    for(let ix in element['domains']){
        let el = element['domains'][ix]
        // console.log(ix, el)
        if (el['url'] === process.env['DOMAIN']){
            return true
        }
    }

    return false
}

const isEmpty = (p) => {
    return typeof p === 'undefined'
    || p === false
    || p === null
    || p === ''
    || (Array.isArray(p) && p.length === 0)
    || (Object.keys(p).length === 0 && p.constructor === Object)
}


function TakeOutTrash (data, model, dataPath) {
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
    // console.log('Reporting', dataPath, report)
}

const Compare = function (model, data, path) {
    // console.log('<--', path)
    if (data === null) {
        console.log(path, 'is null in data')
        return
    }
    if (Array.isArray(model)) {
        if (Array.isArray(data)) {
            // data = data.filter(function (el) { return el != null })
            for (const ix in data) {
                // console.log('foo', path, ix)
                Compare(model[0], data[ix], path + '[' + ix + ']')
            }
        } else {
            console.log('- Not an array:', path, model)
        }
    } else {
        for (const key in model) {
            if (key === '_path' || key === '_modelName') {
                continue
            }
            let next_path = path + '.' + key
            const model_element = model[key]
            if (data.hasOwnProperty(key) && data[key]) {
                if (model_element !== null && typeof(model_element) === 'object' ) {
                    Compare(model_element, data[key], next_path)
                }
            } else {
                // console.log('path', path, 'missing', key)
            }
        }
    }
    // console.log('-->', path)
}


const foo = async () => {

    // Replace every property_name in strapiData with object from searchData
                                // "Performance", strapi events, strapi performances
    const ReplaceInModel = function(property_name, strapiData, searchData) {
        // console.log(property_name, strapiData, searchData)
        for (const element of strapiData) {
            const value = element[property_name]
            if (value === null || value === undefined) {
                element[property_name] = null
                continue
            }

            // kui nt toimetaja on kustutanud artikli, millele mujalt viidatakse
            if (value.constructor === Object && Object.keys(value).length === 0) {
                element[property_name] = null
                continue
            }


            const element_id = (value.hasOwnProperty('id') ? value.id : value)
            element[property_name] = searchData.find(element => element.id === element_id)
        }
    }

    let strapiData = {}
    // datamodel on meie kirjeldatud andmemudel
    // otsime sellest mudelist ühte mudelit =model
    //
    // Esimese sammuna 1. rikastame Strapist tulnud andmeid, mis liigse sygavuse tõttu on jäänud tulemata.
    // Rikastame kõiki alamkomponente, millel mudelis on _path defineeritud
    //
    console.log('Fetching from Strapi:')
    let is_first_model = true
    for (const modelName in DATAMODEL) {
        if (DATAMODEL.hasOwnProperty(modelName)) {
            let model = DATAMODEL[modelName]
            // '_path' muutujas on kirjas tee andmete küsimiseks
            if (model.hasOwnProperty('_path')) {
                if (is_first_model) {
                    is_first_model = false
                } else {
                    process.stdout.write(', ')
                }

                let modelData = await getModel(modelName)


                if (!Array.isArray(modelData)){
                    modelData = [modelData]
                }

                // modelData = modelData.filter(checkDomain)

                // otsime kirjet mudelis =value
                for (const property_name in model) {
                    if (model.hasOwnProperty(property_name)) {
                        const value = (
                            Array.isArray(model[property_name])
                                ? model[property_name][0]
                                : model[property_name]
                            )

                        if (value.hasOwnProperty('_modelName')) {
                            for (strapi_object of modelData) {
                                if (Array.isArray(strapi_object[property_name])) {
                                    for (ix in strapi_object[property_name]) {
                                        if (strapi_object[property_name][ix]) {
                                            const {id} = strapi_object[property_name][ix]
                                            strapi_object[property_name][ix] = {id: id}
                                        }
                                    }
                                } else {
                                    if (strapi_object[property_name]) {
                                        const {id} = strapi_object[property_name]
                                        strapi_object[property_name] = {id: id}
                                    }
                                }
                            }
                        }
                        // '_modelName' on üleval ise sees kirjutaud väärtus andmemudelis, mis on võrdne mudeli nimega
                        // console.log({property_name, model});
                        // if (value.hasOwnProperty('_modelName')) {
                        //     let search_model_name = value['_modelName']
                        //     // console.log('foo', search_model_name, 'in', modelName)
                        //     let searchData = strapiData[search_model_name]
                        //     // otsime juba olemasolevast strapi datast

                        //     // "Performance", strapi events, strapi performances
                        //     ReplaceInModel(property_name, modelData, searchData)
                        // }
                    }
                }
                strapiData[modelName] = modelData
                // console.log('done replacing', modelName)
                process.stdout.write(' (' + modelData.length + ')')
            }
        }
    }

    process.stdout.write('\nCleaning StrapiData')
    spin.start()
    for (const modelName in strapiData) {
        if (strapiData.hasOwnProperty(modelName)) {
            const modelData = strapiData[modelName]
            for (const ix in modelData) {
                if (modelData.hasOwnProperty(ix)) {
                    let element = modelData[ix]
                    // 2. kustutame andmetest kõik propertid, mida mudelis pole
                    try {
                        TakeOutTrash(element, DATAMODEL[modelName], modelName)
                    } catch (error) {
                        console.log({error, modelName, element, model: DATAMODEL[modelName]})
                        process.exit(1)
                    }

                    // 3. valideerime kõike, mis mudelis on kirjeldatud
                    // console.log('XXXX+X+X+X+X', DATAMODEL[modelName], element, modelName)
                    Compare(DATAMODEL[modelName], element, modelName)
                    // console.log('Validated ', modelName, ix, element['id'])
                }
            }
        }
    }
    spin.stop()
    console.log('.')

    // let yamlStr = yaml.dump(JSON.parse(JSON.stringify(strapiData)), { 'noRefs': true, 'indent': '4' })
    // // let yamlStr = yaml.dump(strapiData, { 'noRefs': true, 'indent': '4' })
    // fs.writeFileSync(__dirname + '/../source/strapiData.yaml', yamlStr, 'utf8')

    for ( let modelName in strapiData ) {
       // console.log(JSON.stringify(strapiData[modelName], 0, 2))
       let yamlSmallStr = yaml.dump(JSON.parse(JSON.stringify(strapiData[modelName])), { 'noRefs': true, 'indent': '4' })
       fs.writeFileSync(path.join(allStrapidatapath, `${modelName}.yaml`), yamlSmallStr, 'utf8')
    }


}

foo()
