'use strict';

const lazyRateLimit = {
  get RateLimit() {
    return require('koa2-ratelimit').RateLimit;
  },
};

module.exports = async (ctx, next) => {
  const message = [
    {
      messages: [
        {
          id: 'Auth.form.error.ratelimit',
          message: 'Too many attempts, please try again in a minute.',
        },
      ],
    },
  ];

  return lazyRateLimit.RateLimit.middleware(
    Object.assign(
      {},
      strapi.plugins['users-permissions'].config.ratelimit,
      {
        interval: 1 * 1 * 500,
        max: 1,
        prefixKey: `${ctx.request.path}:${ctx.request.ip}`,
        message,
      }
    )
  )(ctx, next);
};
