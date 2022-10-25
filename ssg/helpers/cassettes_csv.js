// Loeb sisse _allStrapidata kaustast Cassettes yamli ja konverdib selle kohmakaks csv

const fs = require('fs')
const yaml = require('js-yaml')
const path = require('path')

const sourceDir = path.join(__dirname, '..', 'source')
const fetchDir = path.join(sourceDir, '_fetchdir')
const allStrapiDataPath = path.join(sourceDir, '_allStrapidata')
const allCassettesDataPath = path.join(allStrapiDataPath, 'Cassette.yaml')

const assetsDirCSV = path.join(__dirname, '..', 'source')
const CSVpath = path.join(assetsDirCSV, 'cassettes.csv')

let obj = yaml.load(fs.readFileSync(allCassettesDataPath, {encoding: 'utf-8'}));
// this code if you want to save
// fs.writeFileSync(outputfile, JSON.stringify(obj, null, 2));

function jsonToCsv(items) {
  const header = Object.keys(items[0]);

  const headerString = header.join(',');

  // handle null or undefined values here
  const replacer = (key, value) => value ?? '';

  const rowItems = items.map((row) =>
    header
      .map((fieldName) => JSON.stringify(row[fieldName], replacer))
      .join(',')
  );

  // join header and body, and break into separate lines
  const csv = [headerString, ...rowItems].join('\r\n');

  return csv;
}

const csv = jsonToCsv(obj);

// console.log(csv);

// fs.mkdirSync(assetsDirCSV, {recursive: true})
fs.writeFileSync(CSVpath, csv, 'utf8')
