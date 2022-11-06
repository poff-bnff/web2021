function replaceBadChars(text, id, type = '') {
    try {
        // Filter out characters that Strapi does not like and which eventually would render bad XML
        if (text.includes('\x02')) {
            console.log(`UNSUPPORTED CHARACTER WARNING! Some characters in ${type} ID ${id} synopsis were replaced`);
            text = text.replaceAll('\x02', '')
        }
        return text

    } catch (error) {
        console.log(text, typeof text, error);
    }
}
module.exports = replaceBadChars
