'use strict';

/**
 * publisher.js service
 *
 * @description: A set of functions similar to controller's actions to avoid code duplication.
 */

const thereIsSomeWhereToLinkTo = ['programmes',
  'pof-fi-articles',
  'just-filmi-articles',
  'shortsi-articles',
  'kinoffi-articles',
  'hof-fi-articles',
  'tartuffi-articles',
  'kumu-articles',
  'bruno-articles',
  'filmikooli-articles',
  'teams',
  'films',
  'cassettes',
  'screenings',
  'events',
  'courses',
  'industry-people',
  'industry-articles',
  'industry-categories',
  'industry-projects',
  'industry-events',
  'supporters-pages',
  'supporters-justs',
  'supporters-shorts',
  'industry-supporters',
  'kinoffi-supporters',
  'hof-fi-supporters',
  'tartuffi-supporters',
  'kumu-supporters',
  'bruno-supporters',
  'filmikool-supporters',
  'products',
  'product-categories',
  'festival-passes',
  'shops']

const addS = async (result) => {

  const fs = require('fs')
  const yaml = require('js-yaml')
  const path = require('path')
  const ssgDir = path.join(__dirname, '..', '..', '..', '..', '..', 'ssg')
  const domainSpecificsPath = path.join(ssgDir, 'domain_specifics.yaml')
  const domainSpecifics = yaml.load(fs.readFileSync(domainSpecificsPath, 'utf8'))
  const stagingUrls = domainSpecifics.stagingURLs
  const stagingDomains = domainSpecifics.stagingDomains


  const sanitizedResponse = await Promise.all(result.map(async a => {
    const sanitizedResult = {
      id: a.id,
      build_args: a.build_args,
      build_errors: a.build_errors,
      site: stagingUrls[a.site],
      stagingDomain: stagingDomains[a.site],
      paths: await fetchChangedSlug(a.build_args)
    }

    return sanitizedResult
  }))



  return sanitizedResponse
}

const fetchChangedSlug = async args => {
  if (!args) { return null }
  const [collectionType, id] = args.split(' ')
  let result = await strapi.query(collectionType).findOne({ id: id });
  const slug = result.slug_et || result.slug_en || result.slug_ru
  const lang = result.slug_et ? 'et' : result.slug_en ? 'en' : result.slug_ru ? 'ru' : null
  const articleTypeSlugs = []
  const paths = []

  if (thereIsSomeWhereToLinkTo.includes(collectionType)) {

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

    return [`${collectionType}/${slug}`]
  } else {
    return [``]
  }
}

module.exports = {
  addS
};
