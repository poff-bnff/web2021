'use strict';

/**
 * Lifecycle callbacks for the `User` model.
 */

module.exports = {
    lifecycles: {
        beforeCreate (data){
            data.profileFilled = profileFilled(data)
        },
        beforeUpdate(params, data){
            data.profileFilled = profileFilled(data)
        },
        beforeDelete(params){
            delete params.user
        }
    }
}

const profileFilled = data => {
    let profileFilled = false
    if (data.firstName && data.lastName && data.gender && data.birthdate && data.phoneNr && data.address)
        profileFilled = true

    return profileFilled
} 