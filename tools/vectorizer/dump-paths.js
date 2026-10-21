#!/usr/bin/env node
// トレース結果のパスを一覧出力（位置ルール選定用）。usage: node dump-paths.js <in.png> [x0 y0 x1 y1]
const fs = require('node:fs');
const {PNG} = require('pngjs');
const Imagetracer = require('imagetracerjs');

const [, , inPng, ...rest] = process.argv;
const png = PNG.sync.read(fs.readFileSync(inPng));
const data = new Uint8ClampedArray(png.data);
for (let i = 0; i < data.length; i += 4) {
  const lum = (data[i] * 299 + data[i + 1] * 587 + data[i + 2] * 114) / 1000;
  const v = lum < 128 ? 0 : 255;
  data[i] = data[i + 1] = data[i + 2] = v; data[i + 3] = 255;
}
const resultRaw = Imagetracer.imagedataToSVG({
  width: png.width, height: png.height, data,
  ltres: 0.1, qtres: 0.05, pathomit: 2, strokewidth: 0, lineart: 1,
  colorsampling: 1, minarea: 8, layer: 0,
});
const re = /<path\s+([^>]*?)\/?>/g;
let m; const list = [];
const svgText = typeof resultRaw === 'string' ? resultRaw : (resultRaw && resultRaw.svg) || '';
while ((m = re.exec(svgText)) !== null) {
  const d = (m[1].match(/d="([^"]*)"/) || [])[1];
  const fill = (m[1].match(/fill="([^"]*)"/) || [])[1];
  if (!d) continue;
  const nums = d.match(/-?\d+(\.\d+)?/g) || [];
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (let i = 0; i + 1 < nums.length; i += 2) {
    const x = parseFloat(nums[i]); const y = parseFloat(nums[i + 1]);
    if (x < x0) x0 = x; if (x > x1) x1 = x;
    if (y < y0) y0 = y; if (y > y1) y1 = y;
  }
  if (!isFinite(x0)) continue;
  const dark = /rgb\((\d+),\s*(\d+),\s*(\d+)\)/.exec(fill);
  const isInk = dark ? Number(dark[1]) < 128 : true;
  list.push({d, fill, isInk, x0, y0, x1, y1, cx: (x0+x1)/2, cy: (y0+y1)/2, w: x1-x0, h: y1-y0, n: nums.length/2});
}
const region = rest.length === 4 ? rest.map(Number) : null;
let items = list;
if (region) {
  const [rx0, ry0, rx1, ry1] = region;
  items = list.filter((p) => p.cx >= rx0 && p.cx <= rx1 && p.cy >= ry0 && p.cy <= ry1);
}
items = items.filter((p) => p.isInk);
items.sort((a, b) => (b.w * b.h) - (a.w * a.h));
console.log('total paths:', list.length, 'in region:', items.length);
for (const p of items.slice(0, 40)) {
  console.log(`  fill=${p.fill} x${p.x0.toFixed(0)}..${p.x1.toFixed(0)} y${p.y0.toFixed(0)}..${p.y1.toFixed(0)} (${p.w.toFixed(0)}x${p.h.toFixed(0)}) center(${p.cx.toFixed(0)},${p.cy.toFixed(0)}) pts=${p.n}`);
}
