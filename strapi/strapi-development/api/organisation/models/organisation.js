'use strict';
/**
 * Read the documentation (https://strapi.io/documentation/v3.x/concepts/models.html#lifecycle-hooks)
 * to customize this model
 */

const path = require('path');
const { sanitizeEntity } = require('strapi-utils');

const {
  slugify,
  call_update,
  call_build,
  get_domain,
  modify_stapi_data,
  call_delete
} = require(path.join(__dirname, '..', '..', '..', '/helpers/lifecycle_manager.js'))

const {
  getPublishingdAllowedUserRoles,
  getPublishingProperties
} = require(path.join(__dirname, '..', '..', '..', '/helpers/creative_gate_profile_publishing.js'))

/**
const domains =
For adding domain you have multiple choice. First for objects that has property 'domain'
or has property, that has 'domain' (at the moment festival_edition and programmes) use
function get_domain(result). If you know that that object has doimain, but no property
to indicate that. Just write the list of domains (as list), example tartuffi_menu.
And last if full build, with no domain is needed. Write FULL_BUILD (as list)
*/

const model_name = (__dirname.split(path.sep).slice(-2)[0])
const domains = ['industry.poff.ee'] // hard coded if needed AS LIST!!!

module.exports = {
  lifecycles: {
    async afterCreate(result, data) {
      if (result.published_at) {
        await call_update(result, model_name)
      }
    },
    async beforeUpdate(params, data) {

      if (data.published_at === null) { // if strapi publish system goes live
        console.log('Draft! Delete: ')
        await call_delete(params, domains, model_name)
      }
    },
    async afterUpdate(result, params, data) {
      console.log('Create or update: ')
      if (data.skipbuild) return
      if (domains.length > 0) {
        const entity = await strapi.services.organisation.findOne(
          { id: result.id },
          [
            'images',
            'logoWhite',
            'logoBlack',
            'logoColour',
            'awardings',
            'festival_editions',
            'domains',
            'profile_img',
            'role_at_films',
            'addr_coll', 'addr_coll.country', 'addr_coll.county',
            'audioreel',
            'origin',
            'tag_looking_fors',
            'country',
            'filmographies', 'filmographies.type_of_work',
            'languages',
            'orderedRaF',
            'user'
          ]
        );
        const cleanEntity = sanitizeEntity(entity, { model: strapi.models.organisation });
        console.log(cleanEntity, model_name)
        if (cleanEntity.allowed_to_publish) {
          await modify_stapi_data(cleanEntity, model_name)
          await call_build(cleanEntity, domains, model_name)
        }
      }
    },
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

      console.log('Delete: ')
      await call_delete(result, domains, model_name)
    },
    async afterFind(results, params, populate) {
      const allPublishingAllowedRoles = await getPublishingdAllowedUserRoles('publish_cg_org');
      for (const result of results) {
        const publishingAllowedProperties = await getPublishingProperties(result, allPublishingAllowedRoles, 'cgo');
        Object.assign(result, publishingAllowedProperties);
      }
    },
    async afterFindOne(result, params) {
      const allPublishingAllowedRoles = await getPublishingdAllowedUserRoles('publish_cg_org');
      const publishingAllowedProperties = await getPublishingProperties(result, allPublishingAllowedRoles, 'cgo');
      Object.assign(result, publishingAllowedProperties);
    }
  }
};
