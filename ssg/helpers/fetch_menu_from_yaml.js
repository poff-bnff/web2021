const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');
const rueten = require('./rueten.js')
const {fetchModel} = require('./b_fetch.js')

const sourceDir =  path.join(__dirname, '..', 'source')
const strapiDataDirPath = path.join(sourceDir, 'strapidata')
const fetchDirDirPath = path.join(sourceDir, '_fetchdir')
const DOMAIN = process.env['DOMAIN'] || 'poff.ee'

const params = process.argv.slice(2)
const build_type = params[0]
const model_id = params[1]
const addConfigPathAliases = require('./add_config_path_aliases.js')
if(build_type === 'target') {
    addConfigPathAliases(['/menu'])
}

const mapping = {
    'poff.ee': 'POFFiMenu',
    'justfilm.ee': 'JustFilmiMenu',
    'kinoff.poff.ee': 'KinoffiMenu',
    'industry.poff.ee': 'IndustryMenu',
    'shorts.poff.ee': 'ShortsiMenu',
    'hoff.ee': 'HOFFiMenu',
    'kumu.poff.ee': 'KumuMenu',
    'tartuff.ee': 'TartuffiMenu',
    'filmikool.poff.ee': 'FilmikooliMenu',
    'oyafond.ee': 'BrunoMenu'
}
const strapiDataMenuPath = path.join(strapiDataDirPath, `${mapping[DOMAIN]}.yaml`)
const STRAPIDATA_MENUS = yaml.safeLoad(fs.readFileSync(strapiDataMenuPath, 'utf8'))

const artMapping = {
    'poff.ee': 'poffi_article',
    'justfilm.ee': 'just_filmi_article',
    'kinoff.poff.ee': 'kinoffi_article',
    'industry.poff.ee': 'industry_article',
    'shorts.poff.ee': 'shortsi_article',
    'hoff.ee': 'hoffi_article',
    'kumu.poff.ee': 'kumu_article',
    'tartuff.ee': 'tartuffi_article',
    'filmikool.poff.ee': 'filmikooli_article',
    'oyafond.ee': 'bruno_article'
}
const artModelMapping = {
    'poff.ee': 'POFFiArticle',
    'justfilm.ee': 'JustFilmiArticle',
    'kinoff.poff.ee': 'KinoffiArticle',
    'industry.poff.ee': 'IndustryArticle',
    'shorts.poff.ee': 'ShortsiArticle',
    'hoff.ee': 'HOFFiArticle',
    'kumu.poff.ee': 'KumuArticle',
    'tartuff.ee': 'TartuffiArticle',
    'filmikool.poff.ee': 'FilmikooliArticle',
    'oyafond.ee': 'BrunoArticle'
}
const artMappingSubMenuItem = {
    'poff.ee': 'PoffiSubMenuItem',
    'justfilm.ee': 'JustFilmiSubMenuItem',
    'kinoff.poff.ee': 'KinoffiSubMenuItem',
    'industry.poff.ee': 'IndustrySubMenuItem',
    'shorts.poff.ee': 'ShortsiSubMenuItem',
    'hoff.ee': 'HoffiSubMenuItem',
    'kumu.poff.ee': 'KumuSubMenuItem',
    'tartuff.ee': 'TartuffiSubMenuItem',
    'filmikool.poff.ee': 'FilmikooliSubMenuItem',
    'oyafond.ee': 'BrunoSubMenuItem'
}
const minimodel = {
    [`${artMapping[DOMAIN]}`]: {
        model_name: artModelMapping[DOMAIN],
        expand: {
            'article_types': {
                model_name: 'ArticleType'
            }
        }
    },
    'subMenuItem': {
        model_name: artMappingSubMenuItem[DOMAIN],
        expand: {
            [artMapping[DOMAIN]]: {
                model_name: artModelMapping[DOMAIN],
                expand: {
                    'article_types': {
                        model_name: 'ArticleType'
                    }
                }
            }
        }
    }
}
STRAPIDATA_MENU = fetchModel(STRAPIDATA_MENUS, minimodel)

const languages = ['en', 'et', 'ru']
for (const lang of languages) {

    const menuDataFile =  path.join(fetchDirDirPath, `menu.${lang}.yaml`)

    let copyData = JSON.parse(JSON.stringify(STRAPIDATA_MENU))
    menuData = rueten(copyData, lang)

    let menuDataYAML = yaml.safeDump(menuData, { 'noRefs': true, 'indent': '4' })
    fs.writeFileSync(menuDataFile, menuDataYAML, 'utf8')
    console.log(`Fetched ${DOMAIN} menu ${lang} data`)
}
