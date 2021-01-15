'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/v3.x/concepts/controllers.html#core-controllers)
 * to customize this controller
 */

module.exports = {};


// const { sanitizeEntity } = require('strapi-utils');

// module.exports = {
//   async find(ctx) {
//     let entities;
//     if (ctx.query._q) {
//       entities = await strapi.services.cinema.search(ctx.query);
//     } else {
//       entities = await strapi.services.cinema.find(ctx.query);
//     }

//     return entities.map(entity => {
//       const cinema = sanitizeEntity(entity, {
//         model: strapi.models.cinema,
//       });
//       if (cinema.created_by.firstname == "Mariann") {
//         delete cinema.Name;
//         delete cinema.Address;
//         delete cinema.Name_et;
//         delete cinema.Name_en;
//         delete cinema.Name.ru;
//         delete cinema.aadress;
//         cinema.created_by.firstname="MINU MINU MINU"
//         return cinema;
//       }
//     });
//   },
// };


