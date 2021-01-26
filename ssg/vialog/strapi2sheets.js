const yaml = require('js-yaml')
const fs = require('fs')
const path = require('path')

const { getModel } = require('../helpers/strapiQuery.js')
const GoogleSheets = require('../helpers/GoogleSheets/GoogleSheets.js')
const SHEET_VIALOG = '1kc6Fcx5kd5_DwQr_haATahTHhsjajZpsoea8Zc7oKFM'


const rootDir =  path.join(__dirname, '..')
const domainSpecificsPath = path.join(rootDir, 'domain_specifics.yaml')
const DOMAIN_SPECIFICS = yaml.safeLoad(fs.readFileSync(domainSpecificsPath, 'utf8'))
const vialogUrls = DOMAIN_SPECIFICS.vialogUrls.et.map((e, i) => {
    return {
        et: e,
        en: DOMAIN_SPECIFICS.vialogUrls.en[i],
        ru: DOMAIN_SPECIFICS.vialogUrls.ru[i]
    }
})

let row = 4
const range = `Sheet1!a${row++}`
let values = []
getModel('Film').then(films => {
    for (const film of films) {
        for (const lang_urls of vialogUrls) {
            values.push([
                film.title_en,
                lang_urls.en + film.slug_en,
                film.title_et,
                lang_urls.et + film.slug_et,
                film.title_ru,
                lang_urls.ru + film.slug_ru,
                film.id,
                film.title_en
            ])
        }
    }
    GoogleSheets.Write(SHEET_VIALOG, range, values)
})
