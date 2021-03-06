const fs = require('fs')
const yaml = require('js-yaml')
const path = require('path')

const rootDir =  path.join(__dirname, '..')
const buildConfigPath = path.join(rootDir, 'entu-ssg.yaml')
const BUILD_CONFIG = yaml.load(fs.readFileSync(buildConfigPath, 'utf8'))
let BUILD_IGNOREPATHS = []
const DOMAIN = process.env['DOMAIN'] || 'hoff.ee'

function addConfigIgnorePaths() {

	if( DOMAIN ==='poff.ee'){
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
			'/film', // 2020 tartuffi jäänuk
			// '/films', //all
			// '/home', //all
			'/industry_cal', //industry
			'/industry_events', //industry
			'/industry_events_search', //industry
			'/industry_mycal', //industry
			'/industry_persons', //industry
			'/industry_persons_search', //industry
			'/industryproject', //industry
			'/industry_projects', //industry
			'/industry_projects_search', //industry
			'/info', //tartuff
			// '/interview', //article
			'/letschat', //chat industry
			// '/login', //poff, industry
			// '/menu', //all
			// '/mypoff', // poff
			// '/myscreenings', // poff
			// '/news', // article
			// '/programmes', // all except industry
			// '/schedule', // all except industry
			// '/screenings', // all except industry
			// '/screenings-search', // all except industry
			// '/search', // all except industry
			// '/shop', // poff
			// '/signup', // poff
			// '/sponsorstories', //article
			// '/supporterpage', //all
			// '/userprofile', //poff, industry
			'/virtual_booth', //industry
		]
	}else if(DOMAIN==='filmikool.poff.ee'){
		return [
			'/_socket_dashboard', //industry
			'/covid', //tartuff?
			'/eventival_persons_search', //industry
			'/favourite', //poff
			'/film', // 2020 tartuffi jäänuk
			'/industry_cal', //industry
			'/industry_events', //industry
			'/industry_events_search', //industry
			'/industry_mycal', //industry
			'/industry_persons', //industry
			'/industry_persons_search', //industry
			'/industryproject', //industry
			'/industry_projects', //industry
			'/industry_projects_search', //industry
			'/info', //tartuff
			'/letschat', //chat industry
			'/login', //poff, industry
			'/mypoff', // poff, industry
			'/myscreenings', // poff
            '/shop', // poff
			'/signup', //poff, industry
			'/userprofile', //poff, industry
			'/virtual_booth', //industry
		]
	} else if(DOMAIN==='hoff.ee' || DOMAIN==='justfilm.ee' || DOMAIN==='kinoff.poff.ee' || DOMAIN==='kumu.poff.ee' || DOMAIN==='oyafond.ee' || DOMAIN==='shorts.poff.ee'){
		return [
			'/_socket_dashboard', //industry
			'/courses', //filmikool
			'/covid', //tartuff?
			'/eventival_persons_search', //industry
			'/events', //filmikool
			'/favourite', //poff
			'/film', // 2020 tartuffi jäänuk
			'/industry_cal', //industry
			'/industry_events', //industry
			'/industry_events_search', //industry
			'/industry_mycal', //industry
			'/industry_persons', //industry
			'/industry_persons_search', //industry
			'/industryproject', //industry
			'/industry_projects', //industry
			'/industry_projects_search', //industry
			'/info', //tartuff
			'/letschat', //chat industry
			'/login', //poff, industry
			'/mypoff', // poff, industry
			'/myscreenings', // poff
            '/shop', // poff
			'/signup', //poff, industry
			'/userprofile', //poff, industry
			'/virtual_booth', //industry
		]
	} else if( DOMAIN === 'industry.poff.ee'){
		return [
			'/film', // 2020 tartuffi jäänuk
			'/films', // all except industry
			'/myscreenings', // poff
            '/screenings', // all except industry
			'/screenings-search', // all except industry
            '/schedule', // all except industry
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
		]
	} else if( DOMAIN === 'tartuff.ee'){
		return [
			'/film', // 2020 tartuffi jäänuk
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
			'/industryproject', //industry
			'/industry_projects', //industry
			'/industry_projects_search', //industry
			'/letschat', //chat industry
			'/login', //poff, industry
			'/mypoff', // poff, industry
			'/myscreenings', // poff
            '/shop', // poff
			'/signup', //poff, industry
			'/userprofile', //poff, industry
			'/virtual_booth', //industry
		]
	} else {
		return null
	}
}
	BUILD_CONFIG.dev.ignorePaths = addConfigIgnorePaths()

	// console.log(DOMAIN, BUILD_IGNOREPATHS, BUILD_CONFIG)

    const BUILD_CONFIG_YAML = yaml.dump(BUILD_CONFIG, { 'noRefs': true, 'indent': '4' })
    fs.writeFileSync(buildConfigPath, BUILD_CONFIG_YAML, 'utf8')

module.exports = addConfigIgnorePaths
