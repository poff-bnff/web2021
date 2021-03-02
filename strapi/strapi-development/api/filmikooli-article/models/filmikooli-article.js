'use strict';
/**
 * Read the documentation (https://strapi.io/documentation/v3.x/concepts/models.html#lifecycle-hooks)
 * to customize this model
 */

const {
	StringDecoder
} = require('string_decoder')
const decoder = new StringDecoder('utf8')

const {
	execFile,
	exec,
	spawn
} = require('child_process')

const fs = require('fs')
const yaml = require('yaml')
const path = require('path')
const moment = require("moment-timezone")

async function call_update(result) {
	delete result.published_at
	await strapi.query('filmikooli-article').update({
		id: result.id
	}, result)
}

let plugin_log
async function log_data(result) {
	let editor = result.updated_by.id
	if (result.updated_by) {

		let loggerData = {
			start_time: moment().format(), // moment()).tz('Europe/Tallinn'
			admin_user: {
				id: editor
			},
			site: 'filmikool.poff.ee'
			// build_errors: '',
			// error_code: '',
			// end_time: ''
		}

		plugin_log = await strapi.entityService.create({data: loggerData}, {model: "plugins::publisher.build_logs"})
		// console.log('Sinu palutud v4ljaprint', plugin_log)
	}
}

async function update_logs(plugin_log) {
	let id = plugin_log.id
	delete plugin_log.id
	await strapi.entityService.update({params: {id: id,}, data: plugin_log}, {model: "plugins::publisher.build_logs" })
}

module.exports = {
	lifecycles: {
		async afterCreate(result, data) {
			await call_update(result)
		},
		async beforeUpdate(params, data) {},
		async afterUpdate(result, params, data) {
			await log_data(result)
			console.log(__dirname)
			let build_dir = path.join(__dirname,'/../../../../../ssg/buildtest.sh')
			if (fs.existsSync(build_dir)) {
				console.log('AEAEE')
				const args = []

				const child = spawn(build_dir, args)

				child.stdout.on('data', (chunk) => {
					console.log(decoder.write(chunk))
					// data from the standard output is here as buffers
				});
				// since these are streams, you can pipe them elsewhere
				child.stderr.on('data', (chunk) => {
					console.log('err:', decoder.write(chunk))
					plugin_log.build_errors = decoder.write(chunk)
					plugin_log.end_time = moment().format()
					update_logs(plugin_log)
					// data from the standard error is here as buffers
				});
				// child.stderr.pipe(child.stdout);
				child.on('close', (code) => {
					console.log(`child process exited with code ${code}`)
					switch (code) {
						case 0:
							plugin_log.end_time = moment().tz("Europe/Tallinn").format()
							plugin_log.error_code = "-"
							break;
						case 84:
							plugin_log.end_time = moment().tz("Europe/Tallinn").format()
							plugin_log.error_code = "TestERROR"
							break;
						default:
							plugin_data.end_time = moment().tz("Europe/Tallinn").format()
							plugin_data.error_code = `ERR_CODE_${code}`
					}
					console.log(plugin_log)
					update_logs(plugin_log)
				});
			}

		},
		afterDelete(result, params) {
			// console.log('\nR', result, '\nparams', params)
			let model_id = result.id
			console.log(model_id)
			// delete_model(model_id)
		}
	}
};