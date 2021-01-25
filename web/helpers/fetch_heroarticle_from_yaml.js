const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');
const rueten = require('./rueten.js')

const sourceDir =  path.join(__dirname, '..', 'source')
const fetchDir =  path.join(sourceDir, '_fetchdir')
const strapiDataPath = path.join(fetchDir, 'strapiData.yaml')
const STRAPIDATA = yaml.safeLoad(fs.readFileSync(strapiDataPath, 'utf8'))
const DOMAIN = process.env['DOMAIN'] || 'poff.ee'

const mapping = {
    'poff.ee': 'HeroArticlePoff',
    'justfilm.ee': 'HeroArticleJustFilm',
    'kinoff.poff.ee': 'HeroArticleKinoff',
    'industry.poff.ee': 'HeroArticleIndustry',
    'shorts.poff.ee': 'HeroArticleShorts',
    'hoff.poff.ee': 'HeroArticleHoff'
}

const STRAPIDATA_HERO = STRAPIDATA[mapping[DOMAIN]][0]
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


