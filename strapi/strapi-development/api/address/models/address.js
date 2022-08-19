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
const domains = ['FULL_BUILD'] // hard coded if needed AS LIST!!!

module.exports = {
  lifecycles: {
    async afterCreate(result, data) {
    },
    async beforeUpdate(params, data) {
      // 
      let hrAddress = []
      if(data.street_name) {
        hrAddress.push(data.street_name)
      }
      if(data.address_number) {
        hrAddress.push(data.address_number)
      }
      if(data.appartment){
        hrAddress.push(data.appartment)
      }
      if(data.postal_code){
        hrAddress.push(data.postal_code)
      }
      if(data.municipality){
        console.log(data.municipality)
        let id = data.municipality.id
        let munic = await strapi.query('municipalities').findOne({id})
        munic = munic.name_et
        hrAddress.push(munic)
      }
      data.hr_address = hrAddress.join('_')

    },
    async afterUpdate(result, params, data) {

    },
    async beforeDelete(params) {

      delete params.user
    },
    async afterDelete(result, params) {
      // console.log('\nR', result, '\nparams', params)
    }
  }
};
