module.exports = ({ env }) => ({
  defaultConnection: 'default',
  connections: {
    default: {
      connector: 'bookshelf',
      settings: {
        client: 'postgres',
        host: 'localhost',
        port: 5432,
        database: 'strapi',
        username: 'strapi',
        password: 'strapi',
        ssl: false,
      },
      options: {}
    },
  },
});
