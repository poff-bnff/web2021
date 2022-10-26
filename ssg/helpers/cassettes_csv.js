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

const STRAPIDATA_CASSETTES_YAML = yaml.load(fs.readFileSync(allCassettesDataPath, 'utf8'));
// this code if you want to save
// fs.writeFileSync(outputfile, JSON.stringify(obj, null, 2));

let obj = []
STRAPIDATA_CASSETTES_YAML.forEach(cassette => {
  let c_stills = []
  if(cassette.stills) {
    cassette.stills.forEach( still => {
      if(still.formats && still.formats._med_16_9){
        let med_name = still.formats._med_16_9.url.split('/')
        med_name = med_name[med_name.length-1]
        c_stills.push(med_name)
      }
    })
  }
  let f_stills = []
  if(cassette.orderedFilms) {
    let c_orderedFilms = cassette.orderedFilms
    c_orderedFilms.forEach(o_film => {
      if(o_film.film.stills) {
        let o_film_stills = o_film.film.stills
        o_film_stills.forEach(still => {
          if(still.formats && still.formats._med_16_9){
            let med_name = still.formats._med_16_9.url.split('/')
            med_name = med_name[med_name.length-1]
            f_stills.push(med_name)
          }
        })
      }
    })
  }

  obj.push({"cassette_stills":c_stills, "film_stills": f_stills})
})

// console.log(JSON.stringify(obj, 0, 2))

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

fs.writeFileSync(CSVpath, csv, 'utf8')
