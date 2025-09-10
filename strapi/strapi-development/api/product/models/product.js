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
const { addMinutes, addHours, addDays, addWeeks, addMonths, addYears } = require('date-fns');
const moodle_manager = path.join(__dirname, '..', '..', '..', '/helpers/moodle_manager.js')
const role_assigner = path.join(__dirname, '..', '..', '..', '/helpers/role_assigner.js')

const {
  getUser,
  createUser,
  enrolUser,
} = require(moodle_manager)

const { roleAssigner } = require(role_assigner)

let helper_path = path.join(__dirname, '..', '..', '..', '/helpers/lifecycle_manager.js')
//let sheet_path = path.join(__dirname, '..', '..', '..', '..', '..', 'ssg', '/helpers/connect_spreadsheet.js')

const {
  call_update,
  call_build,
  get_domain,
  modify_stapi_data,
  call_delete,
} = require(helper_path)

/*const {
  readSheet,
  update_sheets
} = require(sheet_path)*/

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
      if (data.updatedBy === 'checkout') {
        await syncDatesToProduct(product, data);
      }
    },
    async afterUpdate(result, params, data) {
      // let sheet_ID = '1523CDLVZyDmn9-lKr8B1VNS0paM8IeZBxcvWM_VeXyQ'
      // let sheet_name = 'Strapi_Products'
      // //    console.log({result})
      // let read_spsheet = await update_sheets(result, model_name, sheet_ID, sheet_name)
      // // console.log(read_spsheet)

      // As per beforeUpdate code, only applies when category includes product type course-event (ID 2)

      let owner_before_update = data.owner_before_update
      const sanitizedResult = sanitizeEntity(result, {
        model: strapi.query('product').model,
      });

      if (!sanitizedResult.product_category) {
        return
      }
      const productCat = await strapi.query('product-category').findOne({ 'id': sanitizedResult.product_category.id });
      if (!productCat) {
        return
      }
      await syncUserRoles(productCat, sanitizedResult, data, owner_before_update);
      await syncMoodleData(productCat, sanitizedResult, data, owner_before_update);
      if (data.updatedBy === 'checkout') {
        await startBuildCommands(sanitizedResult, productCat);
      }
    },
    async beforeDelete(params) {
      delete params.user
    },
    async afterDelete(result, params) {

    }
  }
};

async function startBuildCommands(sanitizedResult, productCat) {
  if (!sanitizedResult.owner) {
    return
  }
  const fullUserInfo = await strapi.query('user', 'users-permissions').findOne({ 'id': sanitizedResult.owner.id }, ['user_profile', 'user_roles', 'my_products']);
  await strapi.services.person.newProductBuyed(fullUserInfo, productCat)
  await strapi.services.organisation.newProductBuyed(fullUserInfo, productCat)
}

async function syncDatesToProduct(product, data) {
  if (product.product_category) {
    let valid_from = null;
    let valid_to = null;

    if (product.product_category.validityPeriod && product.product_category.validityPeriod.length) {
      valid_from = product.product_category.validityPeriod[0].startDateTime
      valid_to = product.product_category.validityPeriod[0].endDateTime
    }

    if (product.product_category.validity_period_relative && product.product_category.validity_period_relative.length) {
      if (product.product_category.validity_period_relative[0].time_direction === 'after' && product.product_category.validity_period_relative[0].time_event === 'transaction') {
        const currentMaxValidTo = await getCurrentMaxValidTo(product, data.owner);
        valid_from = Date.now();
        valid_to = await addTimeToDate(currentMaxValidTo, product.product_category.validity_period_relative[0].time_unit.name_private, product.product_category.validity_period_relative[0].number_of_time_units)
      }
    }
    if ((valid_from !== null || valid_to !== null) && !data.valid_from && !data.valid_to) {
      data.valid_from = valid_from;
      data.valid_to = valid_to;
    }
  }
}

async function getCurrentMaxValidTo(buyedProduct, ownerId) {
  const userInfo = await strapi.query('user', 'users-permissions').findOne({ 'id': ownerId }, ['my_products']);
  let user_products = [];
  let maxValidTo = null;
  if (userInfo && userInfo.my_products) {
    user_products = userInfo.my_products.filter(p => buyedProduct.product_category.id === p.product_category && p.id !== buyedProduct.id);
    if (user_products.length) {
      maxValidTo = user_products.reduce((max, p) => {
        if (p.valid_to) {
          const date = new Date(p.valid_to);
          return (!max || date > max) ? date : max;
        }
        return max;
      }, null);
    }
  }
  return maxValidTo;
}

async function addTimeToDate(startDate, unit, value) {
  if (startDate === null || startDate === undefined) {
    startDate = new Date();
  }

  switch (unit) {
    case 'minute':
      return addMinutes(startDate, value);
    case 'hour':
      return addHours(startDate, value);
    case 'day':
      return addDays(startDate, value);
    case 'week':
      return addWeeks(startDate, value);
    case 'month':
      return addMonths(startDate, value);
    case 'year':
      return addYears(startDate, value);
    default:
      console.warn(`ERROR product date change on buy. Unknown unit: {unit}`);
      return null;
  }
}

async function syncUserRoles(productCat, sanitizedResult, data, owner_before_update) {
  let owner = data.owner
  // If previous owner is not the same as new owner
  if (owner_before_update && owner_before_update.id !== owner) {
    await roleAssigner(owner_before_update.id, null, null, productCat.user_roles ? productCat.user_roles.map(p => p.id) : [])
    if (owner) {
      console.log(`Product ID ${sanitizedResult.id} owner has changed (${sanitizedResult.id} -> ${owner_before_update.id})`);
    } else { // Previous owner but no new owner
      console.log(`Product ID ${sanitizedResult.id} owner has been removed (${sanitizedResult.id} -> null)`);
    }
  }
  if (owner && (!owner_before_update || owner_before_update.id !== owner)) {
    const newUserInfo = await strapi.query('user', 'users-permissions').findOne({ 'id': sanitizedResult.owner.id }, ['user_profile', 'user_roles', 'my_products']);
    const sanitizedNewUserInfo = sanitizeEntity(newUserInfo, {
      model: strapi.query('user', 'users-permissions').model,
    });
    let initial_user_roles = sanitizedNewUserInfo.user_roles ? sanitizedNewUserInfo.user_roles.map(r => r.id) : []
    await roleAssigner(sanitizedNewUserInfo.id, initial_user_roles, sanitizedNewUserInfo.my_products ? sanitizedNewUserInfo.my_products.map(r => r.id) : [], [])
  }
}

async function syncMoodleData(productCat, sanitizedResult, data, owner_before_update) {
  if (productCat?.course_events?.filter(ce => ce.moodle_id).length) {
    const courseMoodleIds = productCat?.course_events?.map(c => c.moodle_id)
    const uniqueCourseMoodleIds = [... new Set(courseMoodleIds)]

    let owner = data.owner
    // If previous owner is not the same as new owner
    if (owner_before_update && owner_before_update.id !== owner) {
      const oldUserMoodleId = owner_before_update.moodle_id
      // Suspend previous owner from Moodle course-events and remove roles
      await unEnrolOldUser(oldUserMoodleId, uniqueCourseMoodleIds);
    }
    // If no previous owner and there is a new owner
    if (owner && (!owner_before_update || owner_before_update.id !== owner)) {
      // Get new user full info (including profile)
      await newOwnerMoodleFunc(sanitizedResult, uniqueCourseMoodleIds);
    }
  }
}

async function checkAndCreateMoodleUser(sanitizedNewUserInfo) {
  var userEmail = sanitizedNewUserInfo.email
  const userFirstName = sanitizedNewUserInfo?.user_profile?.firstName
  const userLastName = sanitizedNewUserInfo?.user_profile?.lastName
  let userMoodleId = sanitizedNewUserInfo.moodle_id

  if (sanitizedNewUserInfo.user_profile && sanitizedNewUserInfo.user_profile.email) {
    userEmail = sanitizedNewUserInfo.user_profile.email
  }
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
  const newUserInfo = await strapi.query('user', 'users-permissions').findOne({ 'id': sanitizedResult.owner.id }, ['user_profile', 'user_roles', 'my_products']);
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
