#!/usr/bin/env node

const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');

const rootDir = path.join(__dirname, '..')
const domainSpecificsPath = path.join(rootDir, 'domain_specifics.yaml')
const DOMAIN_SPECIFICS = yaml.load(fs.readFileSync(domainSpecificsPath, 'utf8'))

const d = process.argv.slice(2)[0] || process.env['DOMAIN']
console.log(DOMAIN_SPECIFICS.domain[d])
