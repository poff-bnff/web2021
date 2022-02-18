'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
    async indusrtyEventRelated(ctx) {
        console.log( ctx.request.body)
	return {"ok": "ok"}
    }

//    indusrtyEventRelated: async (ctx, next) => {
//        console.log(ctx, next)
//    }
};
