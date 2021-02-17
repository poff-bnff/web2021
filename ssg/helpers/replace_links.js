const STRAPIDIRS = [
    `https://${process.env['StrapiHostPoff2021']}/uploads/`,
    `http://${process.env['StrapiHost']}/uploads/`
    ];
const REPLACEDIR = `https://assets.poff.ee/img/`;

// console.log(STRAPIDIRS);

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
// console.log('VANA: ', 'https://admin.poff.ee/uploads/ ja http://139.59.130.149/uploads/ ja https://staging.poff.inscaping.eu/ ')
// console.log('UUS: ', replaceLinks('https://admin.poff.ee/uploads/ ja http://139.59.130.149/uploads/ ja https://staging.poff.inscaping.eu/ ', 'https://staging.poff.inscaping.eu/', 'https://poff.ee/'))
