#!/usr/bin/env node

const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');

const rootDir =  path.join(__dirname, '..')
const domainSpecificsPath = path.join(rootDir, 'domain_specifics.yaml')
const DOMAIN_SPECIFICS = yaml.safeLoad(fs.readFileSync(domainSpecificsPath, 'utf8'))

const DOMAIN = process.env['DOMAIN']

function buildDir() {
    return DOMAIN_SPECIFICS.domain[DOMAIN];
 }
console.log(buildDir())
