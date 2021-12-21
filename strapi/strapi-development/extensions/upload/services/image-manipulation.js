'use strict';
/**
 * Image manipulation functions
 */
const sharp = require('sharp');

const { bytesToKbytes } = require('../utils/file');

const getMetadatas = buffer =>
  sharp(buffer)
    .metadata()
    .catch(() => ({})); // ignore errors

const getDimensions = buffer =>
  getMetadatas(buffer)
    .then(({ width = null, height = null }) => ({ width, height }))
    .catch(() => ({})); // ignore errors

// const THUMBNAIL_RESIZE_OPTIONS = {
//   width: 245,
//   height: 156,
//   fit: 'inside',
// };

// const FILM_HDTV = {
//   width: 1920,
//   height: 1080,
//   fit: 'inside',
// };

// const FILM_THUMB = {
//   width: 300,
//   height: 380,
//   fit: 'inside',
// };

const resize_options = [
  {'F_': [{
    sufiks: '_big_16_9',
    width: 1920,
    height: 1080,
    fit: 'cover'
  },
  {
    sufiks: '_med_16_9',
    width: 1280,
    height: 720,
    fit: 'cover'
  },
  {
    sufiks: '_small_16_9',
    width: 640,
    height: 360,
    fit: 'cover'
  }]},
  {'R_': [{
    sufiks: '_big_sq',
    width: 900,
    height: 900,
    fit: 'cover'
  },
  {
    sufiks: '_med_sq',
    width: 500,
    height: 500,
    fit: 'cover'
  },
  {
    sufiks: '_small_sq',
    width: 300,
    height: 300,
    fit: 'cover'
  },
  {
    sufiks: '_thumb_sq',
    width: 100,
    height: 100,
    fit: 'cover'
  }]},
  {'P_': [{
    sufiks: '_big_p',
    width: 555,
    height: 800,
    fit: 'cover'
  },
  {
    sufiks: '_small_p',
    width: 300,
    height: 207,
    fit: 'cover'
  }]},
  {'NO': [{
    sufiks: '_big',
    width: 1920,
    fit: 'cover'
  },
  {
    sufiks: '_med',
    width: 1280,
    fit: 'cover'
  },
  {
    sufiks: '_small',
    width: 640,
    fit: 'cover'
  }]}
]

async function findOptions(prefix){
  let options = null 
  resize_options.forEach( e => {
    if (Object.keys(e)[0] === prefix) {
      options = Object.values(e)[0]
    }
  })
  return options
}

// const ALL_RESIZE_OPTIONS = [FILM_HDTV, THUMBNAIL_RESIZE_OPTIONS, FILM_THUMB]

const resizeTo = (buffer, options) =>
  sharp(buffer)
    .resize(options)
    .toBuffer()
    .catch(() => null);

// async function resizeToFormat(buffer, options) {
//   if(!options.height){
//     const originalDimensions = await getDimensions(buffer);
//     options.height = originalDimensions.height
//   }
//   return sharp(buffer)
//     .resize(options)
//     .toFormat("jpg")
//     .toBuffer()
//     .catch(() => null);
// }

// const resizeToFormat = (buffer, options) =>
//   sharp(buffer)
//     .resize(options)
//     .toFormat("jpg")
//     .toBuffer()
//     .catch(() => null);

// const generateThumbnail = async file => {
//   if (!(await canBeProccessed(file.buffer))) {
//     return null;
//   }

//   const { width, height } = await getDimensions(file.buffer);

//   if (width > THUMBNAIL_RESIZE_OPTIONS.width || height > THUMBNAIL_RESIZE_OPTIONS.height) {
//     const newBuff = await resizeTo(file.buffer, THUMBNAIL_RESIZE_OPTIONS);

//     if (newBuff) {
//       const { width, height, size } = await getMetadatas(newBuff);

//       return {
//         name: `thumbnail_${file.name}`,
//         hash: `thumbnail_${file.hash}`,
//         ext: file.ext,
//         mime: file.mime,
//         width,
//         height,
//         size: bytesToKbytes(size),
//         buffer: newBuff,
//         path: file.path ? file.path : null,
//       };
//     }
//   }

//   return null;
// };

// async function generateCustomFile(file, resizeOptions) {

//   const { width, height } = await getDimensions(file.buffer)
//   if (width > resizeOptions.width || height > resizeOptions.height) {
//     let sufiks = resizeOptions.sufiks
//     delete resizeOptions.sufiks

//     const newBuff = await resizeTo(file.buffer, resizeOptions);

//     if (newBuff) {
//       const { width, height, size } = await getMetadatas(newBuff);

//       return {
//         name: `${file.name}${sufiks}`,
//         hash: `${file.hash}${sufiks}`,
//         ext: file.ext,
//         mime: file.mime,
//         width,
//         height,
//         size: bytesToKbytes(size),
//         buffer: newBuff,
//         path: file.path ? file.path : null,
//       };
//     }
//   }

//   return null;
// }

// const generateFilmHDTV = async file => {

// const generateCustom = async file => {

//   if (!(await canBeProccessed(file.buffer))) {
//     return null;
//   }

//   const { width, height } = await getDimensions(file.buffer);

//   let files = []
//   console.log(ALL_RESIZE_OPTIONS.length)
//   for (let option of ALL_RESIZE_OPTIONS){
//     if (width > option.width || height > option.height) {
//       const newBuff = await resizeTo(file.buffer, option);

//       if (newBuff) {
//         const { width, height, size } = await getMetadatas(newBuff);

//         let prefix = option.width +'x' + option.height

//         files.push (
//         {
//           name: `${prefix}_${file.name}`,
//           hash: `${prefix}_${file.hash}`,
//           ext: file.ext,
//           mime: file.mime,
//           width,
//           height,
//           size: bytesToKbytes(size),
//           buffer: newBuff,
//           path: file.path ? file.path : null,
//         })
//       }
//     }
//     else {
//       console.log('Image too small to cut')
//         const { width, height, size } = await getMetadatas(file.buffer);

//         let prefix = 'original'

//         files.push (
//         {
//           name: `${prefix}_${file.name}`,
//           hash: `${prefix}_${file.hash}`,
//           ext: file.ext,
//           mime: file.mime,
//           width,
//           height,
//           size: bytesToKbytes(size),
//           buffer: file.buffer,
//           path: file.path ? file.path : null,
//         })
//     }
//   }

//   if(files.length > 0) {
//     return files
//   } 

//   return null;
// };

const optimize = async buffer => {
  const {
    sizeOptimization = false,
    autoOrientation = false,
  } = await strapi.plugins.upload.services.upload.getSettings();

  if (!sizeOptimization || !(await canBeProccessed(buffer))) {
    return { buffer };
  }

  const sharpInstance = autoOrientation ? sharp(buffer).rotate() : sharp(buffer);

  return sharpInstance
    .toBuffer({ resolveWithObject: true })
    .then(({ data, info }) => {
      const output = buffer.length < data.length ? buffer : data;

      return {
        buffer: output,
        info: {
          width: info.width,
          height: info.height,
          size: bytesToKbytes(output.length),
        },
      };
    })
    .catch(() => ({ buffer }));
};

// const DEFAULT_BREAKPOINTS = {
//   large: 1000,
//   medium: 750,
//   small: 500,
//   test: 200,
// };

// const getBreakpoints = () => strapi.config.get('plugins.upload.breakpoints', DEFAULT_BREAKPOINTS);

const generateResponsiveFormats = async file => {
  const {
    responsiveDimensions = false,
  } = await strapi.plugins.upload.services.upload.getSettings();

  if (!responsiveDimensions) return [];

  if (!(await canBeProccessed(file.buffer))) {
    return [];
  }

  const originalDimensions = await getDimensions(file.buffer);

  const filePrefix = file.name.slice(0, 2)

  if(await isBitmapFormat(file.buffer)) {

    if(filePrefix === 'F_') {
      let params = await findOptions(filePrefix)
      // console.log({params})

      return Promise.all(
        Object.keys(params).map(key => {
          // console.log({key})
          // console.log(params[key])
          const breakpoint = params[key]

          if (breakpointSmallerThan(breakpoint, originalDimensions)) {
            return generateBreakpoint(key, { file, breakpoint, originalDimensions});
          }
        }))

    }
    else if(filePrefix === 'P_') {
      let params = await findOptions(filePrefix)

      return Promise.all(
        Object.keys(params).map(key => {
          const breakpoint = params[key]

          if (breakpointSmallerThan(breakpoint, originalDimensions)) {
            return generateBreakpoint(key, { file, breakpoint, originalDimensions});
          }
        }))

    }
    else if(filePrefix === 'R_') {
      let params = await findOptions(filePrefix)

      return Promise.all(
        Object.keys(params).map(key => {
          const breakpoint = params[key]

          if (breakpointSmallerThan(breakpoint, originalDimensions)) {
            return generateBreakpoint(key, { file, breakpoint, originalDimensions});
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
            return generateBreakpoint(key, { file, breakpoint, originalDimensions});
          }
        }))
    }        
  }

  // const breakpoints = getBreakpoints();
  // return Promise.all(
  //   Object.keys(breakpoints).map(key => {
  //     const breakpoint = breakpoints[key];

  //     if (breakpointSmallerThan(breakpoint, originalDimensions)) {
  //       return generateBreakpoint(key, { file, breakpoint, originalDimensions });
  //     }
  //   })
  // );
};

const generateBreakpoint = async (key, { file, breakpoint, originalDimensions}) => {

  // console.log('generateBreakpoint', {key}, {file}, {breakpoint})

  let sufiks = breakpoint.sufiks
  // delete breakpoint.sufiks
  if(!breakpoint.height){
    breakpoint.height = originalDimensions.height
  }

  const newBuff = await resizeTo(file.buffer, {
    width: breakpoint.width,
    height: breakpoint.height,
    fit: breakpoint.fit,
  });

  try {
    const metadata = await sharp(newBuff).metadata();
    // console.log({metadata});
    
  } catch (error) {
    console.log(`An error occurred during processing: ${error}`);
  }

  if (newBuff) {
    const { width, height, size, format} = await getMetadatas(newBuff);
    let extLength = file.ext.length
    let name = file.name.slice(0, - extLength)
    console.log(name)
    return {
      sufiks,
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
      },
    };
  }
};

const breakpointSmallerThan = (breakpoint, { width, height }) => {
  console.log('breakpointSmallerThan', breakpoint, width, height)
  return breakpoint.width < width || breakpoint.height < height;
};

// const formatsToProccess = ['jpeg', 'png', 'webp', 'tiff', 'gif']; 
const bitmapFormats = ['tiff', 'png', 'webp', 'bmp', 'jpg', 'jpeg']
const otherFormats = ['pdf', 'doc', 'svg']

const canBeProccessed = async buffer => {
  const { format } = await getMetadatas(buffer);
  // return format && formatsToProccess.includes(format) ;
  return format && (bitmapFormats.includes(format) || otherFormats.includes(format));
};

const isBitmapFormat = async buffer => {
  const { format } = await getMetadatas(buffer)
  return format && bitmapFormats.includes(format)
}

module.exports = {
  getDimensions,
  generateResponsiveFormats,
  bitmapFormats,
  // generateThumbnail,
  bytesToKbytes,
  optimize,
  // generateCustom,
};
