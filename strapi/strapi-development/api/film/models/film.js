'use strict';
/**
 * Read the documentation (https://strapi.io/documentation/v3.x/concepts/models.html#lifecycle-hooks)
 * to customize this model
 */

const path = require('path')
let helper_path = path.join(__dirname, '..', '..', '..', '/helpers/lifecycle_manager.js')

const {
  slugify,
  call_update,
  call_build,
  get_domain,
  modify_stapi_data,
  call_delete
} = require(helper_path)

const getCassettesIncludingOnlyThisSingleFilm = async (filmId) => {
  const getAllCassettes = await strapi.query('cassette').find({ _limit: -1 });
  const allCassettesWithThisFilm = getAllCassettes.filter(c => {
    if (c.orderedFilms && c.orderedFilms.length === 1 && c.orderedFilms[0].film && c.orderedFilms[0].film.id === filmId) {
      return true
    } else {
      return false
    }
  })
  return allCassettesWithThisFilm
}

/**
const domains =
For adding domain you have multiple choice. First for objects that has property 'domain'
or has property, that has 'domain' (at the moment festival_edition and programmes) use
function get_domain(result). If you know that that object has doimain, but no property
to indicate that. Just write the list of domains (as list), example tartuffi_menu.
And last if full build, with no domain is needed. Write FULL_BUILD (as list)
*/

const model_name = (__dirname.split(path.sep).slice(-2)[0])
// const domains = ['hoff.ee'] // hard coded if needed AS LIST!!!
// const domains = ['FULL_BUILD'] // hard coded if needed AS LIST!!!

module.exports = {
  lifecycles: {

    async beforeCreate(params, data) {
      // Remove published_at from data, so that it is not set automatically to the current time
      // This might be a workaround for a bug in Strapi 3.6.8, where published_at is set to the current time?
      // if (data && data.published_at) {
      //   delete data.published_at
      // }
    },

    async afterCreate(result, data) {
      // Automatically create a cassette for a new film
      await strapi.query('cassette').create({
        skipbuild: true,
        created_by: result.created_by,
        updated_by: result.updated_by,
        title_et: result.title_et,
        title_en: result.title_en,
        title_ru: result.title_ru,
        // synopsis: result.synopsis,
        // media: result.media,
        festival_editions: result.festival_editions,
        tags: result.tags ? {
          premiere_types: result?.tags?.premiere_types ? result.tags.premiere_types.map(a => a.id) : null,
          genres: result?.tags?.genres ? result.tags.genres.map(a => a.id) : null,
          keywords: result?.tags?.keywords ? result.tags.keywords.map(a => a.id) : null,
          programmes: result?.tags?.programmes ? result.tags.programmes.map(a => a.id) : null
        } : null,
        // presenters: result.presentedBy ? result.presentedBy.organisations : [],
        orderedFilms: [{ order: 1, film: result.id }],
        // remoteId: result.remoteId,
      })
      // await call_update(result, model_name)
    },

    async beforeUpdate(params, data) {
      // Add prefix to slug

      // film with id 2213 will have slug 0_title_et
      // const prefixes = {
      //   2213: '0_'
      // }
      // let prefix = ''
      // if (data.id in prefixes) {
      //   prefix = prefixes[data.id]
      // }
      const prefix = data.id === 2213 ? '0_' : ''

      // console.log('params', params, 'data', data);
      data.slug_et = data.title_et ? slugify(prefix + data.title_et) : null
      data.slug_ru = data.title_ru ? slugify(prefix + data.title_ru) : null
      data.slug_en = data.title_en ? slugify(prefix + data.title_en) : null

      if (data.published_at === null) { // if strapi publish system goes live
        strapi.log.debug('Draft! Delete: ')
        const festival_editions = await strapi.db.query('festival-edition').find({ id: data.festival_editions })
        const domains = [...new Set(festival_editions.map(fe => fe.domains.map(d => d.url)).flat())]
        strapi.log.debug('films beforeUpdate got domains', domains)
        await call_delete(params, domains, model_name)
      }
    },

    async afterUpdate(result, params, data) {
      strapi.log.debug('afterUpdate film', result.id, result.title_en)
      const allCassettesWithThisFilmOnly = await getCassettesIncludingOnlyThisSingleFilm(result.id)
      strapi.log.debug('afterUpdate film allCassettesWithThisFilmOnly', allCassettesWithThisFilmOnly.map(a => a.id))

      allCassettesWithThisFilmOnly.map(async a => {
        if (data.skipbuild) return
        strapi.log.debug('Updating with film data - cassette ID ', a.id, a.title_en);
        const cassetteId = a.id

        const updateCassetteResult = await strapi.query('cassette').update(
          { id: cassetteId }, {
          created_by: result.created_by,
          updated_by: result.updated_by,
          title_et: result.title_et,
          title_en: result.title_en,
          title_ru: result.title_ru,
          tags: result.tags ? {
            premiere_types: result?.tags?.premiere_types ? result.tags.premiere_types.map(a => a.id) : null,
            genres: result?.tags?.genres ? result.tags.genres.map(a => a.id) : null,
            keywords: result?.tags?.keywords ? result.tags.keywords.map(a => a.id) : null,
            programmes: result?.tags?.programmes ? result.tags.programmes.map(a => a.id) : null
          } : null,
          festival_editions: result.festival_editions,
        })

        const cassetteDomains = await get_domain(updateCassetteResult) // hard coded if needed AS LIST!!!
        strapi.log.debug('... for domains', cassetteDomains.join(', '));

        if (cassetteDomains.length > 0) {
          await modify_stapi_data(updateCassetteResult, 'cassette')
        }

      })

      const festival_editions = await strapi.db.query('festival-edition').find({ id: data.festival_editions })
      const domains = [...new Set(festival_editions.map(fe => fe.domains.map(d => d.url)).flat())]
      strapi.log.debug('films afterUpdate got domains', domains)
        if (domains.length > 0) {
        await modify_stapi_data(result, model_name)
      }

    },
    async beforeDelete(params) {
      const ids = params._where?.[0].id_in || [params.id]
      const updatedIds = await Promise.all(ids.map(async id => {
        const result = await strapi.query(model_name).findOne({ id })
        if (result) {
          const updateDeleteUser = {
            updated_by: params.user,
            skipbuild: true
          }
          await strapi.query(model_name).update({ id: result.id }, updateDeleteUser)

          const allCassettesWithThisFilm = await getCassettesIncludingOnlyThisSingleFilm(result.id)
          allCassettesWithThisFilm.map(async c => {
            console.log('Deleting cassette: ', c.id, c.title_en);
            await strapi.query('cassette').delete({ id: c.id })
          })

          return id
        }
      }))
      delete params.user
    },
    async afterDelete(result, params) {
      // console.log('\nR', result, '\nparams', params)
      const domains = await get_domain(result) // hard coded if needed AS LIST!!!

      console.log('Delete: ')
      await call_delete(result, domains, model_name)
    }
  }
};
