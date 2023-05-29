'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#lifecycle-hooks)
 * to customize this model
 */

module.exports = {
  async beforeDelete(params) {
    // TODO: find out, what or who is params.user?
    delete params.user
  }
}
