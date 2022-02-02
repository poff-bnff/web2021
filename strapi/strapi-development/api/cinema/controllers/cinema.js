'use strict';
// Require sanitizer
const { sanitizeEntity } = require('strapi-utils');

module.exports = {
  // New controller with same name as defined in routes.json for finding all cinemas in one certain town
  findCinemasInTown: async (ctx) => {
    // Get provided 'town' parameter
    const town = ctx.params?.town;

    // Query parameters, limitless responses and town name has to equal provided town
    const params = {
      _limit: -1,
      'town.name_et': town,
    }

    // Query
    let result = await strapi.query('cinema').find(params);

    // SANITIZE, because otherwise password hashes and user info etc will be returned

    // Option 1
    // let sanitizedResult = result.map(c => {
    //   return {
    //     cinema: c.name_et,
    //     town: c?.town?.name_et
    //   }
    // })

    // Option 2, use Strapi sanitizer utility
    let sanitizedResult = sanitizeEntity(result, {
      model: strapi.query('cinema').model,
    })

    // Random console log just for log fun
    console.log(sanitizedResult);

    // Return sanitized result
    return sanitizedResult
  },
};
