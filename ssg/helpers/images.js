function images(obj) {
    let cassetteCarouselPicsCassette = []
    let cassetteCarouselPicsFilms = []
    let cassettePostersCassette = []
    let cassettePostersFilms = []


    if (obj.cassette) {
        // let cassetteFromYAML = CASSETTES.filter( (a) => { return obj.cassette.id === a.id})

        let cassette = obj.cassette

        // Cassette carousel pics
        if (cassette && cassette.stills && cassette.stills[0]) {
            for (const stillIx in cassette.stills) {
                let still = cassette.stills[stillIx]
                if (still.hash && still.ext) {
                    if (still.hash.substring(0, 4) === 'F_1_') {
                        cassetteCarouselPicsCassette.unshift(`https://assets.poff.ee/img/${still.hash}${still.ext}`)
                    }
                    cassetteCarouselPicsCassette.push(`https://assets.poff.ee/img/${still.hash}${still.ext}`)
                }
            }
        }

        if (cassetteCarouselPicsCassette.length > 0) {
            obj.cassetteCarouselPicsCassette = cassetteCarouselPicsCassette
        }

        // Cassette poster pics
        if (cassette && cassette.posters && cassette.posters[0]) {
            for (const posterIx in cassette.posters) {
                let poster = cassette.posters[posterIx]
                if (poster.hash && poster.ext) {
                    if (poster.hash.substring(0, 2) === 'P_') {
                        cassettePostersCassette.unshift(`https://assets.poff.ee/img/${poster.hash}${poster.ext}`)
                    }
                    cassettePostersCassette.push(`https://assets.poff.ee/img/${poster.hash}${poster.ext}`)
                }
            }
        }

        if (cassettePostersCassette.length > 0) {
            obj.cassettePostersCassette = cassettePostersCassette
        }


        if(cassette.orderedFilms) {
            for(filmIx in cassette.orderedFilms) {
                let film = cassette.orderedFilms[filmIx]
                if (film && film.film) {

                    // Film carousel pics
                    if (film.film && film.film.stills && film.film.stills[0]) {
                        for (const stillIx in film.film.stills) {
                            let still = film.film.stills[stillIx]
                            if (still.hash && still.ext) {
                                if (still.hash.substring(0, 4) === 'F_1_') {
                                    cassetteCarouselPicsFilms.unshift(`https://assets.poff.ee/img/${still.hash}${still.ext}`)
                                }
                                cassetteCarouselPicsFilms.push(`https://assets.poff.ee/img/${still.hash}${still.ext}`)
                            }
                        }
                    }

                    if (cassetteCarouselPicsFilms.length > 0) {
                        obj.cassetteCarouselPicsFilms = cassetteCarouselPicsFilms
                    }

                    // Film posters pics
                    if (film.film && film.film.posters && film.film.posters[0]) {
                        for (const posterIx in film.film.posters) {
                            let poster = film.film.posters[posterIx]
                            if (poster.hash && poster.ext) {
                                if (poster.hash.substring(0, 2) === 'P_') {
                                    cassettePostersFilms.unshift(`https://assets.poff.ee/img/${poster.hash}${poster.ext}`)
                                }
                                cassettePostersFilms.push(`https://assets.poff.ee/img/${poster.hash}${poster.ext}`)
                            }
                        }
                    }

                    if (cassettePostersFilms.length > 0) {
                        obj.cassettePostersFilms = cassettePostersFilms
                    }
                }

            }
        }
    return obj
    }
}

module.exports = images
