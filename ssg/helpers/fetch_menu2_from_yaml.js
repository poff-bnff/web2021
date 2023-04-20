const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');
const rueten = require('./rueten.js')
const { fetchModel } = require('./b_fetch.js')

const rootDir = path.join(__dirname, '..')
const sourceDir = path.join(rootDir, 'source')
const strapiDataDirPath = path.join(sourceDir, '_domainStrapidata')
const fetchDirDirPath = path.join(sourceDir, '_fetchdir')
const DOMAIN = process.env['DOMAIN'] || 'poff.ee'
const domainSpecificsPath = path.join(rootDir, 'domain_specifics.yaml')
const DOMAIN_SPECIFICS = yaml.load(fs.readFileSync(domainSpecificsPath, 'utf8'))

const params = process.argv.slice(2)
const build_type = params[0]
const addConfigPathAliases = require('./add_config_path_aliases.js');

if (build_type === 'target') {
    addConfigPathAliases(['/menu2'])
}

const L1MenuItemMapping = {
    // 'poff.ee': 'POFFiMenu',
    // 'justfilm.ee': 'JustFilmiMenu',
    // 'kinoff.poff.ee': 'KinoffiMenu',
    'industry.poff.ee': 'L1MenuIndustry',
    // 'discoverycampus.poff.ee': 'DisCampMenu',
    // 'shorts.poff.ee': 'ShortsiMenu',
    // 'hoff.ee': 'HOFFiMenu',
    'kumu.poff.ee': 'L1MenuKumu',
    // 'tartuff.ee': 'TartuffiMenu',
    // 'filmikool.poff.ee': 'FilmikooliMenu',
    // 'oyafond.ee': 'BrunoMenu'
}

if (!L1MenuItemMapping[DOMAIN]) {
    console.log('Menu2 not available for this domain');
    return
}

const strapiDataMenuPath = path.join(strapiDataDirPath, `${L1MenuItemMapping[DOMAIN]}.yaml`)
const STRAPIDATA_MENUS = yaml.load(fs.readFileSync(strapiDataMenuPath, 'utf8'))

const articleMapping = {
    // 'poff.ee': 'poffi_article',
    // 'justfilm.ee': 'just_filmi_article',
    // 'kinoff.poff.ee': 'kinoffi_article',
    'industry.poff.ee': 'industry_article',
    // 'discoverycampus.poff.ee': 'discamp_article',
    // 'shorts.poff.ee': 'shortsi_article',
    // 'hoff.ee': 'hoffi_article',
    'kumu.poff.ee': 'kumu_article',
    // 'tartuff.ee': 'tartuffi_article',
    // 'filmikool.poff.ee': 'filmikooli_article',
    // 'oyafond.ee': 'bruno_article'
}
const artModelMapping = {
    // 'poff.ee': 'POFFiArticle',
    // 'justfilm.ee': 'JustFilmiArticle',
    // 'kinoff.poff.ee': 'KinoffiArticle',
    'industry.poff.ee': 'IndustryArticle',
    // 'discoverycampus.poff.ee': 'DisCampArticle',
    // 'shorts.poff.ee': 'ShortsiArticle',
    // 'hoff.ee': 'HOFFiArticle',
    'kumu.poff.ee': 'KumuArticle',
    // 'tartuff.ee': 'TartuffiArticle',
    // 'filmikool.poff.ee': 'FilmikooliArticle',
    // 'oyafond.ee': 'BrunoArticle'
}
const L2MenuItemMapping = {
    // 'poff.ee': 'PoffiSubMenuItem',
    // 'justfilm.ee': 'JustFilmiSubMenuItem',
    // 'kinoff.poff.ee': 'KinoffiSubMenuItem',
    'industry.poff.ee': 'L2MenuIndustry',
    // 'discoverycampus.poff.ee': 'DisCampSubMenuItem',
    // 'shorts.poff.ee': 'ShortsiSubMenuItem',
    // 'hoff.ee': 'HoffiSubMenuItem',
    'kumu.poff.ee': 'L2MenuKumu',
    // 'tartuff.ee': 'TartuffiSubMenuItem',
    // 'filmikool.poff.ee': 'FilmikooliSubMenuItem',
    // 'oyafond.ee': 'BrunoSubMenuItem'
}

const L3MenuItemMapping = {
    // 'poff.ee': 'PoffiSubMenuItem',
    // 'justfilm.ee': 'JustFilmiSubMenuItem',
    // 'kinoff.poff.ee': 'KinoffiSubMenuItem',
    'industry.poff.ee': 'L3MenuIndustry',
    // 'discoverycampus.poff.ee': 'DisCampSubMenuItem',
    // 'shorts.poff.ee': 'ShortsiSubMenuItem',
    // 'hoff.ee': 'HoffiSubMenuItem',
    'kumu.poff.ee': 'L3MenuKumu',
    // 'tartuff.ee': 'TartuffiSubMenuItem',
    // 'filmikool.poff.ee': 'FilmikooliSubMenuItem',
    // 'oyafond.ee': 'BrunoSubMenuItem'
}

const minimodel = {
    [articleMapping[DOMAIN]]: {
        model_name: artModelMapping[DOMAIN],
        expand: {
            'article_types': {
                model_name: 'ArticleType'
            }
        }
    },
    'L2MenuItems': {
        model_name: [L2MenuItemMapping[DOMAIN]],
        expand: {
            [articleMapping[DOMAIN]]: {
                model_name: artModelMapping[DOMAIN],
                expand: {
                    'article_types': {
                        model_name: 'ArticleType'
                    }
                }
            },
            'L3MenuItems': {
                model_name: [L3MenuItemMapping[DOMAIN]],
                expand: {
                    [articleMapping[DOMAIN]]: {
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
    }
}

STRAPIDATA_MENU = fetchModel(STRAPIDATA_MENUS, minimodel)

const languages = DOMAIN_SPECIFICS.locales[DOMAIN]
for (const lang of languages) {

    const menuDataFile = path.join(fetchDirDirPath, `menu2.${lang}.yaml`)

    let copyData = JSON.parse(JSON.stringify(STRAPIDATA_MENU))
    let menuData = rueten(copyData, lang)

    let processedData = []

    // Process data to include only what is needed for menu
    menuData.filter(m => validateMenu(m, 'L2MenuItems')).sort(function (a, b) { return (a.order > b.order) ? 1 : ((b.order > a.order) ? -1 : 0); })
        .map(a1 => {
            let oneMenuItem = {
                name: a1.name,
                link: a1.customUrl || getArticleType(a1?.[articleMapping[DOMAIN]], lang) || null,
                L2MenuItems: [],
            }
            if (a1.L2MenuItems) {
                a1.L2MenuItems.filter(m => validateMenu(m, 'L3MenuItems')).sort(function (a, b) { return (a.order > b.order) ? 1 : ((b.order > a.order) ? -1 : 0); })
                    .map(a2 => {
                        let level2MenuItem = {
                            name: a2.name,
                            link: a2.customUrl || getArticleType(a2?.[articleMapping[DOMAIN]], lang) || null,
                            L3MenuItems: []
                        }
                        if (a2.L3MenuItems) {
                            a2.L3MenuItems.filter(m => validateMenu(m, 'noLevel')).sort(function (a, b) { return (a.order > b.order) ? 1 : ((b.order > a.order) ? -1 : 0); })
                                .map(a3 => {
                                    level2MenuItem.L3MenuItems.push({
                                        name: a3.name,
                                        link: a3.customUrl || getArticleType(a3?.[articleMapping[DOMAIN]], lang) || null,
                                    })
                                })
                        }
                        oneMenuItem.L2MenuItems.push(level2MenuItem)
                    })
            }
            processedData.push(oneMenuItem)
        })

    let menuDataYAML = yaml.dump(processedData, { 'noRefs': true, 'indent': '4' })
    fs.writeFileSync(menuDataFile, menuDataYAML, 'utf8')
    console.log(`Fetched ${DOMAIN} menu2 ${lang} data`)
}

// Checks menu levels for info
function validateMenu(menuData = [], level) {
    // Menu has to be published and have a proper name to display
    if (menuData.publish && menuData.name && typeof menuData.name !== 'object') {
        const article = menuData[articleMapping[DOMAIN]];
        // Has to have customUrl or article or submenus for display
        if (
            menuData.customUrl ||
            (article && article.publish && article.slug && article?.article_types?.length) ||
            menuData[level]
        ) {
            return true
        }
    }
}

// Creates a link for article
function getArticleType(art, lang) {
    if (art && art.article_types.length) {
        // Get article slug with first preferred article type
        let mainArticleTypePath = null
        art.article_types.map(artType => {
            const artTypeName = artType?.name?.toLowerCase()
            if (artTypeName === 'about') {
                mainArticleTypePath = artType.slug
            } else if (artTypeName === 'interview') {
                mainArticleTypePath = artType.slug
            } else if (artTypeName === 'sponsor_story') {
                mainArticleTypePath = artType.slug
            } else if (artTypeName === 'news') {
                mainArticleTypePath = artType.slug
            } else {
                mainArticleTypePath = art.article_types[0].slug
            }
        })
        if (mainArticleTypePath) {
            let languagePrefix = DOMAIN_SPECIFICS.defaultLocale[DOMAIN] === lang ? '' : `/${lang}`
            return `${languagePrefix}/${mainArticleTypePath}/${art.slug}`
        } else {
            return null
        }
    } else { return null }
}
