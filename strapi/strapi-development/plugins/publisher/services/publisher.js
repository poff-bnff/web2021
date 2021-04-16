'use strict';

/**
 * publisher.js service
 *
 * @description: A set of functions similar to controller's actions to avoid code duplication.
 */

const lambda = [
    'trio-bruno',
    'trio-filmikool',
    'trio-hoff',
    'trio-industry',
    'trio-just-film',
    'trio-kinoff',
    'trio-kumu',
    'trio-shorts',
    'trio-tartuff',
    'trio-p-oe-ff',
    'article-hero',
    'hero-article-bruno',
    'hero-article-filmikool',
    'hero-article-hoff',
    'hero-article-industry',
    'hero-article-just-film',
    'hero-article-kinoff',
    'hero-article-kumu',
    'hero-article-shorts',
    'hero-article-tartuff']

const addS = async (result) => {

    const sanitizedResponse = await Promise.all(result.map(async a => {
        const sanitizedResult = {
            id: a.id,
            build_args: a.build_args,
            build_errors: a.build_errors,
            site: `build.${a.site}`,
            paths: await fetchChangedSlug(a.build_args)
        }

        return sanitizedResult
    }))


    
    return sanitizedResponse
}

const fetchChangedSlug = async args => {
    if (!args) return null
    const [collectionType, id] = args.split(' ')
    let result = await strapi.query(collectionType).findOne({ id: id });
    const slug = result.slug_et || result.slug_en || result.slug_ru
    const lang = result.slug_et ? 'et' : result.slug_en ? 'en' : result.slug_ru ? 'ru' : null
    const articleTypeSlugs = []
    const paths = []

    if (result.article_types) {
        for (const articleType of result.article_types) {
            for (const key in articleType) {
                if (key === `slug_${lang}`) {
                    articleTypeSlugs.push(articleType[key])
                }
            }
        }
        for (const articleTypeSlug of articleTypeSlugs) {
            paths.push(`${articleTypeSlug}/${slug}`)
        }
        return paths
    }
    return [slug]
}

module.exports = {
    addS
};
