const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');
const { deleteFolderRecursive } = require("./helpers.js")

const rootDir = path.join(__dirname, '..')
const sourceDir = path.join(rootDir, 'source')
const strapiDataPath = path.join(sourceDir, '_allStrapidata')
const domainStrapiDataPath = path.join(sourceDir, '_domainStrapidata')

const DOMAIN = process.env['DOMAIN'] || 'hoff.ee'

const domainsStrapiDataPath = path.join(strapiDataPath, 'Domain.yaml')
const DOMAINSMAPPING = {}
const DOMAINSYAML = yaml.load(fs.readFileSync(domainsStrapiDataPath, 'utf8'))
    .map(d => DOMAINSMAPPING[d.url] = d.id)

let checkDomain = function(element) {
    if (!DOMAIN) {
        return true
    }

    // kui on domain, siis element['domains'] = [domain]
    if (element['domain'] && !element['domains']){
        element['domains'] = [element['domain']]
    }

    if (element.id === 15542 && element.firstName) {
        console.log('TESTPERSON DOMAINS ', element['domains']);
    }

    if (element.domains === undefined || !element?.domains?.length) {
        // console.log(3)
        return true
    }

    for(let ix in element['domains']){
        let el = element['domains'][ix]
        // console.log(ix, el)
        if (el['id'] === DOMAINSMAPPING[DOMAIN]){
            return true
        }
    }

    return false
}

function readYAML(file) {
    const YAMLPath = path.join(strapiDataPath, file)
    const allDataYAML = yaml.load(fs.readFileSync(YAMLPath, 'utf8'))
    return allDataYAML
}

function writeYAML(file, data) {
    // console.log(JSON.stringify(strapiData[modelName], 0, 2))
    let YAMLData = yaml.dump(JSON.parse(JSON.stringify(data)), { 'noRefs': true, 'indent': '4' })
    const YAMLPath = path.join(domainStrapiDataPath, file)
    fs.writeFileSync(YAMLPath, YAMLData, 'utf8')
}


deleteFolderRecursive(domainStrapiDataPath)
fs.mkdirSync(domainStrapiDataPath, { recursive: true })

fs.readdir(strapiDataPath, (err, files) => {
    files.forEach(file => {

        const allDataYAML = readYAML(file)
        const domainData = allDataYAML.filter(checkDomain)
        writeYAML(file, domainData)

    });
    console.log(`Finished writing domain specific domainStrapidata for ${DOMAIN}`);
});

