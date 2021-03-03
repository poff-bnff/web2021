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

async function call_update(result, model) {
	delete result.published_at
	await strapi.query(model).update({id: result.id}, result)
}

async function build_start_to_strapi_logs(result, domain) {
	let editor = result.updated_by.id
	let plugin_log
	if (result.updated_by) {

		let loggerData = {
			start_time: moment().format(), // moment()).tz('Europe/Tallinn'
			admin_user: {
				id: editor
			},
			site: domain
		}

		plugin_log = await strapi.entityService.create({data: loggerData}, {model: "plugins::publisher.build_logs"})
		// console.log('Sinu palutud v4ljaprint', plugin_log)
	}
	return plugin_log
}

async function update_strapi_logs(plugin_log) {
	let id = plugin_log.id
	delete plugin_log.id
	await strapi.entityService.update({params: {id: id,}, data: plugin_log}, {model: "plugins::publisher.build_logs" })
}

async function call_build(build_dir, plugin_log, args) {

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
		update_strapi_logs(plugin_log)
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
			case 83:
				plugin_log.end_time = moment().tz("Europe/Tallinn").format()
				plugin_log.error_code = "TestERROR"
				break;
			default:
				plugin_log.end_time = moment().tz("Europe/Tallinn").format()
				plugin_log.error_code = `ERR_CODE_${code}`
		}
		// console.log(plugin_log)
		update_strapi_logs(plugin_log)
	});
}

function get_build_params() {

}

async function do_query(model, params) {
	let obj_to_return = []
	for (let param of params) {
		let query_answer = await strapi.query(model).find({ id : param.id })
		obj_to_return.push(query_answer)
	}
	return obj_to_return
}

async function get_domain(result) {
	let domain = []
	if (result.domain) {
		domain.push(result.domain.url)
	}
	else if (result.domains) {
		for (let dom of result.domains) {
			domain.push(dom.url)
		}
	}
	else if (result.festival_edition) {
		let query_answer = await strapi.query('festival_edition').find({ id : result.festival_edition.id })
		for (let dom of query_answer.domains) {
			domain.push(dom.url)
		}
	}
	else if (result.festival_editions) {
		let festival_eds = await do_query('festival_edition', result.festival_editions)
		for (let festival_ed of festival_eds) {
			for (let dom of fetsival_ed.domains) {
				domain.push(dom.url)
			}
		}
	}
}

const model_name = (__dirname.split('/').slice(-2)[0])

module.exports = {
	lifecycles: {
		async afterCreate(result, data) {
			await call_update(result, model_name)
		},
		async beforeUpdate(params, data) {},
		async afterUpdate(result, params, data) {
			let domain = get_domain(result)
			// let domain = 'filmikool.poff.ee'
			let plugin_log = await build_start_to_strapi_logs(result, domain)
			let build_dir = path.join(__dirname,'/../../../../../ssg/buildtest.sh')
			if (fs.existsSync(build_dir)) {
				const args = [domain]
				await call_build(build_dir, plugin_log, args)
			} else {
				plugin_log.end_time = moment().tz("Europe/Tallinn").format()
				plugin_log.error_code = `NO_BUILD_SCRIPT_ERROR`
				update_strapi_logs(plugin_log)
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
