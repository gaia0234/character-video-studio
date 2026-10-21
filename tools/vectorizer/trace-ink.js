#!/usr/bin/env node
// 線画PNGから黒線画パスを抽出しJSONで書き出す（imagetracerjs・白黒2色化してからトレース）。
// usage: node trace-ink.js <in.png> <out.json>
const fs = require('node:fs');
const {PNG} = require('pngjs');
const Imagetracer = require('imagetracerjs');

const [, , inPng, outJson] = process.argv;
if (!inPng || !outJson) {
  console.error('usage: node trace-ink.js <in.png> <out.json>');
  process.exit(2);
}
const png = PNG.sync.read(fs.readFileSync(inPng));
const data = new Uint8ClampedArray(png.data);
for (let i = 0; i < data.length; i += 4) {
  const lum = (data[i] * 299 + data[i + 1] * 587 + data[i + 2] * 114) / 1000;
  const v = lum < 128 ? 0 : 255;
  data[i] = data[i + 1] = data[i + 2] = v;
  data[i + 3] = 255;
}
const raw = Imagetracer.imagedataToSVG({
  width: png.width, height: png.height, data,
  ltres: 0.1, qtres: 0.05, pathomit: 2, strokewidth: 0, lineart: 1,
  colorsampling: 1, minarea: 8, layer: 0,
});
const svgText = typeof raw === 'string' ? raw : (raw && raw.svg) || '';
const re = /<path\s+([^>]*?)\/?>/g;
let m;
const ink = [];
while ((m = re.exec(svgText)) !== null) {
  const fill = (m[1].match(/fill="([^"]*)"/) || [])[1] || '';
  const d = (m[1].match(/d="([^"]*)"/) || [])[1];
  if (!d) continue;
  const dark = /rgb\((\d+),\s*(\d+),\s*(\d+)\)/.exec(fill);
  const isInk = dark ? Number(dark[1]) < 128 : true;
  if (isInk) ink.push(d);
}
fs.writeFileSync(outJson, JSON.stringify({width: png.width, height: png.height, ink}, null, 1));
console.log(`${outJson}: inkPaths=${ink.length} size=${png.width}x${png.height}`);
