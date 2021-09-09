
module.exports = ({ env }) => ({
  email: {
    provider: 'mcmandrill',
    providerOptions: {
      mandrill_api_key: process.env.MandrillApiKey,
      mandrill_default_replyto: process.env.MandrillDefaultReplyToEmail,
      mandrill_default_from_email: process.env.MandrillDefaultFromEmail,
      mandrill_default_from_name: process.env.MandrillDefaultFromName
    },
  },
})

