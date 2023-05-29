'use strict';
/**
 * Read the documentation (https://strapi.io/documentation/v3.x/concepts/models.html#lifecycle-hooks)
 * to customize this model
 */

const path = require('path')
const helpersPath = path.join(__dirname, '..', '..', '..', 'helpers')
const ssgHeplersPath = path.join(__dirname, '..', '..', '..', '..', '..', 'ssg', 'helpers')
const { timer } = require(path.join(ssgHeplersPath, 'timer.js'))

const LCManager = path.join(helpersPath, 'lifecycle_manager.js')
const {
    slugify,
    getFeDomainNames,
    exportSingle4SSG
} = require(LCManager)

// returns a list of single-film cassettes that include only this single film
const getCassettesIncludingOnlyThisSingleFilm = async (filmId) => {
    if (typeof filmId !== 'number') {
        throw new Error('getCassettesIncludingOnlyThisSingleFilm: filmId is not a number')
    }
    strapi.log.debug('getCassettesIncludingOnlyThisSingleFilm', filmId)
    const allCassettes = await strapi.query('cassette').find({ _limit: -1 })
    const singleFilmCassettes = allCassettes.filter(c => c.orderedFilms && c.orderedFilms.length === 1)
    const relevantCassettes = singleFilmCassettes.filter(c => c.orderedFilms[0].film && c.orderedFilms[0].film.id === filmId)
    return relevantCassettes
}

const model_name = (__dirname.split(path.sep).slice(-2)[0])

module.exports = {
    lifecycles: {

        async beforeCreate(new_data) {
            timer.start('Film lifecycle')
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
                is_published: result.is_published,
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

            if (getFeDomainNames(festivalEditions).length > 0) {
                await exportSingle4SSG('film', result.id)
                strapi.log.debug('afterCreate film after exportSingle4SSG film', result.id, 'before exportSingle4SSG cassette', new_cassette.id)
                await exportSingle4SSG('cassette', new_cassette.id)
            }

            let timing = timer.check('Film lifecycle', 'Create new film')
            strapi.log.debug(`Creating of film ${result.id} took ${timing.total} ms`)
        },

        // params: { "id": 4686 }
        // newData: data that was sent to the update
        async beforeUpdate(params, newData) {
            timer.start('Film lifecycle')
            // load current film data
            const oldData = await strapi.query('film').findOne(params)
            if (newData.title_et) { newData.slug_et = slugify(newData.title_et) }
            if (newData.title_ru) { newData.slug_ru = slugify(newData.title_ru) }
            if (newData.title_en) { newData.slug_en = slugify(newData.title_en) }

            // if:
            // - film had no stills before update
            // - film has stills now
            // - film is not published
            // then publish film
            if (!oldData || !oldData.stills || oldData.stills.length === 0) {
                if (newData && newData.stills && newData.stills.length > 0) {
                    if (newData.hasOwnProperty('is_published') && newData.is_published === false) {
                        newData.is_published = true
                        strapi.log.debug('beforeUpdate film publish', { params })
                    }
                }
            }
        },

        // result is the updated object
        // params: { "id": 4686 }
        // modifications: data that were sent to the update
        async afterUpdate(result, params, modifications) {
            strapi.log.debug('afterUpdate film') // , {result: resultData, params, newData: modifications})
            // Check if any of single-film cassettes need to be updated
            const allCassettesWithThisFilmOnly = await getCassettesIncludingOnlyThisSingleFilm(result.id)
            strapi.log.debug('afterUpdate film allCassettesWithThisFilmOnly', allCassettesWithThisFilmOnly.map(a => a.id))
            // strapi.log.debug('afterUpdate film finished', params.id)
            // return

            allCassettesWithThisFilmOnly.map(async cassette => {
                // if (data.skipbuild) return
                strapi.log.debug('Updating with film data - cassette ID ', cassette.id, cassette.title_en);
                const cassetteId = cassette.id

                cassette = await strapi.query('cassette').update(
                    { id: cassetteId }, {
                    is_published: result.is_published,
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

                const cassetteFEs = []
                if (cassette.festival_editions && cassette.festival_editions.length > 0) {
                  cassetteFEs.push(... await strapi.db.query('festival-edition').find(
                  { id: cassette.festival_editions.map(fe => fe.id) }))
                }

                const cassetteDomains = getFeDomainNames(cassetteFEs)
                strapi.log.debug('films afterUpdate got domains', cassetteDomains, 'for cassette', cassetteId)

                if (cassetteDomains.length > 0) {
                    await exportSingle4SSG('cassette', cassetteId)
                }
            })

            const filmFEs = []
            if (result.festival_editions && result.festival_editions.length > 0) {
                filmFEs.push(... await strapi.db.query('festival-edition').find(
              { id: result.festival_editions.map(fe => fe.id) }))
            }

            const domains = getFeDomainNames(filmFEs)
            strapi.log.debug('films afterUpdate got domains', domains)
            if (domains.length > 0) {
                await exportSingle4SSG('film', params.id)
            }
            let timing = timer.check('Film lifecycle', 'Update film')
            strapi.log.debug(`Updating of film ${params.id} took ${timing.total} ms`)
        },

        async beforeDelete(params) {
            // One might delete a film by id or by id_in
            // Be aware that id_in is an array of strings, not numbers!
            const filmIds = (params._where?.[0].id_in || [params.id]).map(a => parseInt(a))
            // start a timer for each film
            timer.start('Film lifecycle')
            strapi.log.debug('beforeDelete film', { filmIds })

            // TODO: find out, what or who is params.user?
            delete params.user

            const allCassettes = await strapi.query('cassette').find({ _limit: -1 })
            const relevantCassettes = allCassettes
                // reduce data in cassettes to only what we need
                // orderedFilms is an array of objects, we only need the order and film id
                .map(c => ({
                    id: c.id,
                    title_en: c.title_en,
                    orderedFilms: c.orderedFilms.map(of => ({ order: of.order, film: { id: of.film.id } })),
                    filmIds: c.orderedFilms.map(of => of.film.id)
                }))
                // leave cassettes that have any of the film(s) we are deleting
                .filter(c => c.filmIds.some(id => filmIds.includes(id)))
            strapi.log.debug('beforeDelete film', { relevantCassettes })

            // deal with cassettes that have only one film
            const singleFilmCassettes = relevantCassettes.filter(c => c.orderedFilms && c.orderedFilms.length === 1)
            await singleFilmCassettes.map(async c => {
                // TODO: These logs are here to help with debugging.
                //       Somehow the delete operation is not finished before the next one starts.
                strapi.log.debug('Deleting cassette: ', c.id, c.title_en)
                await strapi.query('cassette').delete({ id: c.id })
                strapi.log.debug('Deleted cassette: ', c.id, c.title_en)
            })

            // deal with cassettes that have multiple films
            const multipleFilmCassettes = relevantCassettes.filter(c => c.orderedFilms && c.orderedFilms.length > 1)
            multipleFilmCassettes.map(async c => {
                strapi.log.debug('Removing film(s)', filmIds, 'from cassette: ', c.id, c.title_en)
                await strapi.query('cassette').update(
                    { id: c.id }, {
                    orderedFilms: c.orderedFilms.filter(of => !filmIds.includes(of.film.id))
                })
                strapi.log.debug('Removed film(s) from cassette: ', c.id, c.title_en)
            })

        },

        async afterDelete(result, params) {
            strapi.log.debug("afterDelete film", { id: result.id, params })
            // One might delete a film by id or by id_in
            // Be aware that id_in is an array of strings, not numbers!
            const filmIds = (params._where?.[0].id_in || [params.id]).map(a => parseInt(a))
            strapi.log.debug('beforeDelete film', { filmIds })

            filmIds.map(async fId => {
                await exportSingle4SSG(model_name, fId)
                let timing = timer.check('Film lifecycle', 'Remove film')
                strapi.log.debug(`Removal of film ${fId} took ${timing.total} ms`)
            })
        }
    }
}


