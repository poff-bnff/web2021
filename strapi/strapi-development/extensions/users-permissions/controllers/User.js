'use strict';

/**
 * User.js controller
 *
 * @description: A set of functions called "actions" for managing `User`.
 */

const _ = require('lodash');
const { sanitizeEntity } = require('strapi-utils');
const adminUserController = require('./user/admin');
const apiUserController = require('./user/api');

const sanitizeUser = user =>
  sanitizeEntity(user, {
    model: strapi.query('user', 'users-permissions').model,
  });

const resolveController = ctx => {
  const {
    state: { isAuthenticatedAdmin },
  } = ctx;

  return isAuthenticatedAdmin ? adminUserController : apiUserController;
};

const resolveControllerMethod = method => ctx => {
  const controller = resolveController(ctx);
  const callbackFn = controller[method];

  if (!_.isFunction(callbackFn)) {
    return ctx.notFound();
  }

  return callbackFn(ctx);
};

const formatError = error => [
  { messages: [{ id: error.id, message: error.message, field: error.field }] },
];

module.exports = {
  create: resolveControllerMethod('create'),
  update: resolveControllerMethod('update'),
  updateme: resolveControllerMethod('updateme'),

  /**
   * Retrieve user records.
   * @return {Object|Array}
   */
  async find(ctx, next, { populate } = {}) {
    let users;

    if (_.has(ctx.query, '_q')) {
      // use core strapi query to search for users
      users = await strapi.query('user', 'users-permissions').search(ctx.query, populate);
    } else {
      users = await strapi.plugins['users-permissions'].services.user.fetchAll(ctx.query, populate);
    }

    ctx.body = users.map(sanitizeUser);
  },

  /**
   * Retrieve a user record.
   * @return {Object}
   */
  async findOne(ctx) {
    const { id } = ctx.params;
    let data = await strapi.plugins['users-permissions'].services.user.fetch({
      id,
    });

    if (data) {
      data = sanitizeUser(data);
    }

    // Send 200 `ok`
    ctx.body = data;
  },

  /**
   * Retrieve user count.
   * @return {Number}
   */
  async count(ctx) {
    if (_.has(ctx.query, '_q')) {
      return await strapi.plugins['users-permissions'].services.user.countSearch(ctx.query);
    }
    ctx.body = await strapi.plugins['users-permissions'].services.user.count(ctx.query);
  },

  /**
   * Destroy a/an user record.
   * @return {Object}
   */
  async destroy(ctx) {
    const { id } = ctx.params;
    const data = await strapi.plugins['users-permissions'].services.user.remove({ id });
    ctx.send(sanitizeUser(data));
  },

  async destroyAll(ctx) {
    const {
      request: { query },
    } = ctx;

    const toRemove = Object.values(_.omit(query, 'source'));
    const { primaryKey } = strapi.query('user', 'users-permissions');
    const finalQuery = { [`${primaryKey}_in`]: toRemove, _limit: 100 };

    const data = await strapi.plugins['users-permissions'].services.user.removeAll(finalQuery);

    ctx.send(data);
  },

  /**
   * Retrieve authenticated user.
   * @return {Object|Array}
   */
  async me(ctx) {
    const user = ctx.state.user;

    if (!user) {
      return ctx.badRequest(null, [{ messages: [{ id: 'No authorization header was found' }] }]);
    }

    const fetchedUser = await strapi.plugins['users-permissions'].services.user.fetch({id: user.id});

    ctx.body = sanitizeUser(fetchedUser);
  },

  async import(ctx) {

    const advanced = await strapi
      .store({
        environment: '',
        type: 'plugin',
        name: 'users-permissions',
        key: 'advanced',
      })
      .get();

    if (ctx.request.body.identities === ''){
      ctx.request.body.identities = undefined
    }
      
    const { email, username, role, ...rest } = ctx.request.body;
    const {awsUUID, blocked, provider, confirmed, identities = false, account_created, ...profile} = rest

    if (!email) return ctx.badRequest('missing.email');
    if (!username) return ctx.badRequest('missing.username');
  //   if (!password) return ctx.badRequest('missing.password');

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

    let externalProviders
    if (!identities){
      externalProviders = [{
        provider: 'local',
        UUID: awsUUID,
        dateConnected: account_created
      }]
    } else {
    externalProviders = JSON.parse(identities).map(identity => {
      if (!identity){
      }
      const externalProvider = {
        provider: identity.providerName.toLowerCase(),
        UUID: identity.userId,
        dateConnected: identity.dateCreated
      }
      return externalProvider
    })}

    const user = {
      username: username,
      email: email,
      provider: provider,
      blocked: blocked,
      confirmed: confirmed,
      externalProviders: externalProviders,
      account_created: account_created,
      awsUUID: awsUUID
    };

    user.email = user.email.toLowerCase();
    user.provider = user.provider.toLowerCase();

    if (!role) {
      const defaultRole = await strapi
        .query('role', 'users-permissions')
        .findOne({ type: advanced.default_role }, []);

      user.role = defaultRole.id;
    }

    try {
      const data = await strapi.plugins['users-permissions'].services.user.add(user);
      if (data){
        profile.users_permissions_user = data.id
        await strapi.query('person-test2').create(profile)
      }
      ctx.created(sanitizeUser(data));
    } catch (error) {
      ctx.badRequest(null, formatError(error));
    }
  }

  
};
