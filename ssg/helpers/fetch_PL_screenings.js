const fs = require('fs')
const yaml = require('js-yaml')
const path = require('path')
const request = require('request');
const sourceDir = path.join(__dirname, '..', 'source')
const fetchDir = path.join(sourceDir, '_fetchdir')
const { getModel, putModel } = require("./strapiQuery.js")

async function main() {

    var optionsPL = {
        'method': 'GET',
        'url': 'http://www.piletilevi.ee/api/?preset=pff&language=est',
        'headers': {}
    };
    let PL_screenings = []
    request(optionsPL, async function (error, response) {
        if (error) throw new Error(error);

        if (response.body === undefined) {
            yaml.dump([], { 'noRefs': true, 'indent': '4' })
        } else {
            const concerts = JSON.parse(response.body).responseData.concert
            const concertsFile = path.join(fetchDir, `PL_info.yaml`)
            fs.writeFileSync(concertsFile, JSON.stringify(concerts, null, 4), 'utf8')

            PL_screenings = concerts.map(concert => {
                return {
                    codeAndTitle: concert.decoratedTitle || null,
                    code: concert.decoratedTitle ? concert.decoratedTitle.split(' / ')[0] : null,
                    ticketingUrl: concert.shopUrl || null,
                    ticketingId: concert.id.toString() || null,
                }
            }).filter(PL_screening => PL_screening.code !== null)

        }
    })
    const s_screenings = await getModel('Screening')

    for (const PL_screening of PL_screenings) {
        let s_screening = s_screenings.filter(s_screening => {
            return s_screening.code === PL_screening.code
        })[0] || {code: null}
        PL_screening.id = s_screening.id
    }

    const outFile = path.join(fetchDir, `screenings_urls.yaml`)
    fs.writeFileSync(outFile, JSON.stringify(PL_screenings, null, 4), 'utf8')

    const PL_codes = PL_screenings.map(pl_s => pl_s.code)
    const online_screenings = s_screenings.filter(s => !PL_codes.includes(s.code))
        .map(s => [s.code, s.codeAndTitle])
    const online_screenings_file = path.join(fetchDir, `online_screenings.yaml`)
    fs.writeFileSync(online_screenings_file, JSON.stringify(online_screenings, null, 4), 'utf8')

    PL_screenings = PL_screenings.filter(PL_screening => {
        if (!PL_screening.id) {
            console.log('WARNING: Missing in Strapi:', JSON.stringify(PL_screening, null, 4))
            return false
        }
        const s_screening = s_screenings.filter(_screening => _screening.id === PL_screening.id)[0]
        if(PL_screening.codeAndTitle === s_screening.codeAndTitle && PL_screening.ticketingUrl === s_screening.ticketingUrl && PL_screening.ticketingId === s_screening.ticketingId){
            return false
        }
        return true
    })


    await putModel('Screening', PL_screenings)
}

main()
