function videoUrlToVideoCode(videoUrl) {
    if (videoUrl) {
        if (videoUrl && videoUrl.length > 10) {
            if (videoUrl.includes('vimeo')) {
                let splitVimeoLink = videoUrl.split('/')
                let videoCode = splitVimeoLink !== undefined ? splitVimeoLink[3] : ''
                if (videoCode.length === 9) {
                    videoUrl = videoCode
                }
            } else {
                let splitYouTubeLink
                let splitForVideoCode

                if (videoUrl.includes('youtube.com')) {
                    // Long youtube link
                    splitYouTubeLink = videoUrl.split('=')[1]
                    splitForVideoCode = splitYouTubeLink !== undefined ? splitYouTubeLink.split('&')[0] : ''
                } else if (videoUrl.includes('youtu.be')) {
                    // Short youtube link
                    splitYouTubeLink = videoUrl.split('?')[0]
                    splitForVideoCode = splitYouTubeLink.split('/')[3]
                }

                if (splitForVideoCode.length === 11) {
                    videoUrl = splitForVideoCode
                }
            }
        }
    }
    return videoUrl
}

module.exports = videoUrlToVideoCode
