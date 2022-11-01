const https = require('https')
const convert = require('xml-js')
var op = require('object-path')
const jsyaml = require('js-yaml');
const path = require('path')
const fs = require('fs')

const ssgDir = path.join(__dirname, '..', '..', '..', '..', '..', 'ssg')
const domainSpecificsPath = path.join(ssgDir, `domain_specifics.yaml`)

const timezonestr = ' 00:00:00 GMT+0200'

function picAndBadges(xml_str, email) {
  const ev_o = op(JSON.parse(convert.xml2json(xml_str, { compact: true })))

  const DOMAIN_SPECIFICS = jsyaml.load(fs.readFileSync(domainSpecificsPath, 'utf8'))
  const EVENTIVALBADGEWHITELIST = DOMAIN_SPECIFICS.industry_eventival_badges_whitelist || []

  let badgearr = ev_o.get('person.badges.badge', [])

  if (!Array.isArray(badgearr)) {
    badgearr = [badgearr]
  }

  let professionarr = ev_o.get('person.eventival_categorization.professions.profession')

  if (!Array.isArray(professionarr)) {
    professionarr = [professionarr]
  }

  const pic_and_badges = {
    photo: ev_o.get(['person', 'photos', 'photo', '_text'], null),
    name: ev_o.get(['person', 'names', 'name_first', '_text'], null),
    lastName: ev_o.get(['person', 'names', 'name_last', '_text'], null),
    professions: professionarr,
    badges: badgearr
      .filter(badge => badge.cancelled._text === '0')
      .map(badge => {
        const cnt = badge.validity_dates.date.length
        return {
          valid: {
            from: badge.validity_dates.date[0]._text + timezonestr,
            to: badge.validity_dates.date[cnt - 1]._text + timezonestr
          },
          type: badge.badge_type.name._text
        }
      })
  }

  const badges = pic_and_badges.badges

  const hasAccreditation = badges.length && badges.map(b => b.type).some(badge => EVENTIVALBADGEWHITELIST.includes(badge.toUpperCase()))

  pic_and_badges.accreditation = hasAccreditation

  // console.log('pic and badges ', pic_and_badges)
  // console.log('hasAccreditation ', hasAccreditation, hasAccreditation ? badges.map(b => b.type) : '')
  return pic_and_badges
}

module.exports = {
  async getEventivalBadges(email) {

    let dataString = ''

    const response = await new Promise((resolve, reject) => {
      const req = https.get(`https://bo.eventival.com/poff/26th/en/ws/${process.env['EventivalWebToken']}/people/badges-for-login-email.xml?login_email=${email}`, function (res) {
        res.on('data', chunk => {
          dataString += chunk
        })
        res.on('end', () => {
          // console.log('EventivalDataString ', email, ' ', dataString)
          if (res.statusCode === 200) {
            resolve({
              statusCode: 200,
              body: picAndBadges(dataString, email)
            })
          }
          resolve({
            statusCode: res.statusCode
          })
        })
      })

      req.on('error', (e) => {
        reject({
          statusCode: 500,
          body: 'Something went wrong!'
        })
      })
    })

    return await response

  }
};
