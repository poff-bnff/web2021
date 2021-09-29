module.exports = ({ env }) => ({
  host: env('StrapiHost'),
  port: env.int('StrapiPort'),
  url: `${env('StrapiProtocol')}://${env('StrapiHost')}${env('StrapiProtocol') !== 'https' ? `:${env('StrapiPort')}` : ''}`,
  admin: {
    auth: {
      secret: env('ADMIN_JWT_SECRET'),
    },
  },
});

