'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/concepts/models.html#lifecycle-hooks)
 * to customize this model
 */
const moment = require('moment-timezone')

module.exports = {
	lifecycles: {
		async afterCreate(result, data){
			delete(result.published_at)
			await strapi.query('course').update({ id: result.id}, result)
		},
		async beforeUpdate(params, data){
			if(data.startDate && data.endDate){
				let start = moment(data.startDate).tz('Europe/Tallinn')
				let end = moment(data.endDate).tz('Europe/Tallinn')
				data.durationTotal = moment.duration(end.diff(start)).as('minutes')
			}
		}
	}
}
