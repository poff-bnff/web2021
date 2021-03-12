'use strict'

const registerPermissionActions = () => {

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
	];

	const { actionProvider } = strapi.admin.services.permission;
	actionProvider.register(actions);

	console.log("registering....");

};

module.exports = () => {
	registerPermissionActions();

};