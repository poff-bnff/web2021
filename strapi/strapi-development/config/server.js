module.exports = ({ env }) => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('StrapiPort'),
  url: `${env('StrapiProtocol')}://${env('StrapiHost')}${(env('StrapiProtocol') !== 'https') ? `:${env('StrapiPort')}` : ''}`,
  admin: {
    auth: {
      secret: env('ADMIN_JWT_SECRET'),
    },
  },
});
