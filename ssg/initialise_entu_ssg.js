const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');

const rootDir =  path.join(__dirname)
const templatePath = path.join(rootDir, 'entu-ssg-template.yaml')
console.log('! templatePath', templatePath);
const mappingsPath = path.join(rootDir, 'domain_specifics.yaml')
console.log('! mappingsPath', mappingsPath);
const ssgConfPath = path.join(rootDir, 'entu-ssg.yaml')
console.log('! ssgConfPath', ssgConfPath);

const DOMAIN = process.env['DOMAIN'] || 'poff.ee'
console.log('! DOMAIN', DOMAIN);

const template = yaml.safeLoad(fs.readFileSync(templatePath, 'utf8'))
console.log('! template', template);

const mappings = yaml.safeLoad(fs.readFileSync(mappingsPath, 'utf8'))
console.log('! mappings', mappings);


template.locales = mappings.locales[DOMAIN]
console.log('! template.locales', template.locales);

template.defaultLocale = mappings.defaultLocale[DOMAIN]
console.log('! template.defaultLocale', template.defaultLocale);

template.build = './build/' + mappings.domain[DOMAIN]
console.log('! template.build', template.build);

let ssg_conf = yaml.safeDump(template, { 'noRefs': true, 'indent': '4' })

try {
    fs.writeFileSync(ssgConfPath, ssg_conf, 'utf8')

  } catch(err) {
    // An error occurred
    console.error(err);
  }
