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
            to: [
                {
                    email: email,
                    type: "to",
                },
            ],
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
            global_merge_vars: [
                { name: "email", content: email },
                { name: "nimi", content: nimi },
                { name: "var3", content: var3 },
                { name: "var4", content: var4 },
            ],
            merge_vars: [],
            tags: [],
            subaccount: "test",
            google_analytics_domains: [],
            google_analytics_campaign: "",
            metadata: { website: "" },
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

module.exports = {
    // lifecycles: {
    //     afterCreate: async (params, data) => {

    //         if (data.eMail) {
    //             SendTemplateEmailFromMailChimp("tapferm@gmail.com", data.firstName, data.lastName, data.eMail)
    //         }

    //     },
    // },
};
