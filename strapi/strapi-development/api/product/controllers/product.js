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
      let dateTimeNow = new Date()
      let productCatIds = availabilityCheck.map(a => {
        let productPrices = a.product_category.priceAtPeriod.filter(p => {
          if (p.startDateTime && p.endDateTime && new Date(p.startDateTime) < dateTimeNow && new Date(p.endDateTime) > dateTimeNow) {
            return true
          } else {
            return false
          }
        })
        let productPriceNow = productPrices[0]?.price
        return JSON.stringify({
          id: a.product_category.id,
          price: productPriceNow || null
        }).filter(p => p.price !== null)
      })
      let uniqueProductCatIds = [...new Set(productCatIds)]
      return uniqueProductCatIds.map(p => JSON.parse(p))
    } else {
      return []
    }
  }

};
