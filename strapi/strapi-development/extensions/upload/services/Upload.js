'use strict'

/**
 * Upload.js service
 *
 * @description: A set of functions similar to controller's actions to avoid code duplication.
 */

const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const LD_ = require('lodash')
const {
  nameToSlug,
  contentTypes: contentTypesUtils,
  sanitizeEntity,
  webhook: webhookUtils,
} = require('strapi-utils')

const sharp = require('sharp')

const { bitmapFormats } = require(path.join(__dirname, 'image-manipulation.js'))

const { MEDIA_UPDATE, MEDIA_CREATE, MEDIA_DELETE } = webhookUtils.webhookEvents

const { bytesToKbytes } = require('../utils/file')

const { UPDATED_BY_ATTRIBUTE, CREATED_BY_ATTRIBUTE } = contentTypesUtils.constants

const randomSuffix = () => crypto.randomBytes(5).toString('hex')

const generateFileName = name => {
  const baseName = nameToSlug(name, { separator: '_', lowercase: false })

  return `${baseName}_${randomSuffix()}`
}

const sendMediaMetrics = data => {
  if (data.hasOwnProperty('caption') && data.caption !== '') {
    strapi.telemetry.send('didSaveMediaWithCaption')
  }

  if (data.hasOwnProperty('alternativeText') && data.alternativeText !== '') {
    strapi.telemetry.send('didSaveMediaWithAlternativeText')
  }
}

const combineFilters = params => {
  // FIXME: until we support boolean operators for querying we need to make mime_ncontains use AND instead of OR
  if (params.hasOwnProperty('mime_ncontains') && Array.isArray(params.mime_ncontains)) {
    params._where = params.mime_ncontains.map(val => ({ mime_ncontains: val }))
    delete params.mime_ncontains
  }
}

async function findBuff(buff) {
  let n_buffer = sharp(buff)
    .toFormat('jpeg', { quality: 100 })
    .toBuffer()
    .catch(() => null)

    return n_buffer
}

module.exports = {

  formatFileInfo({ filename, type, size }, fileInfo = {}, metas = {}) {
    const ext = path.extname(filename)
    const basename = path.basename(fileInfo.name || filename, ext)

    const usedName = fileInfo.name || filename

    const entity = {
      name: usedName,
      alternativeText: fileInfo.alternativeText,
      caption: fileInfo.caption,
      hash: generateFileName(basename),
      ext,
      mime: type,
      size: bytesToKbytes(size),
    }

    const { refId, ref, source, field } = metas

    if (refId && ref && field) {
      entity.related = [
        {
          refId,
          ref,
          source,
          field,
        },
      ]
    }

    if (metas.path) {
      entity.path = metas.path
    }

    return entity
  },

  async enhanceFile(file, fileInfo = {}, metas = {}) {

    const readBuffer = fs.readFileSync(file.path)

    const { optimize } = strapi.plugins.upload.services['image-manipulation']

    const { buffer, info } = await optimize(readBuffer)

    const formattedFile = this.formatFileInfo(
      {
        filename: file.name,
        type: file.type,
        size: file.size,
      },
      fileInfo,
      metas
    )

    // The spread operator (...) to merge the properties of formattedFile,
    // info, and an object containing buffer into a new object.
    // This is the native JavaScript equivalent of _.assign.
    return { ...formattedFile, ...info, buffer }
  },

  async upload({ data, files }, { user } = {}) {
    strapi.log.debug(`Upload::upload fileInfo: ${JSON.stringify(data.fileInfo)}`)

    const { fileInfo, ...metas } = data
    strapi.log.debug(Object.keys(data))
    strapi.log.debug(Object.keys(fileInfo))
    const fileArray = Array.isArray(files) ? files : [files]
    const fileInfoArray = Array.isArray(fileInfo) ? fileInfo : [fileInfo]

    const doUpload = async (file, fileInfo) => {
      const fileData = await this.enhanceFile(file, fileInfo, metas)

      return this.uploadFileAndPersist(fileData, { user })
    }

    return await Promise.all(
      fileArray.map((file, idx) => doUpload(file, fileInfoArray[idx] || {}))
    )
  },

  async uploadFileAndPersist(fileData, { user } = {}) {

    let n_ext = fileData.ext
    let n_mime = fileData.mime
    let n_buffer = fileData.buffer

    if(bitmapFormats.includes(fileData.ext.slice(1))) {
      n_ext = '.jpeg'
      n_mime = 'image/jpeg'
      n_buffer = await findBuff(n_buffer)

    }

    let data = {
      name: fileData.name.slice(0, - fileData.ext.length),
      alternativeText: fileData.alternativeText,
      caption: fileData.caption,
      hash: fileData.hash,
      ext: n_ext,
      mime: n_mime,
      size: fileData.size,
      buffer: n_buffer
    }

    fileData = data

    const config = strapi.plugins.upload.config

    const {
      getDimensions,
      generateResponsiveFormats,
      generateThumbnail,
    } = strapi.plugins.upload.services['image-manipulation']

    await strapi.plugins.upload.provider.upload(fileData)

    const thumbnailFile = await generateThumbnail(fileData)
    if (thumbnailFile) {
      await strapi.plugins.upload.provider.upload(thumbnailFile)
      delete thumbnailFile.buffer
      _.set(fileData, 'formats.thumbnail', thumbnailFile)
    }

    const formats = await generateResponsiveFormats(fileData)

    console.log({formats}) // logidesse saadud formaadid

    if (Array.isArray(formats) && formats.length > 0) {
      for (const format of formats) {

        if (!format || format === undefined) continue

        const { key, file } = format
        await strapi.plugins.upload.provider.upload(file)
        delete file.buffer

        LD_.set(fileData, ['formats', key], file)
      }
    }

    const { width, height } = await getDimensions(fileData.buffer)

    delete fileData.buffer

    LD_.assign(fileData, {
      provider: config.provider,
      width,
      height,
    })

    return this.add(fileData, { user })

   },

  async updateFileInfo(id, { name, alternativeText, caption }, { user } = {}) {
    const dbFile = await this.fetch({ id })

    if (!dbFile) {
      throw strapi.errors.notFound('file not found')
    }

    const newInfos = {
      name: LD_.isNil(name) ? dbFile.name : name,
      alternativeText: LD_.isNil(alternativeText) ? dbFile.alternativeText : alternativeText,
      caption: LD_.isNil(caption) ? dbFile.caption : caption,
    }

    return this.update({ id }, newInfos, { user })
  },

  async replace(id, { data, file }, { user } = {}) {
    // console.log('replace image', {data}, {file} )
    const config = strapi.plugins.upload.config

    const {
      getDimensions,
      generateThumbnail,
      generateResponsiveFormats,
    } = strapi.plugins.upload.services['image-manipulation']

    const dbFile = await this.fetch({ id })

    if (!dbFile) {
      throw strapi.errors.notFound('file not found')
    }

    const { fileInfo } = data
    const fileData = await this.enhanceFile(file, fileInfo)

    // keep a constant hash
    LD_.assign(fileData, {
      hash: dbFile.hash,
      ext: dbFile.ext,
    })

    // execute delete function of the provider
    if (dbFile.provider === config.provider) {
      await strapi.plugins.upload.provider.delete(dbFile)

      if (dbFile.formats) {
        await Promise.all(
          Object.keys(dbFile.formats).map(key => {
            return strapi.plugins.upload.provider.delete(dbFile.formats[key])
          })
        )
      }
    }

    await strapi.plugins.upload.provider.upload(fileData)

    // clear old formats
    LD_.set(fileData, 'formats', {})

    const thumbnailFile = await generateThumbnail(fileData)
    if (thumbnailFile) {
      await strapi.plugins.upload.provider.upload(thumbnailFile)
      delete thumbnailFile.buffer
      LD_.set(fileData, 'formats.thumbnail', thumbnailFile)
    }

    const formats = await generateResponsiveFormats(fileData)
    if (Array.isArray(formats) && formats.length > 0) {
      for (const format of formats) {
        if (!format) continue

        const { key, file } = format

        await strapi.plugins.upload.provider.upload(file)
        delete file.buffer

        LD_.set(fileData, ['formats', key], file)
      }
    }

    const { width, height } = await getDimensions(fileData.buffer)
    delete fileData.buffer

    LD_.assign(fileData, {
      provider: config.provider,
      width,
      height,
    })

    return this.update({ id }, fileData, { user })
  },

  async update(params, values, { user } = {}) {
    const fileValues = { ...values }
    if (user) {
      fileValues[UPDATED_BY_ATTRIBUTE] = user.id
    }
    sendMediaMetrics(fileValues)

    const res = await strapi.query('file', 'upload').update(params, fileValues)
    const modelDef = strapi.getModel('file', 'upload')
    strapi.eventHub.emit(MEDIA_UPDATE, { media: sanitizeEntity(res, { model: modelDef }) })
    return res
  },

  async add(values, { user } = {}) {
    const fileValues = { ...values }
    if (user) {
      fileValues[UPDATED_BY_ATTRIBUTE] = user.id
      fileValues[CREATED_BY_ATTRIBUTE] = user.id
    }
    sendMediaMetrics(fileValues)

    const res = await strapi.query('file', 'upload').create(fileValues)
    const modelDef = strapi.getModel('file', 'upload')
    strapi.eventHub.emit(MEDIA_CREATE, { media: sanitizeEntity(res, { model: modelDef }) })
    return res
  },

  fetch(params) {
    return strapi.query('file', 'upload').findOne(params)
  },

  fetchAll(params) {
    combineFilters(params)
    return strapi.query('file', 'upload').find(params)
  },

  search(params) {
    return strapi.query('file', 'upload').search(params)
  },

  countSearch(params) {
    return strapi.query('file', 'upload').countSearch(params)
  },

  count(params) {
    combineFilters(params)
    return strapi.query('file', 'upload').count(params)
  },

  async remove(file) {
    const config = strapi.plugins.upload.config

    // execute delete function of the provider
    if (file.provider === config.provider) {
      await strapi.plugins.upload.provider.delete(file)

      if (file.formats) {
        await Promise.all(
          Object.keys(file.formats).map(key => {
            return strapi.plugins.upload.provider.delete(file.formats[key])
          })
        )
      }
    }

    const media = await strapi.query('file', 'upload').findOne({
      id: file.id,
    })

    const modelDef = strapi.getModel('file', 'upload')
    strapi.eventHub.emit(MEDIA_DELETE, { media: sanitizeEntity(media, { model: modelDef }) })

    return strapi.query('file', 'upload').delete({ id: file.id })
  },

  async uploadToEntity(params, files, source) {
    const { id, model, field } = params

    const arr = Array.isArray(files) ? files : [files]
    const enhancedFiles = await Promise.all(
      arr.map(file => {
        return this.enhanceFile(
          file,
          {},
          {
            refId: id,
            ref: model,
            source,
            field,
          }
        )
      })
    )

    await Promise.all(enhancedFiles.map(file => this.uploadFileAndPersist(file)))
  },

  getSettings() {
    return strapi
      .store({
        type: 'plugin',
        name: 'upload',
        key: 'settings',
      })
      .get()
  },

  setSettings(value) {
    if (value.responsiveDimensions === true) {
      strapi.telemetry.send('didEnableResponsiveDimensions')
    } else {
      strapi.telemetry.send('didDisableResponsiveDimensions')
    }

    return strapi
      .store({
        type: 'plugin',
        name: 'upload',
        key: 'settings',
      })
      .set({ value })
  },
}
