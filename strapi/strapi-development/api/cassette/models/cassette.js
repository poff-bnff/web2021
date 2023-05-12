'use strict';
/**
 * Read the documentation (https://strapi.io/documentation/v3.x/concepts/models.html#lifecycle-hooks)
 * to customize this model
 */

const path = require('path')
let helper_path = path.join(__dirname, '..', '..', '..', '/helpers/lifecycle_manager.js')

const {
  slugify,
  call_build,
  getFeDomains,
  exportSingle4SSG,
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

    async beforeCreate(new_data) {
      strapi.log.debug('beforeCreate cassette')
      new_data.slug_et = new_data.title_et ? slugify(new_data.title_et) : null
      new_data.slug_ru = new_data.title_ru ? slugify(new_data.title_ru) : null
      new_data.slug_en = new_data.title_en ? slugify(new_data.title_en) : null
    },

    // result is the created object
    // data is the data that was sent to the create
    async afterCreate(result, data) {
      strapi.log.debug('afterCreate cassette', result.id, result.title_en)

      const festival_editions = await strapi.db.query('festival-edition').find(
        { id: result.festival_editions.map(fe => fe.id) })
      const cassetteDomains = getFeDomains(festival_editions)
      strapi.log.debug('films afterUpdate got domains', cassetteDomains, 'for cassette', result.Id)
      if (cassetteDomains.length > 0) {
        await exportSingle4SSG('cassette', result.Id)
      }
  },

    // params is the original object
    // data is the data that was sent to the update
    async beforeUpdate(params, data) {
      data.slug_et = data.title_et ? slugify(data.title_et) : null
      data.slug_ru = data.title_ru ? slugify(data.title_ru) : null
      data.slug_en = data.title_en ? slugify(data.title_en) : null
    },

    // result is the updated object
    // params is the original object
    // data is the data that was sent to the update
    async afterUpdate(result, params, data) {

      const festival_editions = await strapi.db.query('festival-edition').find(
        { id: result.festival_editions.map(fe => fe.id) })
      const cassetteDomains = getFeDomains(festival_editions)
      strapi.log.debug('films afterUpdate got domains', cassetteDomains, 'for cassette', result.Id)
      if (cassetteDomains.length > 0) {
        await exportSingle4SSG('cassette', result.Id)
      }
      // TODO: if no domains, then there is still possibility, that this cassette was
      // associated with domain before and now it is not. So we need to delete it from
      // that domain.
      // We could check for changes in festival_editions before and after update.
    },

    // params is the original object
    async beforeDelete(params) {
      const cassetteIds = (params._where?.[0].id_in || [params.id]).map(a => parseInt(a))
      strapi.log.debug('beforeDelete cassette Ids', cassetteIds)
    },

    async afterDelete(result, params) {
      strapi.log.debug("afterDelete cassette", { id: result.id, params })
      await exportSingle4SSG(model_name, params.id)
      // const domains = await get_domain(result) // hard coded if needed AS LIST!!!

      // console.log('Delete: ')
      // await call_delete(result, domains, model_name)
    }
  }
};
