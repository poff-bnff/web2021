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
    },
    beforeDelete(params) {
      delete params.user
    }
  }
}

const profileFilled = data => {
  let profileFilled = false

  const { personAsProfile } = data
  if (personAsProfile && personAsProfile.firstName && personAsProfile.lastName && personAsProfile.gender && personAsProfile.birthdate && personAsProfile.phoneNr && personAsProfile.address) {
    profileFilled = true
  }
  console.log('Models User profileFilled data', {personAsProfile, profileFilled});
  return profileFilled
}
