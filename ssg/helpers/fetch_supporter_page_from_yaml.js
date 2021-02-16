const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');
const rueten = require('./rueten.js')

const sourceDir =  path.join(__dirname, '..', 'source')
const fetchDir =  path.join(sourceDir, '_fetchdir')
const strapiDataDirPath = path.join(sourceDir, 'strapidata')
const DOMAIN = process.env['DOMAIN'] || 'poff.ee'

const mapping = {
    'poff.ee': 'POFFSupporter',
    'justfilm.ee': 'JustSupporter',
    'kinoff.poff.ee': 'KinoffiSupporter',
    'industry.poff.ee': 'IndustrySupporter',
    'shorts.poff.ee': 'ShortsSupporter',
    'hoff.ee': 'HoffiSupporter'
}
const strapiDataSupporterPath = path.join(strapiDataDirPath, `${mapping[DOMAIN]}.yaml`)
const STRAPIDATA_SUPPORTER_PAGE = yaml.safeLoad(fs.readFileSync(strapiDataSupporterPath, 'utf8'))

LangSelect('et');
LangSelect('en');
LangSelect('ru');

function LangSelect(lang) {
    processData(lang, CreateYAML);
    console.log(`Fetching ${DOMAIN} supporter page ${lang} data`);
}


function processData(lang, CreateYAML) {
    // console.log(util.inspect(data));


    let copyData = JSON.parse(JSON.stringify(STRAPIDATA_SUPPORTER_PAGE));
    // console.log(util.inspect(copyData));
    let buffer = [];
    for (index in copyData) {
        // console.log('index', index);
        // console.log('domain', domain);
        // console.log('copydatadomeen', copyData[index].domain);
        if(copyData[index].domain.url === DOMAIN) {
            buffer = rueten(copyData[index], lang)
        }
    }
    CreateYAML(buffer, lang);
    // console.log('COPYDATA', copyData.keys());
    // console.log('BUFFER', buffer);
}

function CreateYAML(buffer, lang) {
    let allDataYAML = yaml.safeDump(buffer, { 'noRefs': true, 'indent': '4' })
    const outFile = path.join(fetchDir, `supporterspage.${lang}.yaml`)
    fs.writeFileSync(outFile, allDataYAML, 'utf8')
}


