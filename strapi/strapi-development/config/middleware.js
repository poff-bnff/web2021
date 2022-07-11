module.exports = {
    settings: {
        logger: {
            level: 'fatal'
        },
        loggerNew: {
            enabled: true
        },
        parser: {
            enabled: true,
            multipart: true,
            formLimit: "500mb",
            jsonLimit: "500mb",
            formidable: {
                maxFileSize: 524288000
            }
        }
    }
}
