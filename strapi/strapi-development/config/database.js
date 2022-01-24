module.exports = ({ env }) => ({
  defaultConnection: 'default',
  connections: {
    default: {
      connector: 'bookshelf',
      settings: {
        client: 'postgres',
        host: env('StrapiDatabaseHost'),
        port: env.int('StrapiDatabasePort'),
        database: env('StrapiDatabaseName'),
        username: env('StrapiDatabaseUsername'),
        password: env('StrapiDatabasePassword'),
        // ssl: env.bool('StrapiDatabase', false),
	// ssl: { "rejectUnauthorized": false },
	ssl: {
		rejectUnauthorized: env.bool('DATABASE_SSL_SELF', false), // For self-signed certificates
	},
      },
      options: {}
    },
  },
});

