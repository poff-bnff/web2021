const fs = require('fs')
const yaml = require('js-yaml')
const path = require('path')
const rueten = require('./rueten.js')
const { fetchModel } = require('./b_fetch.js')
const replaceLinks = require('./replace_links.js')
const prioritizeImages = require(path.join(__dirname, 'image_prioritizer.js'))

const { timer } = require("./timer")
timer.start(__filename)

const rootDir = path.join(__dirname, '..')
const domainSpecificsPath = path.join(rootDir, 'domain_specifics.yaml')

const DOMAIN_SPECIFICS = yaml.load(fs.readFileSync(domainSpecificsPath, 'utf8'))

const imageOrder = DOMAIN_SPECIFICS.articleListViewImagePriority
const imageOrderDefaults = DOMAIN_SPECIFICS.articleListViewImagePriorityDefaults
const imageOrderViiekas = DOMAIN_SPECIFICS.articleViiekasImagePriority
const imageOrderViiekasDefaults = DOMAIN_SPECIFICS.articleViiekasImagePriorityDefaults

const sourceDir = path.join(rootDir, 'source')
const fetchDir = path.join(sourceDir, '_fetchdir')
const strapiDataDirPath = path.join(sourceDir, '_domainStrapidata')

const params = process.argv.slice(2)
const build_type = params[0]
const only_build_home = params[1] === 'HOME' ? true : false

const DOMAIN = process.env['DOMAIN'] || 'kumu.poff.ee'

const addConfigPathAliases = require(path.join(__dirname, 'add_config_path_aliases.js'))
if (build_type === 'target') {
    if (only_build_home) {
        addConfigPathAliases(['/home'])
    } else {
        addConfigPathAliases(['/articles', '/a_lists', '/trainings', '/about', '/interview', '/news', '/sponsorstories', '/home', '/menu'])
    }
}

const mapping = DOMAIN_SPECIFICS.article
const modelName = mapping[DOMAIN]
const strapiDataArticlesPath = path.join(strapiDataDirPath, `${modelName}.yaml`)
// const STRAPIDATA_ARTICLES = yaml.load(fs.readFileSync(strapiDataArticlesPath, 'utf8'))

const minimodel = {
    'article_types': {
        model_name: 'ArticleType'
    },
    'tag_premiere_types': {
        model_name: 'TagPremiereType'
    },
    'programmes': {
        model_name: 'Programme',
        expand: {
            'festival_editions': {
                model_name: 'FestivalEdition',
                expand: {
                    'festival': {
                        model_name: 'Festival'
                    }
                },
            },
            'presenters': {
                model_name: 'Organisation'
            },
            'domains': {
                model_name: 'Domain'
            },
            'presentedBy': {
                model_name: 'PresentedBy',
                expand: {
                    'organisations': {
                        model_name: 'Organisation'
                    }
                }
            }
        },
    },
    'tag_genres': {
        model_name: 'TagGenre'
    },
    'tag_keywords': {
        model_name: 'TagKeyword'
    },
    'web_authors': {
        model_name: 'WebAuthor'
    },
    'organisations': {
        model_name: 'Organisation'
    }
}

STRAPIDATA_ARTICLE = fetchModel(yaml.load(fs.readFileSync(strapiDataArticlesPath, 'utf8')), minimodel)

const allLanguages = DOMAIN_SPECIFICS.locales[DOMAIN]
const stagingURL = DOMAIN_SPECIFICS.stagingURLs[DOMAIN]
const pageURL = DOMAIN_SPECIFICS.pageURLs[DOMAIN]



for (const lang of allLanguages) {
    const dataFrom = {
        'articles': `/_fetchdir/articles.${lang}.yaml`
    }
    var dirPath = `${sourceDir}_fetchdir/articles/`

    timer.log(__filename, `Fetching ${DOMAIN} articles ${lang} data`)

    let allData = []
    for (const originalElement of STRAPIDATA_ARTICLE) {
        const element = JSON.parse(JSON.stringify(originalElement))
        let slugEn = element.slug_en
        if (!slugEn) {
            slugEn = element.slug_et
        }

        // rueten func. is run for each element separately instead of whole data, that is
        // for the purpose of saving slug_en before it will be removed by rueten func.
        rueten(element, lang)

        element.directory = dirPath + slugEn

        if (element.directory) {
            for (key in element) {
                if (key == 'slug') {
                    element.path = `article/${element[key]}`
                }
            }

            if (element.contents && element.contents[0]) {
                // Replace Img/Staging urls with correct webpage urls
                element.contents = replaceLinks(element.contents, stagingURL, pageURL);
            }

            if (element.lead && element.lead[0]) {

                // Replace Img/Staging urls with correct webpage urls
                element.lead = replaceLinks(element.lead, stagingURL, pageURL);

            }

            // Article list view get priority picture format
            const primaryImage = prioritizeImages(element, imageOrder, imageOrderDefaults)
            if (primaryImage) { element.primaryImage = primaryImage }
            // Same for viiekas, as it uses different order
            const viiekasImage = prioritizeImages(element, imageOrderViiekas, imageOrderViiekasDefaults)
            if (viiekasImage) { element.viiekasImage = viiekasImage }
            // Delete excess media
            delete element.media

            allData.push(element)
            element.data = dataFrom

            let allDataYAML = yaml.dump(allData, { 'noRefs': true, 'indent': '4' })
            fs.writeFileSync(path.join(fetchDir, `articles.${lang}.yaml`), allDataYAML, 'utf8')

        } else {
            timer.log(__filename, `Film ID ${element.id} slug_en value missing`)
        }
        element = undefined
    }
}
timer.log(__filename, `Fetched ${DOMAIN} articles`)
