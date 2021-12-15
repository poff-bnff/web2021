const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');
const rueten = require('./rueten.js')
const {fetchModel} = require('./b_fetch.js')

const sourceDir =  path.join(__dirname, '..', 'source')
const fetchDir =  path.join(sourceDir, '_fetchdir')
const strapiDataDirPath = path.join(sourceDir, '_domainStrapidata')

const DOMAIN = process.env['DOMAIN'] || 'poff.ee'

const params = process.argv.slice(2)
const build_type = params[0]
const model_id = params[1]
const addConfigPathAliases = require('./add_config_path_aliases.js')
if(build_type === 'target') {
    addConfigPathAliases(['/home'])
}

const hero_mapping = {
    'poff.ee': 'HeroArticlePoff',
    'justfilm.ee': 'HeroArticleJustFilm',
    'kinoff.poff.ee': 'HeroArticleKinoff',
    'industry.poff.ee': 'HeroArticleIndustry',
    'discoverycampus.poff.ee': 'HeroArticleDisCamp',
    'shorts.poff.ee': 'HeroArticleShorts',
    'hoff.ee': "HeroArticleHoff",
    'kumu.poff.ee': "HeroArticleKumu",
    'tartuff.ee': "HeroArticleTartuff",
    'filmikool.poff.ee': "HeroArticleFilmikool",
    'oyafond.ee': "HeroArticleBruno"
}
const strapiDataHeroPath = path.join(strapiDataDirPath, `${hero_mapping[DOMAIN]}.yaml`)
const STRAPIDATA_HEROS = yaml.load(fs.readFileSync(strapiDataHeroPath, 'utf8'))

const article_mapping = {
    'poff.ee': 'POFFiArticle',
    'justfilm.ee': 'JustFilmiArticle',
    'kinoff.poff.ee': 'KinoffiArticle',
    'industry.poff.ee': 'IndustryArticle',
    'discoverycampus.poff.ee': 'DisCampArticle',
    'shorts.poff.ee': 'ShortsiArticle',
    'hoff.ee': "HOFFiArticle",
    'kumu.poff.ee': "KumuArticle",
    'tartuff.ee': "TartuffiArticle",
    'filmikool.poff.ee': "FilmikooliArticle",
    'oyafond.ee': "BrunoArticle"
}
const minimodel = {
    'article_et': {
        model_name: article_mapping[DOMAIN]
    },
    'article_en': {
        model_name: article_mapping[DOMAIN]
    },
    'article_ru': {
        model_name: article_mapping[DOMAIN]
    }
}
const STRAPIDATA_HERO = fetchModel(STRAPIDATA_HEROS, minimodel)[0]
const languages = ['en', 'et', 'ru']

for (const lang of languages) {
    console.log(`Fetching ${DOMAIN} heroarticle ${lang} data`);
    var buffer = {}
    for (key in STRAPIDATA_HERO) {

        if(key === `article_${lang}`) {
            buffer = rueten(STRAPIDATA_HERO[`article_${lang}`], lang);
        }
    }

    let allDataYAML = yaml.dump(buffer, { 'noRefs': true, 'indent': '4' });
    fs.writeFileSync(path.join(fetchDir, `heroarticle.${lang}.yaml`), allDataYAML, 'utf8');
}
