'use strict';

const _ = require('lodash');
const https = require('https')
const mime = require('mime');
const path = require('path')
const fs = require('fs')
const yaml = require('js-yaml');

const helper_path = path.join(__dirname, '..', '..', '..', '..', '/helpers/lifecycle_manager.js')
const build_path = path.join(__dirname, '..', '..', '..', '..', '..', '..', 'ssg', 'build')
const DOMAIN_SPECIFICS_PATH = path.join(__dirname, '..', '..', '..', '..', '..', '..', 'ssg', 'domain_specifics.yaml')
const DOMAIN_SPECIFICS = yaml.load(fs.readFileSync(DOMAIN_SPECIFICS_PATH, 'utf8'))

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
  /** Create a/an user record.
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

  /** Update a/an user record.
   * @return {Object}
   */
  async update(ctx) {
    // console.log('users-permissions controllers user api update');

    const advancedConfigs = await strapi
      .store({
        environment: '',
        type: 'plugin',
        name: 'users-permissions',
        key: 'advanced',
      })
      .get();

    // console.log('user::update advancedConfigs', advancedConfigs)
    // console.log('user::update ctx.params', ctx.params)
    const { id } = ctx.params;
    const { email, username, password } = ctx.request.body;
    // console.log('user::update ctx.request.body', ctx.request.body);

    const user = await strapi.plugins['users-permissions'].services.user.fetch({
      id,
    });
    // console.log('user::update user', user);

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
    // console.log('user::update username checked');
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
    // console.log('user::update email checked');

    let updateData = {
      ...ctx.request.body,
    };

    if (_.has(ctx.request.body, 'password') && password === user.password) {
      delete updateData.password;
    }
    // console.log('user::update updateData', updateData);
    const data = await strapi.plugins['users-permissions'].services.user.edit({ id }, updateData);

    // console.log('user::update data', data);

    ctx.send(sanitizeUser(data));
    // console.log('user::update ctx.sent');
  },

  /** Profile update function. pre-oAuth
   * Update a/an user record.
   * @return {Object}
   * @description
   * This function updates the profile of the currently logged in user.
   * It is used by the profile page.
   * @mitselek thinks it should not be used anymore, but it is still used somewhere.
   */
  async updateMe(ctx) {

    // console.log('users-permissions controllers user api updateme');
    const { id } = ctx.state.user;
    console.log(ctx.request.body);

    async function uploadProfilePicture(files, firstName, lastName) {
      // console.log('Uploading profile picture');

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

    // Query body
    // let rawData = { ...JSON.parse(ctx.request.body) }
    let rawData = ctx.request.body
    console.log('users-permissions controllers user api favorites RAWDATA', rawData);

    const id = rawData.userId;

    const manipulateFavorites = async (user, addOrRm, theId, objectName) => {

      console.log('manipulateFavorites', user.id, addOrRm, theId, objectName);

      const userMyContent = (user.My[objectName] || []).map(c => c.id)
      console.log('userMyContent', userMyContent);

      // If the object was already in the user's My list, remove it. Otherwise, add it.
      if (addOrRm === 'add') {
        userMyContent.push(theId)
        console.log('added', userMyContent);
      } else if (addOrRm === 'rm') {
        const indexOfObj = userMyContent.indexOf(theId);
        const removeObj = userMyContent.splice(indexOfObj, 1);
        console.log('removed', userMyContent);
      }

      user.My[objectName] = userMyContent

      console.log('user.My[objectName]', user.My[objectName]);

      // New user My object
      let newMyObject = {
        My: {
          [objectName]: userMyContent
        }
      }
      // Update user with new info
      const updatedUser = await strapi.plugins['users-permissions'].services.user.edit({ id }, newMyObject);
      ctx.send(sanitizeUser(updatedUser));
    }

    const user = await strapi.plugins['users-permissions'].services.user.fetch({
      id,
    });

    // User needs to fill profile before
    if (!user.user_profile) {
      rawData.users_permissions_user = id
      console.log('Please fill profile');
    }

    if (rawData.type === "rmScreening") {
      // user object, "rm/add", "screening ID" "my_screenings", "schedule" , "screenings"
      return await manipulateFavorites(user, "rm", rawData.id, "screenings")
    } else if (rawData.type === "addScreening") {
      return await manipulateFavorites(user, "add", rawData.id, "screenings")
    } else if (rawData.type === "rmMyFilm") {
      return await manipulateFavorites(user, "rm", rawData.id, "films")
    } else if (rawData.type === "addMyFilm") {
      return await manipulateFavorites(user, "add", rawData.id, "films")
    } else if (rawData.type === "rmMyEvent") {
      return await manipulateFavorites(user, "rm", rawData.id, "course_events")
    } else if (rawData.type === "addMyEvent") {
      return await manipulateFavorites(user, "add", rawData.id, "course_events")
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

    const requestBody = ctx.request.body

    const catId = requestBody.categoryId
    var id = requestBody.userId
    var user = await strapi.plugins['users-permissions'].services.user.fetch({ id })

    if(user.mainUser){
      id = user.mainUser.id
      user = await strapi.plugins['users-permissions'].services.user.fetch({ id })
    }

    var userEmail = user.email
    if(user.user_profile && user.user_profile.email){
      userEmail = user.user_profile.email
    }

    console.log(`Buy product ${catId} for user ${id}, ${userEmail}`)

    const postToMaksekeskus = async (postData) => {
      const productCatBP = JSON.parse(postData.transaction.merchant_data).productCatSeller
      console.log('postToMaksekeskus product cat business profile id', productCatBP)

      const businessProfile = await strapi.query('business-profile').findOne({ 'id': productCatBP })

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
        console.log('Already transacted', item.transactions.id, { item: item.id, productId: product.productID })
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
        console.log('user::api Create transactionproduct: ', addTransactionProduct.id);
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
        console.log('api::user addTransactionOptions', addTransactionOptions);
        let addTransaction = await strapi.services.transaction.create(addTransactionOptions)
        let transactionId = addTransaction.id

        console.log('api::user Transaction ID', transactionId);
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
          console.log(`user::api Successfully updated product ID ${updateProductSuccess.id} (${updateProductSuccess.product_category.namePrivate} - ${updateProductSuccess.code}). Owner ID ${updateProductSuccess.owner.id} (${updateProductSuccess.owner.username})`);
          console.log('user::api Transaction ID and hash ', addTransaction.id, addTransaction.transaction);
          // Email
          try {
            console.log('Here send e-mail');

            // const passNames = { h08: 'Hundipass 8', h16: 'Hundipass 16', h36: 'Hundipass 36', h00: 'Toetaja Hundipass', jp1: 'Just Filmi Pass', hp1: 'HÕFFi pass', tp: 'Testpass' }
            var userEmail = getUserInfo.email
            if(getUserInfo.user_profile && getUserInfo.user_profile.email){
              userEmail = getUserInfo.user_profile.email
            }
            const sendEmail = await strapi.plugins['email'].services.email.send({
              to: userEmail,
              template_name: `passiost`,
              template_vars: [
                { name: 'email', content: userEmail },
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

    const user = ctx.state.user;
    const userPersonID = ctx.state.user?.person;

    let personFormData = { ...JSON.parse(ctx.request.body.data) }

    console.log('personFormData.images', personFormData.images);

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

    // Person already exists
    if (userPersonID) {

      const userPerson = await strapi.query('person').findOne({ 'id': userPersonID });
      console.log(JSON.stringify(userPerson));

      // Person address, update or add new
      if (userPerson?.addr_coll?.id === +personFormData?.address?.strapi_id) {
        let addressID = userPerson.addr_coll.id
        await strapi.services['address'].update({ 'id': addressID }, personFormData.address)
        delete personFormData.address
      } else {
        addNewAddressCollection()
      }

      // Filmographies (including education)
      // Delete ones to be deleted
      if (personFormData?.filmographiesToDelete) {
        for (let index = 0; index < personFormData.filmographiesToDelete.length; index++) {
          const filmography = personFormData.filmographiesToDelete[index];
          if (userPerson.filmographies.map(f => f.id).includes(+filmography)) {
            const deletedFilmography = await strapi.services['filmography'].delete({ 'id': filmography })
            console.log('Deleted filmography', deletedFilmography);
          }
        }
      }
      // Add ones to be added
      await addNewFilmographies()
      // Update existing ones
      await updateFilmographies(userPerson)
      // Filter out form data and leave only the IDs
      personFormData.filmographies = personFormData.filmographies.filter(f => typeof f === 'number')

      // Gallery images
      // Delete gallery images
      if (personFormData?.existingGalleryImagesToDelete) {
        for (let index = 0; index < personFormData.existingGalleryImagesToDelete.length; index++) {
          const galleryImage = personFormData.existingGalleryImagesToDelete[index];
          if (userPerson.images.map(i => i.id).includes(galleryImage)) {
            const galleryImgFile = await strapi.plugins['upload'].services.upload.fetch({ 'id': galleryImage });
            await strapi.plugins['upload'].services.upload.remove(galleryImgFile);
            console.log('Deleted gallery image', galleryImage);
          }
        }
      }

      // Image upload and assign to personFormData
      const { files } = parseMultipartData(ctx);
      if (files.picture) {
        const uploadedPicture = await uploadPersonPicture(files.picture, personFormData.firstName, personFormData.lastName, 'C')
        personFormData.picture = uploadedPicture
        // Delete old profile image
        if (userPerson.picture) {
          const profilePictureFile = await strapi.plugins['upload'].services.upload.fetch({ 'id': userPerson.picture.id });
          await strapi.plugins['upload'].services.upload.remove(profilePictureFile);
          console.log('Deleted profile image', userPerson.picture.id);
        }
      }

      // if (files.audioreel) {
      //   const uploadedAudioreel = await uploadAudioreel(files.audioreel)
      //   personFormData.audioreel = uploadedAudioreel
      // }

      // Upload new gallery images
      await addNewGalleryImages(files);

      // Join uploaded images from form with existing ones under person
      let previousImages = (userPerson?.images?.map(i => i.id) || []).filter(f => !personFormData?.existingGalleryImagesToDelete?.includes(f))
      personFormData.images = personFormData.images ? personFormData.images.concat(previousImages) : previousImages

      personFormData.firstNameLastName = (personFormData.firstName + " " + personFormData.lastName).trim()

      console.log('personFormData', personFormData);
      let updatedPerson = await strapi.services['person'].update({ 'id': userPerson.id }, personFormData)
      ctx.send(sanitizeUser(updatedPerson));

    } else {
      ///////////////////// START OF CREATE NEW PERSON /////////////////////

      console.log('personFormData', JSON.stringify(personFormData));

      // Image upload and assign to personFormData
      const { files } = parseMultipartData(ctx);
      if (files.picture) {
        const uploadedPicture = await uploadPersonPicture(files.picture, personFormData.firstName, personFormData.lastName, 'C')
        personFormData.picture = uploadedPicture
      }

      if (files.audioreel) {
        const uploadedAudioreel = await uploadAudioreel(files.audioreel)
        personFormData.audioreel = uploadedAudioreel
      }

      // Add gallery images
      await addNewGalleryImages(files);

      // Create new entry in address collection and assign to person
      await addNewAddressCollection();

      // Create new entry in filmographies collection and assign to person
      await addNewFilmographies();

      personFormData.firstNameLastName = (personFormData.firstName + " " + personFormData.lastName).trim()

      // Filter out form data and leave only the IDs
      personFormData.filmographies = personFormData.filmographies.filter(f => typeof f === 'number')

      console.log('personFormData', personFormData);
      let newPerson = await strapi.services['person'].create(personFormData)
      const addUserPerson = await strapi.query('user', 'users-permissions').update({ 'id': user.id }, { person: newPerson.id });
      console.log('newPerson', newPerson);
      ctx.send(sanitizeUser(newPerson));
      ///////////////////// END OF CREATE NEW PERSON /////////////////////
    }


    async function addNewGalleryImages(files) {
      if (files.images) {

        if (!Array.isArray(files.images)) {
          files.images = [files.images];
        }

        if (!personFormData.images) { personFormData.images = []; }
        for (let index = 0; index < files.images.length; index++) {
          const image = files.images[index];
          const uploadedPicture = await uploadPersonPicture(image, personFormData.firstName, personFormData.lastName, `G_${index + 1}`);
          personFormData.images.push(uploadedPicture);
          console.log('uploadedPicture', uploadedPicture);
        }
      }
    }

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

    async function uploadAudioreel(file) {
      console.log('Uploading audioreel');

      const uploadedAudioreel = await strapi.plugins.upload.services.upload.upload({
        data: {
          // fileInfo: fileInfo
        }, //mandatory declare the data(can be empty), otherwise it will give you an undefined error.
        files: {
          path: file.path,
          name: file.name,
          type: mime.getType(file.name) || file.type, // mime type of the file
          size: file.size,
        },
      });
      return uploadedAudioreel[0].id
    }

    async function addNewAddressCollection() {
      let personFormAddressData = personFormData.address;
      if (personFormAddressData) {
        let form_address = await strapi.services['address'].create(personFormAddressData);
        personFormData.addr_coll = form_address.id;
        delete personFormData.address;
      }
    }

    async function addNewFilmographies() {
      let personFormFilmographiesData = personFormData.filmographies.filter(f => !f.strapi_id)
      console.log('personForm add new filmography', personFormFilmographiesData)
      if (personFormFilmographiesData.length) {
        let filmographiesIds = []
        for (let i = 0; i < personFormFilmographiesData.length; i++) {
          const filmography = personFormFilmographiesData[i]
          let form_filmographies = await strapi.services['filmography'].create(filmography)
          filmographiesIds.push(form_filmographies.id)
        }
        personFormData.filmographies = personFormData.filmographies.concat(filmographiesIds)
      }
    }

    async function updateFilmographies(userPerson) {
      let personFormFilmographiesData = personFormData.filmographies.filter(f => f.strapi_id)
      console.log('personForm update filmograpies', personFormFilmographiesData.map(f => f.id))

      if (personFormFilmographiesData.length) {
        let filmographiesIds = []
        for (let i = 0; i < personFormFilmographiesData.length; i++) {
          const filmography = personFormFilmographiesData[i]
          let thisFilmographyID = +filmography.strapi_id

          if (userPerson?.filmographies?.map(f => f.id).includes(thisFilmographyID)) {

            let form_filmographies = await strapi.services['filmography'].update({ 'id': thisFilmographyID }, filmography)
            filmographiesIds.push(form_filmographies.id)
          }
        }
        personFormData.filmographies = personFormData.filmographies.concat(filmographiesIds)
      }
    }
  },

  async getPersonForm(ctx) {

    // const { person } = ctx.request.body.data.person;

    console.log('Tere');

    // let people_ids = person.map(e => e.id)

    // if(people_ids.length < 1) {
    //   return
    // }

    // let persons =  await strapi.services['person'].find({id_in : people_ids})

    // console.log({persons})
    // return person

    return { tere: 'hommikust' }

  },

  async roleController(ctx) {
    const id = ctx.request.body.userId;
    const { cType, cId, cLang, cSubType, cDomain } = ctx.request.body;
    console.log(' cType, cId, cLang, cSubType, cDomain ', cType, cId, cLang, cSubType, cDomain);
    // const { email, username, password } = ctx.request.body;
    // strapi.query('user', 'users-permissions').update({ 'id': result.id }, { moodle_id: userMoodleId });
    // const user = await strapi.query('user', 'users-permissions').findOne({ 'id': id }, ['user_roles', 'user_roles.user_right', 'user_roles.user_right.smart_folders']);

    // User details
    const user = await strapi.plugins['users-permissions'].services.user.fetch({
      id,
    });

    // All smart folders as per user_roles being too deep. Plus sanitize.
    const rawSmartFolders = await strapi.services['smart-folder'].find({ _limit: -1 });
    const smartFolders = sanitizeEntity(rawSmartFolders, { model: strapi.query('smart-folder').model });

    let timeNow = new Date()
    let rightConditions
    if (user?.user_roles) {
      // Filter out roles which have rights and are still valid and have smart_folders and match pattern, etc.
      let currentRights = user.user_roles
        .filter(r => r.user_right && new Date(r.valid_from) <= timeNow && timeNow <= new Date(r.valid_to))
        .map(r => r.user_right)
        .flat()
        .filter(r => r.smart_folders.length)
        .map(r => r.smart_folders.map(a => a = smartFolders.filter(b => b.id === a.id)[0]))
        .flat()
        .map(r => {
          r.pattern_collections = r.pattern_collections.map(a => a.pattern)
          return r
        })
      // Assign the conditions
      rightConditions = currentRights.filter(r => r.pattern_collections.includes(cType)).map(r => r = r.conditions)

      // console.log('rightConditions', JSON.stringify(rightConditions, null, 4));
    }

    // Get content info and sanitize
    const rawContent = await strapi.services[cType].findOne({ 'id': cId });
    const content = sanitizeEntity(rawContent, { model: strapi.query(cType).model });

    // Pass conditions and values to function that checks the matching
    // If at least one role has all conditions matching, allow user to view the content
    let allowedContent
    for (let i = 0; i < rightConditions.length; i++) {
      const element = rightConditions[i];
      let conditionsResults = []
      element.map(r => conditionsResults.push(conditionsCheck(content, r.property, r.value)))
      if (!conditionsResults.includes(false) && conditionsResults.includes(true)) {
        allowedContent = true
        break
      }
    }

    let cSlug
    if (cLang === '') {
      cSlug = content[`slug_${DOMAIN_SPECIFICS.defaultLocale[cDomain]}`]
    } else {
      cSlug = content[`slug_${cLang.replace('/', '')}`]
    }

    // Return content if allowed
    if (allowedContent) {
      console.log(`Content ${cType} ${cId} for user ${id} ALLOWED!`);
      const contentData = fs.readFileSync(path.join(build_path, DOMAIN_SPECIFICS.domain[cDomain], cLang, 'restrictedcontent', cSubType, cSlug, 'index.html'), 'utf8');
      return { code: 200, case: 'allowed', data: contentData }
    } else {
      console.log(`Content ${cType} ${cId} for user ${id} DENIED!`);
      return { code: 200, case: 'denied' }
    }

    // Checks condition values to match content values to determine right to view the content
    // Returns true/false
    function conditionsCheck(content, condition, conditionValue) {
      let contentCopy = { ...content }
      // If content condition value is String "true"/"false", convert to boolean value
      if (conditionValue === 'true' || conditionValue === 'false') {
        conditionValue = conditionValue === 'true' ? true : false
      }

      // If condition is deeper (ex article_types.name)
      if (condition.includes('.')) {
        condition = condition.split('.')
        for (let i = 0; i < condition.length; i++) {
          // If array, check if at least one array condition matches value
          if (typeof contentCopy[condition[i]] === 'object' && Array.isArray(contentCopy[condition[i]])) {
            contentCopy = contentCopy[condition[i]].map(r => r[condition[i + 1]]).includes(conditionValue);
            break
          } else if (i === (condition.length - 1)) {
            contentCopy = contentCopy[condition[i]] === conditionValue;
          } else {
            contentCopy = contentCopy[condition[i]];
          }
        }
      } else {
        contentCopy = contentCopy[condition] === conditionValue
      }
      return contentCopy
    }
  },

  /** Profile update function.
   * Update a/an user profile.
   * @return {Object}
   * @description
   * This function updates the profile of the currently logged in user.
   * The request is mediated by the "hunt" oAuth service, which is the only
   * way to update the profile. The profile is identified by the profileId
   * parameter in body.
   */
  async putProfile(ctx) {
    strapi.log.debug('putProfile')
    const prfl = 429200 || ctx?.params?.id
    const profileId = prfl || ctx?.request?.body?.profileId
    console.log(`Updating profile ${profileId}`)
    const body = parseMultipartData(ctx)
    console.log(`Updating profile ${profileId} with body ${JSON.stringify(body, null, 4)}`) // eslint-disable-line no-console
  },

  /** Link aliasUser with mainUser
   * @description
   * A user can have aliasUsers, which are other users that are linked to the main user.
   * A user can have only one mainUser.
   * There are three types of users:
   * - users with mainUser;
   * - users with aliasUsers;
   * - users without mainUser and aliasUsers.
   * = user with mainUser can not have aliasUsers and vice versa.
   *
   * @param {Object} ctx - has the request body with mainUser id and aliasUser id
   * @returns {Object} - returns code 200 if success, 400 if error
   *
   * @description
   * This function links aliasUser with mainUser.
   * aliasUser is added to aliasUsers of mainUser and mainUser becomes mainUser of aliasUser.
   *
   * 1. Set the stage:
   *   - If provided mainuser is itself an aliasUser, then use the mainUser of mainUser as mainUser.
   *   - If provided aliasUser has mainUser, then use the mainUser of aliasUser as aliasUser.
   * 2. Merge the My properties
   *   - of mainUser
   *   - and aliasUser
   *   - and update mainUser with the merged properties.
   * 3a. Collect all aliasUsers.
   * 3b. Update mainUser.aliasUsers with the collected aliasUsers.
   * 4. Save mainUser.
   * 5. Return mainUser and status.
   *
   * @NOTE
   * user.My.products is different from films and screenings.
   * user.my_films and user.my_screenings are obsolete and should be read only,
   * any new films and screenings should be added to user.My.films and user.My.screenings;
   * user.my_products on the other hand is primary data and gets copied to user.My.products
   * for frontend use (will deprecate user.my_products in the future).
   *
   * @returns {Object} - returns code 200 if success, 400 if error
   */
  async linkUsers(ctx) {
    // console.log(`request body ${JSON.stringify(ctx.request.body, null, 4)}`)
    // console.log(`context params ${JSON.stringify(ctx.params, null, 4)}`)
    const { mainUser, aliasUser } = ctx.request.body
    console.log(`Linking aliasUser ${aliasUser} with mainUser ${mainUser}`) // eslint-disable-line no-console

    // 1. Set the stage
    // If provided mainuser is itself an aliasUser, then use the mainUser of mainUser as mainUser.
    let mainUserObj = await strapi.query('user', 'users-permissions').findOne({ 'id': mainUser })
    if (mainUserObj.mainUser) {
      mainUserObj = await strapi.query('user', 'users-permissions').findOne({ 'id': mainUserObj.mainUser.id })
    }

    // If provided aliasUser has mainUser, then use the mainUser of aliasUser as aliasUser.
    let aliasUserObj = await strapi.query('user', 'users-permissions').findOne({ 'id': aliasUser })
    if (aliasUserObj.mainUser) {
      aliasUserObj = await strapi.query('user', 'users-permissions').findOne({ 'id': aliasUserObj.mainUser.id })
    }

    // 2. Merge the My properties of mainUser ...
    mainUserObj.My = mainUserObj.My || { films: [], screenings: [], products: [] }
    mainUserObj.My.films = mainUserObj.My.films.map(f => f.id)
    mainUserObj.My.screenings = mainUserObj.My.screenings.map(f => f.id)
    if (mainUserObj.my_films && mainUserObj.my_films.length) {
      const my_films = mainUserObj.my_films.reduce( (acc, cur) => [...acc, ...cur.cassettes], []).map(f => f.id)
      mainUserObj.My.films = [...(mainUserObj.My.films || []), ...(my_films || [])]
      mainUserObj.my_films = []
    }
    if (mainUserObj.my_screenings && mainUserObj.my_screenings.length) {
      const my_screenings = mainUserObj.my_screenings.reduce( (acc, cur) => [...acc, ...cur.cassettes], []).map(f => f.id)
      mainUserObj.My.screenings = [...(mainUserObj.My.screenings || []), ...(my_screenings || [])]
      mainUserObj.my_screenings = []
    }
    mainUserObj.My.products = (mainUserObj.My.products || []).map(f => f.id)
    mainUserObj.my_products = (mainUserObj.my_products || []).map(f => f.id)
    mainUserObj.My.products = [...mainUserObj.My.products, ...mainUserObj.my_products]

    // ... and aliasUser
    aliasUserObj.My = aliasUserObj.My || { films: [], screenings: [], products: [] }
    aliasUserObj.My.films = aliasUserObj.My.films.map(f => f.id)
    aliasUserObj.My.screenings = aliasUserObj.My.screenings.map(f => f.id)
    if (aliasUserObj.my_films && aliasUserObj.my_films.length) {
      const my_films = aliasUserObj.my_films.reduce( (acc, cur) => [...acc, ...cur.cassettes], []).map(f => f.id)
      aliasUserObj.My.films = [...(aliasUserObj.My.films || []), ...(my_films || [])]
      aliasUserObj.my_films = []
    }
    if (aliasUserObj.my_screenings && aliasUserObj.my_screenings.length) {
      const my_screenings = aliasUserObj.my_screenings.reduce( (acc, cur) => [...acc, ...cur.cassettes], []).map(f => f.id)
      aliasUserObj.My.screenings = [...(aliasUserObj.My.screenings || []), ...(my_screenings || [])]
      aliasUserObj.my_screenings = []
    }
    aliasUserObj.My.products = (aliasUserObj.My.products || []).map(f => f.id)
    aliasUserObj.my_products = (aliasUserObj.my_products || []).map(f => f.id)
    aliasUserObj.My.products = [...aliasUserObj.My.products, ...aliasUserObj.my_products]

    // ... and update mainUser with the merged properties.
    console.log(`main- and alias films: ${JSON.stringify(mainUserObj.My.films, null, 4)} ${JSON.stringify(aliasUserObj.My.films, null, 4)}`)
    mainUserObj.My.films = [...mainUserObj.My.films, ...aliasUserObj.My.films]
    console.log(`main films: ${JSON.stringify(mainUserObj.My.films, null, 4)}`)
    // mainUserObj.My.films = [...new Set(mainUserObj.My.films)]
    mainUserObj.My.screenings = [...mainUserObj.My.screenings, ...aliasUserObj.My.screenings]
    // mainUserObj.My.screenings = [...new Set(mainUserObj.My.screenings)]
    mainUserObj.My.products = [...mainUserObj.My.products, ...aliasUserObj.My.products]
    // mainUserObj.My.products = [...new Set(mainUserObj.My.products)]

    // 3a. Collect all aliasUsers.
    aliasUserObj.aliasUsers = aliasUserObj.aliasUsers || []
    const allAliasUsers = aliasUserObj.aliasUsers.map(a => a.id).concat(aliasUserObj.id)

    // 3b. Update mainUser.aliasUsers with the collected aliasUsers.
    mainUserObj.aliasUsers = [...(mainUserObj.aliasUsers || []), ...allAliasUsers]

    // 4. Save mainUser.
    try {
      // TODO: There is a bug hidden in having user_profile while updating user.
      delete aliasUserObj.user_profile
      await strapi.query('user', 'users-permissions').update({ 'id': aliasUserObj.id }, aliasUserObj)
      delete mainUserObj.user_profile
      const updatedMainUser = await strapi.query('user', 'users-permissions').update({ 'id': mainUserObj.id }, mainUserObj)
      // 5. Return mainUser and status.
      return { code: 200, data: updatedMainUser }
    } catch (err) {
      console.log('Error updating mainUser', err);
      return { code: 500, data: err }
    }
  }
}
