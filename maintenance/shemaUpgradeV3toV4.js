'use strinct'

const path = require('path')
const fs = require('fs')
const yaml = require('js-yaml')

const STRAPI3_PATH = path.join(__dirname, '..', 'web2021')
const STRAPI3_API_PATH = path.join(STRAPI3_PATH, 'strapi', 'strapi-development', 'api')
const STRAPI3_DATAMODEL = path.join(STRAPI3_PATH, 'ssg', 'docs', 'datamodel.yaml')
const STRAPI4_API_PATH = path.join(__dirname, 'src', 'api')

// read strapi3 datamodel.yaml, where all relevant collections
// should be listed and hierarchically organized
const s3datamodel = yaml.load(fs.readFileSync(STRAPI3_DATAMODEL, 'utf8'))

// iterate over strapi3 api folders and collect models
const strapi3Models = fs.readdirSync(STRAPI3_API_PATH)
  // only directories
  .filter((item) => fs.statSync(path.join(STRAPI3_API_PATH, item)).isDirectory())
  // only models with settings.json
  .filter((item) => fs.existsSync(path.join(STRAPI3_API_PATH, item, 'models', `${item}.settings.json`)))
  .reduce((obj, item) => {
    obj[item] = JSON.parse(fs.readFileSync(path.join(STRAPI3_API_PATH, item, 'models', `${item}.settings.json`), 'utf8'))
    obj[item].modelName = item
    return obj
  }, {})

// find a model from strapi3Models dictionary where:
// - displayName matches the info.name property or
// - path matches the collectionName property
const findS3Model = (displayName, path) => {
  const s3ModelName = Object.keys(strapi3Models).find((key) => {
    return strapi3Models[key].info?.name === displayName || strapi3Models[key].collectionName === path.split('/')[1].replace(/-/g, '_')
  })
  return strapi3Models[s3ModelName]
}

// manipulate s3datamodel object:
// - remove items without _path property as they are not collections
// - remove all properties but _path from full model
// - create array of collections objects with collectionName and s3modelName
const collectionArray = Object.keys(s3datamodel)
  .filter((key) => s3datamodel[key]._path)
  .reduce((obj, datamodelKey) => {
    const API_path = s3datamodel[datamodelKey]._path
    // const collectionName = _path.split('/')[1].replace(/-/g, '_')
    const model = findS3Model(datamodelKey, API_path)
    // console.log({ API_path, datamodelKey, model })
    const s3CollectionName = model.collectionName
    const modelName = model.modelName
    const displayName = model.info.name
    obj.push({
      s3: {
        API_path: API_path,
        datamodelKey: datamodelKey,
        collectionName: s3CollectionName,
      },
      s4: {
        schema: {
          kind: "collectionType",
          collectionName: s3CollectionName,
          info: {
            singularName: modelName,
            pluralName: s3CollectionName.replace(/_/g, '-'),
            displayName: displayName,
          },
          options: model.options,
          attributes: model.attributes
        }
      }
    })
    return obj
  }, [])

// console.log(JSON.stringify(collectionArray, null, 2))

let modelsCreated = 0
// iterate over collections, create api folders and files
collectionArray.forEach((collection) => {
  if (modelsCreated > 0) {
    return
  }
  const { s3, s4 } = collection
  // const { API_path, datamodelKey,  } = s3
  const { schema } = s4
  const { kind, collectionName, info, options, attributes } = schema
  const { singularName, pluralName, displayName } = info

  const s4APIPath = path.join(STRAPI4_API_PATH, singularName)
  const s4APISchemaPath = path.join(s4APIPath, 'content-types', singularName, 'schema.json')
  const s4APIControllerPath = path.join(s4APIPath, 'controllers')
  const s4APIRouterPath = path.join(s4APIPath, 'routes')
  const s4APIServicePath = path.join(s4APIPath, 'services')
  const s4APIRouterFileContent = `'use strict';`


  if (fs.existsSync(s4APIPath)) {
    return
    // fs.rmdirSync(s4APIPath, { recursive: true })
  }
  modelsCreated++

  // create api folder
  fs.mkdirSync(s4APIPath, { recursive: true })

  // create content-types folder
  fs.mkdirSync(path.join(s4APIPath, 'content-types', singularName), { recursive: true })
  // create schema.json file
  fs.writeFileSync(s4APISchemaPath, JSON.stringify(schema, null, 2))

  // create controllers folder
  fs.mkdirSync(s4APIControllerPath, { recursive: true })
  // create controller.js file
  fs.writeFileSync(path.join(s4APIControllerPath, `${singularName}.js`), `'use strict'\n\nconst { createCoreController } = require('@strapi/strapi').factories\n\nmodule.exports = createCoreController('api::${singularName}.${singularName}')`)

  // create routes folder
  fs.mkdirSync(s4APIRouterPath, { recursive: true })
  // create routes.js file
  fs.writeFileSync(path.join(s4APIRouterPath, `${singularName}.js`), `'use strict'\n\nconst { createCoreRouter } = require('@strapi/strapi').factories\n\nmodule.exports = createCoreRouter('api::${singularName}.${singularName}')`)

  // create services folder
  fs.mkdirSync(s4APIServicePath, { recursive: true })
  // create services.js file
  fs.writeFileSync(path.join(s4APIServicePath, `${singularName}.js`), `'use strict'\n\nconst { createCoreService } = require('@strapi/strapi').factories\n\nmodule.exports = createCoreService('api::${singularName}.${singularName}')`)

})
