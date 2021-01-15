'use strict';
const slugify = require('@sindresorhus/slugify');

/**
 * Read the documentation (https://strapi.io/documentation/v3.x/concepts/models.html#lifecycle-hooks)
 * to customize this model
 */

module.exports = {
  lifecycles: {
    beforeUpdate(params, data) {
      console.log('params', params, 'data', data);
      data.slug_et = data.title_et ? slugify(data.title_et) : null
      data.slug_ru = data.title_ru ? slugify(data.title_ru) : null
      data.slug_en = data.title_en ? slugify(data.title_en) : null
    },
  },
};

// module.exports = {
    // lifecycles: {
    //     async beforeUpdate (data) {
    //       if (data.title_et) data.slug_et = slugify(data.title_et);
    //       if (data.title_en) data.slug_en = slugify(data.title_en);
    //       if (data.title_ru) data.slug_ru = slugify(data.title_ru);
    //     },
  
    //   },

 // };


