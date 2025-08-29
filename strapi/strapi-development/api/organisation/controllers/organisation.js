'use strict';
const { parseMultipartData, sanitizeEntity } = require('strapi-utils');

module.exports = {
  /**
   * Update a record.
   *
   * @return {Object}
   */
  /*industry creative gate endpoint*/
  async addpro(ctx) {
    const { id } = ctx.params;

    let entity;
    if (ctx.is('multipart')) {
      const { data, files } = parseMultipartData(ctx);
      entity = await strapi.services.organisation.update({ id }, data, {
        files,
      });
    } else {
      entity = await strapi.services.organisation.update({ id }, ctx.request.body);
    }
    const returnEntity = sanitizeEntity(entity, { model: strapi.models.organisation });
    returnEntity.estimated_build_time = 5
    return returnEntity
  },
};
