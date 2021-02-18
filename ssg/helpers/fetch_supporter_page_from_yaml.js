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
    'poff.ee': 'POFFSupporter',
    'justfilm.ee': 'JustSupporter',
    'kinoff.poff.ee': 'KinoffiSupporter',
    'industry.poff.ee': 'IndustrySupporter',
    'shorts.poff.ee': 'ShortsSupporter',
    'hoff.ee': 'HoffiSupporter',
    'kumu.poff.ee': 'KumuSupporter',
    'tartuff.ee': 'TartuffiSupporter'
}
const STRAPIDATA_SUPPORTER_PAGE = STRAPIDATA[mapping[DOMAIN]]

LangSelect('et');
LangSelect('en');
LangSelect('ru');

function LangSelect(lang) {
    processData(lang, CreateYAML);
    console.log(`Fetching ${process.env['DOMAIN']} supporter page ${lang} data`);
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


