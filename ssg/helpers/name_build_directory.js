#!/usr/bin/env node

const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');

const rootDir = path.join(__dirname, '..')
const domainSpecificsPath = path.join(rootDir, 'domain_specifics.yaml')
const DOMAIN_SPECIFICS = yaml.load(fs.readFileSync(domainSpecificsPath, 'utf8'))

let domainArgs = process.argv.slice(2)

if (domainArgs.length >= 1) {
    function buildDir() {
        if (domainArgs.length > 1 && domainArgs[1] === 'archive') {
            return path.join('archive', DOMAIN_SPECIFICS.domain[domainArgs[0]]);
        } else {
            return path.join('build', DOMAIN_SPECIFICS.domain[domainArgs[0]]);
        }
    }
    console.log(buildDir())
}
else {
    const DOMAIN = process.env['DOMAIN']

    function buildDir() {
        return path.join('build', DOMAIN_SPECIFICS.domain[DOMAIN]);
    }
    console.log(buildDir())
}


