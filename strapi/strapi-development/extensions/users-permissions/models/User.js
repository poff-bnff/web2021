'use strict';

const path = require('path')
const { sanitizeEntity } = require('strapi-utils');

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
    async beforeUpdate(params, data) {
      const oldUserInfo = await strapi.query('user', 'users-permissions').findOne({ 'id': params.id }, ['my_products']);
      const sanitizedOldUserInfo = sanitizeEntity(oldUserInfo, {
        model: strapi.query('user', 'users-permissions').model,
      });

      data.my_products_before_update = sanitizedOldUserInfo?.my_products?.map(p => p.id)
    },
    async afterCreate(result, data) {
    },
    async afterUpdate(result, params, data) {
      let my_products_before_update = data.my_products_before_update
      let my_products = data.my_products

      // Check if my_products not undefined (happens when updating moodle_id)
      if (my_products) {



        let addedProductsArray = [...new Set(my_products.filter(x => !my_products_before_update.includes(x)))]
        let removedProductsArray = [...new Set(my_products_before_update.filter(x => !my_products.includes(x)))]
        let allAffectedProducts = [...addedProductsArray].concat(removedProductsArray)

        if (addedProductsArray.length) { console.log('addedProduct(s)', addedProductsArray); }
        if (removedProductsArray.length) { console.log('removedProduct(s)', removedProductsArray); }
        if (allAffectedProducts.length) { console.log('allAffectedProducts', allAffectedProducts); }

        const fullProductInfos = await strapi.query('product').find({ 'id_in': allAffectedProducts }, ['product_category', 'product_category.product_types']);
        const sanitizedFullProductInfos = sanitizeEntity(fullProductInfos, {
          model: strapi.query('product').model,
        });
        // Filter products with category type course and which category type moodle_id present
        let courseProducts = sanitizedFullProductInfos.filter(p => p?.product_category?.product_types?.map(t => t.id).includes(2) && p?.product_category?.moodle_id);

        if (courseProducts.length) {
          if (result?.user_profile?.firstName && result?.user_profile?.lastName) {
            const userEmail = result.email
            const userFirstName = result?.user_profile?.firstName
            const userLastName = result?.user_profile?.lastName
            // Check if moodle_id already under Strapi user
            if (!result.moodle_id) {
              const getMoodleUserInfo = await getUser(userEmail)
              let userMoodleId = getMoodleUserInfo?.users?.[0]?.id
              // If already, update user
              if (userMoodleId) {
                console.log('Moodle user exists with ID:', userMoodleId, 'Updating Strapi user with Moodle ID');
                const setMoodleID = await strapi.query('user', 'users-permissions').update({ 'id': result.id }, { moodle_id: userMoodleId });
                // Else, create Moodle user and update Strapi user
              } else {
                const createMoodleUser = await createUser(userEmail, userFirstName, userLastName)
                console.log('createMoodleUser result: ', createMoodleUser, typeof createMoodleUser);
                const setMoodleID = await strapi.query('user', 'users-permissions').update({ 'id': result.id }, { moodle_id: createMoodleUser[0].id });
                // Update variable with user moodle_id
                userMoodleId = createMoodleUser[0].id
              }

              // By now Strapi user should have moodle ID
              if (userMoodleId) {
                // Enrol user to courses that were added
                if (addedProductsArray.length) {
                  for (let i = 0; i < addedProductsArray.length; i++) {
                    const courseId = courseProducts.filter(p => p.id === addedProductsArray[i])[0].product_category?.moodle_id;
                    const enrolMoodleUser = await enrolUser(userMoodleId, courseId, 5)
                    console.log('Moodle user', userMoodleId, 'enrolled to course ', courseId);
                  }
                }
                // Unenrol user from courses that were removed
                if (removedProductsArray.length) {
                  for (let i = 0; i < removedProductsArray.length; i++) {
                    const courseId = courseProducts.filter(p => p.id === removedProductsArray[i])[0].product_category?.moodle_id;
                    const unEnrolMoodleUser = await enrolUser(userMoodleId, courseId, 5, true)
                    console.log('Moodle user', userMoodleId, 'unenrolled from course ', courseId);
                  }
                }
              }
            }
          } else {
          console.log('Profile not filled');
          }
        } else {
          console.log('No course products changed');
        }
      }
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
