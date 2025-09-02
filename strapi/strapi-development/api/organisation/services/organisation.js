'use strict';

const path = require('path');
const { sanitizeEntity } = require('strapi-utils');

const {
  call_build,
  modify_stapi_data,
} = require(path.join(__dirname, '..', '..', '..', '/helpers/lifecycle_manager.js'))

module.exports = {
  async newProductBuyed(user, productCategory) {
    if (productCategory.user_roles && productCategory.user_roles.length) {
      const userRights = productCategory.user_roles.flatMap(r => r.user_right).flatMap(ur => ur.functions).map(f => f.name);
      if (userRights.includes('publish_cg_org') && user.organisation) {
        console.log('Must build org id: ', user.organisation);
        await strapi.services.organisation.build(user.organisation)
      }
    }
  },
  async build(id) {
    const entity = await strapi.services.organisation.findOne(
      { id: id },
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
    console.log(cleanEntity, 'organisation')
    if (cleanEntity.allowed_to_publish) {
      await modify_stapi_data(cleanEntity, 'organisation')
      await call_build(cleanEntity, ['industry.poff.ee'], 'organisation')
    }
  }
};
