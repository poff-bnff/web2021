'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/v3.x/concepts/controllers.html#core-controllers)
 * to customize this controller
 */

module.exports = {

    async getAll(ctx) {


        // try {
        //     const getAll = ctx.params.getAll || ctx.params._getAll
        // }
        // let tere = await strapi.services.product.getAll(getAll)
        // let strapi.query()
        // const data = await strapi.services.product.
        let params = ctx.params
        let query = ctx.query
        return {params, query, ctx}
    },
};

