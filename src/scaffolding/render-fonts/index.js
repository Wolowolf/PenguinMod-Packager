// Section 117: the editor's costume fonts (same files as the GUI's src/lib/tw-scratch-render-fonts), used
// in place of the scratch-render-fonts package (webpack alias). Arial, Verdana and Comic Sans MS are
// Windows fonts that costumes name but that are not bundled.
// Synchronously load TTF fonts.
// First, have Webpack load their data as Base 64 strings.
let FONTS;

const getFonts = function () {
    if (FONTS) return FONTS;
    /* eslint-disable global-require */
    FONTS = {
        'Atkinson Hyperlegible Next': require('base64-loader!./AtkinsonHyperlegibleNext.ttf'),
        'Atkinson Hyperlegible Mono': require('base64-loader!./AtkinsonHyperlegibleMono.ttf'),
        'Lexend': require('base64-loader!./Lexend.ttf'),
        'OpenDyslexic': require('base64-loader!./OpenDyslexic-Regular.otf')
    };
    /* eslint-enable global-require */

    // For each Base 64 string,
    // 1. Replace each with a usable @font-face tag that points to a Data URI.
    // 2. Inject the font into a style on `document.body`, so measurements
    //    can be accurately taken in SvgRenderer._transformMeasurements.
    for (const fontName in FONTS) {
        const fontData = FONTS[fontName];
        FONTS[fontName] = '@font-face {' +
            `font-family: "${fontName}";src: url("data:application/x-font-ttf;charset=utf-8;base64,${fontData}");}`;
    }

    if (!document.getElementById('scratch-font-styles')) {
    	const documentStyleTag = document.createElement('style');
    	documentStyleTag.id = 'scratch-font-styles';
    	for (const fontName in FONTS) {
    	    documentStyleTag.textContent += FONTS[fontName];
    	}
    	document.body.insertBefore(documentStyleTag, document.body.firstChild);
    }

    return FONTS;
}

module.exports = getFonts;
