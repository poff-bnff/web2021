const fs = require('fs')
const yaml = require('js-yaml')
const path = require('path')
const rueten = require('./rueten.js')

const sourceDir =  path.join(__dirname, '..', 'source')
const fetchDir =  path.join(sourceDir, '_fetchdir')
const strapiDataDirPath = path.join(sourceDir, 'strapidata')

const strapiDatafrontpagecoursePath = path.join(strapiDataDirPath, 'FrontPageCourses.yaml')
const STRAPIDATA_FRONTPAGECOURSE = yaml.safeLoad(fs.readFileSync(strapiDatafrontpagecoursePath, 'utf8'))
const DOMAIN = process.env['DOMAIN'] || 'filmikool.poff.ee'

const languages = ['en', 'et', 'ru']

var failing = false
for (const lang of languages) {
    if (STRAPIDATA_FRONTPAGECOURSE.length < 1) {
        console.log(`ERROR! No data to fetch for ${DOMAIN} frontpagecourse`)
        const outFile = path.join(fetchDir, `frontpagecourses.${lang}.yaml`)
        fs.writeFileSync(outFile, '[]', 'utf8')
        continue
    }
    console.log(`Fetching ${DOMAIN} frontpagecourse ${lang} data`)

    let copyData = JSON.parse(JSON.stringify(STRAPIDATA_FRONTPAGECOURSE[0]))
    if (typeof copyData !== 'undefined') {

        for (key in copyData) {
            if (key === `courses_${lang}`) {

                for (courseIx in copyData[key]) {
                    let thisCourse = copyData[key][courseIx]
                    let courseYAMLPath = path.join(fetchDir, `courses.${lang}.yaml`)
                    let COURSESYAML = yaml.safeLoad(fs.readFileSync(courseYAMLPath, 'utf8'))

                    let thisCourseFromYAML = COURSESYAML.filter( (a) => { return thisCourse.id === a.id })[0];

                    if (thisCourseFromYAML.media) {
                        thisCourseFromYAML.carouselStills = thisCourseFromYAML.media?.stills.map(a => `${a.hash}${a.ext}`)
                        thisCourseFromYAML.posters = thisCourseFromYAML.media?.posters.map(a => `${a.hash}${a.ext}`)
                    }

                    if(thisCourseFromYAML !== undefined) {
                        var thisCourseFromYAMLCopy = JSON.parse(JSON.stringify(thisCourseFromYAML));
                    } else {
                        console.log('ERROR! Course ID ', thisCourse.id, ' not associated with domain ', DOMAIN, ', frontpagecourses not built!')
                        failing = true
                        continue
                    }
                    copyData[key][courseIx] = thisCourseFromYAMLCopy
                }

            copyData[key] = copyData[key].sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
            // Teistes keeltes kursus kustutatakse
            } else if (key !== `courses_${lang}` && key.substring(0, 8) === `courses_`) {
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
    const outFile = path.join(fetchDir, `frontpagecourses.${lang}.yaml`)
    fs.writeFileSync(outFile, allDataYAML, 'utf8')
}
