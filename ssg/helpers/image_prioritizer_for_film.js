function prioritizeImages(element = {}, imageOrder = [], imageType) {
    let images = []
    let imagesThumbs = []

    // Prioritize by imageOrder (formats)
    for (const med of element?.media?.[imageType] || []) {
        let formatFound = null
        let formatFoundThumb = null

        if (med.formats) {
            for (const format of imageOrder) {
                if (med.formats[format]) {
                    formatFound = `${med.hash}${format}${med.ext}`
                    formatFoundThumb = formatFound
                    break
                }
            }
        }
        if (!formatFound) {
            formatFound = `${med.hash}${med.ext}`
            formatFoundThumb = `thumbnail_${med.hash}${med.ext}`
        }
        images.push(formatFound)
        imagesThumbs.push(formatFoundThumb)
    }
    return { images: images, imagesThumbs: imagesThumbs }
}
module.exports = prioritizeImages
