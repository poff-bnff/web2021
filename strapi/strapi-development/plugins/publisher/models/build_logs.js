'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/v3.x/concepts/models.html#lifecycle-hooks)
 * to customize this model
 */

module.exports = {
  lifecycles: {
    beforeUpdate(params, data) {
      // console.log('...... beforeUpdate params:', params, '......... beforeUpdate data:', data);

    },
    afterUpdate (result, params, data){
    	// console.log('...... afterUpdate result:', result,'...... afterUpdate params:', params, '......... afterUpdate data:', data);

    },
    beforeCreate(data) {
    	console.log(".....beforeCreate data:", data)
    	if(data.endTime && data.errorCode === "-"){
    		              console.log("kõik õnnestus")
    		  	strapi.notification.toggle({type: "warning", message: "kõik õnnestus", title: "HÕFF", timeout: 5000, blockTransition: false})

    	}
    }
  },
};