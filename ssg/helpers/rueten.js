function rueten(obj, lang) {
    const regex = new RegExp(`.*_${lang}$`, 'g')

    for (const key in obj) {
        if (obj[key] === null) {
            delete obj[key]
            continue
        }
        else if (key === lang) { // {obj:{et:'foo'}} --> {obj:'foo'}
            return obj[key]
        } else if (key.match(regex) !== null) {
            // console.log(regex, key, key.match(regex))
            obj[key.substring(0, key.length-3)] = obj[key]
            delete obj[key]
        } else if (typeof(obj[key]) === 'object') {
            obj[key] = rueten(obj[key], lang)
        }
        if (Array.isArray(obj[key])) {
            if (obj[key].length > 0) {
                for (var i = 0; i < obj[key].length; i++) {
                    if (obj[key][i] === '') {
                        // console.log('EMPTY ONE')
                        obj[key].splice(i, 1)
                        i--
                    }
                }
                if (obj[key].length === 0) {
                    delete obj[key]
                }
            }else{
                delete obj[key]
            }
        }
    }
    return obj
}

module.exports = rueten
