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

let helper_path = path.join(__dirname, '..', '..', '..', '/helpers/lifecycle_manager.js')
const {
	call_update,
	build_start_to_strapi_logs,
	call_build,
	get_domain,
	get_build_script,
	update_strapi_logs
// // } = require('/srv/strapi/strapi-development/helpers/lifecycle_manager.js')
} = require(helper_path)

const model_name = (__dirname.split('/').slice(-2)[0])

module.exports = {
	lifecycles: {
		async afterCreate(result, data) {
			await call_update(result, model_name)
		},
		async beforeUpdate(params, data) {},
		async afterUpdate(result, params, data) {

			let domains = await get_domain(result)
			console.log(domains )
			if (domains.length > 1 ) {
				for ( let domain of domains ) {
					let plugin_log = await build_start_to_strapi_logs(result, domain)
					let build_dir = get_build_script(domain)
					if (fs.existsSync(build_dir)) {
						
						const args = [domain, model_name]
						await call_build(build_dir, plugin_log, args)
					} else {
						plugin_log.end_time = moment().tz("Europe/Tallinn").format()
						plugin_log.error_code = `NO_BUILD_SCRIPT_ERROR`
						update_strapi_logs(plugin_log)
					}
				}
			} else {
				let error = 'NO DOMAIN'
				console.log('-------------', error, '-------------')
				let plugin_log = await build_start_to_strapi_logs(result, '¯\\_( ͡ᵔ ͜ʖ ͡ᵔ)_/¯', error)

			}


			// let domain = 'filmikool.poff.ee'
			// let plugin_log = await build_start_to_strapi_logs(result, domain)
			// let build_dir = path.join(__dirname,'/../../../../../ssg/buildtest.sh')
			// if (fs.existsSync(build_dir)) {
			// 	const args = [domain]
			// 	await call_build(build_dir, plugin_log, args)
			// } else {
			// 	plugin_log.end_time = moment().tz("Europe/Tallinn").format()
			// 	plugin_log.error_code = `NO_BUILD_SCRIPT_ERROR`
			// 	update_strapi_logs(plugin_log)
			// }
		},
		afterDelete(result, params) {
			// console.log('\nR', result, '\nparams', params)
			let model_id = result.id
			console.log(model_id)
			// delete_model(model_id)
		}
	}
};
