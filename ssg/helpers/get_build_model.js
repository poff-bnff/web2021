#!/usr/bin/env node

const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');

// const rootDir =  path.join(__dirname, '..')
// const domainSpecificsPath = path.join(rootDir, 'domain_specifics.yaml')
// const DOMAIN_SPECIFICS = yaml.safeLoad(fs.readFileSync(domainSpecificsPath, 'utf8'))

let domainArgs = process.argv.slice(2)

const mapping_models = {
	'article-hero': 'hero',
	'hero-article-bruno': 'hero',
	'hero-article-filmikool': 'hero',
	'hero-article-hoff': 'hero',
	'hero-article-industry': 'hero',
	'hero-article-just-film': 'hero',
	'hero-article-kinoff': 'hero',
	'hero-article-kumu': 'hero',
	'hero-article-shorts': 'hero',
	'hero-article-tartuff': 'hero',

	'bruno-article': 'article',
	'filmikooli-article': 'article',
	'hof-fi-article': 'article',
	'industry-article': 'article',
	'just-filmi-article': 'article',
	'kinoffi-article': 'article',
	'kumu-article': 'article',
	'shortsi-article': 'article',
	'tartuffi-article': 'article',
	'pof-fi-article': 'article',

	'bruno-footer': 'footer',
	'filmikooli-footer': 'footer',
	'hof-fi-footer': 'footer',
	'industry-footer': 'footer',
	'just-filmi-footer': 'footer',
	'kinoffi-footer': 'footer',
	'kumu-footer': 'footer',
	'shortsi-footer': 'footer',
	'tartuffi-footer': 'footer',
	'pof-fi-footer': 'footer',

	'bruno-menu': 'menu',
	'filmikooli-menu': 'menu',
	'hof-fi-menu': 'menu',
	'industry-menu': 'menu',
	'just-filmi-menu': 'menu',
	'kinoffi-menu': 'menu',
	'kumu-menu': 'menu',
	'shortsi-menu': 'menu',
	'tartuffi-menu': 'menu',
	'pof-fi-menu': 'menu',

	'bruno-supporter': 'supporter',
	'filmikooli-supporter': 'supporter',
	'hof-fi-supporter': 'supporter',
	'industry-supporter': 'supporter',
	'supporters-just': 'supporter',
	'kinoffi-supporter': 'supporter',
	'kumu-supporter': 'supporter',
	'supporters-shorts': 'supporter',
	'tartuff-supporter': 'supporter',
	'supporters-page': 'supporter',

	'article-type':'',
	'cassette': '',
	'channel':'',
	'cinema': '',
	'country': '',
	'course': '',
	// 'domain': '',
	'event': '',
	'festival': '',
	'festival-edition': '',
	'festival-pass': '',
	'film': '',
	'gender': '',
	'hall': '',
	'label-group': '',
	'language': '',
	'location': '',
	'organisation': '',
	'person': '',
	'product': '',
	'product-category': '',
	'programme': '',
	'project-status': '',
	'project-type': '',
	'role-at-film': '',
	'screening': '',
	'screening-mode': '',
	'screening-type': '',
	'shop': '',
	'six-films': '',
	'tag-genre': '',
	'tag-keyword': '',
	'tag-premiere-type': '',
	'tag-programme': '',
	'team': '',
	'town': '',
	'transaction': '',

	'trio-bruno': 'trio',
	'trio-filmikool': 'trio',
	'trio-hoff': 'trio',
	'trio-industry': 'trio',
	'trio-just-film': 'trio',
	'trio-kinoff': 'trio',
	'trio-kumu': 'trio',
	'trio-shorts': 'trio',
	'trio-tartuff': 'trio',
	'trio-p-oe-ff': 'trio',

	'industry-category': '',
	'industry-event': '',
	'industry-group': '',
	'industry-person': '',
	'industry-person-type': '',
	'industry-project': '',

}

console.log(domainArgs[0])
console.log(mapping_models[domainArgs[0]])


return mapping_models[domainArgs[0]]