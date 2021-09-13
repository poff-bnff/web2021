const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');

const rootDir = path.join(__dirname, '..')
const domainSpecificsPath = path.join(rootDir, 'domain_specifics.yaml')
const DOMAIN_SPECIFICS = yaml.load(fs.readFileSync(domainSpecificsPath, 'utf8'))

const sourceDir = path.join(__dirname, '..', 'source')
const fetchDir = path.join(sourceDir, '_fetchdir')

// Read all locales
const allLocales = DOMAIN_SPECIFICS.allLocales

// List YAMLs to create if not exists
// Example /source/home YAMLs
const allDomainYamls = [
    'heroarticle',
    'articletrioblock',
    'sixfilms',
    'articles',
    'industryevents',
    'channels',
    'frontpagecourses',
]

allDomainYamls.map(yamlType => {
    allLocales.map(locale => {
        const yamlFilePath = path.join(fetchDir, `${yamlType}.${locale}.yaml`)
        const exists = fs.existsSync(yamlFilePath)
        if (!exists) {
            console.log(`Creating empty ${yamlType}.${locale}.yaml`);
            let emptyYAML = yaml.dump([], { 'noRefs': true, 'indent': '4' });
            fs.writeFileSync(yamlFilePath, emptyYAML, 'utf8');
        }
    })
})
