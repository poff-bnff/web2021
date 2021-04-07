const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');
const rueten = require('./rueten.js');

const rootDir =  path.join(__dirname, '..')
const domainSpecificsPath = path.join(rootDir, 'domain_specifics.yaml')
const DOMAIN_SPECIFICS = yaml.safeLoad(fs.readFileSync(domainSpecificsPath, 'utf8'))

const sourceDir =  path.join(rootDir, 'source');
const fetchDir =  path.join(sourceDir, '_fetchdir');
const fetchDataDir =  path.join(fetchDir, 'products');
const strapiDataDirPath = path.join(sourceDir, '_domainStrapidata');

const strapiDataShopPath = path.join(strapiDataDirPath, 'Shop.yaml');
const STRAPIDATA_SHOPS = yaml.safeLoad(fs.readFileSync(strapiDataShopPath, 'utf8'))
const strapiDataProdCategoryPath = path.join(strapiDataDirPath, 'ProductCategory.yaml');
const STRAPIDATA_PROD_CATEGORIES = yaml.safeLoad(fs.readFileSync(strapiDataProdCategoryPath, 'utf8'))
const DOMAIN = process.env['DOMAIN'] || 'poff.ee';

const mapping = DOMAIN_SPECIFICS.domain
const allLanguages = DOMAIN_SPECIFICS.locales[DOMAIN]

for (const lang of allLanguages) {
    console.log(`Fetching ${DOMAIN} shops ${lang} data`);

    var allData = []
    for (const ix in STRAPIDATA_SHOPS) {

        if (mapping[DOMAIN]) {
            var templateDomainName = mapping[DOMAIN];
        }else{
            console.log('ERROR! Missing domain name for assigning template.');
            continue;
        }
        let element = JSON.parse(JSON.stringify(STRAPIDATA_SHOPS[ix]));

        if (element.prodCatList && element.prodCatList.length) {
            for (const catListIx in element.prodCatList) {
                let prodCatList = element.prodCatList[catListIx]
                if (prodCatList.orderedProductCategories && prodCatList.orderedProductCategories.length) {
                    for (const catIx in prodCatList.orderedProductCategories) {
                        let category = prodCatList.orderedProductCategories[catIx].product_category
                        if (typeof category !== 'undefined') {
                            let categoryFromYAML = STRAPIDATA_PROD_CATEGORIES.filter( (a) => { return category.id === a.id})
                            if (categoryFromYAML.length) {
                                let categoryFromYAMLcopy = JSON.parse(JSON.stringify(categoryFromYAML[0]))

                                prodCatList.orderedProductCategories[catIx].product_category = categoryFromYAMLcopy

                                if (categoryFromYAMLcopy[`slug_${lang}`]) {
                                    categoryFromYAMLcopy.path = `${categoryFromYAMLcopy[`slug_${lang}`]}`;
                                }
                                let dirSlug = categoryFromYAMLcopy.slug_en || categoryFromYAMLcopy.slug_et ? categoryFromYAMLcopy.slug_en || categoryFromYAMLcopy.slug_et : null ;
                                if (dirSlug != null && typeof categoryFromYAMLcopy.path !== 'undefined') {

                                    rueten(categoryFromYAMLcopy, lang)
                                    const oneYaml = yaml.safeDump(categoryFromYAMLcopy, { 'noRefs': true, 'indent': '4' });
                                    const yamlPath = path.join(fetchDataDir, dirSlug, `data.${lang}.yaml`);

                                    let saveDir = path.join(fetchDataDir, dirSlug);
                                    fs.mkdirSync(saveDir, { recursive: true });

                                    fs.writeFileSync(yamlPath, oneYaml, 'utf8');
                                    fs.writeFileSync(`${saveDir}/index.pug`, `include /_templates/product_${templateDomainName}_index_template.pug`)

                                } else {
                                    console.log(`ERROR! Skipped product_cat ${categoryFromYAMLcopy.id} due to missing slug_en/slug_et`);
                                }
                            }
                        }
                    }
                }
            }
        }

        element = rueten(element, lang);
        allData.push(element)
    }

    const allDataYAML = yaml.safeDump(allData, { 'noRefs': true, 'indent': '4' });
    const yamlPath = path.join(fetchDir, `shops.${lang}.yaml`);
    fs.writeFileSync(yamlPath, allDataYAML, 'utf8');
}
