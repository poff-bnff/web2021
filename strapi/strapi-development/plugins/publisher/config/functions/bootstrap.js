'use strict'

module.exports = async () => {
	const actions = [
		{
			section: 'plugins',
			displayName: 'Access the Publisher',
			uid: 'read',
			pluginName: 'publisher',
		},
		{
			section: 'plugins',
			displayName: 'Create (publisher)',
			uid: 'assets.create',
			subCategory: 'assets',
			pluginName: 'publisher',
		},
		{
			section: 'plugins',
			displayName: 'Update (publisher)',
			uid: 'assets.update',
			subCategory: 'assets',
			pluginName: 'publisher',
		}
	]; await strapi.admin.services.permission.actionProvider.registerMany(actions);

}
