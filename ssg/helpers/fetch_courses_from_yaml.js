const fs = require('fs')
const yaml = require('js-yaml')
const path = require('path')
const rueten = require('./rueten.js')
const {fetchModel} = require('./b_fetch.js')

const { timer } = require("./timer")
timer.start(__filename)

const rootDir =  path.join(__dirname, '..')
const domainSpecificsPath = path.join(rootDir, 'domain_specifics.yaml')
const DOMAIN_SPECIFICS = yaml.load(fs.readFileSync(domainSpecificsPath, 'utf8'))

const sourceDir =  path.join(rootDir, 'source')
const fetchDir =  path.join(sourceDir, '_fetchdir')
const coursesDir =  path.join(fetchDir, 'courses')
const strapiDataDirPath = path.join(sourceDir, '_domainStrapidata')
const DOMAIN = process.env['DOMAIN'] || 'filmikool.poff.ee'
const allLanguages = DOMAIN_SPECIFICS.locales[DOMAIN]

if (DOMAIN === 'filmikool.poff.ee') {

    const strapiDataCoursePath = path.join(strapiDataDirPath, `Course.yaml`)
    const STRAPIDATA_COURSES = yaml.load(fs.readFileSync(strapiDataCoursePath, 'utf8')) || []

    const minimodel = {
        'languages': {
            model_name: 'Language'
        },
        'credentials': {
            model_name: 'Credentials',
            expand: {
                'rolePerson': {
                    model_name: 'RolePerson',
                    expand: {
                        'role_at_film': {
                            model_name: 'RoleAtFilm'
                        },
                        'person': {
                            model_name: 'Person'
                        }
                    }
                },
                'roleCompany': {
                    model_name: 'RoleCompany',
                    expand: {
                        'roles_at_film': {
                            model_name: 'RoleAtFilm'
                        },
                        'organisation': {
                            model_name: 'Organisation'
                        }
                    }
                }
            }
        },
        'presentedBy': {
            model_name: 'PresentedBy',
            expand: {
                'organisations': {
                    model_name: 'Organisation'
                }
            }
        },
        'events': {
            model_name: 'Event',
                expand: {
                'location': {
                    model_name: 'Location',
                    expand: {
                        'hall': {
                            model_name: 'Hall',
                            expand: {
                                'cinema': {
                                    model_name: 'Cinema',
                                    expand: {
                                        'town': {
                                            model_name: 'Town'
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    const STRAPIDATA_COURSE = fetchModel(STRAPIDATA_COURSES, minimodel)

    for (const lang of allLanguages) {
        const courseCopy = JSON.parse(JSON.stringify(STRAPIDATA_COURSE))

        console.log(`Fetching ${DOMAIN} course ${lang} data`);

        const filteredCourse = courseCopy.filter(c => c.slug_en || c.slug_et).map(course => {
            const dirSlug = course.slug_en || course.slug_et

            rueten(course, lang)

            if (course.languages) {
                course.languages = course.languages.map(l => l.name)
            }

            if (course.media) {
                course.carouselStills = course.media?.stills.map(a => `${a.hash}${a.ext}`)
                course.posters = course.media?.posters.map(a => `${a.hash}${a.ext}`)
            }

            // Rolepersons by role
            if(course.credentials && course.credentials.rolePerson && course.credentials.rolePerson[0]) {
                let rolePersonTypes = {}
                course.credentials.rolePerson.sort(function(a, b){ return (a.order > b.order) ? 1 : ((b.order > a.order) ? -1 : 0) })
                for (roleIx in course.credentials.rolePerson) {
                    let rolePerson = course.credentials.rolePerson[roleIx]
                    if (rolePerson === undefined) { continue }
                    if (rolePerson.person) {
                        let searchRegExp = new RegExp(' ', 'g')
                        const role_name_lc = rolePerson.role_at_film.roleNamePrivate.toLowerCase().replace(searchRegExp, '')
                        rolePersonTypes[role_name_lc] = rolePersonTypes[role_name_lc] || []

                        if (rolePerson.person.firstNameLastName) {
                            rolePersonTypes[role_name_lc].push(rolePerson.person.firstNameLastName)
                        } else if (personFromYAML.fullName) {
                            rolePersonTypes[role_name_lc].push(personFromYAML.fullName)
                        }
                    }
                }
                course.credentials.rolePersonsByRole = rolePersonTypes
            }

            // Rolecompanies by role
            if(course.credentials && course.credentials.roleCompany && course.credentials.roleCompany[0]) {
                let roleCompanyTypes = {}
                course.credentials.roleCompany.sort(function(a, b){ return (a.order > b.order) ? 1 : ((b.order > a.order) ? -1 : 0) })
                for (roleIx in course.credentials.roleCompany) {
                    let roleCompany = course.credentials.roleCompany[roleIx]
                    if (roleCompany === undefined) { continue }
                    if (roleCompany.organisation) {
                        let searchRegExp = new RegExp(' ', 'g')
                        const role_name_lc = roleCompany.roles_at_film.roleNamePrivate.toLowerCase().replace(searchRegExp, '')
                        roleCompanyTypes[role_name_lc] = roleCompanyTypes[role_name_lc] || []

                        if (roleCompany.organisation.name) {
                            roleCompanyTypes[role_name_lc].push(roleCompany.organisation.name)
                        }
                    }
                }
                course.credentials.roleCompaniesByRole = roleCompanyTypes
            }

            course.path = `courses/${dirSlug}`

            const oneYaml = yaml.dump(course, { 'noRefs': true, 'indent': '4' });
            const yamlPath = path.join(coursesDir, dirSlug, `data.${lang}.yaml`);

            let saveDir = path.join(coursesDir, dirSlug);
            fs.mkdirSync(saveDir, { recursive: true });

            fs.writeFileSync(yamlPath, oneYaml, 'utf8');
            fs.writeFileSync(`${saveDir}/index.pug`, `include /_templates/filmikool_course_index_template.pug`)
            return course
        }) || []

        let allDataYAML = yaml.dump(filteredCourse, { 'noRefs': true, 'indent': '4' });
        fs.writeFileSync(path.join(fetchDir, `courses.${lang}.yaml`), allDataYAML, 'utf8');
    }
} else {
    allLanguages.map(lang => {
        let emptyYAML = yaml.dump([], { 'noRefs': true, 'indent': '4' });
        fs.writeFileSync(path.join(fetchDir, `courses.${lang}.yaml`), emptyYAML, 'utf8');
    })
}
