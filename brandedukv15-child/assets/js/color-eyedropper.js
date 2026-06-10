/**
 * Eyedropper RGB sampling from product thumbnail pixels.
 * Used for garment tint — never infer colour from product name.
 */
(function (global) {
    'use strict';

    function rgbToHex(r, g, b) {
        return (
            '#' +
            [r, g, b]
                .map(function (v) {
                    return Math.max(0, Math.min(255, Math.round(v)))
                        .toString(16)
                        .padStart(2, '0');
                })
                .join('')
        );
    }

    function rgbToHsl(r, g, b) {
        var rn = r / 255;
        var gn = g / 255;
        var bn = b / 255;
        var max = Math.max(rn, gn, bn);
        var min = Math.min(rn, gn, bn);
        var delta = max - min;
        var h = 0;
        var s = 0;
        var l = (max + min) / 2;

        if (delta !== 0) {
            s = delta / (1 - Math.abs(2 * l - 1));
            if (max === rn) h = ((gn - bn) / delta) % 6;
            else if (max === gn) h = (bn - rn) / delta + 2;
            else h = (rn - gn) / delta + 4;
            h *= 60;
            if (h < 0) h += 360;
        }

        return { h: h, s: s * 100, l: l * 100 };
    }

    /**
     * Weighted eyedropper on RGBA buffer (centre of garment thumb).
     * Returns { hex, rgb } or null.
     */
    function sampleEyedropperFromRgba(data, width, height) {
        if (!data || !width || !height) return null;

        var cx = width / 2;
        var cy = height / 2;
        var sumR = 0;
        var sumG = 0;
        var sumB = 0;
        var weightTotal = 0;

        for (var y = 0; y < height; y++) {
            for (var x = 0; x < width; x++) {
                var i = (y * width + x) * 4;
                var r = data[i];
                var g = data[i + 1];
                var b = data[i + 2];
                var a = data[i + 3];
                if (a < 140) continue;

                var hsl = rgbToHsl(r, g, b);
                if (hsl.l > 96) continue;
                if (hsl.l < 2) continue;

                var dx = (x - cx) / Math.max(1, cx);
                var dy = (y - cy) / Math.max(1, cy);
                var dist = Math.sqrt(dx * dx + dy * dy);
                if (dist > 0.88) continue;

                var centerWeight = 1 - dist * 0.4;
                var satWeight = 0.4 + Math.min(1, hsl.s / 100);
                var weight = centerWeight * satWeight;

                sumR += r * weight;
                sumG += g * weight;
                sumB += b * weight;
                weightTotal += weight;
            }
        }

        if (weightTotal <= 0) return null;

        var avgR = sumR / weightTotal;
        var avgG = sumG / weightTotal;
        var avgB = sumB / weightTotal;

        return {
            hex: rgbToHex(avgR, avgG, avgB),
            rgb: {
                r: Math.round(avgR),
                g: Math.round(avgG),
                b: Math.round(avgB)
            }
        };
    }

    function sampleEyedropperFromCanvas(canvas) {
        if (!canvas || !canvas.width || !canvas.height) return null;
        var ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return null;
        var data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        return sampleEyedropperFromRgba(data, canvas.width, canvas.height);
    }

    function sampleEyedropperFromImageElement(img, sampleSize) {
        var size = sampleSize || 48;
        if (!img || !img.naturalWidth) return null;
        try {
            var canvas = document.createElement('canvas');
            canvas.width = size;
            canvas.height = size;
            var ctx = canvas.getContext('2d', { willReadFrequently: true });
            if (!ctx) return null;
            ctx.drawImage(img, 0, 0, size, size);
            return sampleEyedropperFromCanvas(canvas);
        } catch (err) {
            return null;
        }
    }

    var api = {
        rgbToHex: rgbToHex,
        rgbToHsl: rgbToHsl,
        sampleEyedropperFromRgba: sampleEyedropperFromRgba,
        sampleEyedropperFromCanvas: sampleEyedropperFromCanvas,
        sampleEyedropperFromImageElement: sampleEyedropperFromImageElement
    };

    global.BrandedColorEyedropper = api;
})(typeof window !== 'undefined' ? window : globalThis);
