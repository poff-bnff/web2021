module.exports = ({ env }) => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('StrapiPort'),
  url: `${env('StrapiProtocol')}://${env('StrapiHost')}`,
  admin: {
    auth: {
      secret: env('ADMIN_JWT_SECRET'),
    },
  },
});

