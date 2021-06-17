'use strict';

/**
 * Lifecycle callbacks for the `User` model.
 */

module.exports = {
    lifecycles: {
        beforeCreate(data) {
            data.profileFilled = profileFilled(data)
            data.account_created ? null : data.account_created = new Date().toISOString()
        },
        afterCreate(result, data) {
            data.profileFilled && createPersonAsProfile(result.id, data.personAsProfile)
        },
        beforeDelete(params) {
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

const createPersonAsProfile = (userId, personAsProfile) => {
    personAsProfile.users_permissions_user = userId

    strapi.query('person-test2').create(personAsProfile)
}