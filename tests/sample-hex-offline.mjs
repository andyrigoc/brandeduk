/**
 * Replica server-side dell'algoritmo di campionamento (stesso peso pixel del browser).
 * Dimostra che dal JPG Lime API si ottiene un verde plausibile senza usare il PNG front.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import jpeg from "jpeg-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function rgbToHsl(r, g, b) {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (delta !== 0) {
    s = delta / (1 - Math.abs(2 * l - 1));
    if (max === rn) h = ((gn - bn) / delta) % 6;
    else if (max === gn) h = (bn - rn) / delta + 2;
    else h = (rn - gn) / delta + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s: s * 100, l: l * 100 };
}

function rgbToHex(r, g, b) {
  return (
    "#" +
    [r, g, b]
      .map((n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0"))
      .join("")
  );
}

function sampleHexFromRgba(data, width, height) {
  const sampleSize = 24;
  let sumR = 0;
  let sumG = 0;
  let sumB = 0;
  let weightTotal = 0;

  for (let sy = 0; sy < sampleSize; sy++) {
    for (let sx = 0; sx < sampleSize; sx++) {
      const x = Math.floor((sx / sampleSize) * width);
      const y = Math.floor((sy / sampleSize) * height);
      const i = (y * width + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];
      if (a < 140) continue;
      const hsl = rgbToHsl(r, g, b);
      if (hsl.l < 6 || hsl.l > 95) continue;
      const satWeight = 0.45 + Math.min(1, hsl.s / 100);
      const lightWeight = hsl.l > 82 ? 0.5 : 1;
      const weight = satWeight * lightWeight;
      sumR += r * weight;
      sumG += g * weight;
      sumB += b * weight;
      weightTotal += weight;
    }
  }

  if (weightTotal <= 0) return "";
  return rgbToHex(sumR / weightTotal, sumG / weightTotal, sumB / weightTotal);
}

function isPlausibleLime(hex) {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return g > 90 && g > r && g > b;
}

const jpgPath = path.join(__dirname, "_lime.jpg");
const raw = readFileSync(jpgPath);
const decoded = jpeg.decode(raw, { useTArray: true });
const hex = sampleHexFromRgba(decoded.data, decoded.width, decoded.height);
const ok = hex && isPlausibleLime(hex);

console.log("=== Campionamento offline (JPG Lime GD002) ===");
console.log("Hex:", hex);
console.log("Verde Lime plausibile:", ok ? "SI" : "NO");
console.log("PNG front NON usato — solo foto prodotto nascosta.");

if (!ok) process.exitCode = 1;
