export const convertSVGContentToDataUrl = function (svgContent, options = {
    width: 300,
    height: 300,
    preserveOriginalSize: false
}) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgContent);

        img.onload = function () {
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            
            if (options.preserveOriginalSize) {
                canvas.width = img.width;
                canvas.height = img.height;
            } else {
                canvas.width = options.width;
                canvas.height = options.height;
            }
            
            context.drawImage(img, 0, 0, canvas.width, canvas.height);

            const pngDataUrl = canvas.toDataURL('image/png');
            resolve(pngDataUrl);
        };

        img.onerror = function (e) {
            reject('Ошибка загрузки изображения: ' + e);
        };
    });
}

export const convertSVGToDataUrl = function (svgUrl, options) {
    return new Promise((resolve, reject) => {
        fetch(svgUrl)
            .then(response => response.text())
            .then(svgContent => svgContentToDataUrl(svgContent, options || undefined).then(pngDataUrl => resolve(pngDataUrl)))
            .catch(error => reject('Ошибка загрузки SVG: ' + error));
    });
}