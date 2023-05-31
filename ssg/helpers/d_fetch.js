const fs = require('fs')
const yaml = require('js-yaml')
const path = require('path')
const {
    deleteFolderRecursive,
    mergeStrapidataUpdates
 } = require("./helpers.js")

const rootDir = path.join(__dirname, '..')
const sourceDir = path.join(rootDir, 'source')
const allStrapiDataDir = path.join(sourceDir, '_allStrapidata')
const domainStrapiDataDir = path.join(sourceDir, '_domainStrapidata')

const DOMAIN = process.env['DOMAIN'] || 'hoff.ee'

const strapiDomainsFilePath = path.join(allStrapiDataDir, 'Domain.yaml')
const DOMAINSYAML = yaml.load(fs.readFileSync(strapiDomainsFilePath, 'utf8'))
const DOMAIN_ID = DOMAINSYAML.filter(d => d.url === DOMAIN)[0].id

let checkDomain = function(element) {
    if (!DOMAIN) { return true }

    if (!element['domains'] && !element['domain']) {
        // console.log('checkDomain with no domains', {element})
        return true
    }

    element['domains'] = element['domains'] || [element['domain']] || []

    if (element.id === 15542 && element.firstName) {
        console.log('TESTPERSON DOMAINS ', element['domains'])
    }

    if (element.domains.length === 0) { return true }

    // return true, if any of the element's domains matches the DOMAIN_ID
    if (element['domains'] && element['domains'].length > 0) {
        if (element['domains'].filter(d => d['id'] === DOMAIN_ID).length > 0) {
            return true
        }
    }

    return false
}

deleteFolderRecursive(domainStrapiDataDir)
fs.mkdirSync(domainStrapiDataDir, { recursive: true })

// merge _updates.yaml files with the main yaml file in allStrapiDataDir
mergeStrapidataUpdates()

fs.readdir(allStrapiDataDir, (err, modelFiles) => {
    modelFiles.forEach(modelFile => {
        if (modelFile.endsWith('_updates.yaml')) {
            return
        }
        const modelData = yaml.load(fs.readFileSync(path.join(allStrapiDataDir, modelFile), 'utf8'))
        const domainModelData = modelData.filter(checkDomain)
        // stringify - parse is used for yaml dump to remove circular references?
        let YAMLData = yaml.dump(JSON.parse(JSON.stringify(domainModelData)), { 'noRefs': true, 'indent': '4' })
        fs.writeFileSync(path.join(domainStrapiDataDir, modelFile), YAMLData, 'utf8')
    })
})

console.log(`d_fetch finished. Saved domain specific domainStrapidata for ${DOMAIN}`)

