const fs = require('fs')
const yaml = require('js-yaml')
const path = require('path')
const rueten = require('./rueten.js')
const {fetchModel} = require('./b_fetch.js')

const { timer } = require("./timer")
timer.start(__filename)

const rootDir =  path.join(__dirname, '..')
const domainSpecificsPath = path.join(rootDir, 'domain_specifics.yaml')
const DOMAIN_SPECIFICS = yaml.safeLoad(fs.readFileSync(domainSpecificsPath, 'utf8'))

const sourceDir =  path.join(rootDir, 'source')
const fetchDir =  path.join(sourceDir, '_fetchdir')
const strapiDataDirPath = path.join(sourceDir, 'strapidata')

const DOMAIN = process.env['DOMAIN'] || 'poff.ee'
const STRAPIDIR = '/uploads/'
const STRAPIHOSTWITHDIR = `https://${process.env['StrapiHostPoff2021']}${STRAPIDIR}`;


const mapping = DOMAIN_SPECIFICS.article
const modelName = mapping[DOMAIN]
const strapiDataArticlesPath = path.join(strapiDataDirPath, `${modelName}.yaml`)
const STRAPIDATA_ARTICLE = yaml.safeLoad(fs.readFileSync(strapiDataArticlesPath, 'utf8'))

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
    }

fetchModel(STRAPIDATA_ARTICLE, minimodel)


const allLanguages = DOMAIN_SPECIFICS.locales[DOMAIN]

const stagingURL = DOMAIN_SPECIFICS.stagingURLs[DOMAIN]
const pageURL = DOMAIN_SPECIFICS.pageURLs[DOMAIN]


for (const lang of allLanguages) {
    const dataFrom = {
        'pictures': '/article_pictures.yaml',
        'screenings': `/film/screenings.${lang}.yaml`,
        'articles': `/_fetchdir/articles.${lang}.yaml`
    }
    var dirPath = `${sourceDir}_fetchdir/articles/`

    // fs.mkdirSync(dirPath, { recursive: true })

    timer.log(__filename, `Fetching ${DOMAIN} articles ${lang} data`)

    let allData = []
    // data = rueten(data, lang)
    // timer.log(__filename, data)
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
                var splitContent = element.contents.split(STRAPIHOSTWITHDIR);
                var i = 0;
                var contentImgs = [];
                while (splitContent[i+1]){
                    if(splitContent[i+1]) {
                        // timer.log(__filename, 'IMG: ', splitContent[i+1].split(')')[0]);
                        contentImgs.push(splitContent[i+1].split(')')[0]);
                        i++;
                    }
                }
                let searchRegExp = new RegExp(STRAPIHOSTWITHDIR, 'g');
                let replaceWith = `https://assets.poff.ee/img/`;
                const replaceImgPath = element.contents.replace(searchRegExp, replaceWith);
                element.contents = replaceImgPath;


                // Replace Staging urls with correct webpage urls
                let searchRegExpStaging = new RegExp(stagingURL, 'g');
                const replaceLinkURL = element.contents.replace(searchRegExpStaging, pageURL);
                element.contents = replaceLinkURL;

                // timer.log(__filename, contentImgs);
                element.contentsImg = contentImgs;
            }

            if (element.lead && element.lead[0]) {
                var splitContent = element.lead.split('[');
                var i = 0;
                var contentImgs = [];
                while (splitContent[i+1]){
                    if(splitContent[i+1]) {
                        // timer.log(__filename, 'IMG: ', splitContent[i+1].split(')')[0]);
                        // contentImgs.push(splitContent[i+1].split(')')[0]);
                        var theLink = splitContent[i+1].split(')')[0];
                        var wholeLink = `[${splitContent[i+1].split(')')[0]})`;
                        var wholeLinkEscaped = wholeLink.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
                        var linkText = theLink.split(']')[0];
                        let searchRegExp = new RegExp(wholeLinkEscaped, 'g');
                        const replaceLinkWithLinkText = element.lead.replace(searchRegExp, linkText);
                        element.lead = replaceLinkWithLinkText;
                        // timer.log(__filename, element.lead);
                        i++;
                    }
                }

                // Replace Staging urls with correct webpage urls
                let searchRegExpStaging = new RegExp(stagingURL, 'g');
                const replaceLinkURL = element.lead.replace(searchRegExpStaging, pageURL);
                element.lead = replaceLinkURL;

            }

            allData.push(element)
            element.data = dataFrom

            let allDataYAML = yaml.safeDump(allData, { 'noRefs': true, 'indent': '4' })
            fs.writeFileSync(path.join(fetchDir, `articles.${lang}.yaml`), allDataYAML, 'utf8')

        } else {
            timer.log(__filename, `Film ID ${element.id} slug_en value missing`)
        }
    }
}
timer.log(__filename, `Fetched ${DOMAIN} articles`)
