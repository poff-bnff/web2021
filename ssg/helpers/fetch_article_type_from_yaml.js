const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');
const rueten = require('./rueten.js')
const { fetchModel } = require('./b_fetch.js')
const replaceLinks = require('./replace_links.js')
const prioritizeImages = require(path.join(__dirname, 'image_prioritizer.js'))

const rootDir = path.join(__dirname, '..')
const domainSpecificsPath = path.join(rootDir, 'domain_specifics.yaml')
const DOMAIN_SPECIFICS = yaml.load(fs.readFileSync(domainSpecificsPath, 'utf8'))
const imageOrder = DOMAIN_SPECIFICS.articleViewImagePriority
const imageOrderDefaults = DOMAIN_SPECIFICS.articleViewImagePriorityDefaults

const addConfigPathAliases = require('./add_config_path_aliases.js')
const params = process.argv.slice(2)
const param_build_type = params[0]
const target_id = params[1]

const DOMAIN = process.env['DOMAIN'] || 'poff.ee'

const sourceDir = path.join(rootDir, 'source')
const fetchDir = path.join(sourceDir, '_fetchdir')
const fetchDirRestricted = path.join(sourceDir, '_fetchdirRestricted')
const strapiDataPath = path.join(sourceDir, '_domainStrapidata')
const mapping = DOMAIN_SPECIFICS.article
const modelName = mapping[DOMAIN]
const strapiDataArticlesPath = path.join(strapiDataPath, `${modelName}.yaml`)
const STRAPIDATA_ARTICLES = yaml.load(fs.readFileSync(strapiDataArticlesPath, 'utf8'))

const DEFAULTTEMPLATENAME = 'news'
const RESTRICTEDTEMPLATENAME = 'news_restricted'

const languages = DOMAIN_SPECIFICS.locales[DOMAIN]
const defaultLocale = DOMAIN_SPECIFICS.defaultLocale[DOMAIN]
const stagingURL = DOMAIN_SPECIFICS.stagingURLs[DOMAIN]
const pageURL = DOMAIN_SPECIFICS.pageURLs[DOMAIN]

// Artiklite limiit mida buildida
const ARTICLELIMIT = parseInt(process.env['ARTICLELIMIT']) || 0

console.log('fetch_article_type_from_yaml.js target_id', target_id);

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
    'industry_people': {
        model_name: 'IndustryPerson',
        expand: {
            'person': {
                model_name: 'Person'
            },
            'industry_person_types': {
                model_name: 'IndustryPersonType'
            },
            'role_at_films': {
                model_name: 'RoleAtFilm'
            },
        }
    },
    'people': {
        model_name: 'Person'
    },
    'organisations': {
        model_name: 'Organisation'
    },
}

const STRAPIDATA_ARTICLE = fetchModel(STRAPIDATA_ARTICLES, minimodel)

for (const lang of languages) {
    console.log(`Fetching ${DOMAIN} articles ${lang} data`)

    const dataFrom = {
        articles: `/_fetchdir/articles.${lang}.yaml`,
    }

    let limit = ARTICLELIMIT
    let counting = {}

    for (const strapiElement of STRAPIDATA_ARTICLE) {
        let element = JSON.parse(JSON.stringify(strapiElement))
        let slugEn = element.slug_en || element.slug_et
        if (!slugEn) {
            throw new Error(`Artiklil (ID: ${element.id}) on puudu nii eesti kui inglise keelne slug!`, Error.ERR_MISSING_ARGS)
        }

        if (param_build_type === 'target' && element.id.toString() !== target_id) {
            continue
        } else if (param_build_type === 'target' && element.id.toString() === target_id) {
            console.log('Target build article ID', element.id);
        }

        let publishFrom = undefined
        let publishUntil = undefined

        var currentTime = new Date()
        if (typeof (element.publishFrom) === 'undefined') {
            publishFrom = new Date(element.created_at)
        } else {
            publishFrom = new Date(element.publishFrom)
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

        if (element.contents && element.contents[0]) {
            // Replace Strapi URL with assets URL for images
            // Replace Staging urls with correct webpage urls
            element.contents = replaceLinks(element.contents, stagingURL, pageURL)
        }

        if (element.lead && element.lead[0]) {
            // Replace Staging urls with correct webpage urls
            element.lead = replaceLinks(element.lead, stagingURL, pageURL)
        }

        if (element.article_types) {

            for (artType of element.article_types) {

                counting[artType.name] = ~~counting[artType.name] + 1
                if (limit !== 0 && counting[artType.name] > limit) continue

                element.articleTypeSlug = artType.slug

                element.directory = path.join(fetchDir, artType.name, slugEn)
                fs.mkdirSync(element.directory, { recursive: true });

                element.directoryRestricted = path.join(fetchDirRestricted, artType.name, slugEn)
                if (!element.public) {
                    fs.mkdirSync(element.directoryRestricted, { recursive: true });
                }

                // Article view get priority picture format
                const primaryImage = prioritizeImages(element, imageOrder, imageOrderDefaults)
                if (primaryImage) { element.primaryImage = primaryImage }
                // Delete excess media
                delete element.media

                for (key in element) {

                    if (key === "slug") {
                        element.path = path.join(artType.slug, element[key])
                        element.articleType = artType.label

                        // see patch siin on tehtud, kuna reklaamis kasutati poff.ee/lemmikfilm, aga meil on artiklid ju poff.ee/artikkel/lemmikfilm
                        // if (element[key] === 'lemmikfilm') {
                        if (element[key] === 'lemmik') {
                            element.aliases = ['lemmik']
                        }
                        if (element[key] === 'lemmik') {
                            element.aliases = ['lemmik']
                        }
                        // 2021 adding covid article aliases
                        if (element[key] === 'koroonareeglid') {
                            element.aliases = ['covid', 'koroonareeglid']
                        }
                        // 2021 adding Industry article aliases
                        if (element[key] === 'music-meets-film-1') {
                            element.aliases = ['about/music-meets-film']
                        }
                        // 2022 Ukraina programmi alias
                        if (element[key] === 'auukrainale') {
                            element.aliases = ['auukrainale', 'ukraina','au-ukrainale']
                        }
                        // 2022 adding votemo for HOFF
                        // if (DOMAIN === 'hoff.ee' && element[key] === 'votemo2') {
                        //     let votemooAliasLangPrefix = lang === 'et' ? '' : `${lang}/`
                        //     element.aliases = [`${votemooAliasLangPrefix}votemoo`]
                        // }
                        // 2022 adding elakaasa for HOFF
                        // if (DOMAIN === 'hoff.ee' && element[key] === 'votemo2') {
                        //     let votemoAliasLangPrefix = lang === 'et' ? '' : `${lang}/`
                        //     element.aliases = [`${votemoAliasLangPrefix}votemo`]
                        // }
                        // 2022 adding votemo (artikli slug votemo)
                        if (DOMAIN === 'poff.ee' && element[key] === 'votemo') {
                            let votemooAliasLangPrefix = lang === 'en' ? '' : `${lang}/`
                            element.aliases = [`${votemooAliasLangPrefix}votemo`]
                        }
                        // 2022 adding parkimine (artikli slug parkimine)
                        if (DOMAIN === 'poff.ee' && element[key] === 'parkimine') {
                            let parkimineAliasLangPrefix = lang === 'et' ? '' : `${lang}/`
                            element.aliases = [`${parkimineAliasLangPrefix}parkimine`]
                        }

                        // // 2024 adding poff-soovitab
                        // if (DOMAIN === 'poff.ee' && element[key] === 'poff-soovitab') {
                        //     let soovitabAliasLangPrefix = lang === 'et' ? '' : `${lang}/`
                        //     element.aliases = [`${soovitabAliasLangPrefix}a_list`]
                        // }

                        // // 2024 adding poff-soovitab
                        // if (DOMAIN === 'poff.ee' && element[key] === 'a_list') {
                        //     let alistAliasLangPrefix = lang === 'et' ? '' : `${lang}/`
                        //     element.aliases = [`${alistAliasLangPrefix}poff-soovitab`]
                        // }

                        // 2022 adding poff.ee/tv (artikli slug tv)
                        if (DOMAIN === 'poff.ee' && element[key] === 'tv') {
                            let tvAliasLangPrefix = lang === 'et' ? '' : `${lang}/`
                            element.aliases = [`${tvAliasLangPrefix}tv`]
                        }
                        // 2022 industry accre alias
                        if (DOMAIN === 'industry.poff.ee' && element[key] === 'accreditation') {
                            let accreAliasLangPrefix = lang === 'en' ? '' : `${lang}/`
                            element.aliases = [`${accreAliasLangPrefix}accreditation`]
                        }

                        // 2024 industry creative gate alias
                        if (DOMAIN === 'industry.poff.ee' && element[key] === 'creative_gate') {
                            let accreAliasLangPrefix = lang === 'en' ? '' : `${lang}/`
                            element.aliases = [`${accreAliasLangPrefix}creative_gate`]
                        }

                        // 2022 industry mmf alias
                        if (DOMAIN === 'industry.poff.ee' && element[key] === 'mmf') {
                            let indmmfAliasLangPrefix = lang === 'en' ? '' : `${lang}/`
                            element.aliases = [`${indmmfAliasLangPrefix}mmf`]
                        }

                        // 2022 discamp mmf alias
                        if (DOMAIN === 'discoverycampus.poff.ee' && element[key] === 'mmf') {
                            let dcmmfAliasLangPrefix = lang === 'en' ? '' : `${lang}/`
                            element.aliases = [`${dcmmfAliasLangPrefix}mmf`]
                        }

                        // 2022 discamp mmf award alias
                        if (DOMAIN === 'discoverycampus.poff.ee' && element[key] === 'mmfaward') {
                            let dcmmfawardAliasLangPrefix = lang === 'en' ? '' : `${lang}/`
                            element.aliases = [`${dcmmfawardAliasLangPrefix}mmfaward`]
                        }

                        // // 2022 mai Ukraina programm
                        // if (DOMAIN === 'poff.ee' && element[key] === 'auukrainale') {
                        //     let auukrainaleAliasLangPrefix = lang === 'et' ? '' : `${lang}/`
                        //     element.aliases = [`${auukrainaleAliasLangPrefix}au-ukrainale`]
                        // }
                        // // 2022 mai Ukraina programm
                        // if (DOMAIN === 'poff.ee' && element[key] === 'auukrainale') {
                        //     let auukrainaleAliasLangPrefix = lang === 'et' ? '' : `${lang}/`
                        //     element.aliases = [`${auukrainaleAliasLangPrefix}au-ukrainale`]
                        // }
                        // // 2022 mai Ukraina programm
                        // if (DOMAIN === 'poff.ee' && element[key] === 'ukraina') {
                        //     let auukrainaleAliasLangPrefix = lang === 'et' ? '' : `${lang}/`
                        //     element.aliases = [`${auukrainaleAliasLangPrefix}au-ukrainale`]
                        // }
                    }
                }
                element.data = dataFrom;

                let article_template = `/_templates/article_${artType.name}_index_template.pug`
                let article_template_restricted = `/_templates/article_${artType.name}_restricted_index_template.pug`

                let industryArtTypeNames = ['news', 'about', 'virtual_booth']
                let artTypeName = ''
                if (industryArtTypeNames.includes(artType.name)) {
                    artTypeName = artType.name
                }

                if (DOMAIN === 'industry.poff.ee' && artTypeName.length > 1) {
                    article_template = `/_templates/article_industry_${artType.name}_index_template.pug`
                    article_template_restricted = `/_templates/article_industry_${artType.name}_restricted_index_template.pug`
                }

                // If target build, delete old single article data
                if (param_build_type === 'target') {
                    if (fs.existsSync(`${element.directory}/data.${lang}.yaml`)) {
                        console.log('Deleting old target article data ', `${element.directory}/data.${lang}.yaml`);
                        fs.unlinkSync(`${element.directory}/data.${lang}.yaml`);
                    }
                    if (element.directoryRestricted && fs.existsSync(`${element.directoryRestricted}/data.${lang}.yaml`)) {
                        console.log('Deleting old target article restricted data ', `${element.directoryRestricted}/data.${lang}.yaml`);
                        fs.unlinkSync(`${element.directoryRestricted}/data.${lang}.yaml`);
                    }
                }

                let yamlStr = yaml.dump(element, { 'indent': '4' });

                fs.writeFileSync(`${element.directory}/data.${lang}.yaml`, yamlStr, 'utf8');
                let buildPath = `/_fetchdir/${artType.name}/${slugEn}`
                if (fs.existsSync(`${sourceDir}${article_template}`)) {
                    fs.writeFileSync(`${element.directory}/index.pug`, `include ${article_template}`)
                    if (param_build_type === 'target') {
                        addConfigPathAliases([buildPath])
                    }
                } else {
                    fs.writeFileSync(`${element.directory}/index.pug`, `include /_templates/article_${DEFAULTTEMPLATENAME}_index_template.pug`)
                }

                if (!element.public) {
                    // element.path = path.join('..', 'restrictedcontent', DOMAIN_SPECIFICS.domain[DOMAIN], lang === defaultLocale ? '' : lang, element.path)

                    element.path = path.join('restrictedcontent', element.path)
                    let yamlStr = yaml.dump(element, { 'indent': '4' });

                    fs.writeFileSync(`${element.directoryRestricted}/data.${lang}.yaml`, yamlStr, 'utf8');
                    let buildPath = `/_fetchdirRestricted/${artType.name}/${slugEn}`
                    if (fs.existsSync(`${sourceDir}${article_template_restricted}`)) {
                        fs.writeFileSync(`${element.directoryRestricted}/index.pug`, `include ${article_template_restricted}`)
                        if (param_build_type === 'target') {
                            addConfigPathAliases([buildPath])
                        }
                    } else {
                        fs.writeFileSync(`${element.directoryRestricted}/index.pug`, `include /_templates/article_${RESTRICTEDTEMPLATENAME}_index_template.pug`)
                    }
                }

            }
        } else {
            console.log(`ERROR! Article ID ${element.id} missing article_type`);
        }
    }
}
