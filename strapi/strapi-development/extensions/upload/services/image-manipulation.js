'use strict'
/**
 * Image manipulation functions
 */
const sharp = require('sharp')
const path = require('path')
const yaml = require('js-yaml')
const fs = require('fs')

const { bytesToKbytes } = require('../utils/file')

const getMetadatas = buffer =>
  sharp(buffer)
    .metadata()
    .catch(() => ({})) // ignore errors

const getDimensions = buffer =>
  getMetadatas(buffer)
    .then(({ width = null, height = null }) => ({ width, height }))
    .catch(() => ({})) // ignore errors

const domainSpecificsPath = path.join(__dirname, '..', '..', '..', '..', '..', 'ssg' ,'domain_specifics.yaml')
const DOMAIN_SPECIFICS = yaml.load(fs.readFileSync(domainSpecificsPath, 'utf8'))
const resize_options = DOMAIN_SPECIFICS.libraryImageResizeOptions

const THUMBNAIL_RESIZE_OPTIONS = DOMAIN_SPECIFICS.libraryImageThumbnailResizeOption

async function findOptions(prefix){
  let options = null
  resize_options.forEach( e => {
    if (Object.keys(e)[0] === prefix) {
      options = Object.values(e)[0]
    }
  })
  return options
}

const resizeTo = (buffer, options) =>
  sharp(buffer)
    .resize(options)
    .toBuffer()
    .catch(() => null)

const generateThumbnail = async file => {
  if (!(await canBeProccessed(file.buffer))) {
    return null
  }

  const { width, height } = await getDimensions(file.buffer)

  if (width > THUMBNAIL_RESIZE_OPTIONS.width || height > THUMBNAIL_RESIZE_OPTIONS.height) {
    const newBuff = await resizeTo(file.buffer, THUMBNAIL_RESIZE_OPTIONS)

    if (newBuff) {
      const { width, height, size } = await getMetadatas(newBuff)

      return {
        name: `thumbnail_${file.name}`,
        hash: `thumbnail_${file.hash}`,
        ext: file.ext,
        mime: file.mime,
        width,
        height,
        size: bytesToKbytes(size),
        buffer: newBuff,
        path: file.path ? file.path : null,
      }
    }
  }

  return null
}

const optimize = async buffer => {
  const {
    sizeOptimization = false,
    autoOrientation = false,
  } = await strapi.plugins.upload.services.upload.getSettings()

  if (!sizeOptimization || !(await canBeProccessed(buffer))) {
    return { buffer }
  }

  const sharpInstance = autoOrientation ? sharp(buffer).rotate() : sharp(buffer)

  return sharpInstance
    .toBuffer({ resolveWithObject: true })
    .then(({ data, info }) => {
      const output = buffer.length < data.length ? buffer : data

      return {
        buffer: output,
        info: {
          width: info.width,
          height: info.height,
          size: bytesToKbytes(output.length),
        },
      }
    })
    .catch(() => ({ buffer }))
}

const generateResponsiveFormats = async file => {

  if (!(await canBeProccessed(file.buffer))) {
    return []
  }

  const originalDimensions = await getDimensions(file.buffer)

  const filePrefix = file.name.slice(0, 2)

  if(await isBitmapFormat(file.buffer)) {

    let prefixes = ['F_', 'P_', 'R_', 'U_', 'C_']

    if(prefixes.includes(filePrefix)) {
      let params = await findOptions(filePrefix)

      return Promise.all(
        Object.keys(params).map(key => {
          const breakpoint = params[key]

          if (breakpointSmallerThan(breakpoint, originalDimensions)) {
            return generateBreakpoint(params[key].sufiks, { file, breakpoint, originalDimensions})
          }
        }))

    }
    else {
      const prefix = 'NO'
      let params = await findOptions(prefix)
      return Promise.all(
        Object.keys(params).map(key => {
          const breakpoint = params[key]

          if (breakpointSmallerThan(breakpoint, originalDimensions)) {
            return generateBreakpoint(params[key].sufiks, { file, breakpoint, originalDimensions})
          }
        }))
    }
  }

}

const generateBreakpoint = async (key, { file, breakpoint, originalDimensions}) => {

  let sufiks = breakpoint.sufiks

  if(!breakpoint.height) {
    breakpoint.height = originalDimensions.height
    if(breakpoint.height > 1920) {
      breakpoint.height = 1920
    }
  }

  const newBuff = await resizeTo(file.buffer, {
    width: breakpoint.width,
    height: breakpoint.height,
    fit: breakpoint.fit,
  })

  try {
    const metadata = await sharp(newBuff).metadata()

  } catch (error) {
    console.log(`An error occurred during processing: ${error}`)
  }

  if (newBuff) {
    const { width, height, size, format} = await getMetadatas(newBuff)
    let extLength = file.ext.length
    let name = file.name.slice(0, - extLength)

    return{
      key,
      file: {
        name: `${name}${sufiks}`,
        hash: `${file.hash}${sufiks}`,
        ext: file.ext,
        mime: file.mime,
        width,
        height,
        size: bytesToKbytes(size),
        buffer: newBuff,
        path: file.path ? file.path : null,
      }
    }
  }
}

const breakpointSmallerThan = (breakpoint, { width, height }) => {
  console.log('breakpointSmallerThan', breakpoint, 'originalDimensions', width, height)
  return breakpoint.width < width || breakpoint.height < height
}

const bitmapFormats = ['tiff', 'tif', 'png', 'webp', 'jpg', 'jpeg']
const otherFormats = ['pdf', 'doc']

const canBeProccessed = async buffer => {
  const { format } = await getMetadatas(buffer)
  return format && (bitmapFormats.includes(format) || otherFormats.includes(format))
}

const isBitmapFormat = async buffer => {
  const { format } = await getMetadatas(buffer)
  return format && bitmapFormats.includes(format)
}

module.exports = {
  getDimensions,
  generateResponsiveFormats,
  bitmapFormats,
  bytesToKbytes,
  generateThumbnail,
  optimize,
}
