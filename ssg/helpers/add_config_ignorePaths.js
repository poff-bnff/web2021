const fs = require('fs')
const yaml = require('js-yaml')
const path = require('path')

const rootDir = path.join(__dirname, '..')
const buildConfigPath = path.join(rootDir, 'entu-ssg.yaml')
const BUILD_CONFIG = yaml.load(fs.readFileSync(buildConfigPath, 'utf8'))
let BUILD_IGNOREPATHS = []
const DOMAIN = process.env['DOMAIN'] || 'hoff.ee'

function addConfigIgnorePaths() {

    if (DOMAIN === 'poff.ee') {
        return [
            '/_socket_dashboard', //industry
            // '/a_list', //article
            // '/about', //article
            // '/articles', //article
            '/courses', //filmikool
            '/covid', //tartuff?
            '/eventival_persons_search', //industry
            '/events', //filmikool
            // '/favourite', //poff
            // '/films', //all
            // '/home', //all
            '/industry_cal', //industry
            '/industry_events', //industry
            '/industry_events_search', //industry
            '/industry_mycal', //industry
            '/industry_persons', //industry
            '/industry_persons_search', //industry
            '/discamp_persons_search', //discamp
            '/industryproject', //industry
            '/industry_projects', //industry
            '/industry_projects_search', //industry
            '/industry_projects_archive_search', //industry
            '/industry_persons_archive_search', //industry
            '/info', //tartuff
            '/locations', //locations - tulevikus domeeni järgi, mis L all relatsioonina
            // '/interview', //article
            // '/login', //poff, industry
            // '/menu', //all
            // '/mypoff', // poff
            // '/my_screenings', // poff
            // '/news', // article
            // '/programmes', // all except industry
            // '/screenings', // all except industry
            // '/screenings-search', // all except industry
            // '/search', // all except industry
            // '/shop', // poff
            // '/signup', // poff
            // '/sponsorstories', //article
            // '/supporterpage', //all
            // '/userprofile', //poff, industry
            '/virtual_booth', //industry
            '/favouriteAWS', //OldAWSFavoritePageBackup
            '/search_archive', //Search film archive
            '/industry_courseevents_search', //Industry Events
            '/persons_search', //Persons for Industry
            '/courses_courseevents', //Filmikool
            '/discamp_events_search', //Discamp events
            '/discamp_courseevents_search', //Discamp events
            '/filmikool_courseevents_search', //Filmikool events
        ]
    } else if (DOMAIN === 'filmikool.poff.ee') {
        return [
            '/_socket_dashboard', //industry
            '/covid', //tartuff?
            '/eventival_persons_search', //industry
            '/favourite', //poff
            '/industry_cal', //industry
            '/industry_events', //industry
            '/industry_events_search', //industry
            '/industry_mycal', //industry
            '/industry_persons', //industry
            '/industry_persons_search', //industry
            '/discamp_persons_search', //discamp
            '/industryproject', //industry
            '/industry_projects', //industry
            '/industry_projects_search', //industry
            '/industry_projects_archive_search', //industry
            '/industry_persons_archive_search', //industry
            '/info', //tartuff
            '/letschat', // POFF letschat page
            '/login', //poff, industry
            '/mypoff', // poff, industry
            '/my_screenings', // poff
            '/shop', // poff
            '/signup', //poff, industry
            '/userprofile', //poff, industry
            '/virtual_booth', //industry
            '/favouriteAWS', //OldAWSFavoritePageBackup
            '/search_archive', //Search film archive
            '/persons_search', //Persons for Industry
            '/industry_courseevents_search', //Industry Events
            '/discamp_events_search', //Discamp events
            '/discamp_courseevents_search', //Discamp events
        ]
    } else if (DOMAIN === 'hoff.ee' || DOMAIN === 'justfilm.ee' || DOMAIN === 'kinoff.poff.ee' || DOMAIN === 'kumu.poff.ee' || DOMAIN === 'oyafond.ee' || DOMAIN === 'shorts.poff.ee') {
        return [
            '/_socket_dashboard', //industry
            '/courses', //filmikool
            '/covid', //tartuff?
            '/eventival_persons_search', //industry
            '/events', //filmikool
            '/favourite', //poff
            '/industry_cal', //industry
            '/industry_events', //industry
            '/industry_events_search', //industry
            '/industry_mycal', //industry
            '/industry_persons', //industry
            '/industry_persons_search', //industry
            '/discamp_persons_search', //discamp
            '/industryproject', //industry
            '/industry_projects', //industry
            '/industry_projects_search', //industry
            '/industry_projects_archive_search', //industry
            '/industry_persons_archive_search', //industry
            '/info', //tartuff
            '/letschat', // POFF letschat page
            '/login', //poff, industry
            '/mypoff', // poff, industry
            '/my_screenings', // poff
            '/shop', // poff
            '/signup', //poff, industry
            '/userprofile', //poff, industry
            '/virtual_booth', //industry
            '/favouriteAWS', //OldAWSFavoritePageBackup
            '/search_archive', //Search film archive
            '/industry_courseevents_search', //Industry Events
            '/persons_search', //Persons for Industry
            '/courses_courseevents', //Filmikool
            '/discamp_events_search', //Discamp events
            '/discamp_courseevents_search', //Discamp events
            '/filmikool_courseevents_search', //Filmikool events
        ]
    } else if (DOMAIN === 'industry.poff.ee') {
        return [
            '/films', // all except industry
            '/my_screenings', // poff
            '/screenings', // all except industry
            '/screenings-search', // all except industry
            '/programmes', // all except industry
            '/shop', // poff
            '/search', // all except industry
            '/mypoff', // poff
            '/signup', // poff
            '/courses', //filmikool
            '/covid', //tartuff?
            '/events', //filmikool
            '/favourite', //poff
            '/info', //tartuff
            '/letschat', // POFF letschat page
            '/favouriteAWS', //OldAWSFavoritePageBackup
            '/search_archive', //Built by archive build
            '/industry_projects_archive_search', //Built by archive build
            '/industry_persons_archive_search', //Built by archive build
            '/discamp_events_search', //discamp
            '/discamp_persons_search', //discamp
            '/industry_cal', //old
            '/industry_events', //old
            '/courses_courseevents', //Filmikool
            '/discamp_events_search', //Discamp events
            '/discamp_courseevents_search', //Discamp events
            '/filmikool_courseevents_search', //Filmikool events
        ]
    } else if (DOMAIN === 'discoverycampus.poff.ee') {
        return [
            '/films', // all except industry
            '/my_screenings', // poff
            '/screenings', // all except industry
            '/screenings-search', // all except industry
            '/programmes', // all except industry
            '/shop', // poff
            '/search', // all except industry
            '/mypoff', // poff
            '/signup', // poff
            '/covid', //tartuff?
            '/events', //filmikool
            '/favourite', //poff
            '/info', //tartuff
            '/letschat', // POFF letschat page
            '/favouriteAWS', //OldAWSFavoritePageBackup
            '/search_archive', //Built by archive build
            '/industry_persons_search', //industry
            '/industry_projects_archive_search', //Built by archive build
            '/industry_persons_archive_search', //Built by archive build
            '/persons_search', //Persons for Industry
            '/industry_events_search', //industry
            '/industry_courseevents_search', //Industry Events
            '/courses_courseevents', //Filmikool
            '/filmikool_courseevents_search', //Filmikool events
        ]
    } else if (DOMAIN === 'tartuff.ee') {
        return [
            '/_socket_dashboard', //industry
            '/courses', //filmikool
            '/eventival_persons_search', //industry
            '/events', //filmikool
            '/industry_cal', //industry
            '/industry_events', //industry
            '/industry_events_search', //industry
            '/industry_mycal', //industry
            '/industry_persons', //industry
            '/industry_persons_search', //industry
            '/discamp_persons_search', //discamp
            '/industryproject', //industry
            '/industry_projects', //industry
            '/industry_projects_search', //industry
            '/industry_projects_archive_search', //industry
            '/industry_persons_archive_search', //industry
            '/letschat', // POFF letschat page
            '/login', //poff, industry
            '/mypoff', // poff, industry
            '/my_screenings', // poff
            '/shop', // poff
            '/signup', //poff, industry
            '/userprofile', //poff, industry
            '/virtual_booth', //industry
            '/favouriteAWS', //OldAWSFavoritePageBackup
            '/search_archive', //Search film archive
            '/industry_courseevents_search', //Industry Events
            '/persons_search', //Persons for Industry
            '/courses_courseevents', //Filmikool
            '/discamp_events_search', //Discamp events
            '/discamp_courseevents_search', //Discamp events
            '/filmikool_courseevents_search', //Filmikool events
        ]
    } else {
        return null
    }
}
BUILD_CONFIG.dev.ignorePaths = addConfigIgnorePaths()

// console.log(DOMAIN, BUILD_IGNOREPATHS, BUILD_CONFIG)

const BUILD_CONFIG_YAML = yaml.dump(BUILD_CONFIG, { 'noRefs': true, 'indent': '4' })
fs.writeFileSync(buildConfigPath, BUILD_CONFIG_YAML, 'utf8')
