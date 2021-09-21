const STRAPIDIRS = [
    `https://${process.env['StrapiHost']}/uploads/`,
    `http://139.59.130.149/uploads/`
    ];
const REPLACEDIR = `https://assets.poff.ee/img/`;

function replaceLinks(pathAliases = '', stagingURL = null, pageURL = null) {
    // Replace Strapi URLs with assets URL for images
    for (const DIR of STRAPIDIRS) {
        pathAliases = replacer(pathAliases, DIR, REPLACEDIR)
    }
    // Also replace Staging URLs with Page URLs if given
    if (stagingURL && pageURL) {
        pathAliases = replacer(pathAliases, stagingURL, pageURL)
    }
    return pathAliases
}

function replacer(textStr, replaceStr, replacerStr) {
    let searchRegExp = new RegExp(replaceStr, 'g');
    let replaceWith = replacerStr;
    let replacedStr = textStr.replace(searchRegExp, replaceWith);
    return replacedStr
}

module.exports = replaceLinks
