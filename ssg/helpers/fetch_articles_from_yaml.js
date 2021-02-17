const fs = require('fs')
const yaml = require('js-yaml')
const path = require('path')
const rueten = require('./rueten.js')
const replaceLinks = require('./replace_links.js')

const { timer } = require("./timer")
timer.start(__filename)

const rootDir =  path.join(__dirname, '..')
const domainSpecificsPath = path.join(rootDir, 'domain_specifics.yaml')
const DOMAIN_SPECIFICS = yaml.safeLoad(fs.readFileSync(domainSpecificsPath, 'utf8'))

const sourceDir =  path.join(rootDir, 'source')
const fetchDir =  path.join(sourceDir, '_fetchdir')
const strapiDataPath = path.join(fetchDir, 'strapiData.yaml')
const STRAPIDATA = yaml.safeLoad(fs.readFileSync(strapiDataPath, 'utf8'))

const DOMAIN = process.env['DOMAIN'] || 'poff.ee'
const STRAPIDIR = '/uploads/'
const STRAPIHOSTWITHDIR = `https://${process.env['StrapiHostPoff2021']}${STRAPIDIR}`;

const mapping = DOMAIN_SPECIFICS.article
const modelName = mapping[DOMAIN]
const STRAPIDATA_ARTICLE = STRAPIDATA[modelName]

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
                // Replace Img/Staging urls with correct webpage urls
                element.contents = replaceLinks(element.contents, stagingURL, pageURL);
            }

            if (element.lead && element.lead[0]) {

                // Replace Img/Staging urls with correct webpage urls
                element.lead = replaceLinks(element.lead, stagingURL, pageURL);

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
