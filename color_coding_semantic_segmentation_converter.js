const fs = require('fs');
const path = require('path');
const colorNameList = require('color-name-list');
const nearestColor = require('nearest-color');
const anyp = require('anypalette');

// nearestColor need objects {name => hex} as input
const colors = colorNameList.reduce((o, { name, hex }) => Object.assign(o, { [name]: hex }), {});

const nearest = nearestColor.from(colors);

const tsvData = fs.readFileSync(path.resolve(__dirname, 'color_coding_semantic_segmentation_classes.tsv'), 'utf-8');
const lines = tsvData.split('\n');
const headers = lines.shift().split('\t');

const segments = lines.map((line, index) => {
    const currentLine = line.split('\t');
    const [idx, ratio, train, val, stuff, colorCodeRGB, colorCodeHex, name] = currentLine;
    const nearestColorName = nearest(colorCodeHex);

    // Round up or down the distance to the nearest color
    const distant = Math.round(nearestColorName.distance * 100) / 100;

    // Split the name by ; and trim the spaces, then return 2 first names if more than one
    const names = name.split(';').map(name => name.trim());

    // Split string of "(1,2,3)" to array of [0,1,0.5] using regex
    const [red, green, blue] = colorCodeRGB.match(/\d+/g).map(Number).map(n => n / 255);

    // Return an object with the name of the color and the color itself
    const col = new anyp.Color({ red, green, blue, alpha: 1, name: `${names.join('_')}` });
    return col;
});

const pallette = new anyp.Palette();
segments.forEach(segment => {
    pallette.push(segment)
});

// segments.forEach(segment => console.log(segment));

// List formats from anypalette
// console.log(Object.entries(anyp.formats).filter(
//     (k, v) => {
//         const [name, value] = k;
//         if (value.write) return true;
//     }
// ));

const wp = anyp.writePalette(
    pallette,
    anyp.formats.ADOBE_COLOR_SWATCH_PALETTE
);

// Create a file to receive the palette buffer
fs.writeFileSync(path.resolve(__dirname, 'color_coding_semantic_segmentation.aco'), wp);

const wpcss = anyp.writePalette(
    pallette,
    anyp.formats.CSS_VARIABLES
);

// Create a file to receive the palette buffer
fs.writeFileSync(path.resolve(__dirname, 'color_coding_semantic_segmentation.css'), wpcss);
