let testmodel = [
	'article_types',
	'web_authors'
]


const fs = require('fs')
const yaml = require('js-yaml')
const path = require('path')

function find_single_obj(name, ids){
	const objDataDir = path.join(__dirname, '..', 'source', 'strapidata', `${name}.yaml`)
	const objData = yaml.safeLoad(fs.readFileSync(objDataDir, 'utf8'))
	for (let e of ids){
		let find_ids = objData.filter( ob => {
			// console.log('ob', ob, ob.id, e.id )
			return ob.id === e.id
		})
	}
}

function fetch_model(obj_name, minimodel) {
	const objDataDir = path.join(__dirname, '..', 'source', 'strapidata', `${obj_name}.yaml`)
	const objData = yaml.safeLoad(fs.readFileSync(objDataDir, 'utf8'))
	let filled_objects = []

	for(let single_obj of objData ){

		for(let row of testmodel){
			if(single_obj.hasOwnProperty(row)){
				let ids = single_obj[row]
				single_obj[row] = find_single_obj(row, ids)

			}
		}
		filled_objects.push(single_obj)
	}
	return filled_objects
}

let test2 = fetch_model('hof-fi-article', testmodel)
console.log(test2[0])
// console.log('test',testmodel)