const { getModel } = require("../../helpers/strapiQuery.js")

const main = async () => {
    const S_SCREENINGS = await getModel('Screening')
    const screening_codes = {}
    for (const s_screening of S_SCREENINGS) {
        screening_codes[s_screening.codeAndTitle] = screening_codes[s_screening.codeAndTitle] || []
        screening_codes[s_screening.codeAndTitle].push({remoteId: s_screening.remoteId, updated_at: s_screening.updated_at})
    }
    const extra_screening_codes = {}
    for (const code in screening_codes) {
        if (screening_codes.hasOwnProperty(code)) {
            const sc = screening_codes[code]
            if (sc.length > 1) {
                extra_screening_codes[code] = sc
            }
        }
    }
    console.log(extra_screening_codes)
}

main()
