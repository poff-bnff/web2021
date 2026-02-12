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
      if (userRights.includes('publish_cg_person') && user.person) {
       /*  console.log('Must build person id: ', user.person); */
        await strapi.services.person.build(user.person)
      }
    }
  },

  async build(id) {
    const entity = await strapi.services.person.findOne(
      { id: id },
      [
        'picture',
        'gender',
        'organisations',
        'biography',
        'awardings',
        'festival_editions',
        'domains',
        'role_at_films',
        'eye_colour',
        'hair_colour',
        'shoe_size',
        'stature',
        'pitch_of_voice',
        'profile_img',
        'addr_coll', 'addr_coll.country', 'addr_coll.county',
        'hair_length',
        'native_lang',
        'other_lang',
        'images',
        'audioreel',
        'industry_person_types',
        'tag_looking_fors',
        'filmographies', 'filmographies.type_of_work',
        'industry_categories',
        'orderedRafF',
        'clients',
        'user',
      ]
    );
    const cleanEntity = sanitizeEntity(entity, { model: strapi.models.person });
    /* console.log(cleanEntity, 'person') */
    if (cleanEntity.allowed_to_publish) {
      await modify_stapi_data(cleanEntity, 'person')
      await call_build(cleanEntity, ['industry.poff.ee'], 'person')
    }
  }
};
