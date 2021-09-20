'use strict';

// This file was only added to prevent
// "Your filters contain a field 'user' that doesn't appear on your model definition nor it's relations"
// error as ctx filter accepts only fields that exist in particular model

/**
 * Read the documentation (https://strapi.io/documentation/v3.x/concepts/models.html#lifecycle-hooks)
 * to customize this model
 */

const path = require('path')
let helper_path = path.join(__dirname, '..', '..', '..', '/helpers/lifecycle_manager.js')
let sheet_path = path.join(__dirname, '..', '..', '..', '..', '..', 'ssg', '/helpers/connect_spreadsheet.js')

const {
  call_update,
  call_build,
  get_domain,
  modify_stapi_data,
  call_delete,
} = require(helper_path)

const {
  readSheet,
  update_sheets
} = require(sheet_path)

/**
const domains =
For adding domain you have multiple choice. First for objects that has property 'domain'
or has property, that has 'domain' (at the moment festival_edition and programmes) use
function get_domain(result). If you know that that object has doimain, but no property
to indicate that. Just write the list of domains (as list), example tartuffi_menu.
And last if full build, with no domain is needed. Write FULL_BUILD (as list)
*/

const model_name = (__dirname.split(path.sep).slice(-2)[0])
// const domains = ['hoff.ee'] // hard coded if needed AS LIST!!!
// const domains = ['FULL_BUILD'] // hard coded if needed AS LIST!!!

module.exports = {
  lifecycles: {
    async afterCreate(result, data) {

    },
    async beforeUpdate(params, data) {

    },
    async afterUpdate(result, params, data) {
      // let sheet_ID = '1523CDLVZyDmn9-lKr8B1VNS0paM8IeZBxcvWM_VeXyQ'
      // let sheet_name = 'Strapi_Products'
      // //	console.log({result})
      // let read_spsheet = await update_sheets(result, model_name, sheet_ID, sheet_name)
      // // console.log(read_spsheet)

    },
    async beforeDelete(params) {
      delete params.user
    },
    async afterDelete(result, params) {

    }
  }
};
