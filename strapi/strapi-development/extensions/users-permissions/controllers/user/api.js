'use strict';

const _ = require('lodash');
const https = require('https')
const mime = require('mime');
const path = require('path')
let helper_path = path.join(__dirname, '..', '..', '..', '..', '/helpers/lifecycle_manager.js')

const {
  slugify
} = require(helper_path)

const { parseMultipartData, sanitizeEntity } = require('strapi-utils');

const sanitizeUser = user =>
  sanitizeEntity(user, {
    model: strapi.query('user', 'users-permissions').model,
  });

const sanitizePerson = person =>
  sanitizeEntity(person, {
    model: strapi.query('person').model,
  });

const formatError = error => [
  { messages: [{ id: error.id, message: error.message, field: error.field }] },
];

module.exports = {
  /**
   * Create a/an user record.
   * @return {Object}
   */
  async create(ctx) {
    console.log('CREATE USER');
    const advanced = await strapi
      .store({
        environment: '',
        type: 'plugin',
        name: 'users-permissions',
        key: 'advanced',
      })
      .get();

    const { email, username, password, role } = ctx.request.body;

    if (!email) return ctx.badRequest('missing.email');
    if (!username) return ctx.badRequest('missing.username');
    if (!password) return ctx.badRequest('missing.password');

    const userWithSameUsername = await strapi
      .query('user', 'users-permissions')
      .findOne({ username });

    if (userWithSameUsername) {
      return ctx.badRequest(
        null,
        formatError({
          id: 'Auth.form.error.username.taken',
          message: 'Username already taken.',
          field: ['username'],
        })
      );
    }

    if (advanced.unique_email) {
      const userWithSameEmail = await strapi
        .query('user', 'users-permissions')
        .findOne({ email: email.toLowerCase() });

      if (userWithSameEmail) {
        return ctx.badRequest(
          null,

          formatError({
            id: 'Auth.form.error.email.taken',
            message: 'Email already taken.',
            field: ['email'],
          })
        );
      }
    }

    const user = {
      ...ctx.request.body,
      provider: 'local',
    };

    user.email = user.email.toLowerCase();

    if (!role) {
      const defaultRole = await strapi
        .query('role', 'users-permissions')
        .findOne({ type: advanced.default_role }, []);

      user.role = defaultRole.id;
    }

    try {
      const data = await strapi.plugins['users-permissions'].services.user.add(user);

      ctx.created(sanitizeUser(data));
    } catch (error) {
      ctx.badRequest(null, formatError(error));
    }
  },
  /**
   * Update a/an user record.
   * @return {Object}
   */

  async update(ctx) {
    console.log('users-permissions controllers user api update');

    const advancedConfigs = await strapi
      .store({
        environment: '',
        type: 'plugin',
        name: 'users-permissions',
        key: 'advanced',
      })
      .get();

    const { id } = ctx.params;
    const { email, username, password } = ctx.request.body;

    const user = await strapi.plugins['users-permissions'].services.user.fetch({
      id,
    });

    if (_.has(ctx.request.body, 'email') && !email) {
      return ctx.badRequest('email.notNull');
    }

    if (_.has(ctx.request.body, 'username') && !username) {
      return ctx.badRequest('username.notNull');
    }

    if (_.has(ctx.request.body, 'password') && !password && user.provider === 'local') {
      return ctx.badRequest('password.notNull');
    }

    if (_.has(ctx.request.body, 'username')) {
      const userWithSameUsername = await strapi
        .query('user', 'users-permissions')
        .findOne({ username });

      if (userWithSameUsername && userWithSameUsername.id != id) {
        return ctx.badRequest(
          null,
          formatError({
            id: 'Auth.form.error.username.taken',
            message: 'username.alreadyTaken.',
            field: ['username'],
          })
        );
      }
    }

    if (_.has(ctx.request.body, 'email') && advancedConfigs.unique_email) {
      const userWithSameEmail = await strapi
        .query('user', 'users-permissions')
        .findOne({ email: email.toLowerCase() });

      if (userWithSameEmail && userWithSameEmail.id != id) {
        return ctx.badRequest(
          null,
          formatError({
            id: 'Auth.form.error.email.taken',
            message: 'Email already taken',
            field: ['email'],
          })
        );
      }
      ctx.request.body.email = ctx.request.body.email.toLowerCase();
    }

    let updateData = {
      ...ctx.request.body,
    };

    if (_.has(ctx.request.body, 'password') && password === user.password) {
      delete updateData.password;
    }

    const data = await strapi.plugins['users-permissions'].services.user.edit({ id }, updateData);

    ctx.send(sanitizeUser(data));
  },
  async updateMe(ctx) {

    async function uploadProfilePicture(files, firstName, lastName) {
      console.log('Uploading profile picture');

      firstName = slugify(firstName)
      lastName = slugify(lastName)

      let splitter = files.picture.name.split('.')
      let fileExt = splitter[splitter.length - 1]
      let fileName = `U_${firstName}_${lastName}.${fileExt}`

      const uploadedPicture = await strapi.plugins.upload.services.upload.upload({
        data: {}, //mandatory declare the data(can be empty), otherwise it will give you an undefined error.
        files: {
          path: files.picture.path,
          name: fileName,
          type: mime.getType(files.picture.name) || files.picture.type, // mime type of the file
          size: files.picture.size,
        },
      });
      return uploadedPicture[0].id
    }

    console.log('users-permissions controllers user api updateme');
    const { id } = ctx.state.user;
    const { password } = ctx.request.body.data;

    const createNewPersonProfile = async (personProfile, ctxForPicture) => {
      const { files } = parseMultipartData(ctxForPicture);

      console.log('Create new Person to user-profiles');
      if (files.picture) {
        const uploadedPicture = await uploadProfilePicture(files, personProfile.firstName, personProfile.lastName)
        personProfile.picture = uploadedPicture
      }

      let newUserProfile = await strapi.services['user-profiles'].create(personProfile)

      console.log('newUserProfile', newUserProfile);
      return newUserProfile
    }

    const updatePersonProfile = async (personProfile, ctxForPicture, id) => {
      const { files } = parseMultipartData(ctxForPicture);

      console.log('Update user profile in user-profiles');
      if (files.picture) {
        const uploadedPicture = await uploadProfilePicture(files, personProfile.firstName, personProfile.lastName)
        personProfile.picture = uploadedPicture
      }

      let updatedProfile = await strapi.services['user-profiles'].update({ id }, personProfile)
      updatedProfile.user = sanitizeUser(updatedProfile.user)

      console.log('updatedProfile', updatedProfile.user.email);
      return updatedProfile

    }

    const user = await strapi.plugins['users-permissions'].services.user.fetch({
      id,
    });

    if (_.has(ctx.request.body.data, 'email')) {
      return ctx.badRequest('email.notNull');
    }

    if (_.has(ctx.request.body.data, 'username')) {
      return ctx.badRequest('username.notNull');
    }

    if (_.has(ctx.request.body.data, 'password') && !password && user.provider === 'local') {
      return ctx.badRequest('password.notNull');
    }

    if (_.has(ctx.request.body.data, 'provider')) {
      return ctx.badRequest('provider.notNull');
    }
    if (_.has(ctx.request.body.data, 'role')) {
      return ctx.badRequest('role.notNull');
    }

    // Check if profile is fully filled
    let personProfile = { ...JSON.parse(ctx.request.body.data) }
    if (!personProfile?.firstName?.length) {
      return ctx.badRequest('firstName incorrect');
    }
    if (!personProfile?.lastName?.length) {
      return ctx.badRequest('lastName incorrect');
    }
    if (!personProfile?.gender?.length) {
      return ctx.badRequest('gender incorrect');
    }
    if (!personProfile?.birthdate?.length) {
      return ctx.badRequest('birthdate incorrect');
    }
    if (!personProfile?.phoneNr?.length) {
      return ctx.badRequest('phoneNr incorrect');
    }
    if (!personProfile?.address?.length) {
      return ctx.badRequest('address incorrect');
    }

    // Create new person if it does not exist, else update
    personProfile.email = user.email
    if (!user.user_profile) {
      personProfile.users_permissions_user = id
      console.log('Create new person', personProfile);
      // await createNewPersonProfile(personProfile)
    } else {
      // await updatePersonProfile(personProfile, user.user_profile.id)
    }

    let updateData = {
      ...ctx.request.body.data,
    };

    if (_.has(ctx.request.body.data, 'password') && password === user.password) {
      delete updateData.password;
    }

    updateData.profileFilled = true
    let file = ctx.request.files['files.picture']

    if (file) {
      if (!file.type.includes("image")) {
        console.log("File is not an image.", file.type, file);
        return ctx.badRequest('Not an image');
      } else if (file.size / 1024 / 1024 > 5) {
        console.log("Image can be max 5MB, uploaded image was " + (file.size / 1024 / 1024).toFixed(2) + "MB")
        return ctx.badRequest('Image too bulky');
      }
    }

    let thisUsersProfile = !user.user_profile ? await createNewPersonProfile(personProfile, ctx) : await updatePersonProfile(personProfile, ctx, user.user_profile.id)
    updateData.user_profile = thisUsersProfile.id
    console.log('updateData.user_profile', updateData.user_profile);

    const updatedUser = await strapi.plugins['users-permissions'].services.user.edit({ id }, updateData);
    // toSheets.newUserToSheets(updatedUser)
    ctx.send(sanitizeUser(updatedUser));
  },
  async favorites(ctx) {
    console.log('users-permissions controllers user api favorites');
    const { id } = ctx.state.user;

    const manipulateFavorites = async (user, addOrRm, theId, objectName, objectType, objectArrayName) => {
      var dataIds = user[objectName]
        .filter(myFavoriteLists => myFavoriteLists.type === objectType)
        .map(myType => myType[objectArrayName])
        .flat()
        .map(obj => obj.id)
      var uniqueIds = [...new Set(dataIds)]

      let newArray
      // Remove or add from/to array
      if (addOrRm === "rm") {
        newArray = uniqueIds.filter(a => a !== theId)
      } else if (addOrRm === "add") {
        uniqueIds.push(theId)
        newArray = uniqueIds
      }

      // Create new array of objects
      let newArrayOfObjects = []
      // Add objects of other types to array if any
      let otherTypeObjects = user[objectName]
        .filter(myFavoriteLists => myFavoriteLists.type !== objectType)
      if (otherTypeObjects.length) { otherTypeObjects.map(a => newArrayOfObjects.push(a)) }

      let newTypeData = {
        type: objectType,
        [objectArrayName]: newArray
      }

      if (newArray.length) { newArrayOfObjects.push(newTypeData) }

      let arrayToSave = newArrayOfObjects.length ? newArrayOfObjects : []
      const updatedUser = await strapi.plugins['users-permissions'].services.user.edit({ id }, { [objectName]: arrayToSave });
      ctx.send(sanitizeUser(updatedUser));
    }

    const user = await strapi.plugins['users-permissions'].services.user.fetch({
      id,
    });

    // Query body
    let rawData = { ...JSON.parse(ctx.request.body) }

    // User needs to fill profile before
    if (!user.user_profile) {
      rawData.users_permissions_user = id
      console.log('Please fill profile');
    }

    if (rawData.type === "rmScreening") {
      // user object, "rm/add", "screening ID" "my_screenings", "schedule" , "screenings"
      return await manipulateFavorites(user, "rm", rawData.id, "my_screenings", "schedule", "screenings")
    } else if (rawData.type === "addScreening") {
      return await manipulateFavorites(user, "add", rawData.id, "my_screenings", "schedule", "screenings")
    } else if (rawData.type === "rmMyFilm") {
      return await manipulateFavorites(user, "rm", rawData.id, "my_films", "favorite", "cassettes")
    } else if (rawData.type === "addMyFilm") {
      return await manipulateFavorites(user, "add", rawData.id, "my_films", "favorite", "cassettes")
    } else if (rawData.type === "rmMyEvent") {
      return await manipulateFavorites(user, "rm", rawData.id, "my_events", "schedule", "industry_events")
    } else if (rawData.type === "addMyEvent") {
      return await manipulateFavorites(user, "add", rawData.id, "my_events", "schedule", "industry_events")
    }

  },
  async paymentMethods(ctx) {
    const catId = ctx?.params?.id;

    const getMkConfig = async (catId) => {


      const categoryInfo = await strapi.query('product-category').findOne({ 'id': catId });

      console.log('Yes, methods here for ', categoryInfo?.business_profile?.name, categoryInfo?.business_profile?.reg_code)

      let mkId
      let mkKey
      let mkHost
      // Use only PÖFF currently
      // if (categoryInfo?.business_profile?.reg_code === '80044767') {
      mkId = process.env.MakseKeskusId
      mkKey = process.env.MakseKeskusSecret
      mkHost = process.env.MakseKeskusHost
      // MTÜ BE
      // } else if (categoryInfo?.business_profile?.reg_code === '80213483') {
      // BMO OÜ
      // } else if (categoryInfo?.business_profile?.reg_code === '12142069') {
      // }
      return new Promise((resolve, reject) => {
        const options = {
          hostname: mkHost,
          path: '/v1/shop/configuration',
          method: 'GET',
          headers: {
            Authorization: 'Basic ' + Buffer.from(`${mkId}:${mkKey}`).toString('base64'),
            'Content-Type': 'application/json'
          }
        }

        const request = https.request(options, response => {
          var body = ''

          response.on('data', function (d) {
            body += d
          })

          response.on('end', function () {
            resolve(JSON.parse(body))
          })
        })

        request.on('error', reject)
        request.end()
      })
    }

    // const userId = _h.getUserId(event)

    // if (!userId) {
    //     return _h.error([401, 'Unauthorized'])
    // }

    const mkResponse = await getMkConfig(catId)

    return {
      banklinks: mkResponse.payment_methods.banklinks.map(m => {
        return {
          id: [m.country, m.name].join('_').toUpperCase(),
          name: m.name,
          country: m.country,
          logo: m.logo_url
        }
      }),
      cards: mkResponse.payment_methods.cards.map(m => {
        return {
          id: [m.country, m.name].join('_').toUpperCase(),
          name: m.name,
          country: m.country,
          logo: m.logo_url
        }
      }),
      other: mkResponse.payment_methods.other.map(m => {
        return {
          id: [m.country, m.name].join('_').toUpperCase(),
          name: m.name,
          country: m.country,
          logo: m.logo_url
        }
      }),
      payLater: mkResponse.payment_methods.payLater.map(m => {
        return {
          id: [m.country, m.name].join('_').toUpperCase(),
          name: m.name,
          country: m.country,
          logo: m.logo_url
        }
      })
    }
  },
  async buyProduct(ctx) {
    console.log('Yes, buy product here')
    const { id } = ctx.state.user;

    const user = await strapi.plugins['users-permissions'].services.user.fetch({
      id,
    });

    const userEmail = user.email
    console.log(userEmail)

    const requestBody = JSON.parse(ctx.request.body)

    const postToMaksekeskus = async (postData) => {
      const productCatBP = JSON.parse(postData.transaction.merchant_data).productCatSeller
      console.log('postToMaksekeskus product cat business profile id', productCatBP);

      const businessProfile = await strapi.query('business-profile').findOne({ 'id': productCatBP });

      console.log('postToMaksekeskus product cat business profile ', businessProfile?.name, businessProfile?.reg_code)

      let mkId
      let mkKey
      let mkHost
      // Use only PÖFF currently
      // if (businessProfile?.reg_code === '80044767') {
      mkId = process.env.MakseKeskusId
      mkKey = process.env.MakseKeskusSecret
      mkHost = process.env.MakseKeskusHost
      // MTÜ BE
      // } else if (businessProfile?.reg_code === '80213483') {
      // BMO OÜ
      // } else if (businessProfile?.reg_code === '12142069') {
      // }

      return new Promise((resolve, reject) => {
        const options = {
          hostname: mkHost,
          path: '/v1/transactions',
          method: 'POST',
          headers: {
            Authorization: 'Basic ' + Buffer.from(`${mkId}:${mkKey}`).toString('base64'),
            'Content-Type': 'application/json'
          }
        }

        const request = https.request(options, response => {
          var body = ''

          response.on('data', function (d) {
            body += d
          })

          response.on('end', function () {
            resolve(JSON.parse(body))
          })
        })

        request.on('error', reject)
        request.write(JSON.stringify(postData))
        request.end()
      })
    }

    // console.log('event ', event)
    // const saleActiveCategories = ['tp1']
    const userId = id
    const userIp = ctx.headers['x-real-ip'] || ctx.headers['x-forwarded-for'] || ctx.request.ip
    const { categoryId, return_url, cancel_url, paymentMethodId } = requestBody;
    const body = requestBody

    // const return_url = event.queryStringParameters.return_url || event.headers.referer
    console.log('return_url ', return_url)
    // const cancel_url = event.queryStringParameters.cancel_url || event.headers.referer
    console.log('cancel_url ', cancel_url)

    if (!userId) {
      return { code: 401, case: 'unauthorized' }
    }

    if (!categoryId) {
      return { code: 400, case: 'noCategoryId' }
    }

    // if (!saleActiveCategories.includes(categoryId)) {
    //   return { code: 400, case: 'Sale currently closed for this product' }
    // }

    if (!paymentMethodId) {
      return { code: 400, case: 'noPaymentMethodId' }
    }

    ///////////////////////////////////////
    const params = {
      code_null: false,
      reserved_to_null: true,
      owner_null: true,
      owner_null: true,
      product_category_null: false,
      transactions_null: true,
      'product_category.codePrefix': categoryId,
      active: true,
    }

    let getOneProduct = await strapi.services.product.findOne(params)

    if (!getOneProduct || getOneProduct.length === 0) {
      return { code: 404, case: 'noItems' }
    }

    let thisProductId = getOneProduct.id
    let thisProductCatSeller = getOneProduct?.product_category?.business_profile
    let dateTimeNow = new Date()
    let productPrices = getOneProduct.product_category.priceAtPeriod.filter(p => {
      if (p.startDateTime && p.endDateTime && new Date(p.startDateTime) < dateTimeNow && new Date(p.endDateTime) > dateTimeNow) {
        return true
      } else {
        return false
      }
    })
    let thisProductCurrentPrice = productPrices[0].price

    console.log('id', thisProductId, typeof thisProductId)
    console.log('thisProductCatSeller id', thisProductCatSeller, typeof thisProductCatSeller)
    console.log('price', thisProductCurrentPrice, 'valid: ', productPrices[0].startDateTime, ' - ', productPrices[0].endDateTime)


    const reserveParams = {
      reserved_to: userId,
      reservation_price: thisProductCurrentPrice,
      reservation_time: (new Date()).toISOString()
    }

    let reserveProduct = await strapi.services.product.update({ 'id': thisProductId }, reserveParams)

    if (!reserveProduct.reserved_to) {
      return { code: 500, case: 'reservationSaveFailed' }
    }
    console.log('Product ', thisProductId, ' reserved to ', reserveProduct.reserved_to.id);

    const mkResponse = await postToMaksekeskus({
      customer: {
        email: userEmail,
        ip: userIp,
        country: 'ee',
        locale: body.locale || 'et'
      },
      transaction: {
        amount: thisProductCurrentPrice,
        currency: 'EUR',
        merchant_data: JSON.stringify({
          userId: userId,
          categoryId: categoryId,
          productId: thisProductId,
          productCatSeller: thisProductCatSeller,
          userBusinessProfiles: user?.business_profiles?.map(bp => bp.id),
          cancel_url: cancel_url,
          return_url: return_url
        }),
        reference: categoryId,
        transaction_url: {
          cancel_url: { method: 'POST', url: `${process.env['StrapiProtocol']}://${process.env['StrapiHost']}${process.env['StrapiProtocol'] === 'https' ? '' : ':' + process.env['StrapiPort']}/users-permissions/users/buyproductcb/cancel` },
          notification_url: { method: 'POST', url: `${process.env['StrapiProtocol']}://${process.env['StrapiHost']}${process.env['StrapiProtocol'] === 'https' ? '' : ':' + process.env['StrapiPort']}/users-permissions/users/buyproductcb/notification` },
          return_url: { method: 'POST', url: `${process.env['StrapiProtocol']}://${process.env['StrapiHost']}${process.env['StrapiProtocol'] === 'https' ? '' : ':' + process.env['StrapiPort']}/users-permissions/users/buyproductcb/return` }
        }
      }
    })

    const paymentMethod = [
      ...mkResponse.payment_methods.banklinks,
      ...mkResponse.payment_methods.cards,
      ...mkResponse.payment_methods.other,
      ...mkResponse.payment_methods.payLater
    ].find(m => [m.country, m.name].join('_').toUpperCase() === body.paymentMethodId)

    if (!paymentMethod) {
      return { code: 400, case: 'noPaymentMethod' }
    }

    return { url: paymentMethod.url }

  },
  async buyProductCb(ctx) {
    let cancel_url = 'https://poff.ee/'

    async function redirectUser(code = 302, url = 'https://poff.ee/', body = null) {
      ctx.status = code;
      let searchParams = body ? `?result=${body}` : ``
      console.log(body);
      ctx.redirect(`${url}${searchParams}`);
      ctx.body = body;
    }

    let redirectType = ctx.params.returntype
    console.log('ctx.params.returntype', redirectType);

    const mkResponse = JSON.parse(ctx.request.body.json)
    console.log('Yes, MK CB: ', mkResponse);
    console.log('Response status ', mkResponse.status)

    const product = JSON.parse(mkResponse.merchant_data)
    console.log('product', product)

    const findProductParams = {
      id: product.productId,
      'product_category.codePrefix': product.categoryId,
    }

    let getOneProduct = await strapi.services.product.findOne(findProductParams)

    if (!getOneProduct || getOneProduct.length === 0) {
      redirectUser(404, null, 'Product not found error')
      return
    }

    const item = getOneProduct

    if (mkResponse.status === 'CANCELLED' || mkResponse.status === 'EXPIRED') {

      if (item.transactions && item.transactions.length) {
        console.log('Payment cancelled due to conflict', item.transactions, { item: item, product: product })
        redirectUser(402, cancel_url, 'Payment cancelled due to conflict')
        return
      }

      const updateProductOptions = {
        reservation_time: null,
        reservation_price: null,
        reserved_to: null
      }

      let updateProduct
      try {
        updateProduct = await strapi.services.product.update({ 'id': item.id, 'reserved_to': product.userId }, updateProductOptions)
      } catch (err) {
        null
      }

      if (updateProduct) {
        console.log('Updated product to set reservation and reservation time/price info to null: ', updateProduct.reservation_time, updateProduct.reserved_to);
      } else {
        console.log('Product already no allocated to this user, did not set reservation and reservation time info to null.');
      }

      if (redirectType === 'cancel' && product.cancel_url.length) {
        console.log('Kui cancel URL olemas, siis viskame sellele ', product.cancel_url);
        cancel_url = product.cancel_url
      } else {
        // Kui cancel URL puudu, siis viskame avalehele
        console.log('Kui cancel URL puudu,siis viskame avalehele');
      }
      // return { url: cancel_url }
      redirectUser(402, cancel_url, 'Payment cancelled')
      return
    }

    if (!product.userId || !product.categoryId || !product.productId) {
      console.error('Invalid merchant_data', mkResponse)
      redirectUser(400, cancel_url, 'Invalid merchant_data')
      return
    }

    const mkId = process.env.MakseKeskusId
    if (mkResponse.shop !== mkId) {
      redirectUser(400, cancel_url, 'Invalid shop')
      return
    }

    if (mkResponse.status === 'COMPLETED') {
      if (item.transactions && item.transactions.length) {
        console.log('Already transacted', item.transactions, { item: item, product: product })
        redirectUser(409, cancel_url, 'Already transacted')
        return
      } else {

        //Sheets
        try {
          console.log('Here should do some Google Sheet stuff');
        } catch (error) {
          console.log(error)
        }

        const addTransactionProductsOptions = {
          product: product.productId,
          value: mkResponse.amount,
        }

        let addTransactionProduct = await strapi.services['transactions-products'].create(addTransactionProductsOptions)
        console.log('Create transactionproduct: ', addTransactionProduct);
        // add transaction time
        const addTransactionOptions = {
          dateTime: mkResponse.message_time,
          type: 'Purchase',
          transactor: product.userId,
          beneficiary: product.userId,
          seller_business_profile: product.productCatSeller,
          buyer_business_profile: (product.userBusinessProfiles && product.userBusinessProfiles.length) ? product.userBusinessProfiles[0] : null,
          currency: mkResponse.currency,
          amount: mkResponse.amount,
          transaction: mkResponse.transaction,
          method: 'Maksekeskus',
          status: mkResponse.status,
          products: [addTransactionProduct],
        }
        console.log(addTransactionOptions);
        let addTransaction = await strapi.services.transaction.create(addTransactionOptions)
        let transactionId = addTransaction.id

        console.log('Transaction ID', transactionId);
        if (!transactionId) {
          redirectUser(500, cancel_url, 'Failed to save transaction')
          return
        }

        // Update pass one last time
        const successOptions = {
          owner: product.userId,
          transactions: [addTransaction],
        }

        // let updateProductSuccess = await strapi.services.product.update({ 'id': item.id }, successOptions)
        let updateProductSuccess = await strapi.query('product').update({ 'id': item.id }, successOptions)

        const getUserInfo = await strapi.query('user', 'users-permissions').findOne({ 'id': product.userId });
        if (getUserInfo) {
          console.log('Success getting user info for email');
        } else {
          console.log('Failed getting user info for email');
        }

        let return_url = 'https://poff.ee/minupoff/'

        if (redirectType === 'return' && product.return_url.length) {
          console.log('Kui return URL olemas, saadame kasutaja sinna');
          return_url = product.return_url
        } else {
          console.log('Kui return URL puudu, saadame kasutaja Minu POFFi');
        }

        if (updateProductSuccess) {
          console.log(`Successfully updated product ID ${updateProductSuccess.id} (${updateProductSuccess.product_category.namePrivate} - ${updateProductSuccess.code}). Owner ID ${updateProductSuccess.owner.id} (${updateProductSuccess.owner.username})`);
          console.log('Transaction ID and hash ', addTransaction.id, addTransaction.transaction);
          // Email
          try {
            console.log('Here send e-mail');

            // const passNames = { h08: 'Hundipass 8', h16: 'Hundipass 16', h36: 'Hundipass 36', h00: 'Toetaja Hundipass', jp1: 'Just Filmi Pass', hp1: 'HÕFFi pass', tp: 'Testpass' }

            const sendEmail = await strapi.plugins['email'].services.email.send({
              to: getUserInfo.email,
              template_name: `passiost`,
              template_vars: [
                { name: 'email', content: getUserInfo.email },
                { name: 'eesnimi', content: getUserInfo.user_profile.firstName },
                { name: 'perenimi', content: getUserInfo.user_profile.lastName },
                { name: 'passituup', content: updateProductSuccess.product_category.codePrefix },
                { name: 'passikood', content: updateProductSuccess.code },
                { name: 'passinimi', content: updateProductSuccess.product_category.name.et },
                { name: 'transactionid', content: addTransaction.transaction }
                // { name: 'enabledProviders', content: enabledProviders }
              ]
              // from:
              //   settings.from.email || settings.from.name
              //     ? `${settings.from.name} <${settings.from.email}>`
              //     : undefined,
              // replyTo: settings.response_email,
              // subject: settings.object,
              // text: settings.message,
              // html: settings.message,
            });
            console.log(sendEmail);
          } catch (err) {
            console.log(err)
          }

          console.log('Suunamine kui kõik õnnestus', return_url);
          redirectUser(302, return_url, 'Successful transaction')
          return
        }
      }
    }
  },
  async personForm(ctx) {

    async function uploadPersonPicture(file, firstName, lastName, prefix) {
      console.log('Uploading profile picture');

      const firstNameSlug = slugify(firstName)
      const lastNameSlug = slugify(lastName)

      let splitter = file.name.split('.')
      let fileExt = splitter[splitter.length - 1]
      let fileName = `${prefix}_${firstNameSlug}_${lastNameSlug}.${fileExt}`

      const fileInfo = [
        {
          "caption": file.name,
          "alternativeText": `${firstName} ${lastName}`
        }
      ];

      const uploadedPicture = await strapi.plugins.upload.services.upload.upload({
        data: {
          fileInfo: fileInfo
        }, //mandatory declare the data(can be empty), otherwise it will give you an undefined error.
        files: {
          path: file.path,
          name: fileName,
          type: mime.getType(file.name) || file.type, // mime type of the file
          size: file.size,
        },
      });
      return uploadedPicture[0].id
    }

    let personFormData = { ...JSON.parse(ctx.request.body.data) }

    // Image check
    let file = ctx.request.files['files.picture']
    if (file) {
      if (!file.type.includes("image")) {
        console.log("File is not an image.", file.type, file);
        return ctx.badRequest('Not an image');
      } else if (file.size / 1024 / 1024 > 5) {
        console.log("Image can be max 5MB, uploaded image was " + (file.size / 1024 / 1024).toFixed(2) + "MB")
        return ctx.badRequest('Image too bulky');
      }
    }

    // Image upload and assign to personFormData
    const { files } = parseMultipartData(ctx);
    if (files.picture) {
      const uploadedPicture = await uploadPersonPicture(files.picture, personFormData.firstName, personFormData.lastName, 'C')
      personFormData.picture = uploadedPicture
    }

    if (files.images) {

      if (!Array.isArray(files.images)) {
        files.images = [files.images]
      }

      if (!personFormData.images) { personFormData.images = [] }
      for (let index = 0; index < files.images.length; index++) {
        const image = files.images[index];
        const uploadedPicture = await uploadPersonPicture(image, personFormData.firstName, personFormData.lastName, `G_${index+1}`)
        personFormData.images.push(uploadedPicture)
        console.log('uploadedPicture', uploadedPicture);
      }
    }
    // Create new entry in address collection and assign to person
    let personFormAddressData = personFormData.address
    if (personFormAddressData) {
      let form_address = await strapi.services['address'].create(personFormAddressData)
      personFormData.addr_coll = form_address.id
      delete personFormData.address
    }

    // Create new entry in filmographies collection and assign to person
    let personFormFilmographiesData = personFormData.filmographies
    console.log('personFormFilmographiesData', personFormFilmographiesData);
    if (personFormFilmographiesData.length) {
      let filmographiesIds = []
      for (let i = 0; i < personFormFilmographiesData.length; i++) {
        const filmography = personFormFilmographiesData[i];
        let form_filmographies = await strapi.services['filmography'].create(filmography)
        filmographiesIds.push(form_filmographies.id)
      }
      personFormData.filmographies = filmographiesIds
    }

    personFormData.firstNameLastName = (personFormData.firstName + " " + personFormData.lastName).trim()

    let newPerson = await strapi.services['person'].create(personFormData)
    ctx.send(sanitizeUser(newPerson));
  },
  async getPersonForm(ctx) {

    const { person } = ctx.request.body.data.person;

    // let people_ids = person.map(e => e.id)

    // if(people_ids.length < 1) {
    //   return
    // }

    // let persons =  await strapi.services['person'].find({id_in : people_ids})

    // console.log({persons})
    return person

  }
};


