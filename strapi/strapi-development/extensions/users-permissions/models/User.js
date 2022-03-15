'use strict';

const path = require('path')

let moodle_manager = path.join(__dirname, '..', '..', '..', '/helpers/moodle_manager.js')
const {
  getUser,
  createUser,
  enrolUser,
} = require(moodle_manager)

/**
 * Lifecycle callbacks for the `User` model.
 */

module.exports = {
  lifecycles: {
    beforeCreate(data) {
      data.profileFilled = profileFilled(data)
      data.account_created ? null : data.account_created = new Date().toISOString()
    },
    async afterCreate(result, data) {
    },
    async afterUpdate(result, params, data) {
      const userEmail = result.email
      const userFirstName = result?.user_profile?.firstName
      const userLastName = result?.user_profile?.lastName

      if (result.user_roles) {
        let courseRoles = result.user_roles.filter(cr => cr?.name?.split('_')?.[0] === 'Course')
        if (courseRoles.length) {
          console.log(`User ${userEmail} (${userFirstName} ${userLastName}) should be assigned to courses: `, courseRoles);
        }
      }
      // const getMoodleUserInfo = await getUser(userEmail)
      // const userMoodleId = getMoodleUserInfo?.users?.[0]?.id

      // if (userMoodleId) {
      //   console.log('getMoodleUserInfo result, user exists with ID: ', userMoodleId);
      // } else {
      //   const createMoodleUser = await createUser(userEmail, userFirstName, userLastName)
      //   console.log('createMoodleUser result: ', createMoodleUser, typeof createMoodleUser);
      // }

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
  console.log('Models User profileFilled data', { personAsProfile, profileFilled });
  return profileFilled
}
