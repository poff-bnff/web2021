'use strict';

/**
 * `isAuthenticated` policy.
 */

module.exports = async (ctx, next) => {
	// Add your own logic here.
	console.log('In isAuthenticated policy.');
	// console.log(ctx, 'params', ctx.params, ctx.state, ctx.status)
	if (ctx.state.user.id === parseInt(ctx.params.id)) {
		return await next()
	}

	ctx.unauthorized(`You're not allowed to perform this action!`)
 		
	


};
