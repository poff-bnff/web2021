function prioritizeImages(element = {}, imageOrder = [], defaults = []) {
    let primaryImage = null

    // Prioritize by imageOrder (formats)
    for (const med of imageOrder) {
        if (element?.media?.[med[1]]?.[0]?.formats?.[med[0]]) {
            primaryImage = `${element.media[med[1]][0].hash}${med[0]}${element.media[med[1]][0].ext}`
            break
        }
    }

    // If imageOrder did not have results, determine and use provided defaults
    if (!primaryImage) {
        for (const med of defaults) {
            if (element?.media?.[med]?.[0]) {
                primaryImage = `${element.media[med][0].hash}${element.media[med][0].ext}`
                break
            }
        }
    }
    return primaryImage
}
module.exports = prioritizeImages
