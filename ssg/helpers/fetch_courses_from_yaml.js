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
const coursesDir =  path.join(fetchDir, 'courses')
const strapiDataDirPath = path.join(sourceDir, 'strapidata')
const DOMAIN = 'filmikool.poff.ee'

const strapiDataCoursePath = path.join(strapiDataDirPath, `Course.yaml`)
const STRAPIDATA_COURSES = yaml.safeLoad(fs.readFileSync(strapiDataCoursePath, 'utf8')) || []

const minimodel = {
    'events': {
        model_name: 'Event'
    }
}

const STRAPIDATA_COURSE = fetchModel(STRAPIDATA_COURSES, minimodel)
const allLanguages = DOMAIN_SPECIFICS.locales[DOMAIN]

for (const lang of allLanguages) {
    const courseCopy = JSON.parse(JSON.stringify(STRAPIDATA_COURSE))

    console.log(`Fetching ${DOMAIN} course ${lang} data`);

    const filteredCourse = courseCopy.filter(c => c.slug_en || c.slug_et).map(course => {
        const dirSlug = course.slug_en || course.slug_et

        rueten(course, lang)
        course.data = {'articles': `/_fetchdir/articles.${lang}.yaml`};
        course.path = `courses/${dirSlug}`

        const oneYaml = yaml.safeDump(course, { 'noRefs': true, 'indent': '4' });
        const yamlPath = path.join(coursesDir, dirSlug, `data.${lang}.yaml`);

        let saveDir = path.join(coursesDir, dirSlug);
        fs.mkdirSync(saveDir, { recursive: true });

        fs.writeFileSync(yamlPath, oneYaml, 'utf8');
        fs.writeFileSync(`${saveDir}/index.pug`, `include /_templates/filmikool_course_index_template.pug`)
        return course
    }) || []

    let allDataYAML = yaml.safeDump(filteredCourse, { 'noRefs': true, 'indent': '4' });
    fs.writeFileSync(path.join(fetchDir, `courses.${lang}.yaml`), allDataYAML, 'utf8');
}
