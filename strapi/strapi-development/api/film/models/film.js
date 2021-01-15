'use strict';
const slugify = require('@sindresorhus/slugify');

//const countableSlugify = slugify.counter();

/**
 * Read the documentation (https://strapi.io/documentation/v3.x/concepts/models.html#lifecycle-hooks)
 * to customize this model
 */

// module.exports = {
// 	beforeSave: async (model, attrs, options) => {
// 		console.log('FOO', model, attrs, options)
        // data.slug_et = slugify(data.title_et) + '_42';
        // data.slug_en = slugify(data.title_en);
        // data.slug_ru = slugify(data.title_ru);
//       },
// }

module.exports = {
  lifecycles: {
    beforeUpdate(params, data) {
      const prefixes= {
        2213: '0_'
      }
      let prefix = ''
      if (data.id in prefixes) {
        prefix = prefixes[data.id]
      }
      console.log('params', params, 'data', data);
      data.slug_et = data.title_et ? slugify(prefix + data.title_et) : null
      data.slug_ru = data.title_ru ? slugify(prefix + data.title_ru) : null
      data.slug_en = data.title_en ? slugify(prefix + data.title_en) : null
    },
  },
};



