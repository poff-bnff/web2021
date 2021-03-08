'use strict';
/**
 * Read the documentation (https://strapi.io/documentation/v3.x/concepts/models.html#lifecycle-hooks)
 * to customize this model
 */

const path = require('path')
let helper_path = path.join(__dirname, '..', '..', '..', '/helpers/lifecycle_manager.js')

const {
    slugify,
    call_update,
    call_build,
    get_domain,
    modify_stapi_data,
} = require(helper_path)

/**
const domains = 
For adding domain you have multiple choice. First for objects that has property 'domain' 
or has property, that has 'domain' (at the moment festival_edition and programmes) use 
function get_domain(result). If you know that that object has doimain, but no property 
to indicate that. Just write the list of domains (as list), example tartuffi_menu. 
And last if full build, with no domain is needed. Write FULL_BUILD (as list)
*/

const model_name = (__dirname.split('/').slice(-2)[0])
const domains = ['poff.ee'] // hard coded if needed AS LIST!!!

module.exports = {
    lifecycles: {
        async afterCreate(result, data) {
            await call_update(result, model_name)
        },
        async beforeUpdate(params, data) {

            if (data.published_at === null) { // if strapi publish system goes live
                console.log('Draft! Delete: ')
                await modify_stapi_data(params, model_name, true)
                await call_build(params, domains, model_name)
            }
        },
        async afterUpdate(result, params, data) {
            console.log('Create or update: ')
            if (domains.length > 0) {
                await modify_stapi_data(result, model_name)
            }
            await call_build(result, domains, model_name)


        },
        async afterDelete(result, params) {
            // console.log('\nR', result, '\nparams', params)

            console.log('Delete: ')
            await modify_stapi_data(result[0], model_name, true)
            await call_build(result[0], domains, model_name)

        }
    }
};