/**
 * Build deduplicated color-hex-database.json from HTML names + workwear aliases.
 * Run: node scripts/build-color-hex-database.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const outPath = path.join(root, 'brandedukv15-child/assets/data/color-hex-database.json');
const csvPath = path.join(root, 'brandedukv15-child/assets/data/color-names-hex.csv');
const brandedCatalogPath = path.join(root, 'brandedukv15-child/assets/data/branded-color-catalog.txt');

const PLACEHOLDER = new Set(['#cccccc', '#ccc', '#f3f4f6', '#ffffff', '#fff']);

function normName(name) {
  return String(name || '')
    .trim()
    .toLowerCase()
    .replace(/[''`]/g, '')
    .replace(/[_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\s*\([^)]*\)\s*/g, ' ')
    .trim();
}

function parseHex(hex) {
  if (!hex) return '';
  let h = String(hex).trim().replace(/^#/, '');
  if (/^[0-9a-f]{3}$/i.test(h)) {
    h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  }
  return /^[0-9a-f]{6}$/i.test(h) ? ('#' + h.toLowerCase()) : '';
}

function camelToWords(s) {
  return String(s)
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .trim();
}

function addEntry(global, name, hex, source) {
  const h = parseHex(hex);
  if (!h || PLACEHOLDER.has(h)) return;
  const n = normName(camelToWords(name));
  if (!n) return;
  if (!global[n]) {
    global[n] = h;
    return;
  }
  if (global[n] !== h) {
    /* keep first; log conflict only in verbose mode */
  }
}

/** W3C / HTML named colors (user-provided table) */
const HTML_COLORS = `
IndianRed CD5C5C
LightCoral F08080
Salmon FA8072
DarkSalmon E9967A
LightSalmon FFA07A
Crimson DC143C
Red FF0000
FireBrick B22222
DarkRed 8B0000
Pink FFC0CB
LightPink FFB6C1
HotPink FF69B4
DeepPink FF1493
MediumVioletRed C71585
PaleVioletRed DB7093
Coral FF7F50
Tomato FF6347
OrangeRed FF4500
DarkOrange FF8C00
Orange FFA500
Gold FFD700
Yellow FFFF00
LightYellow FFFFFE0
LemonChiffon FFFACD
LightGoldenrodYellow FAFAD2
PapayaWhip FFEFD5
Moccasin FFE4B5
PeachPuff FFDAB9
PaleGoldenrod EEE8AA
Khaki F0E68C
DarkKhaki BDB76B
Lavender E6E6FA
Thistle D8BFD8
Plum DDA0DD
Violet EE82EE
Orchid DA70D6
Fuchsia FF00FF
Magenta FF00FF
MediumOrchid BA55D3
MediumPurple 9370DB
RebeccaPurple 663399
BlueViolet 8A2BE2
DarkViolet 9400D3
DarkOrchid 9932CC
DarkMagenta 8B008B
Purple 800080
Indigo 4B0082
SlateBlue 6A5ACD
DarkSlateBlue 483D8B
MediumSlateBlue 7B68EE
GreenYellow ADFF2F
Chartreuse 7FFF00
LawnGreen 7CFC00
Lime 00FF00
LimeGreen 32CD32
PaleGreen 98FB98
LightGreen 90EE90
MediumSpringGreen 00FA9A
SpringGreen 00FF7F
MediumSeaGreen 3CB371
SeaGreen 2E8B57
ForestGreen 228B22
Green 008000
DarkGreen 006400
YellowGreen 9ACD32
OliveDrab 6B8E23
Olive 808000
DarkOliveGreen 556B2F
MediumAquamarine 66CDAA
DarkSeaGreen 8FBC8B
LightSeaGreen 20B2AA
DarkCyan 008B8B
Teal 008080
Aqua 00FFFF
Cyan 00FFFF
LightCyan E0FFFF
PaleTurquoise AFEEEE
Aquamarine 7FFFD4
Turquoise 40E0D0
MediumTurquoise 48D1CC
DarkTurquoise 00CED1
CadetBlue 5F9EA0
SteelBlue 4682B4
LightSteelBlue B0C4DE
PowderBlue B0E0E6
LightBlue ADD8E6
SkyBlue 87CEEB
LightSkyBlue 87CEFA
DeepSkyBlue 00BFFF
DodgerBlue 1E90FF
CornflowerBlue 6495ED
RoyalBlue 4169E1
Blue 0000FF
MediumBlue 0000CD
DarkBlue 00008B
Navy 000080
MidnightBlue 191970
Cornsilk FFF8DC
BlanchedAlmond FFEBCD
Bisque FFE4C4
NavajoWhite FFDEAD
Wheat F5DEB3
BurlyWood DEB887
Tan D2B48C
RosyBrown BC8F8F
SandyBrown F4A460
Goldenrod DAA520
DarkGoldenrod B8860B
Peru CD853F
Chocolate D2691E
SaddleBrown 8B4513
Sienna A0522D
Brown A52A2A
Maroon 800000
White FFFFFF
Snow FFFAFA
HoneyDew F0FFF0
MintCream F5FFFA
Azure F0FFFF
AliceBlue F0F8FF
GhostWhite F8F8FF
WhiteSmoke F5F5F5
SeaShell FFF5EE
Beige F5F5DC
OldLace FDF5E6
FloralWhite FFFAF0
Ivory FFFFF0
AntiqueWhite FAEBD7
Linen FAF0E6
LavenderBlush FFF0F5
MistyRose FFE4E1
Gainsboro DCDCDC
LightGray D3D3D3
Silver C0C0C0
DarkGray A9A9A9
Gray 808080
DimGray 696969
LightSlateGray 778899
SlateGray 708090
DarkSlateGray 2F4F4F
Black 000000
`;

/** Workwear / catalog names (aprons, hoodies, Premier, etc.) */
const WORKWEAR_ALIASES = {
  Camel: 'C19A6B',
  Moss: '6B7C4E',
  'Moss Green': 'ADDFAD',
  Sand: 'C2B280',
  'Dark Beige': 'A89078',
  'Light Sand': 'D4C4A8',
  Stone: '928E85',
  Natural: 'F5F0E6',
  Ecru: 'C2B280',
  Oatmeal: 'E8DCC8',
  Taupe: '8B7D6B',
  Charcoal: '36454F',
  Heather: 'B6B6B4',
  'Heather Grey': 'B6B6B4',
  'Sport Grey': '9CA3AF',
  Aquatic: '5BA4A4',
  Bottle: '1B4D3E',
  'Bottle Green': '006A4E',
  Navy: '1E3A5F',
  'French Navy': '002366',
  'Oxford Navy': '002147',
  Royal: '2563EB',
  'Royal Blue': '4169E1',
  Burgundy: '800020',
  Cardinal: 'C41E3A',
  Emerald: '50C878',
  Jade: '00A86B',
  Kelly: '4CBB17',
  'Kelly Green': '4CBB17',
  Lime: '00FF00',
  Orange: 'FFA500',
  Rust: 'B7410E',
  Terracotta: 'E2725B',
  Wine: '722F37',
  Aubergine: '4A2C4A',
  Lilac: 'C8A2C8',
  Lavender: 'E6E6FA',
  Pistachio: '93C572',
  Mustard: 'FFDB58',
  Cement: '9E9E9E',
  Smoke: '738276',
  Paragon: 'C0C0C0',
  Daisy: 'FFD700',
  'Apron Purple': '7B5EA7',
  'Heather Purple': '7D6B8A',
  'Dark Green': '013220',
  'Light Blue': 'ADD8E6',
  'Light Grey': 'D3D3D3',
  'Dark Grey': '505050',
  'Ash Grey': 'B8B8B8',
  'Off White': 'FAF9F6',
  Cream: 'FFFDD0',
  Black: '1A1A1A',
  White: 'FFFFFF',
  Red: 'DC2626',
  Yellow: 'EAB308',
  Pink: 'EC4899',
  Purple: '7C3AED',
  Teal: '008080',
  Petrol: '005F6A',
  'Petrol Blue': '005F6A',
  Khaki: 'C3B091',
  Olive: '808000',
  Chocolate: 'D2691E',
  Caramel: 'C68E5A',
  Copper: 'B87333',
  Cinnamon: 'D2691E',
  Biscuit: 'E8D4B8',
  Biscotti: 'D4B896',
};

const global = {};

for (const line of HTML_COLORS.trim().split('\n')) {
  const parts = line.trim().split(/\s+/);
  if (parts.length < 2) continue;
  const hex = parts.pop();
  const name = parts.join(' ');
  addEntry(global, name, hex, 'html');
}

for (const [name, hex] of Object.entries(WORKWEAR_ALIASES)) {
  addEntry(global, name, hex, 'workwear');
}

if (fs.existsSync(brandedCatalogPath)) {
  const lines = fs.readFileSync(brandedCatalogPath, 'utf8').split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  for (let i = 0; i < lines.length - 1; i += 2) {
    const a = lines[i];
    const b = lines[i + 1];
    if (/^[0-9a-f]{6}$/i.test(a) && !/^[0-9a-f]{6}$/i.test(b)) {
      addEntry(global, b, a, 'branded');
    } else if (/^[0-9a-f]{6}$/i.test(b) && !/^[0-9a-f]{6}$/i.test(a)) {
      addEntry(global, a, b, 'branded');
    }
  }
}

if (fs.existsSync(csvPath)) {
  const csv = fs.readFileSync(csvPath, 'utf8');
  for (const line of csv.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const m = trimmed.match(/^([^,]+),"([^"]+)",(#?[0-9a-fA-F]+),/);
    if (!m) continue;
    addEntry(global, m[2], m[3], 'csv');
    addEntry(global, m[1].replace(/_/g, ' '), m[3], 'csv-slug');
  }
}

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(
  outPath,
  JSON.stringify({ version: 1, count: Object.keys(global).length, global }, null, 0)
);

console.log('Wrote', outPath, '—', Object.keys(global).length, 'unique color names');
