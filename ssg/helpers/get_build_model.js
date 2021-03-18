
function model(arg) {
	// let domainArgs = process.argv.slice(2)

	const mapping_models = {
		'article-hero': 'full',
		'hero-article-bruno': 'full',
		'hero-article-filmikool': 'full',
		'hero-article-hoff': 'full',
		'hero-article-industry': 'full',
		'hero-article-just-film': 'full',
		'hero-article-kinoff': 'full',
		'hero-article-kumu': 'full',
		'hero-article-shorts': 'full',
		'hero-article-tartuff': 'full',

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

		'bruno-footer': 'full',
		'filmikooli-footer': 'full',
		'hof-fi-footer': 'full',
		'industry-footer': 'full',
		'just-filmi-footer': 'full',
		'kinoffi-footer': 'full',
		'kumu-footer': 'full',
		'shortsi-footer': 'full',
		'tartuffi-footer': 'full',
		'pof-fi-footer': 'full',

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

		'bruno-supporter': 'full',
		'filmikooli-supporter': 'full',
		'hof-fi-supporter': 'full',
		'industry-supporter': 'full',
		'supporters-just': 'full',
		'kinoffi-supporter': 'full',
		'kumu-supporter': 'full',
		'supporters-shorts': 'full',
		'tartuff-supporter': 'full',
		'supporters-page': 'full',

		'article-type':'full',
		'cassette': 'full', // cassette
		'channel':'full',
		'cinema': 'full',
		'country': 'full',
		'course': 'full',
		// 'domain': 'full',
		'event': 'full',
		'festival': 'full',
		'festival-edition': 'full',
		'festival-pass': 'full',
		'film': 'full',
		'front-page-courses': 'full',
		'gender': 'full',
		'hall': 'full',
		'label-group': 'full',
		'language': 'full',
		'location': 'full',
		'organisation': 'full',
		'person': 'full',
		'product': 'full',
		'product-category': 'full',
		'programme': 'full',
		'project-status': 'full',
		'project-type': 'full',
		'role-at-film': 'full',
		'screening': 'full', // screening
		'screening-mode': 'full',
		'screening-type': 'full',
		'shop': 'full',
		'six-films': 'full',
		'tag-genre': 'full',
		'tag-keyword': 'full',
		'tag-premiere-type': 'full',
		'tag-programme': 'full',
		'team': 'full',
		'town': 'full',
		'transaction': 'full',

		'trio-bruno': 'full',
		'trio-filmikool': 'full',
		'trio-hoff': 'full',
		'trio-industry': 'full',
		'trio-just-film': 'full',
		'trio-kinoff': 'full',
		'trio-kumu': 'full',
		'trio-shorts': 'full',
		'trio-tartuff': 'full',
		'trio-p-oe-ff': 'full',

		'industry-category': 'full',
		'industry-event': 'full',
		'industry-group': 'full',
		'industry-person': 'full',
		'industry-person-type': 'full',
		'industry-project': 'full',
		'full': 'full'
	}

	return mapping_models[arg]
}

exports.model = model