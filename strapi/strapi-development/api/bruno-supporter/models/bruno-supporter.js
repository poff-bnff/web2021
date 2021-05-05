'use strict';
/**
 * Read the documentation (https://strapi.io/documentation/v3.x/concepts/models.html#lifecycle-hooks)
 * to customize this model
 */

const path = require('path')
let helper_path = path.join(__dirname, '..', '..', '..', '/helpers/lifecycle_manager.js')

const {
  call_update,
  call_build,
  get_domain,
  modify_stapi_data,
  call_delete
} = require(helper_path)

/**
const domains =
For adding domain you have multiple choice. First for objects that has property 'domain'
or has property, that has 'domain' (at the moment festival_edition and programmes) use
function get_domain(result). If you know that that object has doimain, but no property
to indicate that. Just write the list of domains (as list), example tartuffi_menu.
And last if full build, with no domain is needed. Write FULL_BUILD (as list)
*/

const model_name = (__dirname.split(path.sep).slice(-2)[0])

module.exports = {
  lifecycles: {
    async afterCreate(result, data) {
      await call_update(result, model_name)
    },
    async beforeUpdate(params, data) {
      const domains = await get_domain(data) // hard coded if needed AS LIST!!!

      if (data.published_at === null) { // if strapi publish system goes live
        console.log('Draft! Delete: ')
        await call_delete(params, domains, model_name)
      }
    },
    async afterUpdate(result, params, data) {
      const domains = await get_domain(result) // hard coded if needed AS LIST!!!
      console.log('Create or update: ')
      if (data.skipbuild) return
      if (domains.length > 0) {
        await modify_stapi_data(result, model_name)
      }
      await call_build(result, domains, model_name)
    },
async beforeDelete(params) {
      const ids = params._where?.[0].id_in || [params.id]
      const updatedIds = await Promise.all(ids.map(async id => {
        const result = await strapi.query(model_name).findOne({ id })
        if (result){
        const updateDeleteUser = {
          updated_by: params.user,
          skipbuild: true
        }
        await strapi.query(model_name).update({ id: result.id }, updateDeleteUser)
        return id
        }
      }))
      delete params.user
    },
    async afterDelete(result, params) {
      // console.log('\nR', result, '\nparams', params)
      const domains = await get_domain(result) // hard coded if needed AS LIST!!!

      console.log('Delete: ')
      await call_delete(result, domains, model_name)
    }
  }
};
