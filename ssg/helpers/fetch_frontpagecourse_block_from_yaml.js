const fs = require('fs')
const yaml = require('js-yaml')
const path = require('path')
const rueten = require('./rueten.js')

const sourceDir =  path.join(__dirname, '..', 'source')
const fetchDir =  path.join(sourceDir, '_fetchdir')
const strapiDataPath = path.join(fetchDir, 'strapiData.yaml')
const STRAPIDATA = yaml.safeLoad(fs.readFileSync(strapiDataPath, 'utf8'))['FrontPageCourses']
const DOMAIN = process.env['DOMAIN'] || 'filmikool.poff.ee'

const mapping = {
    'poff.ee': 'poff.ee',
    'justfilm.ee': 'justfilm.ee',
    'kinoff.poff.ee': 'kinoff.poff.ee',
    'industry.poff.ee': 'industry.poff.ee',
    'shorts.poff.ee': 'shorts.poff.ee',
    'hoff.ee': 'hoff.ee',
    'kumu.poff.ee': 'kumu.poff.ee',
    'tartuff.ee': 'tartuff.ee',
    'oyafond.ee': 'oyafond.ee',
    'filmikool.poff.ee': 'filmikool.poff.ee'
}

const STRAPIDATA_FRONTPAGECOURSE = STRAPIDATA

const languages = ['en', 'et', 'ru']

var failing = false
for (const lang of languages) {
    if (STRAPIDATA_FRONTPAGECOURSE.length < 1) {
        console.log(`ERROR! No data to fetch for ${DOMAIN} front page courses`)
        const outFile = path.join(fetchDir, `frontpagecourse.${lang}.yaml`)
        fs.writeFileSync(outFile, '[]', 'utf8')
        continue
    }
    console.log(`Fetching ${DOMAIN} front page course ${lang} data`)

    let copyData = JSON.parse(JSON.stringify(STRAPIDATA_FRONTPAGECOURSE[0]))
    if (typeof copyData !== 'undefined') {

        for (key in copyData) {
            if (key === `courses_${lang}`) {
                for (courseIx in copyData[key]) {
                    let thisCourse = copyData[key][courseIx]
                    let coursesYAMLPath = path.join(fetchDir, `courses.${lang}.yaml`)
                    let COURSESYAML = yaml.safeLoad(fs.readFileSync(coursesYAMLPath, 'utf8'))
                    let thisCourseFromYAML = COURSESYAML.filter( (a) => { return thisCourse.id === a.id })[0];
                    if(thisCourseFromYAML !== undefined) {
                        var thisCourseFromYAMLCopy = JSON.parse(JSON.stringify(thisCourseFromYAML));
                    } else {
                        console.log('ERROR! Cassette ID ', thisCourse.id, ' not associated with domain ', DOMAIN, ', frontpagecourse not built!')
                        failing = true
                        continue
                    }
                    // if (thisCourseFromYAMLCopy !== undefined && thisCourseFromYAMLCopy.data) {
                    //     delete thisCourseFromYAMLCopy.data
                    // }
                    copyData[key][courseIx] = thisCourseFromYAMLCopy
                }
            // Teistes keeltes kassett kustutatakse
            } else if (key !== `courses_${lang}` && key.substring(0, 10) === `courses_`) {
                delete copyData[key]
            }

        }
    }
    rueten(copyData, lang)
    if (failing || copyData === undefined) {
        var allDataYAML = yaml.safeDump([], { 'noRefs': true, 'indent': '4' })
    } else {
        var allDataYAML = yaml.safeDump(copyData, { 'noRefs': true, 'indent': '4' })
    }
    const outFile = path.join(fetchDir, `frontpagecourse.${lang}.yaml`)
    fs.writeFileSync(outFile, allDataYAML, 'utf8')
}
