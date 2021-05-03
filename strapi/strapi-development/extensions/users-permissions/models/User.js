'use strict';

/**
 * Lifecycle callbacks for the `User` model.
 */

module.exports = {
    lifecycles: {
        beforeUpdate(params, data){
            console.log(params, data);
            if (data.firstName && data.lastName && data.gender && data.birthdate && data.phoneNr && data.address){
                data.profileFilled = true
            } else {
                data.profileFilled = false
            }
        },
    }
}