#!/usr/bin/env node
// エルダーチャンネルの線画ラスタ→SVG変換（専用トレーサ imagetracerjs + クリップによる色分け）。
// 1) 入力を白黒2色に閾値化し、imagetracerjs でトレース（線画は1本の闭合パスにまとまる）
// 2) 差し色は同じ線画パスを「クリップ領域」で切り出して塗る（面として鮮明／線画は完全に共通）
//    - ribbon: つばの直線に沿った回転矩形の帯（つばの上のリボン）
//    - bow   : 蝶ネクタイ位置の矩形
// 3) 白地＋黒線画＋差し色(currentColor)のSVGを出力
// usage: node vectorize-character.js <in.png> <out.svg> <spec.json>
// spec: {"color":"#C8322C","ribbon":{"p1":[x,y],"p2":[x,y],"offset":30,"width":12},"bow":{"box":[x,y,w,h]}}
const fs = require('node:fs');
const path = require('node:path');
const {PNG} = require('pngjs');
const Imagetracer = require('imagetracerjs');

const [, , inPng, outSvg, specP] = process.argv;
if (!inPng || !outSvg || !specP) {
  console.error('usage: node vectorize-character.js <in.png> <out.svg> <spec.json>');
  process.exit(2);
}
const spec = JSON.parse(fs.readFileSync(specP, 'utf-8'));

const png = PNG.sync.read(fs.readFileSync(inPng));
const data = new Uint8ClampedArray(png.data);
for (let i = 0; i < data.length; i += 4) {
  const lum = (data[i] * 299 + data[i + 1] * 587 + data[i + 2] * 114) / 1000;
  const v = lum < 128 ? 0 : 255;
  data[i] = data[i + 1] = data[i + 2] = v;
  data[i + 3] = 255;
}
const resultRaw = Imagetracer.imagedataToSVG({
  width: png.width, height: png.height, data,
  ltres: 0.1, qtres: 0.05, pathomit: 2, strokewidth: 0, lineart: 1,
  colorsampling: 1, minarea: 8, layer: 0,
});
const svgText = typeof resultRaw === 'string' ? resultRaw : (resultRaw && resultRaw.svg) || '';
if (!svgText) {
  console.error('trace failed');
  process.exit(3);
}
const re = /<path\s+([^>]*?)\/?>/g;
let m;
const inkPaths = [];
while ((m = re.exec(svgText)) !== null) {
  const fill = (m[1].match(/fill="([^"]*)"/) || [])[1] || '';
  const d = (m[1].match(/d="([^"]*)"/) || [])[1];
  if (!d) continue;
  const dark = /rgb\((\d+),\s*(\d+),\s*(\d+)\)/.exec(fill);
  const isInk = dark ? Number(dark[1]) < 128 : true;
  if (isInk) inkPaths.push(d);
}
if (!inkPaths.length) {
  console.error('no ink path');
  process.exit(4);
}
const inkD = inkPaths.join(' ');

// クリップ領域
const defs = [];
const accents = [];
if (spec.ribbon) {
  const {p1, p2, offset = 0, width = 12} = spec.ribbon;
  const dx = p2[0] - p1[0];
  const dy = p2[1] - p1[1];
  const len = Math.hypot(dx, dy);
  const ux = dx / len;
  const uy = dy / len;
  const nx = uy;
  const ny = -ux; // 法線（進行方向に対して左向き）
  const cx = (p1[0] + p2[0]) / 2 + nx * offset;
  const cy = (p1[1] + p2[1]) / 2 + ny * offset;
  const angle = (Math.atan2(uy, ux) * 180) / Math.PI;
  const half = width / 2;
  defs.push(`    <rect x="${(-len / 2 - 12).toFixed(1)}" y="${(-half).toFixed(1)}" width="${(len + 24).toFixed(1)}" height="${width}" fill="#fff" transform="translate(${cx.toFixed(1)} ${cy.toFixed(1)}) rotate(${angle.toFixed(2)})"/>`);
  accents.push(['ribbon', 'clip-ribbon']);
}
if (spec.bow) {
  const [x, y, w, h] = spec.bow.box;
  defs.push(`    <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#fff"/>`);
  accents.push(['bow', 'clip-bow']);
}

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${png.width} ${png.height}" color="${spec.color || '#000000'}">\n`;
svg += `  <title>${path.basename(outSvg, '.svg')}</title>\n`;
if (defs.length) {
  svg += '  <defs>\n';
  accents.forEach(([name], i) => {
    svg += `    <clipPath id="clip-${name}">\n${defs[i]}\n    </clipPath>\n`;
  });
  svg += '  </defs>\n';
}
svg += `  <rect width="${png.width}" height="${png.height}" fill="#ffffff"/>\n`;
svg += `  <path d="${esc(inkD)}" fill="#111111" fill-rule="evenodd"/>\n`;
for (const [name, clip] of accents) {
  svg += `  <path id="${name}" d="${esc(inkD)}" fill="currentColor" fill-rule="evenodd" clip-path="url(#${clip})"/>\n`;
}
svg += '</svg>\n';
fs.writeFileSync(outSvg, svg);
console.log(`${path.basename(outSvg)}: inkPaths=${inkPaths.length} accents=${accents.map(([n]) => n).join(',') || 'none'} bytes=${svg.length}`);
