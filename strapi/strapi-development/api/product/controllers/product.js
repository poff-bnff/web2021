'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/v3.x/concepts/controllers.html#core-controllers)
 * to customize this controller
 */

module.exports = {

  async availability(ctx) {
    const params = {
      code_null: false,
      reserved_to_null: true,
      owner_null: true,
      active: true,
    }

    let availabilityCheck = await strapi.services.product.find(params)

    if (availabilityCheck) {
      let productCatIds = availabilityCheck.map(a => {
        return JSON.stringify({
          id: a.product_category.id,
          price: a.product_category.priceAtPeriod[0].price
        })
      })
      let uniqueProductCatIds = [...new Set(productCatIds)]
      return uniqueProductCatIds.map(p => JSON.parse(p))
    } else {
      return []
    }
  }

};
