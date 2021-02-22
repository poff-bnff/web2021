'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/v3.x/concepts/models.html#lifecycle-hooks)
 * to customize this model
 */

const slugify = require('@sindresorhus/slugify');
const { StringDecoder } = require('string_decoder');
const decoder = new StringDecoder('utf8');
const {
    execFile,
    exec,
    spawn
} = require('child_process');

const fs = require('fs');
const yaml = require('yaml');
const path = require('path');

// module.exports = {
// 	beforeSave: async (model, attrs, options) => {
// 		console.log('FOO', model, attrs, options)
        // data.slug_et = slugify(data.title_et) + '_42';
        // data.slug_en = slugify(data.title_en);
        // data.slug_ru = slugify(data.title_ru);
//       },
// }

// mappingFestivalEdition is used for keeping track of strapi_id for for festival_edition
const mappingFestivalEdition = {
  '1': 'poff',
  '2': 'shorts',
  '3': 'just',
  '4': 'kinoff',
  '5': 'hoff'
}

function get_domain_name(result) {
  let domain_to_build = []
  for (let edition of result.festival_editions){
    domain_to_build.push(mappingFestivalEdition[edition.id])
  }
  return domain_to_build
}


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
      // console.log('params', params, 'data', data);
      data.slug_et = data.title_et ? slugify(prefix + data.title_et) : null
      data.slug_ru = data.title_ru ? slugify(prefix + data.title_ru) : null
      data.slug_en = data.title_en ? slugify(prefix + data.title_en) : null
    },
    afterUpdate(result, params, data) {
      let domains = get_domain_name(result)
      for (let domain of domains){
        if (fs.existsSync('/srv/ssg/build_hoff.sh') && domain === 'hoff') {
            const args = []

            const child = spawn('/srv/ssg/build_hoff.sh', args)

            child.stdout.on('data', (chunk) => {
                console.log(decoder.write(chunk))
              // data from the standard output is here as buffers
            });
            // since these are streams, you can pipe them elsewhere
            child.stderr.on('data', (chunk) => {
                console.log('err:', decoder.write(chunk))
              // data from the standard error is here as buffers
            });
            // child.stderr.pipe(child.stdout);
            child.on('close', (code) => {
                console.log(`child process exited with code ${code}`);
            });
        }
      }
    }
  },
};



