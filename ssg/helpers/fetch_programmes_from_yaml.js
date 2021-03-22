const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');
const rueten = require('./rueten.js');

const rootDir =  path.join(__dirname, '..')
const sourceDir =  path.join(__dirname, '..', 'source');
const fetchDir =  path.join(sourceDir, '_fetchdir');
const fetchDataDir =  path.join(fetchDir, 'programmes');
const strapiDataDirPath = path.join(sourceDir, '_domainStrapidata');
const strapiDataProgrammePath = path.join(strapiDataDirPath, 'Programme.yaml')
const STRAPIDATA_PROGRAMME = yaml.safeLoad(fs.readFileSync(strapiDataProgrammePath, 'utf8'))
const strapiDataOrganisationPath = path.join(strapiDataDirPath, 'Organisation.yaml')
const STRAPIDATA_ORGANISATIONS = yaml.safeLoad(fs.readFileSync(strapiDataOrganisationPath, 'utf8'))
const domainSpecificsPath = path.join(rootDir, 'domain_specifics.yaml')
const DOMAIN_SPECIFICS = yaml.safeLoad(fs.readFileSync(domainSpecificsPath, 'utf8'))

const params = process.argv.slice(2)
const param_build_type = params[0]
const target_id = params.slice(1)

const addConfigPathAliases = require('./add_config_path_aliases.js')

const DOMAIN = process.env['DOMAIN'] || 'hoff.ee';

const languages = ['en', 'et', 'ru']
const mapping = {
    'poff.ee': 'poff',
    'justfilm.ee': 'justfilm',
    'kinoff.poff.ee': 'kinoff',
    'industry.poff.ee': 'industry',
    'shorts.poff.ee': 'shorts',
    'hoff.ee': 'hoff',
    'kumu.poff.ee': 'kumu',
    'tartuff.ee': 'tartuff',
    'filmikool.poff.ee': 'filmikool',
    'oyafond.ee': 'bruno'
}

const festival_editions = DOMAIN_SPECIFICS.programmes_festival_editions[DOMAIN] || []

for (const ix in languages) {
    const lang = languages[ix];
    console.log(`Fetching ${DOMAIN} programmes ${lang} data`);

    // Filter out all programmes that do not have at least one FE defined
    // under domain specifics programmes_festival_editions
    var STRAPIDATA_PROGRAMMES = STRAPIDATA_PROGRAMME.filter(programmes => {
        if (programmes.festival_editions && programmes.festival_editions.length) {
            let programmes_festival_editions_ids = programmes.festival_editions.map(edition => edition.id)
            return programmes_festival_editions_ids.filter(cfe_id => festival_editions.includes(cfe_id))[0] !== undefined
        } else {
            return false
        }
    })

    var allData = []
    for (const ix in STRAPIDATA_PROGRAMMES) {

        if (param_build_type === 'target' && !target_id.includes((STRAPIDATA_PROGRAMMES[ix].id).toString())) {
            continue
        }

        if (mapping[DOMAIN]) {
            var templateDomainName = mapping[DOMAIN];
        }else{
            console.log('ERROR! Missing domain name for assigning template.');
            continue;
        }
        let element = JSON.parse(JSON.stringify(STRAPIDATA_PROGRAMMES[ix]));
        let dirSlug = element.slug_en || element.slug_et ? element.slug_en || element.slug_et : null ;


        for (eIx in element.festival_editions) {
            if(element.presentedBy && element.presentedBy[0]) {
                for (orgIx in element.presentedBy.organisations) {
                    let organisationFromYAML = STRAPIDATA_ORGANISATIONS.filter( (a) => { return element.presentedBy.organisations[orgIx].id === a.id })
                    let organisationCopy = JSON.parse(JSON.stringify(organisationFromYAML[0]))
                    if (organisationCopy) {
                        element.presentedBy.organisations[orgIx] = rueten(organisationCopy, lang);
                    }
                }
            }
        }

        element = rueten(element, lang);

        for (key in element) {
            if (key == 'slug') {
                element.path = element[key];
                element.slug = element[key];
            }
        }

        if (element.path === undefined) {
            element.path = dirSlug;
            element.slug = dirSlug;
        }

        if (param_build_type === 'target') {
            addConfigPathAliases([
                `/_fetchdir/programmes/${dirSlug}`
            ])
        }

        element.data = {'cassettes': '/_fetchdir/cassettes.' + lang + '.yaml'};

        if (dirSlug != null && typeof element.path !== 'undefined') {
            const oneYaml = yaml.safeDump(element, { 'noRefs': true, 'indent': '4' });
            const yamlPath = path.join(fetchDataDir, dirSlug, `data.${lang}.yaml`);

            allData.push(element)

            let saveDir = path.join(fetchDataDir, dirSlug);
            fs.mkdirSync(saveDir, { recursive: true });

            fs.writeFileSync(yamlPath, oneYaml, 'utf8');
            fs.writeFileSync(`${saveDir}/index.pug`, `include /_templates/programmes_${templateDomainName}_index_template.pug`)
        }

    }

    const allDataSorted = allData.sort(function(a, b) {
            // nulls sort after anything else
            if (a.order === undefined) {
                return 1;
            }
            else if (b.order === undefined) {
                return -1;
            } else {
                return (a.order > b.order) ? 1 : ((b.order > a.order) ? -1 : 0);
            }
    })
    const allDataYAML = yaml.safeDump(allData, { 'noRefs': true, 'indent': '4' });
    const yamlPath = path.join(fetchDir, `programmes.${lang}.yaml`);
    fs.writeFileSync(yamlPath, allDataYAML, 'utf8');
}
