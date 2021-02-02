
'use strict';


/**
 * Read the documentation (https://strapi.io/documentation/v3.x/concepts/models.html#lifecycle-hooks)
 * to customize this model
 */
const { execFile } = require('child_process');
const fs = require('fs');
const yaml = require('yaml');
const path = require('path');



module.exports = {
	lifecycles: {
		beforeUpdate(params, data) {
			console.log(data.published_at)
		},
		afterUpdate(result, params, data) {
			if (result.published_at) {
				if (fs.existsSync(`/srv/ssg/build_hoff.sh`)) {
					console.log('START FULLBUILD')
					const child = execFile('bash', [`/srv/ssg/build_hoff.sh`, result.id], (error, stdout, stderr) => {
						if (error) {
							throw error;
						}
						console.log(stdout);
					})
				}
			}
		}
	}
};
