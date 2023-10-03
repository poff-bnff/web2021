'use strict';

const path = require('path')
const { sanitizeEntity } = require('strapi-utils');

let moodle_manager = path.join(__dirname, '..', '..', '..', '/helpers/moodle_manager.js')
let role_assigner = path.join(__dirname, '..', '..', '..', '/helpers/role_assigner.js')
const {
  getUser,
  createUser,
  enrolUser,
} = require(moodle_manager)

const { roleAssigner } = require(role_assigner)

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
      const oldUserInfo = await strapi.query('user', 'users-permissions').findOne({ 'id': params.id }, ['my_products', 'user_roles']);
      const sanitizedOldUserInfo = sanitizeEntity(oldUserInfo, {
        model: strapi.query('user', 'users-permissions').model,
      });

      // Save beforeUpdate state of the user products
      data.my_products_before_update = sanitizedOldUserInfo?.my_products?.map(p => p.id)
    },

    async afterCreate(result, data) {
      const userProfile = await strapi.query('user-profiles').create({
        user: result.id,
        email: result.email,
      })
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

        const affectedProductInfos = await strapi.query('product').find({ 'id_in': allAffectedProducts }, ['product_category', 'product_category.product_types', 'product_category.user_roles', 'product_category.course_events']);
        const sanitizedAffectedProductInfos = sanitizeEntity(affectedProductInfos, {
          model: strapi.query('product').model,
        });

        // Array of roles to be removed from user
        let roles_removed = removedProductsArray.map(p => sanitizedAffectedProductInfos.filter(s => s.id === p)[0]?.product_category?.user_roles?.map(r => r.id))
        let unique_roles_removed = [].concat(...roles_removed)

        // Array of initial roles of user
        let initial_user_roles = result.user_roles ? result.user_roles.map(r => r.id) : []

        // Remove roles to be removed and add all associated with current products
        await roleAssigner(result.id, initial_user_roles, my_products, unique_roles_removed)

        // Filter products with category type course (ID 3)
        let productsCategories = sanitizedAffectedProductInfos.filter(p => p?.product_category?.product_types?.map(t => t.id).includes(3));

        if (productsCategories.length) {
          if (result?.user_profile?.firstName && result?.user_profile?.lastName) {
            const userEmail = result.email
            const userFirstName = result?.user_profile?.firstName
            const userLastName = result?.user_profile?.lastName

            let userMoodleId
            // Check if moodle_id already under Strapi user
            if (!result.moodle_id) {
              const getMoodleUserInfo = await getUser(userEmail)
              userMoodleId = getMoodleUserInfo?.users?.[0]?.id
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

            } else { userMoodleId = result.moodle_id }

            // By now Strapi user should have moodle ID to enrol Moodle courses
            if (userMoodleId) {
              // Enrol user to courses that were added
              if (addedProductsArray.length) {
                const courseIds = []
                addedProductsArray.map(ap => {
                  productsCategories.filter(p => p.id === ap)
                    .map(p => p?.product_category?.course_events?.filter(c => c.moodle_id).map(c => courseIds.push(c.moodle_id)))
                })

                const uniqueCourseIds = [... new Set(courseIds)]
                for (let i = 0; i < uniqueCourseIds.length; i++) {
                  const courseId = uniqueCourseIds[i];
                  console.log('courseId', courseId);
                  const enrolMoodleUser = await enrolUser(userMoodleId, courseId, 5)
                  console.log('Moodle user', userMoodleId, 'enrolled to course ', courseId);
                }
              }

              // Unenrol user from courses that were removed
              if (removedProductsArray.length) {
                const courseIds = []
                removedProductsArray.map(rp => {
                  productsCategories.filter(p => p.id === rp)
                    .map(p => p?.product_category?.courses?.filter(c => c.moodle_id).map(c => courseIds.push(c.moodle_id)))
                })

                const uniqueCourseIds = [... new Set(courseIds)]
                for (let i = 0; i < uniqueCourseIds.length; i++) {
                  const courseId = uniqueCourseIds[i];
                  console.log('courseId', courseId);
                  const enrolMoodleUser = await enrolUser(userMoodleId, courseId, 5, true)
                  console.log('Moodle user', userMoodleId, 'unenrolled from course ', courseId);
                }
              }
            }
          } else {
            console.log('Profile not filled');
          }
        } else {
          console.log('User, but no course products changed');
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
