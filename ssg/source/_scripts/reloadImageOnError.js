
function reloadImageOnError() {
    var images = document.images
    for(var i = 0; i < images.length; i++) {
        var _image = images[i]
        // console.log(_image);

        _image.onerror = function foo() {

            var reloaded = this.getAttribute('reloaded') || 0
            if (reloaded > 1000) {
                return
            }
            this.setAttribute('reloaded', reloaded + 1)

            var _src = this.getAttribute('src')
            this.setAttribute('src', _src)

            console.log('Error at loading image', this)
        }
    }
}
