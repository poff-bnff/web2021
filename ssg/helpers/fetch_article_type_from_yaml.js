const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');
const rueten = require('./rueten.js')
const {fetchModel} = require('./b_fetch.js')
const replaceLinks = require('./replace_links.js')

const rootDir =  path.join(__dirname, '..')
const domainSpecificsPath = path.join(rootDir, 'domain_specifics.yaml')
const DOMAIN_SPECIFICS = yaml.safeLoad(fs.readFileSync(domainSpecificsPath, 'utf8'))

const DOMAIN = process.env['DOMAIN'] || 'industry.poff.ee'

const sourceDir =  path.join(rootDir, 'source')
const fetchDir =  path.join(sourceDir, '_fetchdir')
const strapiDataPath =  path.join(sourceDir, 'strapidata')
const mapping = DOMAIN_SPECIFICS.article
const modelName = mapping[DOMAIN]
const strapiDataArticlesPath = path.join(strapiDataPath, `${modelName}.yaml`)
const STRAPIDATA_ARTICLES = yaml.safeLoad(fs.readFileSync(strapiDataArticlesPath, 'utf8'))
// const STRAPIDATA_PERSONS = STRAPIDATA['Person'];
const STRAPIDATA_PERSONS = [];

const DEFAULTTEMPLATENAME = 'news'

// console.log(DOMAIN_SPECIFICS)
const languages = DOMAIN_SPECIFICS.locales[DOMAIN]
const stagingURL = DOMAIN_SPECIFICS.stagingURLs[DOMAIN]
const pageURL = DOMAIN_SPECIFICS.pageURLs[DOMAIN]


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
        }
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
    },
    'industry_people': {
        model_name: 'IndustryPerson'
    },
    'people': {
        model_name: 'Person'
    },

}

STRAPIDATA_ARTICLE = fetchModel(STRAPIDATA_ARTICLES, minimodel)

for (const lang of languages) {
    console.log(`Fetching ${DOMAIN} articles ${lang} data`)

    if (DOMAIN === 'industry.poff.ee') {
        var industryPersonsPath = path.join(fetchDir, `industrypersons.${lang}.yaml`)
        var industryPersonsYaml = yaml.safeLoad(fs.readFileSync(industryPersonsPath, 'utf8'));
    }
    // allData = [];
    const dirPath = path.join(sourceDir, "_fetchdir" )
    const dataFrom = {
        screenings: `/film/screenings.${lang}.yaml`,
        articles: `/_fetchdir/articles.${lang}.yaml`,
    }

    for (const strapiElement of STRAPIDATA_ARTICLE) {
        let element = JSON.parse(JSON.stringify(strapiElement))
        let slugEn = element.slug_en || element.slug_et
        if (!slugEn) {
            // console.log(element)
            throw new Error ("Artiklil on puudu nii eesti kui inglise keelne slug!", Error.ERR_MISSING_ARGS)
        }

        let publishFrom = undefined
        let publishUntil = undefined

        var currentTime = new Date()
        if (typeof(element.publishFrom) === 'undefined') {
            publishFrom= new Date(element.created_at)
        } else {
            publishFrom= new Date(element.publishFrom)
        }
        if (element.publishUntil) {
            publishUntil = new Date(element.publishUntil)
        }

        if (currentTime < publishFrom) {
            console.log(`Skipped article ID ${element.id} which publishFrom is ${publishFrom}, current time ${currentTime}`);
            continue;
        }
        if (publishUntil !== 'undefined' && publishUntil < currentTime) {
            console.log(`Skipped article ID ${element.id} which publishUntil is ${publishUntil}, current time ${currentTime}`);
            continue;
        }

        if (element[`publish_${lang}`] === undefined || element[`publish_${lang}`] === false) {
            continue;
        }
        if (element[`title_${lang}`] < 1) {
            console.log(`Skipped article ID ${element.id} which is missing title`);
            continue;
        }

        // rueten func. is run for each element separately instead of whole data, that is
        // for the purpose of saving slug_en before it will be removed by rueten func.
        rueten(element, lang);

        //TODO #444
        if (element.contents && element.contents[0]) {
            // Replace Strapi URL with assets URL for images
            // Replace Staging urls with correct webpage urls
            element.contents = replaceLinks(element.contents, stagingURL, pageURL)
        }

        if (element.lead && element.lead[0]) {
            // Replace Staging urls with correct webpage urls
            element.lead = replaceLinks(element.lead, stagingURL, pageURL)
        }

        // console.log(element)
        if (element.article_types) {
            for (artType of element.article_types) {

                // console.log(dirPath, artType, slugEn)
                element.directory = path.join(dirPath, artType.name, slugEn)

                fs.mkdirSync(element.directory, { recursive: true });
                //let languageKeys = ['en', 'et', 'ru'];
                for (key in element) {

                    if (key === "slug") {
                        element.path = path.join(artType.slug, element[key])
                        element.articleType = artType.label

                        // see patch siin on tehtud, kuna reklaamis kasutati poff.ee/lemmikfilm, aga meil on artiklid ju poff.ee/artikkel/lemmikfilm
                        if (element[key] === 'lemmikfilm') {
                            element.aliases = ['lemmikfilm', 'publikulemmik']
                        }
                    }
                }
                // allData.push(element);
                element.data = dataFrom;

                let article_template = `/_templates/article_${artType.name}_index_template.pug`

                let industryArtTypeNames = ['news', 'about', 'virtual_booth']
                let artTypeName = ''
                if (industryArtTypeNames.includes(artType.name)){
                    artTypeName = artType.name
                }

                if (DOMAIN === 'industry.poff.ee' && artTypeName.length > 1 ) {
                    // if (element.industry_people && element.industry_people.length) {
                    //     let indPeopleFromYaml = element.industry_people.filter(a => a.person).map(per => {
                    //         return industryPersonsYaml.filter(indp => indp.person.id === per.person)[0]
                    //     })
                    //     if (typeof indPeopleFromYaml !== 'undefined') {
                    //         element.industry_people = indPeopleFromYaml
                    //     } else {
                    //         element.industry_people = []
                    //     }
                    // }

                    // if (element.people && element.people.length) {
                    //     let peopleFromYaml = element.people.map(per => {
                    //         return STRAPIDATA_PERSONS.filter(pers => pers.id === per.id)[0]
                    //     })
                    //     if (typeof peopleFromYaml !== 'undefined') {
                    //         element.people = peopleFromYaml
                    //     } else {
                    //         element.people = []
                    //     }
                    // }

                    article_template  = `/_templates/article_industry_${artType.name}_index_template.pug`
                }

                let yamlStr = yaml.safeDump(element, { 'indent': '4' });

                fs.writeFileSync(`${element.directory}/data.${lang}.yaml`, yamlStr, 'utf8');

                if (fs.existsSync(`${sourceDir}${article_template}`)) {
                    fs.writeFileSync(`${element.directory}/index.pug`, `include ${article_template}`)
                } else {
                    fs.writeFileSync(`${element.directory}/index.pug`, `include /_templates/article_${DEFAULTTEMPLATENAME}_index_template.pug`)
                }
            }
        } else {
            console.log(`ERROR! Article ID ${element.id} missing article_type`);
        }
    }
}
