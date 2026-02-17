'use strict';

/**
 * Email service override
 * 
 * Wraps email sending with error handling at the service level.
 * The main fix for Mandrill unhandled rejections is in config/functions/bootstrap.js
 */

const _ = require('lodash');

const getProviderSettings = () => {
  return strapi.plugins.email.config;
};

/**
 * Send email with error handling
 */
const send = async (options) => {
  try {
    const result = await strapi.plugins.email.provider.send(options);
    return result;
  } catch (error) {
    console.error('Email service: Send failed, returning null:', error.message || error);
    return null;
  }
};

/**
 * Send templated email using lodash template
 */
const sendTemplatedEmail = (emailOptions = {}, emailTemplate = {}, data = {}) => {
  const attributes = ['subject', 'text', 'html'];
  const missingAttributes = _.difference(attributes, Object.keys(emailTemplate));
  
  if (missingAttributes.length > 0) {
    throw new Error(
      `Following attributes are missing from your email template : ${missingAttributes.join(', ')}`
    );
  }

  const templatedAttributes = attributes.reduce(
    (compiled, attribute) =>
      emailTemplate[attribute]
        ? Object.assign(compiled, { [attribute]: _.template(emailTemplate[attribute])(data) })
        : compiled,
    {}
  );

  return send({ ...emailOptions, ...templatedAttributes });
};

module.exports = {
  getProviderSettings,
  send,
  sendTemplatedEmail,
};
