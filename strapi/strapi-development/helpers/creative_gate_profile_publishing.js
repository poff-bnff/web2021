async function getPublishingProperties(entity, buildAllowedRoles, productCodePrefix) {
  if (!entity.user) {
    return {
      allowed_to_publish: true,
      allowed_to_publish_valid_to_date: null
    };
  }

  const userInfo = await strapi.query('user', 'users-permissions').findOne({ 'id': entity.user.id }, ['my_products', 'user_roles']);



  for (const role of userInfo.user_roles) {
    if (buildAllowedRoles[role.id]) {
      //if role is with end date
      if (role.valid_to) {
        if (new Date(role.valid_to) >= new Date()) {
          return {
            allowed_to_publish: true,
            allowed_to_publish_valid_to_date: new Date(role.valid_to),
          };
        }
      } else {
        //if buyed role and has active product for publishing
        const maxProductValidToDate = await getMaxProductValidToDate(userInfo, productCodePrefix);
        if (maxProductValidToDate >= new Date()) {
          return {
            allowed_to_publish: true,
            allowed_to_publish_valid_to_date: maxProductValidToDate,
          };
        }
      }
    }
  }
  return {
    allowed_to_publish: false,
    allowed_to_publish_valid_to_date: null
  };
}

async function getMaxProductValidToDate(userInfo, productCodePrefix) {
  const activeCreativeGateProducts = userInfo.my_products.filter(product => product.code.startsWith(productCodePrefix) && product.valid_to && new Date(product.valid_to) > new Date());

  return activeCreativeGateProducts.reduce((max, product) => {
    const validTo = new Date(product.valid_to);
    return validTo > max ? validTo : max;
  }, new Date(0));
}

async function getPublishingdAllowedUserRoles(allowedFunction) {
  const allRoles = await strapi.query('user-role').find({}, ['user_right']);

  return allRoles.reduce((acc, role) => {
    const functions = role.user_right
      .flatMap(user_right => user_right.functions)
      .filter(func => func.name === allowedFunction)
      .map(func => func.name);

    if (functions.length > 0) {
      acc[role.id] = {
        valid_from: role.valid_from,
        valid_to: role.valid_to,
        functions
      };
    }
    return acc;
  }, {});
}

exports.getPublishingProperties = getPublishingProperties
exports.getPublishingdAllowedUserRoles = getPublishingdAllowedUserRoles
