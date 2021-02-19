const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');
const rueten = require('./rueten.js')
const {fetchModel} = require('./b_fetch.js')

const sourceDir =  path.join(__dirname, '..', 'source')
const fetchDir =  path.join(sourceDir, '_fetchdir')
const strapiDataDirPath = path.join(sourceDir, 'strapidata')

const DOMAIN = process.env['DOMAIN'] || 'poff.ee'

const hero_mapping = {
    'poff.ee': 'HeroArticlePoff',
    'justfilm.ee': 'HeroArticleJustFilm',
    'kinoff.poff.ee': 'HeroArticleKinoff',
    'industry.poff.ee': 'HeroArticleIndustry',
    'shorts.poff.ee': 'HeroArticleShorts',
    'hoff.ee': "HeroArticleHoff",
    'kumu.poff.ee': "HeroArticleKumu",
    'tartuff.ee': "HeroArticleTartuff"
}
const strapiDataHeroPath = path.join(strapiDataDirPath, `${hero_mapping[DOMAIN]}.yaml`)
const STRAPIDATA_HEROS = yaml.safeLoad(fs.readFileSync(strapiDataHeroPath, 'utf8'))

const article_mapping = {
    'poff.ee': 'POFFiArticle',
    'justfilm.ee': 'JustFilmiArticle',
    'kinoff.poff.ee': 'KinoffiArticle',
    'industry.poff.ee': 'IndustryArticle',
    'shorts.poff.ee': 'ShortsiArticle',
    'hoff.ee': "HOFFiArticle"
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
            // console.log(buffer);
        }
    }

    let allDataYAML = yaml.safeDump(buffer, { 'noRefs': true, 'indent': '4' });
    fs.writeFileSync(path.join(fetchDir, `heroarticle.${lang}.yaml`), allDataYAML, 'utf8');
}
