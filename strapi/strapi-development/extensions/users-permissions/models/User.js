'use strict';

/**
 * Lifecycle callbacks for the `User` model.
 */

module.exports = {
    lifecycles: {
        beforeCreate (data){
            data.profileFilled = profileFilled(data)
        },
        async beforeUpdate( params, data) {
            // console.log('P', params, 'D', data)
            data.people = []
            let people = await strapi.query('person').find({ eMail_eq: data.email})
            if (people.length > 0) {
                let userAddedPersons = []
                for(let person of people) {
                    userAddedPersons.push({id: person.id})
                }
                data.people = userAddedPersons
            }

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