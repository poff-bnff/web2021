module.exports = {
  async eventivalBadgeRoleAdder(personIndustryBadges, userInfo, provider) {
    // Applies only for industry.poff.ee
    try {
      if (!provider.split(',').includes('eventivalindustry')) {
        return null
      }
    } catch (error) {
      console.log('eventivalBadgeRoleAdder provider error', error);
    }

    try {
      // Get all userRoles from Strapi
      let userRoles = await strapi.query('user-role').find({}, ['user_right', 'user_right.functions', 'user_right.functions']);
      // Get all functions from Strapi (as userRoles are too deep, so need to get them separately and join later)
      const allFunctions = await strapi.query('function').find({});

      // Filter out any roles which do not include any "badge" property under
      // user-role -> array of user_right -> array of user_right functions -> array of user_right functions function_parameters
      // user_right functions function_parameters made into object for easier processing later
      // userRoles output will include array of objects including only role id and array of user_right functions function_parameters, example:
      // [
      //   {
      //     id: 5,
      //     functions_parameters: [
      //       'MANAGEMENT',
      //       'JURY',
      //       'GUEST',
      //       'PRESS',
      //       'TEAM',
      //       'Industry PRO',
      //       'Industry PRO ONLINE',
      //       'Industry Student / Talent',
      //       'Industry Student / Talent ONLINE',
      //       'VOLUNTEER'
      //     ]
      //   }
      // ]

      userRoles = userRoles?.map(r => {
        r.user_right = r?.user_right.map(ur => {
          r.functions_parameters = ur.functions.map(f => allFunctions.filter(af => af.id === f.id)[0]?.function_parameters?.filter(fp => fp.property === 'badge')).flat().map(fp => fp.value)
          return ur
        })
        return { id: r.id, functions_parameters: r.functions_parameters }
      }).filter(r => r.functions_parameters.length)

      // Get roles which user is entitled to have
      const rolesEntitledTo = userRoles.filter(ur => ur.functions_parameters.some(r => personIndustryBadges.includes(r)))
        .map(r => r.id)

      // User's existing roles
      let userExistingRoles = userInfo.user_roles.map(r => r.id)

      // If existing roles do not include role entitled to, then add it to the array of rolesToBeAdded
      let rolesToBeAdded = []
      rolesEntitledTo.map(r => {
        if (!userExistingRoles.includes(r)) {
          rolesToBeAdded.push(r)
        }
      })

      // If user is missing entitled role(s), then assign role(s) to user
      if (rolesToBeAdded.length) {
        // Join existing role(s) and entitled role(s)
        let finalUserRoles = userExistingRoles.concat(rolesToBeAdded)
        // Update userRoles of the user
        const setUserRoles = await strapi.query('user', 'users-permissions').update({ 'id': userInfo.id }, { user_roles: finalUserRoles });
        console.log(`eventivalBadgeRoleAdder: Assigned roles ID: ${rolesToBeAdded} to user ID ${userInfo.id}, user now has roles ${finalUserRoles}`);
      }

    } catch (error) {
      console.log(error);
    }
  }
};
