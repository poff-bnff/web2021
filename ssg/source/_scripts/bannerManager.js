function getBannerBlock(position) {
    var fullHost = window.location.href.slice(0, window.location.href.indexOf("/", 8))
    var langPath = /^[a-z]{2}$/.test(window.location.pathname.split('/')[1]) ? window.location.pathname.split('/')[1] : null;
    var formattedPosition = position.toLowerCase().replace(/_/g, '-');

    var bannerLocation = fullHost + (langPath ? '/' + langPath : '') + '/banners/' + formattedPosition;

    return fetch(bannerLocation)
        .then(response => {
            if (!response.ok) {
                console.error('Error loading banner url:', response.statusText);
                return null;
            }
            return response.text();
        })
        .then(html => {
            var parser = new DOMParser();
            var doc = parser.parseFromString(html, 'text/html');
            var bannerContent = doc.querySelector('#banner-content');
            if (bannerContent) {
                return bannerContent.innerHTML;
            } else {
                throw new Error('Banner content not found');
            }
        })
        .catch(error => {
            console.error('Error fetching banner:', error);
            return null;
        });
}

function initializeCarousel(container) {
    if (!container || !container.querySelectorAll) return;
    const carousels = container.querySelectorAll('.carousel');

    carousels.forEach((el) => {
        if (window.bootstrap && bootstrap.Carousel) {
            const instance = bootstrap.Carousel.getOrCreateInstance(el);
            instance.cycle(); // start auto rotation
        }
    });
}

document.addEventListener('DOMContentLoaded', function () {
    var bannerElements = document.querySelectorAll('.automatic-banner');
    bannerElements.forEach(function (element) {
        var position = element.id;
        getBannerBlock(position).then(function (content) {
            if (content) {
                element.innerHTML = content;

                // Reinitialize the carousel after injecting the content
                if (typeof initializeCarousel === 'function') {
                    initializeCarousel(element);
                } else {
                    console.warn('initializeCarousel function is not defined.');
                }
            }
        });
    });
});