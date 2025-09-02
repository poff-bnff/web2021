'use strict';
const { parseMultipartData, sanitizeEntity } = require('strapi-utils');
const path = require('path');
const {
  getPublishingdAllowedUserRoles,
  getPublishingProperties,
  getBuildEstimate
} = require(path.join(__dirname, '..', '..', '..', '/helpers/creative_gate_profile_publishing.js'))

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
    const allPublishingAllowedRoles = await getPublishingdAllowedUserRoles('publish_cg_org');
    const publishingAllowedProperties = await getPublishingProperties(returnEntity.user, allPublishingAllowedRoles, 'cgo');
    Object.assign(returnEntity, publishingAllowedProperties);
    returnEntity.estimated_build_time = await getBuildEstimate(returnEntity, 'organisation')
    return returnEntity
  }
};
