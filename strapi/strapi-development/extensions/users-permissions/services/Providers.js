'use strict';

/**
 * Module dependencies.
 */

// Public node modules.
const _ = require('lodash');
const request = require('request');

// Purest strategies.
const purest = require('purest')({ request });
const purestConfig = require('@purest/providers');
const { getAbsoluteServerUrl } = require('strapi-utils');
const jwt = require('jsonwebtoken');

const apiUserController = require('../controllers/user/api');  //c
const { getEventivalBadges } = require('./getEventivalBadges');
const { eventivalBadgeRoleAdder } = require('./eventivalBadgeRoleAdder');

const formatError = error => [
  { messages: [{ id: error.id, message: error.message, field: error.field }] },
];

/**
 * Connect thanks to a third-party provider.
 *
 *
 * @param {String}    provider
 * @param {String}    access_token
 *
 * @return  {*}
 */

const connect = (provider, query) => {
  const access_token = query.access_token || query.code || query.oauth_token;

  console.log(`services.providers.connect accesstoken,`, access_token)


  return new Promise((resolve, reject) => {
    if (!access_token) {
      return reject([null, { message: 'No access_token.' }]);
    }

    // Get the profile.
    getProfile(provider, query, async (err, profile) => {
      if (!profile) {
      console.debug('services.providers.connect getProfile profile:', profile)
      return reject([null, { message: 'Profile was not available.' }]);
      }

      let personIndustryBadges = null

      if (provider.split(',').includes('eventivalindustry')) {
        console.log('getEventivalBadges for ', profile.email);
        const badges = await getEventivalBadges(profile.email);
        personIndustryBadges = badges && badges.statusCode === 200 ? badges.body.badges.map(b => b.type) : null

        if (!badges?.body?.accreditation) {
          console.log('No accreditation for ', profile.email, 'Badges:', personIndustryBadges);
          return reject([null, formatError({
            id: 'Connect.error.accreditation',
            message: 'No accreditation.',
          })]);
        }
        console.log('Accreditation found for ', profile.email);

      }

      if (err) {
        console.log('Services providers getProfile error', err);
        return reject([null, err]);
      }

      // We need at least the mail.
      if (!profile.email) {
        console.log('Services providers getProfile no email', err);
        return reject([null, { message: 'Email was not available.' }]);
      }

      try {
        const users = await strapi.query('user', 'users-permissions').find({
          email: profile.email,
        });
        console.log(`Services Providers. Try to find user.`, users?.[0]?.email, provider);

        const advanced = await strapi
          .store({
            environment: '',
            type: 'plugin',
            name: 'users-permissions',
            key: 'advanced',
          })
          .get();

        let user = _.find(users, { provider });



        if (users.length > 0) {
          user = users[0]

          // Add roles according to Eventival badges
          await eventivalBadgeRoleAdder(personIndustryBadges, user, provider)

          const connectedProviders = user.provider.split(',')
          if (!connectedProviders.includes(provider)) {
            const updatedUser = await mergeProviders(user, provider, profile.externalProviders[0])
            if (updatedUser) {
              notifyAboutMerge(updatedUser, provider)
            }
            if (!updatedUser) {
              return reject([null, { message: 'Merge provider to existing providers failed' }]);
            }
          }
        }

        if (_.isEmpty(user) && !advanced.allow_register) {
          return resolve([
            null,
            [{ messages: [{ id: 'Auth.advanced.allow_register' }] }],
            'Register action is actualy not available.',
          ]);
        }

        if (!_.isEmpty(user)) {
          console.log('If no user then resolve');
          return resolve([user, null]);
        }

        if (
          !_.isEmpty(_.find(users, user => user.provider !== provider)) &&
          advanced.unique_email
        ) {
          return resolve([
            null,
            [{ messages: [{ id: 'Auth.form.error.email.taken' }] }],
            'Email is already taken.',
          ]);
        }

        // Retrieve default role.
        const defaultRole = await strapi
          .query('role', 'users-permissions')
          .findOne({ type: advanced.default_role }, []);

        // Create the new user.
        const params = _.assign(profile, {
          provider: provider,
          role: defaultRole.id,
          confirmed: true,
        });

        const createdUser = await strapi.query('user', 'users-permissions').create(params);

        console.log('Services Providers. User created: ', { createdUser });

        // Add roles to the newly created user according to Eventival badges
        await eventivalBadgeRoleAdder(personIndustryBadges, createdUser, provider)

        return resolve([createdUser, null]);
      } catch (err) {
        reject([null, err]);
      }
    });
  });
};

/**
 * Helper to get profiles
 *
 * @param {String}   provider
 * @param {Function} callback
 */

const getProfile = async (provider, query, callback) => {
  const access_token = query.access_token || query.code || query.oauth_token;

  const grant = await strapi
    .store({
      environment: '',
      type: 'plugin',
      name: 'users-permissions',
      key: 'grant',
    })
    .get();

  switch (provider) {
    case 'discord': {
      const discord = purest({
        provider: 'discord',
        config: {
          discord: {
            'https://discordapp.com/api/': {
              __domain: {
                auth: {
                  auth: { bearer: '[0]' },
                },
              },
              '{endpoint}': {
                __path: {
                  alias: '__default',
                },
              },
            },
          },
        },
      });
      discord
        .query()
        .get('users/@me')
        .auth(access_token)
        .request((err, res, body) => {
          if (err) {
            callback(err);
          } else {
            // Combine username and discriminator because discord username is not unique
            var username = `${body.username}#${body.discriminator}`;
            callback(null, {
              username: username,
              email: body.email,
            });
          }
        });
      break;
    }
    case 'cognito': {
      // get the id_token
      const idToken = query.id_token;
      // decode the jwt token
      const tokenPayload = jwt.decode(idToken);
      if (!tokenPayload) {
        callback(new Error('unable to decode jwt token'));
      } else {
        callback(null, {
          username: tokenPayload['cognito:username'],
          email: tokenPayload.email,
        });
      }
      break;
    }
    case 'facebook': {
      const facebook = purest({
        provider: 'facebook',
        config: purestConfig,
      });

      facebook
        .query()
        .get('me?fields=name,email')
        .auth(access_token)
        .request((err, res, body) => {
          if (err) {
            callback(err);
          } else {
            callback(null, {
              username: body.email,
              email: body.email,
              externalProviders: [{ provider: provider.replace(/^./, provider[0].toUpperCase()), UUID: body.id, dateConnected: new Date().toISOString() }]
            });
          }
        });
      break;
    }
    case 'google': {
      const google = purest({ provider: 'google', config: purestConfig });

      google
        .query('oauth')
        .get('tokeninfo')
        .qs({ access_token })
        .request((err, res, body) => {
          if (err) {
            callback(err);
          } else {
            console.log('Providers Google', body.email, ' now callback');
            callback(null, {
              username: body.email,
              email: body.email,
              externalProviders: [{ provider: provider.replace(/^./, provider[0].toUpperCase()), UUID: body.user_id, dateConnected: new Date().toISOString() }]
            });
          }
        });
      break;
    }
    case 'github': {
      const github = purest({
        provider: 'github',
        config: purestConfig,
        defaults: {
          headers: {
            'user-agent': 'strapi',
          },
        },
      });

      github
        .query()
        .get('user')
        .auth(access_token)
        .request((err, res, userbody) => {
          if (err) {
            return callback(err);
          }

          // This is the public email on the github profile
          if (userbody.email) {
            return callback(null, {
              username: userbody.login,
              email: userbody.email,
            });
          }

          // Get the email with Github's user/emails API
          github
            .query()
            .get('user/emails')
            .auth(access_token)
            .request((err, res, emailsbody) => {
              if (err) {
                return callback(err);
              }

              return callback(null, {
                username: userbody.login,
                email: Array.isArray(emailsbody)
                  ? emailsbody.find(email => email.primary === true).email
                  : null,
              });
            });
        });
      break;
    }
    case 'microsoft': {
      const microsoft = purest({
        provider: 'microsoft',
        config: purestConfig,
      });

      microsoft
        .query()
        .get('me')
        .auth(access_token)
        .request((err, res, body) => {
          if (err) {
            callback(err);
          } else {
            callback(null, {
              username: body.userPrincipalName,
              email: body.userPrincipalName,
            });
          }
        });
      break;
    }
    case 'twitter': {
      const twitter = purest({
        provider: 'twitter',
        config: purestConfig,
        key: grant.twitter.key,
        secret: grant.twitter.secret,
      });

      twitter
        .query()
        .get('account/verify_credentials')
        .auth(access_token, query.access_secret)
        .qs({ screen_name: query['raw[screen_name]'], include_email: 'true' })
        .request((err, res, body) => {
          if (err) {
            callback(err);
          } else {
            callback(null, {
              username: body.screen_name,
              email: body.email,
            });
          }
        });
      break;
    }
    case 'instagram': {
      const instagram = purest({
        provider: 'instagram',
        key: grant.instagram.key,
        secret: grant.instagram.secret,
        config: purestConfig,
      });

      instagram
        .query()
        .get('me')
        .qs({ access_token, fields: 'id,username' })
        .request((err, res, body) => {
          if (err) {
            callback(err);
          } else {
            callback(null, {
              username: body.username,
              email: `${body.username}@strapi.io`, // dummy email as Instagram does not provide user email
            });
          }
        });
      break;
    }
    case 'vk': {
      const vk = purest({
        provider: 'vk',
        config: purestConfig,
      });

      vk.query()
        .get('users.get')
        .qs({ access_token, id: query.raw.user_id, v: '5.122' })
        .request((err, res, body) => {
          if (err) {
            callback(err);
          } else {
            callback(null, {
              username: `${body.response[0].last_name} ${body.response[0].first_name}`,
              email: query.raw.email,
            });
          }
        });
      break;
    }
    case 'twitch': {
      const twitch = purest({
        provider: 'twitch',
        config: {
          twitch: {
            'https://api.twitch.tv': {
              __domain: {
                auth: {
                  headers: {
                    Authorization: 'Bearer [0]',
                    'Client-ID': '[1]',
                  },
                },
              },
              'helix/{endpoint}': {
                __path: {
                  alias: '__default',
                },
              },
              'oauth2/{endpoint}': {
                __path: {
                  alias: 'oauth',
                },
              },
            },
          },
        },
      });

      twitch
        .get('users')
        .auth(access_token, grant.twitch.key)
        .request((err, res, body) => {
          if (err) {
            callback(err);
          } else {
            callback(null, {
              username: body.data[0].login,
              email: body.data[0].email,
            });
          }
        });
      break;
    }
    case 'linkedin': {
      const linkedIn = purest({
        provider: 'linkedin',
        config: {
          linkedin: {
            'https://api.linkedin.com': {
              __domain: {
                auth: [{ auth: { bearer: '[0]' } }],
              },
              '[version]/{endpoint}': {
                __path: {
                  alias: '__default',
                  version: 'v2',
                },
              },
            },
          },
        },
      });
      try {
        const getDetailsRequest = () => {
          return new Promise((resolve, reject) => {
            linkedIn
              .query()
              .get('me')
              .auth(access_token)
              .request((err, res, body) => {
                if (err) {
                  return reject(err);
                }
                resolve(body);
              });
          });
        };

        const getEmailRequest = () => {
          return new Promise((resolve, reject) => {
            linkedIn
              .query()
              .get('emailAddress?q=members&projection=(elements*(handle~))')
              .auth(access_token)
              .request((err, res, body) => {
                if (err) {
                  return reject(err);
                }
                resolve(body);
              });
          });
        };

        const { localizedFirstName } = await getDetailsRequest();
        const { elements } = await getEmailRequest();
        const email = elements[0]['handle~'];

        callback(null, {
          username: localizedFirstName,
          email: email.emailAddress,
        });
      } catch (err) {
        callback(err);
      }
      break;
    }
    case 'reddit': {
      const reddit = purest({
        provider: 'reddit',
        config: purestConfig,
        defaults: {
          headers: {
            'user-agent': 'strapi',
          },
        },
      });

      reddit
        .query('auth')
        .get('me')
        .auth(access_token)
        .request((err, res, body) => {
          if (err) {
            callback(err);
          } else {
            callback(null, {
              username: body.name,
              email: `${body.name}@strapi.io`, // dummy email as Reddit does not provide user email
            });
          }
        });
      break;
    }
    case 'eventival': {
      // get the id_token
      const accessToken = query.access_token;
      // decode the jwt token
      const tokenPayload = jwt.decode(accessToken);
      if (!tokenPayload) {
        callback(new Error('unable to decode jwt token'));
      } else {
        callback(null, {
          username: tokenPayload.email,
          email: tokenPayload.email,
          externalProviders: [{ provider: provider.replace(/^./, provider[0].toUpperCase()), UUID: tokenPayload.sub, dateConnected: new Date().toISOString() }]

        });
      }
      break;
    }
    case 'eventivalindustry': {
      // get the id_token
      const accessToken = query.access_token;
      // decode the jwt token
      const tokenPayload = jwt.decode(accessToken);
      if (!tokenPayload) {
        callback(new Error('unable to decode jwt token'));
      } else {
        callback(null, {
          username: tokenPayload.email,
          email: tokenPayload.email,
          externalProviders: [{ provider: provider.replace(/^./, provider[0].toUpperCase()), UUID: tokenPayload.sub, dateConnected: new Date().toISOString() }]

        });
      }
      break;
    }
    case 'auth0': {
      const purestAuth0Conf = {};
      purestAuth0Conf[`https://${grant.auth0.subdomain}.auth0.com`] = {
        __domain: {
          auth: {
            auth: { bearer: '[0]' },
          },
        },
        '{endpoint}': {
          __path: {
            alias: '__default',
          },
        },
      };
      const auth0 = purest({
        provider: 'auth0',
        config: {
          auth0: purestAuth0Conf,
        },
      });

      auth0
        .get('userinfo')
        .auth(access_token)
        .request((err, res, body) => {
          if (err) {
            callback(err);
          } else {
            const username =
              body.username || body.nickname || body.name || body.email;
            const email = body.email || `${username.replace(/\s+/g, '.')}@strapi.io`;

            callback(null, {
              username,
              email,
            });
          }
        });
      break;
    }
    default:
      callback(new Error('Unknown provider.'));
      break;
  }
};

const buildRedirectUri = (provider = '') =>
  `${getAbsoluteServerUrl(strapi.config)}/connect/${provider}/callback`;

const mergeProviders = async (user, provider, externalProvider) => {
  const externalProviders = user.externalProviders
  externalProvider.dateConnected = new Date().toISOString()
  externalProviders.push(externalProvider)
  const values = { provider: user.provider + ',' + provider, externalProviders: externalProviders }
  const updatedUser = await strapi.plugins['users-permissions'].services.user.edit({ id: user.id }, values);
  return updatedUser
}

// const logAuthDateTime = async (id, last10Logins, provider, lang) => {
//   const authTime = new Date().toISOString()
//   const lastLogin = { loginDateTime: authTime, provider: provider }
//   if (last10Logins.length === 10) last10Logins.shift()
//   last10Logins.push(lastLogin)
//   const updateData = { last10Logins: last10Logins }
//   const user = await strapi.plugins['users-permissions'].services.user.edit({ id }, updateData);

//   // notifyUserAuthDateTime(user, authTime, lang)
// }

const notifyAboutMerge = async (user, addedProvider) => {
  let enabledProviders = (user.externalProviders.map(provider => {
    const date = new Intl.DateTimeFormat('et-EE', { dateStyle: 'full', timeStyle: 'long' }).format(new Date(provider.dateConnected))
    return `(${provider.provider} ${date})<br/>`
  })
  )
  enabledProviders = enabledProviders.join(' ')
  addedProvider = addedProvider.replace(/^./, addedProvider[0].toUpperCase())

  await strapi.plugins['email'].services.email.send(
    {
      to: user.email,
      template_name: 'merge-providers-et',
      template_vars: [
        { name: 'email', content: user.email },
        { name: 'addedProvider', content: addedProvider },
        { name: 'enabledProviders', content: enabledProviders }]
    });
}

const notifyUserAuthDateTime = (user, authTime, lang) => {
  strapi.plugins['email'].services.email.send({
    to: user.email,
    template_name: `new-login-${lang}`,
    template_vars: [
      { name: 'email', content: user.email },
      { name: 'authTime', content: authTime }
    ]
  });
}

module.exports = {
  connect,
  buildRedirectUri,
  mergeProviders,
  // logAuthDateTime,
  notifyUserAuthDateTime
};
