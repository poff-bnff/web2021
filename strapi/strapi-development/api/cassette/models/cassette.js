'use strict';
/**
 * Read the documentation (https://strapi.io/documentation/v3.x/concepts/models.html#lifecycle-hooks)
 * to customize this model
 */

const path = require('path')
let helper_path = path.join(__dirname, '..', '..', '..', '/helpers/lifecycle_manager.js')

const {
  slugify,
  update_entity_wo_published_at,
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

    // result is the created object
    // data is the data that was sent to the create
    async afterCreate(result, data) {
      logger.debug('afterCreate cassette', result.id, result.title_en)
      // Skip if created along with a new film
      if (data.skipbuild) { return }
      logger.debug('afterCreate cassette without new film', result.id, result.title_en
                 , 'published_at:', result.published_at)
      await update_entity_wo_published_at(result, model_name)
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

      strapi.log.debug('Create or update: ')
      if (data.skipbuild) return

      const festival_editions = await strapi.db.query('festival-edition').find({ id: result.festival_editions.map(fe => fe.id) })
      const domains = [...new Set(festival_editions.map(fe => fe.domains.map(d => d.url)).flat())]
      strapi.log.debug('Got domains: ', domains)
      if (domains.length > 0) {
        await modify_stapi_data(result, model_name)
      }
      strapi.log.debug('Lets build: ')
      await call_build(result, domains, model_name)
    },

    // params is the original object
    async beforeDelete(params) {
      const ids = params._where?.[0].id_in || [params.id]
      const updatedIds = await Promise.all(ids.map(async id => {
        const result = await strapi.query(model_name).findOne({ id })
        if (result) {
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
