const { sanitizeEntity } = require('strapi-utils');

async function roleAssigner(affectedUserId, initialUserRoles = null, allProducts = null, uniqueRolesRemoved) {

  // If no initial roles nor products, get user info
  if (!initialUserRoles && !allProducts) {
    console.log('Getting userinfo to update roles...');
    const userInfo = await strapi.query('user', 'users-permissions').findOne({ 'id': affectedUserId }, ['my_products', 'user_roles']);
    initialUserRoles = userInfo.user_roles ? userInfo.user_roles.map(r => r.id) : []
    allProducts = userInfo.my_products ? userInfo.my_products.map(r => r.id) : []
  }

  // Get current user products
  const userProductInfos = await strapi.query('product').find({ 'id_in': allProducts }, ['product_category', 'product_category.user_roles']);
  const sanitizedUserProductInfos = sanitizeEntity(userProductInfos, {
    model: strapi.query('product').model,
  });

  // Get roles from current user products
  const userProductRoles = [...new Set(sanitizedUserProductInfos.map(p => p?.product_category?.user_roles?.map(r => r.id))?.flat())]
  console.log('userProductRoles', userProductRoles);

  // Remove roles which are associated with removed products
  if (uniqueRolesRemoved.length) {
    initialUserRoles = initialUserRoles.filter(i => !uniqueRolesRemoved.includes(i));
    console.log('roles_removed', uniqueRolesRemoved);
  }

  // Add all roles associated with current user products
  if (userProductRoles.length) {
    initialUserRoles = initialUserRoles.concat(userProductRoles)
    console.log('roles_added', userProductRoles);
  }

  // Update user with actual roles
  const finalUserRoles = [...new Set(initialUserRoles)]
  const setUserRoles = await strapi.query('user', 'users-permissions').update({ 'id': affectedUserId }, { user_roles: finalUserRoles });
  console.log('User id: ', affectedUserId, 'roles updated: ', finalUserRoles);
}

exports.roleAssigner = roleAssigner


// build_hoff.sh hoff.ee target screenings id  // info mida sh fail ootab
