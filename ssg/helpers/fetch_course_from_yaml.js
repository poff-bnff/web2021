const fs = require('fs')
const yaml = require('js-yaml')
const path = require('path')
const rueten = require('./rueten.js')
const {fetchModel} = require('./b_fetch.js')

const { timer } = require("./timer")
timer.start(__filename)

const rootDir =  path.join(__dirname, '..')
const domainSpecificsPath = path.join(rootDir, 'domain_specifics.yaml')
const DOMAIN_SPECIFICS = yaml.safeLoad(fs.readFileSync(domainSpecificsPath, 'utf8'))

const sourceDir =  path.join(rootDir, 'source')
const fetchDir =  path.join(sourceDir, '_fetchdir')
const strapiDataDirPath = path.join(sourceDir, 'strapidata')
const DOMAIN = process.env['DOMAIN'] || 'poff.ee'

const strapiDataCoursePath = path.join(strapiDataDirPath, `Course.yaml`)
const STRAPIDATA_COURSES = yaml.safeLoad(fs.readFileSync(strapiDataCoursePath, 'utf8'))

const minimodel = {
    'events': {
        model_name: 'Event'
    }
}

const STRAPIDATA_COURSE = fetchModel(STRAPIDATA_COURSES, minimodel)[0]
const allLanguages = DOMAIN_SPECIFICS.locales[DOMAIN]

for (const lang of allLanguages) {
    console.log( `Fetching ${DOMAIN} course ${lang} data`);
    var buffer = {}
    for (key in STRAPIDATA_COURSE) {

        if(key === `events_${lang}`) {
            buffer = rueten(STRAPIDATA_COURSE[`events_${lang}`], lang);
        }
    }

    let allDataYAML = yaml.safeDump(buffer, { 'noRefs': true, 'indent': '4' });
    fs.writeFileSync(path.join(fetchDir, `course.${lang}.yaml`), allDataYAML, 'utf8');
}