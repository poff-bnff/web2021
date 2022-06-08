'use strict';

// This file was only added to prevent
// "Your filters contain a field 'user' that doesn't appear on your model definition nor it's relations"
// error as ctx filter accepts only fields that exist in particular model

/**
 * Read the documentation (https://strapi.io/documentation/v3.x/concepts/models.html#lifecycle-hooks)
 * to customize this model
 */

const path = require('path')
const { sanitizeEntity } = require('strapi-utils');
const moodle_manager = path.join(__dirname, '..', '..', '..', '/helpers/moodle_manager.js')
const {
  getUser,
  createUser,
  enrolUser,
} = require(moodle_manager)

let helper_path = path.join(__dirname, '..', '..', '..', '/helpers/lifecycle_manager.js')
let sheet_path = path.join(__dirname, '..', '..', '..', '..', '..', 'ssg', '/helpers/connect_spreadsheet.js')

const {
  call_update,
  call_build,
  get_domain,
  modify_stapi_data,
  call_delete,
} = require(helper_path)

const {
  readSheet,
  update_sheets
} = require(sheet_path)

/**
const domains =
For adding domain you have multiple choice. First for objects that has property 'domain'
or has property, that has 'domain' (at the moment festival_edition and programmes) use
function get_domain(result). If you know that that object has doimain, but no property
to indicate that. Just write the list of domains (as list), example tartuffi_menu.
And last if full build, with no domain is needed. Write FULL_BUILD (as list)
*/

const model_name = (__dirname.split(path.sep).slice(-2)[0])
// const domains = ['hoff.ee'] // hard coded if needed AS LIST!!!
// const domains = ['FULL_BUILD'] // hard coded if needed AS LIST!!!

module.exports = {
  lifecycles: {
    async afterCreate(result, data) {
    },
    async beforeUpdate(params, data) {
      // data.product_category (ja muu algeline info) on olemas kui muudetakse Strapis
      // data.transactions (ja enamik muud datast puudu) on ainult olemas kui on edukas tehing veebipoes
      // Seetõttu alati pärime tooteinfo endise omaniku kättesaamiseks
      const product = await strapi.query('product').findOne({ 'id': params.id });

      const sanitizedOldOwnerInfo = sanitizeEntity(product, {
        model: strapi.query('user', 'users-permissions').model,
      });
      data.owner_before_update = sanitizedOldOwnerInfo.owner
    },
    async afterUpdate(result, params, data) {
      // let sheet_ID = '1523CDLVZyDmn9-lKr8B1VNS0paM8IeZBxcvWM_VeXyQ'
      // let sheet_name = 'Strapi_Products'
      // //	console.log({result})
      // let read_spsheet = await update_sheets(result, model_name, sheet_ID, sheet_name)
      // // console.log(read_spsheet)

      // As per beforeUpdate code, only applies when category includes product type course (ID 2)

      let owner_before_update = data.owner_before_update
      const sanitizedResult = sanitizeEntity(result, {
        model: strapi.query('product').model,
      });
      if (sanitizedResult.product_category) {
        const productCat = await strapi.query('product-category').findOne({ 'id': sanitizedResult.product_category.id });

        const courseMoodleIds = productCat?.courses?.map(c => c.moodle_id)
        const uniqueCourseMoodleIds = [... new Set(courseMoodleIds)]

        let owner = data.owner
        // If previous owner is not the same as new owner
        if (owner_before_update && owner_before_update.id !== owner) {
          // If there was a change of owner
          if (owner_before_update && owner) {
            console.log(`Product ID ${sanitizedResult.id} owner has changed (${sanitizedResult.id} -> ${owner_before_update.id})`);
            const oldUserMoodleId = owner_before_update.moodle_id

            // Suspend previous owner from Moodle courses
            await unEnrolOldUser(oldUserMoodleId, uniqueCourseMoodleIds);

            // Get new user full info (including profile) and enrol courses
            await newOwnerMoodleFunc(sanitizedResult, uniqueCourseMoodleIds);
          }
          // Previous owner but no new owner
          if (owner_before_update && !owner) {
            console.log(`Product ID ${sanitizedResult.id} owner has been removed (${sanitizedResult.id} -> null)`);
            const oldUserMoodleId = owner_before_update.moodle_id
            // Suspend previous owner from Moodle courses
            await unEnrolOldUser(oldUserMoodleId, uniqueCourseMoodleIds);
          }
        }
        // If no previous owner and there is a new owner
        if (!owner_before_update && owner) {
          // Get new user full info (including profile)
          await newOwnerMoodleFunc(sanitizedResult, uniqueCourseMoodleIds);
        }
      }
    },
    async beforeDelete(params) {
      delete params.user
    },
    async afterDelete(result, params) {

    }
  }
};

async function checkAndCreateMoodleUser(sanitizedNewUserInfo) {
  const userEmail = sanitizedNewUserInfo.email
  const userFirstName = sanitizedNewUserInfo?.user_profile?.firstName
  const userLastName = sanitizedNewUserInfo?.user_profile?.lastName
  let userMoodleId = sanitizedNewUserInfo.moodle_id

  // Check if moodle_id already under Strapi user

  const getMoodleUserInfo = await getUser(userEmail)
  userMoodleId = getMoodleUserInfo?.users?.[0]?.id
  // If already, update user
  if (userMoodleId) {
    console.log('Moodle user exists with ID:', userMoodleId, 'Updating Strapi user with Moodle ID');
    const setMoodleID = await strapi.query('user', 'users-permissions').update({ 'id': sanitizedNewUserInfo.id }, { moodle_id: userMoodleId });
    // Else, create Moodle user and update Strapi user
  } else {
    const createMoodleUser = await createUser(userEmail, userFirstName, userLastName)
    console.log('createMoodleUser result: ', createMoodleUser, typeof createMoodleUser);
    const setMoodleID = await strapi.query('user', 'users-permissions').update({ 'id': sanitizedNewUserInfo.id }, { moodle_id: createMoodleUser?.[0]?.id });
    // Update variable with user moodle_id
    userMoodleId = createMoodleUser?.[0]?.id
  }
  return userMoodleId
}

async function unEnrolOldUser(oldUserMoodleId, uniqueCourseMoodleIds) {
  if (oldUserMoodleId && uniqueCourseMoodleIds.length) {
    for (let i = 0; i < uniqueCourseMoodleIds.length; i++) {
      const courseId = uniqueCourseMoodleIds[i];
      const enrolMoodleUser = await enrolUser(oldUserMoodleId, courseId, 5, true);
    }
    console.log('Suspended course(s)', uniqueCourseMoodleIds, 'for Moodle user', oldUserMoodleId);
  }
}

async function newOwnerMoodleFunc(sanitizedResult, uniqueCourseMoodleIds) {
  const newUserInfo = await strapi.query('user', 'users-permissions').findOne({ 'id': sanitizedResult.owner.id }, ['user_profile']);
  const sanitizedNewUserInfo = sanitizeEntity(newUserInfo, {
    model: strapi.query('user', 'users-permissions').model,
  });

  let newOwnerMoodleId = sanitizedNewUserInfo.moodle_id;
  if (!newOwnerMoodleId) {
    newOwnerMoodleId = await checkAndCreateMoodleUser(sanitizedNewUserInfo);
  }

  if (newOwnerMoodleId) {
    if (uniqueCourseMoodleIds.length) {
      for (let i = 0; i < uniqueCourseMoodleIds.length; i++) {
        const courseId = uniqueCourseMoodleIds[i];
        const enrolMoodleUser = await enrolUser(newOwnerMoodleId, courseId, 5);
      }
      console.log('Enrolled course(s)', uniqueCourseMoodleIds, 'for Moodle user', newOwnerMoodleId);
    }
  } else {
    console.log('User creation failed');
  }
}

