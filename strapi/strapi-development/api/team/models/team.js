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

module.exports = {
	lifecycles: {
		beforeUpdate(params, data) {

		},
		afterUpdate(result, params, data) {
			// console.log(result.domain.id)
			if (fs.existsSync('/srv/ssg/build_hoff.sh') && result.domain.id === 6) {
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
	},
};
