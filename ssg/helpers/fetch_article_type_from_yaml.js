const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');
const rueten = require('./rueten.js')

const rootDir =  path.join(__dirname, '..')
const domainSpecificsPath = path.join(rootDir, 'domain_specifics.yaml')
const DOMAIN_SPECIFICS = yaml.safeLoad(fs.readFileSync(domainSpecificsPath, 'utf8'))

const sourceDir =  path.join(rootDir, 'source')
const fetchDir =  path.join(sourceDir, '_fetchdir')
const strapiDataPath = path.join(fetchDir, 'strapiData.yaml')
const STRAPIDATA = yaml.safeLoad(fs.readFileSync(strapiDataPath, 'utf8'))
const STRAPIDATA_PERSONS = STRAPIDATA['Person'];

const DOMAIN = process.env['DOMAIN'] || 'industry.poff.ee'
const STRAPIDIR = '/uploads/'
const STRAPIHOSTWITHDIR = `http://${process.env['StrapiHostPoff2021']}${STRAPIDIR}`;
const DEFAULTTEMPLATENAME = 'news'

// console.log(DOMAIN_SPECIFICS)
const mapping = DOMAIN_SPECIFICS.article
const modelName = mapping[DOMAIN]
const STRAPIDATA_ARTICLE = STRAPIDATA[modelName]
const languages = DOMAIN_SPECIFICS.locales[DOMAIN]
const stagingURL = DOMAIN_SPECIFICS.stagingURLs[DOMAIN]
const pageURL = DOMAIN_SPECIFICS.pageURLs[DOMAIN]

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
            let searchRegExp = new RegExp(STRAPIHOSTWITHDIR, 'g');
            let replaceWith = `https://assets.poff.ee/img/`;
            const replaceImgPath = element.contents.replace(searchRegExp, replaceWith);
            element.contents = replaceImgPath;

            // Replace Staging urls with correct webpage urls
            let searchRegExpStaging = new RegExp(stagingURL, 'g');
            const replaceLinkURL = element.contents.replace(searchRegExpStaging, pageURL);
            element.contents = replaceLinkURL;
        }

        if (element.lead && element.lead[0]) {
            // Replace Staging urls with correct webpage urls
            let searchRegExpStaging = new RegExp(stagingURL, 'g');
            const replaceLinkURL = element.lead.replace(searchRegExpStaging, pageURL);
            element.lead = replaceLinkURL;
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
                    if (element.industry_people && element.industry_people.length) {
                        let indPeopleFromYaml = element.industry_people.filter(a => a.person).map(per => {
                            return industryPersonsYaml.filter(indp => indp.person.id === per.person)[0]
                        })
                        if (typeof indPeopleFromYaml !== 'undefined') {
                            element.industry_people = indPeopleFromYaml
                        } else {
                            element.industry_people = []
                        }
                    }

                    if (element.people && element.people.length) {
                        let peopleFromYaml = element.people.map(per => {
                            return STRAPIDATA_PERSONS.filter(pers => pers.id === per.id)[0]
                        })
                        if (typeof peopleFromYaml !== 'undefined') {
                            element.people = peopleFromYaml
                        } else {
                            element.people = []
                        }
                    }

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
