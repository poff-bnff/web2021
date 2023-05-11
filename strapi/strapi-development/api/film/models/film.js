'use strict';
/**
 * Read the documentation (https://strapi.io/documentation/v3.x/concepts/models.html#lifecycle-hooks)
 * to customize this model
 */

const path = require('path')
let helper_path = path.join(__dirname, '..', '..', '..', '/helpers/lifecycle_manager.js')

const {
  slugify,
  call_build,
  get_domain,
  modify_stapi_data,
  call_delete
} = require(helper_path)

const getCassettesIncludingOnlyThisSingleFilm = async (filmId) => {
  strapi.debug.log('getCassettesIncludingOnlyThisSingleFilm', filmId)
  const getAllCassettes = await strapi.query('cassette').find({ _limit: -1 })
  strapi.debug.log('got Cassettes', getAllCassettes.length)
  const allCassettesWithThisFilm = getAllCassettes.filter(c => {
    if (c.orderedFilms && c.orderedFilms.length === 1 && c.orderedFilms[0].film && c.orderedFilms[0].film.id === filmId) {
      return true
    } else {
      return false
    }
  })
  strapi.debug.log('allCassettesWithThisFilm', allCassettesWithThisFilm.length)
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

    async beforeCreate(new_data) {
      strapi.log.debug('beforeCreate film') // , new_data.title_en)
      new_data.slug_et = new_data.title_et ? slugify(new_data.title_et) : null
      new_data.slug_ru = new_data.title_ru ? slugify(new_data.title_ru) : null
      new_data.slug_en = new_data.title_en ? slugify(new_data.title_en) : null
    // Remove published_at from data, so that it is not set automatically to the current time
      // This might be a workaround for a bug in Strapi 3.6.8, where published_at is set to the current time?
      // if (data && data.published_at) {
      //   delete data.published_at
      // }
    },

    // new_data is the data that was sent to the create
    // result is the created object
    async afterCreate(result, new_data) {
      // Automatically create a cassette for a new film
      strapi.log.debug('afterCreate film before cassette', result.id, result.title_en)
      const new_cassette = await strapi.query('cassette').create({
        created_by: result.created_by,
        updated_by: result.updated_by,
        title_et: result.title_et,
        title_en: result.title_en,
        title_ru: result.title_ru,
        // synopsis: result.synopsis,
        // media: result.media,
        festival_editions: result.festival_editions ? result.festival_editions.map(a => a.id) : null,
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
      strapi.log.debug('afterCreate film after cassette', result.id, result.title_en
                 , 'published_at:', result.published_at)

      const festivalEditionIDs = result.festival_editions ? result.festival_editions.map(a => a.id) : []
      // strapi.log.debug('festivalEditionIDs', { festivalEditionIDs })
      const festivalEditions = await strapi.query('festival-edition').find({ id_in: festivalEditionIDs })
      // strapi.log.debug('festivalEditions', { festivalEditions })
      const festivalEditionDomainURLs = festivalEditions.map(a => a.domains.map(b => b.url)).flat(1)
      // strapi.log.debug('festivalEditionDomainURLs', { festivalEditionDomainURLs })
      const uniqueFestivalEditionDomainURLs = [...new Set(festivalEditionDomainURLs)]
      strapi.log.debug('uniqueFestivalEditionDomainURLs', { uniqueFestivalEditionDomainURLs })

      if (uniqueFestivalEditionDomainURLs.length > 0) {
        await modify_stapi_data(new_cassette, 'cassette')
        await modify_stapi_data(result, 'film')
        await call_build(new_cassette, uniqueFestivalEditionDomainURLs, 'cassette')
      }

    },

    // params: { "id": 4686 }
    // new_data: data that was sent to the update
    async beforeUpdate(params, new_data) {
      strapi.log.debug('beforeUpdate film')

      new_data.slug_et = new_data.title_et ? slugify(new_data.title_et) : null
      new_data.slug_ru = new_data.title_ru ? slugify(new_data.title_ru) : null
      new_data.slug_en = new_data.title_en ? slugify(new_data.title_en) : null

      if (new_data.published_at === null) { // if strapi publish system goes live
        strapi.log.debug('Draft! Delete: ')
        const festival_editions = await strapi.db.query('festival-edition').find({ id: new_data.festival_editions })
        const domains = [...new Set(festival_editions.map(fe => fe.domains.map(d => d.url)).flat())]
        strapi.log.debug('films beforeUpdate got domains', domains)
        await call_delete(params, domains, model_name)
      }
    },

    // result is the updated object
    // params: { "id": 4686 }

    async afterUpdate(result, params, data) {
      strapi.log.debug('afterUpdate film') //, { result, params, data })
      const allCassettesWithThisFilmOnly = await getCassettesIncludingOnlyThisSingleFilm(result.id)
      strapi.log.debug('afterUpdate film allCassettesWithThisFilmOnly', allCassettesWithThisFilmOnly.map(a => a.id))

      allCassettesWithThisFilmOnly.map(async cassette => {
        if (data.skipbuild) return
        strapi.log.debug('Updating with film data - cassette ID ', cassette.id, cassette.title_en);
        const cassetteId = cassette.id

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
          festival_editions: result.festival_editions.map(a => a.id),
        })

        const cassetteDomains = await get_domain(updateCassetteResult) // hard coded if needed AS LIST!!!
        strapi.log.debug('... for domains', cassetteDomains.join(', '));

        if (cassetteDomains.length > 0) {
          await modify_stapi_data(updateCassetteResult, 'cassette')
        }

      })

      const festival_editions = await strapi.db.query('festival-edition').find(
        { id: data.festival_editions.map(fe => fe.id) })
      const domains = [...new Set(festival_editions.map(fe => fe.domains.map(d => d.url)).flat())]
      strapi.log.debug('films afterUpdate got domains', domains)
      if (domains.length > 0) {
        await modify_stapi_data(result, model_name)
      }
    },

    async beforeDelete(params) {
      // One might delete a film by id or by id_in
      strapi.log.debug('beforeDelete film', params._where?.[0].id_in, JSON.stringify(params))
      const filmIds = params._where?.[0].id_in || [params.id]
      strapi.log.debug('beforeDelete film filmIds', filmIds)
      filmIds.map(async fId => {
        const allCassettesWithThisFilm = await getCassettesIncludingOnlyThisSingleFilm(fId)
        allCassettesWithThisFilm.map(async c => {
          strapi.log.debug('Deleting cassette: ', c.id, c.title_en)
          await strapi.query('cassette').delete({ id: c.id })
        })
      })
    },

    async afterDelete(result, params) {
      strapi.log.debug("afterDelete film", { result, params })
      // const domains = await get_domain(result) // hard coded if needed AS LIST!!!
      // strapi.log.debug('Delete: ')
      // await call_delete(result, domains, model_name)
    }
  }
}
