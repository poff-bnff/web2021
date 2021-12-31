'use strict';

/**
 * publisher.js service
 *
 * @description: A set of functions similar to controller's actions to avoid code duplication.
 */

 const fs = require('fs')
 const yaml = require('js-yaml')
 const path = require('path')
 const ssgDir = path.join(__dirname, '..', '..', '..', '..', '..', 'ssg')

const thereIsSomeWhereToLinkTo = [
  'programme',
  'pof-fi-article',
  'just-filmi-article',
  'shortsi-article',
  'kinoffi-article',
  'hof-fi-article',
  'tartuffi-article',
  'kumu-article',
  'bruno-article',
  'filmikooli-article',
  'team',
  'film',
  'cassette',
  'screening',
  'event',
  'course',
  'industry-article',
  'industry-category',
  'industry-project',
  'industry-supporter',
  'industry-event',
  'industry-person',
  'dis-camp-article',
  'dis-camp-category',
  'dis-camp-project',
  'dis-camp-supporter',
  'dis-camp-event',
  'dis-camp-person',
  'supporters-page',
  'supporters-just',
  'supporters-short',
  'kinoffi-supporter',
  'hof-fi-supporter',
  'tartuffi-supporter',
  'kumu-supporter',
  'bruno-supporter',
  'filmikool-supporter',
  'product',
  'product-category',
  'festival-pass',
  'shop',
]

const pathBeforeSlug = {
  'programme': '/',
  'team': '/',
  'cassette': 'film/',
  'screening': 'film/',
  'film': 'film/',
  'festival-pass': '/',
  'industry-person': '/',
  'industry-event': 'events/',
  'industry-supporter': 'supporters/',
  'dis-camp-person': '/',
  'dis-camp-event': 'events/',
  'dis-camp-supporter': 'supporters/',
  'product': 'shop/',
  'supporters-page': 'toetajad/',
  'supporters-just': 'toetajad/',
  'supporters-short': 'toetajad/',
  'kinoffi-supporter': 'toetajad/',
  'hof-fi-supporter': 'toetajad/',
  'tartuffi-supporter': 'toetajad/',
  'kumu-supporter': 'toetajad/',
  'bruno-supporter': 'toetajad/',
  'filmikool-supporter': 'toetajad/',
  'course': 'courses/',
  'event': 'courses/',
  'shop': 'shop/',
  'product-category': '/',
}

const addS = async (result) => {
  const domainSpecificsPath = path.join(ssgDir, 'domain_specifics.yaml')
  const domainSpecifics = yaml.load(fs.readFileSync(domainSpecificsPath, 'utf8'))
  const stagingUrls = domainSpecifics.stagingURLs
  const stagingDomains = domainSpecifics.stagingDomains
  const domainLocales = domainSpecifics.locales

  const sanitizedResponse = await Promise.all(result.map(async a => {

    let paths = []
    if (a.action !== 'delete' || a.action !== 'archive') {
      console.log('WHY HERE', a.action);
      try {
        paths = await fetchChangedSlug(a.build_args, domainLocales[a.site])
      } catch (error) {
        console.log('Error in fetchChangedSlug: ', error);
      }
    }
    const sanitizedResult = {
      id: a.id,
      build_args: a.build_args,
      build_errors: a.build_errors,
      site: stagingUrls[a.site],
      stagingDomain: stagingDomains[a.site],
      paths: paths,
      action: a.action
    }
    return sanitizedResult
  }))
  return sanitizedResponse
}

const fetchChangedSlug = async (args, domainLanguages) => {
  if (!args) { return null }
  const [collectionType, id] = args.split(' ')
  let result = await strapi.query(collectionType).findOne({ id: id });

  let slug = null
  let lang = null
  let objContainingSlug

  if (collectionType === 'screening' && result.cassette) {
    objContainingSlug = result.cassette
  } else {
    objContainingSlug = result
  }

  for (let i = 0; i < domainLanguages.length; i++) {
    const element = domainLanguages[i];
    if (objContainingSlug[`slug_${element}`]) {
      slug = objContainingSlug[`slug_${element}`]
      lang = element
      break
    }
  }

  const articleTypeSlugs = []
  const paths = []

  if (thereIsSomeWhereToLinkTo.includes(collectionType)) {

    
    if (result.article_types && result.article_types.length === 0){
      return {articleTypeMissing: true}
    }
    
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

    return [`${pathBeforeSlug[collectionType] ? pathBeforeSlug[collectionType] : ''}${slug ? slug : ''}`]
  } else {
    return [``]
  }
}

module.exports = {
  addS
};
