'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/v3.x/concepts/models.html#lifecycle-hooks)
 * to customize this model
 */
const https = require('https');

function SendTemplateEmailFromMailChimp(email, nimi, var3, var4) {
    let postData = JSON.stringify({
        key: "f0fd5eytVAO71_OF-gqhTw",
        template_name: "Test",
        template_content: [],
        message: {
            html: "",
            text: "",
            subject: "",
            from_email: "",
            from_name: "",
            to: [{
                email: email,
                type: "to",
            }, ],
            headers: {},
            important: false,
            track_opens: false,
            track_clicks: false,
            auto_text: false,
            auto_html: false,
            inline_css: false,
            url_strip_qs: false,
            preserve_recipients: false,
            view_content_link: false,
            bcc_address: "",
            tracking_domain: "",
            signing_domain: "",
            return_path_domain: "",
            merge: false,
            merge_language: "mailchimp",
            global_merge_vars: [{
                name: "email",
                content: email
            }, {
                name: "nimi",
                content: nimi
            }, {
                name: "var3",
                content: var3
            }, {
                name: "var4",
                content: var4
            }, ],
            merge_vars: [],
            tags: [],
            subaccount: "test",
            google_analytics_domains: [],
            google_analytics_campaign: "",
            metadata: {
                website: ""
            },
            recipient_metadata: [],
            attachments: [],
            images: [],
        },
        async: false,
        ip_pool: "",
        send_at: "",
    });

    const options = {
        hostname: "mandrillapp.com",
        port: 443,
        path: "/api/1.0/messages/send-template",
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-MC-MergeVars": [
                '"email": "global value 1"',
                '"nimi": "global value 2"',
                '"var3": "global value 3"',
                '"var4": "global value 4"',
            ],
        },
    };
    const req = https.request(options, (res) => {
        console.log(`E-kirja saatmine aadressile: ${email}`);
        console.log("statusCode:", res.statusCode);
        //console.log("headers:", res.headers);

        res.on("data", (d) => {
            process.stdout.write(d);
        });
    });

    req.on("error", (e) => {
        console.log(e);
    });
    req.write(postData);
    req.end();
}

// module.exports = {
// lifecycles: {
//     afterCreate: async (params, data) => {

//         if (data.eMail) {
//             SendTemplateEmailFromMailChimp("tapferm@gmail.com", data.firstName, data.lastName, data.eMail)
//         }

//     },
// },
// };

const path = require('path')
let helper_path = path.join(__dirname, '..', '..', '..', '/helpers/lifecycle_manager.js')

const {
    slugify,
    call_update,
    call_build,
    get_domain,
    modify_stapi_data,
    call_delete
} = require(helper_path)

/**
const domains =
For adding domain you have multiple choice. First for objects that has property 'domain'
or has property, that has 'domain' (at the moment festival_edition and programmes) use
function get_domain(result). If you know that that object has doimain, but no property
to indicate that. Just write the list of domains (as list), example tartuffi_menu.
And last if full build, with no domain is needed. Write FULL_BUILD (as list)
*/

const model_name = (__dirname.split(path.sep).slice(-2)[0])
const domains = ['FULL_BUILD'] // hard coded if needed AS LIST!!!

module.exports = {
    lifecycles: {
        async afterCreate(result, data) {
        },

        async beforeUpdate(params, data) {
        },

        async afterUpdate(result, params, data) {
        },

        async beforeDelete(params) {
        },

        async afterDelete(result, params) {
        }
    }
};
