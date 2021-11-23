'use strict';

// This file was only added to prevent
// "Your filters contain a field 'user' that doesn't appear on your model definition nor it's relations"
// error as ctx filter accepts only fields that exist in particular model

/**
 * Read the documentation (https://strapi.io/documentation/v3.x/concepts/models.html#lifecycle-hooks)
 * to customize this model
 */

module.exports = {
  lifecycles: {
    async afterCreate(result, data) {

    },
    async beforeUpdate(params, data) {

    },
    async afterUpdate(result, params, data) {

    },
    async beforeDelete(params) {
      delete params.user
    },
    async afterDelete(result, params) {

    }
  }
};
