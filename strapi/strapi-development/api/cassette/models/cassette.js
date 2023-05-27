'use strict';
/**
 * Read the documentation (https://strapi.io/documentation/v3.x/concepts/models.html#lifecycle-hooks)
 * to customize this model
 */

const path = require('path')
const helpersPath = path.join(__dirname, '..', '..', '..', 'helpers')
const ssgHeplersPath = path.join(__dirname, '..', '..', '..', '..', '..', 'ssg', 'helpers')
const { timer } = require(path.join(ssgHeplersPath, 'timer.js'))

const LC_MANAGER = path.join(helpersPath, 'lifecycle_manager.js')
const {
    slugify,
    call_build,
    getFeDomainNames,
    exportSingle4SSG,
    call_delete
} = require(LC_MANAGER)

const model_name = (__dirname.split(path.sep).slice(-2)[0])

module.exports = {
    lifecycles: {

        async beforeCreate(new_data) {
            timer.start('create new cassette')
            strapi.log.debug('beforeCreate cassette')
            new_data.slug_et = new_data.title_et ? slugify(new_data.title_et) : null
            new_data.slug_ru = new_data.title_ru ? slugify(new_data.title_ru) : null
            new_data.slug_en = new_data.title_en ? slugify(new_data.title_en) : null
        },

        // result is the created object
        // data is the data that was sent to the create
        async afterCreate(result, data) {
            strapi.log.debug('afterCreate cassette', result.id, result.title_en)

            const festival_editions = []
            if (result.festival_editions && result.festival_editions.length > 0) {
                festival_editions.push(... await strapi.db.query('festival-edition').find(
                    { id: result.festival_editions.map(fe => fe.id) }))
            }
            const cassetteDomains = getFeDomainNames(festival_editions)
            strapi.log.debug('cassettes afterCreate got domains', cassetteDomains, 'for cassette', result.id)
            if (cassetteDomains.length > 0) {
                await exportSingle4SSG('cassette', result.id)
                strapi.log.debug('Lets build: ')
                await call_build(result, cassetteDomains, model_name)
            }
            let timing = timer.check('create new cassette', 'Create new cassette')
            strapi.log.debug(`creating of cassette ${result.id} took ${timing.total} ms`)
        },

        // params is the original object
        // data is the data that was sent to the update
        async beforeUpdate(params, data) {
            timer.start(`update cassette ${params.id}`)
            // strapi.log.debug('beforeUpdate cassette', params.id, {data})
            if (data.title_et) { data.slug_et = slugify(data.title_et) }
            if (data.title_ru) { data.slug_ru = slugify(data.title_ru) }
            if (data.title_en) { data.slug_en = slugify(data.title_en) }
        },

        // result is the updated object
        // params is the original object
        // data is the data that was sent to the update
        async afterUpdate(result, params, data) {
            strapi.log.debug('afterUpdate cassette', result.id, result.title_en)
            const festival_editions = []
            if (result.festival_editions && result.festival_editions.length > 0) {
                festival_editions.push(... await strapi.db.query('festival-edition').find(
                    { id: result.festival_editions.map(fe => fe.id) }))
            }
            const cassetteDomains = getFeDomainNames(festival_editions)
            strapi.log.debug('cassettes afterUpdate got domains', cassetteDomains, 'for cassette', result.id)
            if (cassetteDomains.length > 0) {
                await exportSingle4SSG('cassette', result.id)
                strapi.log.debug('cassettes afterUpdate Lets build: ')
                await call_build(result, cassetteDomains, model_name)
            }
            let timing = timer.check(`update cassette ${params.id}`, 'Update cassette')
            strapi.log.debug(`updating of cassette ${params.id} took ${timing.total} ms`)
            // TODO: if no domains, then there is still possibility, that this cassette was
            // associated with domain before and now it is not. So we need to delete it from
            // that domain.
            // We could check for changes in festival_editions before and after update.
        },

        // params is the original object
        async beforeDelete(params) {
            timer.start(`delete cassette ${params.id}`)
            const cassetteIds = (params._where?.[0].id_in || [params.id]).map(a => parseInt(a))
            strapi.log.debug('beforeDelete cassette Ids', cassetteIds)

            // TODO: find out, what or who is params.user?
            delete params.user
        },

        // result is the deleted object as it was before it was deleted
        // params is like { id: 1 }
        async afterDelete(result, params) {
            strapi.log.debug("afterDelete cassette") // , { result, params })
            // One might delete a cassette by id or by id_in
            // Be aware that id_in is an array of strings, not numbers!
            const cassetteIds = (params._where?.[0].id_in || [params.id]).map(a => parseInt(a))

            cassetteIds.forEach(async cassetteId => {
                await exportSingle4SSG(model_name, cassetteId)
            })
            let timing = timer.check(`delete cassette ${params.id}`, 'Delete cassette')
            strapi.log.debug(`deleting of cassette ${params.id} took ${timing.total} ms`)
        }
    }
};
