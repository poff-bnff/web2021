const validYoutubeLinks = [
    'https://www.youtube.com/watch?v=DFYRQ_zQ-gk&feature=featured',
    'https://www.youtube.com/watch?v=DFYRQ_zQ-gk',
    'http://www.youtube.com/watch?v=DFYRQ_zQ-gk',
    'www.youtube.com/watch?v=DFYRQ_zQ-gk',
    'https://youtube.com/watch?v=DFYRQ_zQ-gk',
    'http://youtube.com/watch?v=DFYRQ_zQ-gk',
    'youtube.com/watch?v=DFYRQ_zQ-gk',
    'https://m.youtube.com/watch?v=DFYRQ_zQ-gk',
    'http://m.youtube.com/watch?v=DFYRQ_zQ-gk',
    'm.youtube.com/watch?v=DFYRQ_zQ-gk',
    'https://www.youtube.com/v/DFYRQ_zQ-gk?fs=1&hl=en_US',
    'http://www.youtube.com/v/DFYRQ_zQ-gk?fs=1&hl=en_US',
    'www.youtube.com/v/DFYRQ_zQ-gk?fs=1&hl=en_US',
    'youtube.com/v/DFYRQ_zQ-gk?fs=1&hl=en_US',
    'https://www.youtube.com/embed/DFYRQ_zQ-gk?autoplay=1',
    'https://www.youtube.com/embed/DFYRQ_zQ-gk',
    'http://www.youtube.com/embed/DFYRQ_zQ-gk',
    'www.youtube.com/embed/DFYRQ_zQ-gk',
    'https://youtube.com/embed/DFYRQ_zQ-gk',
    'http://youtube.com/embed/DFYRQ_zQ-gk',
    'youtube.com/embed/DFYRQ_zQ-gk',
    'https://www.youtube-nocookie.com/embed/DFYRQ_zQ-gk?autoplay=1',
    'https://www.youtube-nocookie.com/embed/DFYRQ_zQ-gk',
    'http://www.youtube-nocookie.com/embed/DFYRQ_zQ-gk',
    'www.youtube-nocookie.com/embed/DFYRQ_zQ-gk',
    'https://youtube-nocookie.com/embed/DFYRQ_zQ-gk',
    'http://youtube-nocookie.com/embed/DFYRQ_zQ-gk',
    'youtube-nocookie.com/embed/DFYRQ_zQ-gk',
    'https://youtu.be/DFYRQ_zQ-gk?t=120',
    'https://youtu.be/DFYRQ_zQ-gk',
    'http://youtu.be/DFYRQ_zQ-gk',
    'youtu.be/DFYRQ_zQ-gk',
    'https://www.youtube.com/HamdiKickProduction?v=DFYRQ_zQ-gk',
    'https://www.youtube.com/live/DFYRQ_zQ-gk?feature=share'
]
const validVimeoLinks = [
    'vimeo.com/123456789',
    'vimeo.com/channels/mychannel/123456789',
    'vimeo.com/groups/shortfilms/videos/123456789',
    'player.vimeo.com/video/123456789',
    'http://vimeo.com/123456789',
    'https://vimeo.com/channels/mychannel/123456789',
    'https://vimeo.com/groups/shortfilms/videos/123456789',
    'https://www.player.vimeo.com/video/123456789'
]

// https://regexr.com/7m06l
const youtubeRegex = /(?:(?:https?:)?\/\/)?(?:(?:www|m)\.)?(?:(youtube(?:-nocookie)?\.com|youtu.be))(?:\/(?:[\w\-]+\?v=|embed\/|live\/|v\/)?)([\w\-]+)(?:\S+)?/
// https://regexr.com/7m06i
const vimeoRegex = /(?:http|https)?:?\/?\/?(?:www\.)?(?:player\.)?(vimeo\.com)\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|video\/|)(\d+)(?:|\/\?)/

// validates media links
// returns true if link is valid
const validateMediaLink = (link) => {
    return youtubeRegex.test(link) || vimeoRegex.test(link)
}

// returns media code from link
// returns false if link is invalid
const codeFromMediaLink = (link) => {
    if (youtubeRegex.test(link)) {
        return link.match(youtubeRegex)[2]
    } else if (vimeoRegex.test(link)) {
        return link.match(vimeoRegex)[2]
    }
    return false
}

// returns media host from link
// returns false if link is invalid
const hostFromMediaLink = (link) => {
    if (youtubeRegex.test(link)) {
        return link.match(youtubeRegex)[1]
    } else if (vimeoRegex.test(link)) {
        return link.match(vimeoRegex)[1]
    }
    return false
}

// returns media code and host from link
// returns false if link is invalid
const parseMediaLink = (link) => {
    if (youtubeRegex.test(link)) {
        return {
            code: link.match(youtubeRegex)[2],
            host: link.match(youtubeRegex)[1]
        }
    } else if (vimeoRegex.test(link)) {
        return {
            code: link.match(vimeoRegex)[2],
            host: link.match(vimeoRegex)[1]
        }
    }
    return false
}

exports = module.exports = {
    validYoutubeLinks,
    validVimeoLinks,
    youtubeRegex,
    vimeoRegex,
    validateMediaLink,
    codeFromMediaLink,
    hostFromMediaLink,
    parseMediaLink
}
