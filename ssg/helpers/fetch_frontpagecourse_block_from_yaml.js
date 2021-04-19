const fs = require('fs')
const yaml = require('js-yaml')
const path = require('path')
const rueten = require('./rueten.js')
const {fetchModel} = require('./b_fetch.js')

const sourceDir =  path.join(__dirname, '..', 'source')
const fetchDir =  path.join(sourceDir, '_fetchdir')
const strapiDataDirPath = path.join(sourceDir, '_domainStrapidata')

const strapiDatafrontpagecoursePath = path.join(strapiDataDirPath, 'FrontPageCourses.yaml')
const STRAPIDATA_FRONTPAGECOURSES = yaml.load(fs.readFileSync(strapiDatafrontpagecoursePath, 'utf8'))
const DOMAIN = process.env['DOMAIN'] || 'filmikool.poff.ee'

const languages = ['en', 'et', 'ru']

const minimodel = {
    'courses_et': {
        model_name: 'Course'
    },
    'courses_en': {
        model_name: 'Course'
    },
    'courses_ru': {
        model_name: 'Course'
    },
}

const STRAPIDATA_FRONTPAGECOURSE = fetchModel(STRAPIDATA_FRONTPAGECOURSES, minimodel)

var failing = false
for (const lang of languages) {
    if (STRAPIDATA_FRONTPAGECOURSE.length < 1) {
        console.log(`No data to fetch for ${DOMAIN} frontpagecourse`)
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
                    let thisCourse = rueten(copyData[key][courseIx], lang)
                    let courseYAMLPath = path.join(fetchDir, `courses.${lang}.yaml`)

                    if (thisCourse.media) {
                        thisCourse.carouselStills = thisCourse.media?.stills.map(a => `${a.hash}${a.ext}`)
                        thisCourse.posters = thisCourse.media?.posters.map(a => `${a.hash}${a.ext}`)
                    }

                    if(thisCourse !== undefined) {
                        var thisCourseCopy = JSON.parse(JSON.stringify(thisCourse));
                    } else {
                        console.log('ERROR! Course ID ', thisCourse.id, ' not associated with domain ', DOMAIN, ', frontpagecourses not built!')
                        failing = true
                        continue
                    }
                    copyData[key][courseIx] = thisCourseCopy
                }

            copyData[key] = copyData[key].sort((a, b) => new Date(a.startDate) - new Date(b.startDate))

            console.log(`Total of ${copyData[key].length} ${DOMAIN} frontpagecourse ${lang} fetched`)

            // Teistes keeltes kursus kustutatakse
            } else if (key !== `courses_${lang}` && key.substring(0, 8) === `courses_`) {
                delete copyData[key]
            }

        }
    }

    rueten(copyData, lang)

    if (failing || copyData === undefined) {
        var allDataYAML = yaml.dump([], { 'noRefs': true, 'indent': '4' })
    } else {
        var allDataYAML = yaml.dump(copyData, { 'noRefs': true, 'indent': '4' })
    }
    const outFile = path.join(fetchDir, `frontpagecourses.${lang}.yaml`)
    fs.writeFileSync(outFile, allDataYAML, 'utf8')
}
