module.exports = {
  definition: ``,
  query: `
    productsByCategory(limit: Int): [Product]!
  `,
  type: {},
  resolver: {
    Query: {
      productsByCategory: {
        description: 'Return a list of products by category',
        resolverOf: 'application::product.product.find',
        resolver: async (obj, options, { context }) => {
          console.log({context, obj, options})
          const {id} = context.params
          const transaction = await strapi.services.transaction.find({id})
          return transaction ? transaction : 'no transactions'
        },
      }
    },
  }
};
