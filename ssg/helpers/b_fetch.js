const fs = require('fs')
const yaml = require('js-yaml')
const path = require('path')

const modelFile = path.join(__dirname, '..', 'docs', 'datamodel.yaml')
const DATAMODEL = yaml.load(fs.readFileSync(modelFile, 'utf8'))


// const root_model_name = 'POFFiMenu'
// const testmodel = {
// 	'poffi_article': {
// 		model_name: 'POFFiArticle'
// 	},
// 	'subMenuItem': {
// 		model_name: 'PoffiSubMenuItem',
// 		expand: {
// 			'poffi_article': {
// 				model_name: 'POFFiArticle',
// 				expand: {
// 					'article_types': {
// 						model_name: 'ArticleType'
// 					},
// 					'programmes': {
// 						model_name: 'Programme'
// 					}
// 				}
// 			}
// 		}
// 	}
// }

let MODELS = {}

function make_MODELS(minimodel) {
	for (const property_name in minimodel){
		const submodel = minimodel[property_name]
		const model_n = submodel.model_name
		// if (MODELS.hasOwnProperty(model_n)) {
		// 	continue
		// }
		// console.log(submodel)
		if (DATAMODEL[model_n].hasOwnProperty('_path')){
			MODELS[model_n] = yaml.load(fs.readFileSync(path.join(objDataDir, `${model_n}.yaml`), 'utf8'))
		} else {
			MODELS[model_n] = null
		}
		if(submodel.hasOwnProperty('expand')){
			make_MODELS(submodel.expand)
		}
	}
}


const objDataDir = path.join(__dirname, '..', 'source', '_domainStrapidata')


function find_single_obj(minimodel, entries){
  	if (!Array.isArray(entries)){
        entries = entries ? [entries] : []

		const objData = MODELS[minimodel.model_name]
			// console.log('objData', objData)

		for (const ix in entries){
			if (objData) {
	            const e = entries[ix]

	            const filtering = objData.filter( ob => {
					return ob.id === e.id
	            })[0]

	            if( filtering !== undefined){
		            entries[ix] = filtering
	            }
			}

			if (minimodel.expand) {
				for(let property_name in minimodel.expand){
					if(entries[ix].hasOwnProperty(property_name)){
						let ids = entries[ix][property_name]
						// console.log('rec', property_name, minimodel.expand[property_name])
						entries[ix][property_name] = find_single_obj(minimodel.expand[property_name], ids)
					}
				}
			}
		}
		return entries.filter(a => a !== undefined)[0]

	} else {
		const objData = MODELS[minimodel.model_name]
		for (const ix in entries){
			if (objData) {
	            const e = entries[ix]

	            const filtering = objData.filter( ob => {
					return ob.id === e.id
	            })[0]

	            if( filtering !== undefined){
		            entries[ix] = filtering
	            }
			}

			if (minimodel.expand) {
				for(let property_name in minimodel.expand){
					if(entries[ix].hasOwnProperty(property_name)){
						let ids = entries[ix][property_name]
						// console.log('rec', property_name, minimodel.expand[property_name])
						entries[ix][property_name] = find_single_obj(minimodel.expand[property_name], ids)
					}
				}
			}
		}
		return entries.filter(a => a !== undefined)
	}
}

function fetchModel(modelData, minimodel) {
    console.log('fetchModel', {minimodel})
    make_MODELS(minimodel)
	for(let single_obj of modelData ){

		for(let property_name in minimodel){
			if(single_obj.hasOwnProperty(property_name)){
				let ids = single_obj[property_name]
				single_obj[property_name] = find_single_obj(minimodel[property_name], ids)
			}
		}
	}

	return modelData
}

// const modelDataDir = path.join(__dirname, '..', 'source', '_domainStrapidata', `${model_name}.yaml`)
// const modelData = yaml.load(fs.readFileSync(modelDataDir, 'utf8'))

// let test2 = fetchModel(modelData, testmodel)
// console.log(JSON.stringify(test2[2], 0, 2))

exports.fetchModel = fetchModel

