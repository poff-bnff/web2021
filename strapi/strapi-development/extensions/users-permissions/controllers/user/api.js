'use strict';

const _ = require('lodash');
const { sanitizeEntity } = require('strapi-utils');

const sanitizeUser = user =>
  sanitizeEntity(user, {
    model: strapi.query('user', 'users-permissions').model,
  });

const formatError = error => [
  { messages: [{ id: error.id, message: error.message, field: error.field }] },
];

module.exports = {
  /**
   * Create a/an user record.
   * @return {Object}
   */
  async create(ctx) {
    console.log('CREATE USER');
    const advanced = await strapi
      .store({
        environment: '',
        type: 'plugin',
        name: 'users-permissions',
        key: 'advanced',
      })
      .get();

    const { email, username, password, role } = ctx.request.body;

    if (!email) return ctx.badRequest('missing.email');
    if (!username) return ctx.badRequest('missing.username');
    if (!password) return ctx.badRequest('missing.password');

    const userWithSameUsername = await strapi
      .query('user', 'users-permissions')
      .findOne({ username });

    if (userWithSameUsername) {
      return ctx.badRequest(
        null,
        formatError({
          id: 'Auth.form.error.username.taken',
          message: 'Username already taken.',
          field: ['username'],
        })
      );
    }

    if (advanced.unique_email) {
      const userWithSameEmail = await strapi
        .query('user', 'users-permissions')
        .findOne({ email: email.toLowerCase() });

      if (userWithSameEmail) {
        return ctx.badRequest(
          null,

          formatError({
            id: 'Auth.form.error.email.taken',
            message: 'Email already taken.',
            field: ['email'],
          })
        );
      }
    }

    const user = {
      ...ctx.request.body,
      provider: 'local',
    };

    user.email = user.email.toLowerCase();

    if (!role) {
      const defaultRole = await strapi
        .query('role', 'users-permissions')
        .findOne({ type: advanced.default_role }, []);

      user.role = defaultRole.id;
    }

    try {
      const data = await strapi.plugins['users-permissions'].services.user.add(user);

      ctx.created(sanitizeUser(data));
    } catch (error) {
      ctx.badRequest(null, formatError(error));
    }
  },
  /**
   * Update a/an user record.
   * @return {Object}
   */

  async update(ctx) {
    console.log('users-permissions controllers user api update');

    const advancedConfigs = await strapi
      .store({
        environment: '',
        type: 'plugin',
        name: 'users-permissions',
        key: 'advanced',
      })
      .get();

    const { id } = ctx.params;
    const { email, username, password } = ctx.request.body;

    const user = await strapi.plugins['users-permissions'].services.user.fetch({
      id,
    });

    if (_.has(ctx.request.body, 'email') && !email) {
      return ctx.badRequest('email.notNull');
    }

    if (_.has(ctx.request.body, 'username') && !username) {
      return ctx.badRequest('username.notNull');
    }

    if (_.has(ctx.request.body, 'password') && !password && user.provider === 'local') {
      return ctx.badRequest('password.notNull');
    }

    if (_.has(ctx.request.body, 'username')) {
      const userWithSameUsername = await strapi
        .query('user', 'users-permissions')
        .findOne({ username });

      if (userWithSameUsername && userWithSameUsername.id != id) {
        return ctx.badRequest(
          null,
          formatError({
            id: 'Auth.form.error.username.taken',
            message: 'username.alreadyTaken.',
            field: ['username'],
          })
        );
      }
    }

    if (_.has(ctx.request.body, 'email') && advancedConfigs.unique_email) {
      const userWithSameEmail = await strapi
        .query('user', 'users-permissions')
        .findOne({ email: email.toLowerCase() });

      if (userWithSameEmail && userWithSameEmail.id != id) {
        return ctx.badRequest(
          null,
          formatError({
            id: 'Auth.form.error.email.taken',
            message: 'Email already taken',
            field: ['email'],
          })
        );
      }
      ctx.request.body.email = ctx.request.body.email.toLowerCase();
    }

    let updateData = {
      ...ctx.request.body,
    };

    if (_.has(ctx.request.body, 'password') && password === user.password) {
      delete updateData.password;
    }

    const data = await strapi.plugins['users-permissions'].services.user.edit({ id }, updateData);

    ctx.send(sanitizeUser(data));
  },
  async updateMe(ctx) {
    console.log('users-permissions controllers user api updateme');
    const { id } = ctx.state.user;
    const { password } = ctx.request.body;

    const createNewPersonProfile = async (newPersonProfile) => {
      console.log('Create new Person to person-test2');
      console.log(newPersonProfile);
      return await strapi.query('person-test2').create(newPersonProfile)
    }

    const updatePersonProfile = async (personProfile, id) => {
      console.log('Update Person in person-test2', id);
      console.log(personProfile, id);
      return await strapi.query('person-test2').update({ id }, personProfile)
    }

    const user = await strapi.plugins['users-permissions'].services.user.fetch({
      id,
    });

    if (_.has(ctx.request.body, 'email')) {
      return ctx.badRequest('email.notNull');
    }

    if (_.has(ctx.request.body, 'username')) {
      return ctx.badRequest('username.notNull');
    }

    if (_.has(ctx.request.body, 'password') && !password && user.provider === 'local') {
      return ctx.badRequest('password.notNull');
    }

    if (_.has(ctx.request.body, 'provider')) {
      return ctx.badRequest('provider.notNull');
    }
    if (_.has(ctx.request.body, 'role')) {
      return ctx.badRequest('role.notNull');
    }

    // Check if profile is fully filled
    let personProfile = { ...JSON.parse(ctx.request.body) }
    if (!personProfile?.firstName?.length) {
      return ctx.badRequest('firstName incorrect');
    }
    if (!personProfile?.lastName?.length) {
      return ctx.badRequest('lastName incorrect');
    }
    if (!personProfile?.gender?.length) {
      return ctx.badRequest('gender incorrect');
    }
    if (!personProfile?.birthdate?.length) {
      return ctx.badRequest('birthdate incorrect');
    }
    if (!personProfile?.phoneNr?.length) {
      return ctx.badRequest('phoneNr incorrect');
    }
    if (!personProfile?.address?.length) {
      return ctx.badRequest('address incorrect');
    }

    // Create new person if it does not exist, else update
    personProfile.email = user.email
    if (!user.person_test_2) {
      personProfile.users_permissions_user = id
      console.log('Create new person');
      // await createNewPersonProfile(personProfile)
    } else {
      // await updatePersonProfile(personProfile, user.person_test_2.id)
    }

    let updateData = {
      ...ctx.request.body,
    };

    if (_.has(ctx.request.body, 'password') && password === user.password) {
      delete updateData.password;
    }

    updateData.profileFilled = true
    updateData.person_test_2 = !user.person_test_2 ? await createNewPersonProfile(personProfile).id : await updatePersonProfile(personProfile, user.person_test_2.id).id

    console.log(updateData.person_test_2);

    const updatedUser = await strapi.plugins['users-permissions'].services.user.edit({ id }, updateData);
    // toSheets.newUserToSheets(updatedUser)
    ctx.send(sanitizeUser(updatedUser));
  },
  async favorites(ctx) {
    console.log('users-permissions controllers user api favorites');
    const { id } = ctx.state.user;

    const manipulateFavorites = async (user, addOrRm, theId, objectName, objectType, objectArrayName) => {
      var dataIds = user[objectName]
        .filter(myFavoriteLists => myFavoriteLists.type === objectType)
        .map(myType => myType[objectArrayName])
        .flat()
        .map(obj => obj.id)
      var uniqueIds = [...new Set(dataIds)]

      let newArray
      // Remove or add from/to array
      if (addOrRm === "rm") {
        newArray = uniqueIds.filter(a => a !== theId)
      } else if (addOrRm === "add") {
        uniqueIds.push(theId)
        newArray = uniqueIds
      }

      // Create new array of objects
      let newArrayOfObjects = []
      // Add objects of other types to array if any
      let otherTypeObjects = user[objectName]
        .filter(myFavoriteLists => myFavoriteLists.type !== objectType)
      if (otherTypeObjects.length) { otherTypeObjects.map(a => newArrayOfObjects.push(a)) }

      let newTypeData = {
        type: objectType,
        [objectArrayName]: newArray
      }

      if (newArray.length) { newArrayOfObjects.push(newTypeData) }

      let arrayToSave = newArrayOfObjects.length ? newArrayOfObjects : []
      const updatedUser = await strapi.plugins['users-permissions'].services.user.edit({ id }, { [objectName]: arrayToSave });
      ctx.send(sanitizeUser(updatedUser));
    }

    const user = await strapi.plugins['users-permissions'].services.user.fetch({
      id,
    });

    // Query body
    let rawData = { ...JSON.parse(ctx.request.body) }

    // User needs to fill profile before
    if (!user.person_test_2) {
      rawData.users_permissions_user = id
      console.log('Please fill profile');
    }

    if (rawData.type === "rmScreening") {
      // user object, "rm/add", "screening ID" "my_screenings", "schedule" , "screenings"
      return await manipulateFavorites(user, "rm", rawData.id, "my_screenings", "schedule", "screenings")
    } else if (rawData.type === "addScreening") {
      return await manipulateFavorites(user, "add", rawData.id, "my_screenings", "schedule", "screenings")
    } else if (rawData.type === "rmMyFilm") {
      return await manipulateFavorites(user, "rm", rawData.id, "my_films", "favorite", "cassettes")
    } else if (rawData.type === "addMyFilm") {
      return await manipulateFavorites(user, "add", rawData.id, "my_films", "favorite", "cassettes")
    }

  },
};
