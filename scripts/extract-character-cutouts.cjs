const browserExecutable = require('./browser-executable.cjs');
// Mechanical extraction of approved reference art; never redraws or resizes pixels.
const {readFileSync, writeFileSync, mkdirSync} = require('node:fs');
const {createHash} = require('node:crypto');
const {resolve} = require('node:path');
const {openBrowser} = require('@remotion/renderer');
const root = resolve(__dirname, '..');
const materialRoot = resolve(root, '../knowledge-anime-character-system/materials');
const outputDir = resolve(root, 'public/assets/characters/test-cutouts');
const checkDir = resolve(root, 'output/character-cutouts');
const hash = data => createHash('sha256').update(data).digest('hex');
const characters = [
  {id: 'luno', name: 'ルーノ', source: 'a_clean_vector_flat_2d_character_design_sheet_illu_1.png', crop: [250, 132, 465, 389]},
  {id: 'miino', name: 'ミーノ', source: 'ChatGPT Image 2026年9月6日 03_43_18.png', crop: [1250, 310, 1448, 569]},
  {id: 'kano', name: 'カーノ', source: 'ChatGPT Image 2026年9月6日 03_43_18.png', crop: [1265, 590, 1433, 811], protectedEllipses: [[1395, 699, 27, 29]]},
];

(async () => {
  const browser = await openBrowser('chrome', {
    browserExecutable: browserExecutable(process.env.CUTOUT_BROWSER),
  });
  try {
    const page = await browser.newPage({context: () => null, logLevel: 'error', indent: false, pageIndex: 0, onBrowserLog: null, onLog: () => {}});
    await page.goto({url: 'about:blank', timeout: 30000});
    await page.evaluate(async src => {
      const font = new FontFace('CutoutJP', `url(${src})`);
      document.fonts.add(await font.load());
    }, 'data:font/ttf;base64,' + readFileSync(resolve(root, 'public/assets/fonts/NotoSansJP.ttf')).toString('base64'));
    mkdirSync(outputDir, {recursive: true});
    mkdirSync(checkDir, {recursive: true});
    const reports = [];
    const previews = [];
    for (const character of characters) {
      const sourcePath = resolve(materialRoot, character.source);
      const source = readFileSync(sourcePath);
      const result = await page.evaluate(async ({src, crop, protectedEllipses}) => {
        const image = new Image();
        image.src = src;
        await image.decode();
        const [left, top, right, bottom] = crop;
        const width = right - left, height = bottom - top;
        const canvas = document.createElement('canvas');
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d', {willReadFrequently: true});
        ctx.drawImage(image, left, top, width, height, 0, 0, width, height);
        const originalCrop = canvas.toDataURL('image/png');
        const pixels = ctx.getImageData(0, 0, width, height);
        const original = new Uint8ClampedArray(pixels.data);
        const count = width * height;
        const background = new Uint8Array(count);
        const queue = [];
        const isBackground = index => {
          // The source's right lens has an open outline. Protect its interior
          // explicitly so a background flood cannot erase the lens or pupil.
          const x = left + index % width, y = top + Math.floor(index / width);
          if (protectedEllipses.some(([cx, cy, rx, ry]) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1)) return false;
          const rgb = pixels.data.subarray(index * 4, index * 4 + 3);
          return Math.min(...rgb) >= 185 && Math.max(...rgb) - Math.min(...rgb) <= 45;
        };
        const add = index => {
          if (!background[index] && isBackground(index)) {background[index] = 1; queue.push(index);}
        };
        for (let x = 0; x < width; x++) {add(x); add((height - 1) * width + x);}
        for (let y = 0; y < height; y++) {add(y * width); add(y * width + width - 1);}
        for (let head = 0; head < queue.length; head++) {
          const i = queue[head], x = i % width, y = Math.floor(i / width);
          if (x) add(i - 1); if (x < width - 1) add(i + 1);
          if (y) add(i - width); if (y < height - 1) add(i + width);
        }
        // Retain the connected character, discard isolated exterior shadow specks.
        const visited = new Uint8Array(count);
        let largest = [];
        for (let start = 0; start < count; start++) {
          if (background[start] || visited[start]) continue;
          const component = [start]; visited[start] = 1;
          for (let head = 0; head < component.length; head++) {
            const i = component[head], x = i % width, y = Math.floor(i / width);
            const neighbors = [];
            if (x) neighbors.push(i - 1); if (x < width - 1) neighbors.push(i + 1);
            if (y) neighbors.push(i - width); if (y < height - 1) neighbors.push(i + width);
            for (const next of neighbors) if (!background[next] && !visited[next]) {visited[next] = 1; component.push(next);}
          }
          if (component.length > largest.length) largest = component;
        }
        const keep = new Uint8Array(count);
        for (const i of largest) keep[i] = 1;
        let minX = width, minY = height, maxX = -1, maxY = -1, modifiedRgb = 0;
        for (let i = 0; i < count; i++) {
          pixels.data[i * 4 + 3] = keep[i] ? 255 : 0;
          if (keep[i]) {
            const x = i % width, y = Math.floor(i / width);
            minX = Math.min(minX, x); maxX = Math.max(maxX, x);
            minY = Math.min(minY, y); maxY = Math.max(maxY, y);
            for (let c = 0; c < 3; c++) if (pixels.data[i * 4 + c] !== original[i * 4 + c]) modifiedRgb++;
          }
        }
        if (maxX < 0 || modifiedRgb) throw new Error('Empty cutout or changed source RGB');
        if (minX === 0 || minY === 0 || maxX === width - 1 || maxY === height - 1) throw new Error(`Character touches crop boundary: crop=${crop}, bounds=${[minX,minY,maxX,maxY]}`);
        ctx.putImageData(pixels, 0, 0);
        const padding = 16;
        const out = document.createElement('canvas');
        out.width = maxX - minX + 1 + padding * 2;
        out.height = maxY - minY + 1 + padding * 2;
        out.getContext('2d').drawImage(canvas, minX, minY, maxX - minX + 1, maxY - minY + 1, padding, padding, maxX - minX + 1, maxY - minY + 1);
        return {png: out.toDataURL('image/png'), originalCrop, width: out.width, height: out.height,
          contentBounds: [padding, padding, maxX - minX + 1, maxY - minY + 1],
          sourceContentBounds: [left + minX, top + minY, maxX - minX + 1, maxY - minY + 1],
          retainedPixels: largest.length, removedPixels: count - largest.length, modifiedRgb};
      }, {src: 'data:image/png;base64,' + source.toString('base64'), crop: character.crop, protectedEllipses: character.protectedEllipses || []});
      const file = `assets/characters/test-cutouts/${character.id}-front-v1.png`;
      const png = Buffer.from(result.png.split(',')[1], 'base64');
      writeFileSync(resolve(root, 'public', file), png);
      const {png: ignoredPng, originalCrop, ...checks} = result;
      reports.push({id: character.id, name: character.name, file, type: 'character-test-cutout',
        source: sourcePath, sourceSha256: hash(source), crop: character.crop, protectedEllipses: character.protectedEllipses || [], ...checks,
        sha256: hash(png), version: 'test-cutout-v1', approvalStatus: 'test-only; not a finished character master',
        method: 'Original RGB retained; exterior neutral bright background flood fill; largest connected foreground; no redrawing or upscaling'});
      previews.push({...character, ...result});
    }
    const screenshot = async (file, width, height, html) => {
      await page.setViewport({width, height, deviceScaleFactor: 1});
      await page.evaluate(async html => {
        document.documentElement.innerHTML = html;
        document.body.style.fontFamily = 'CutoutJP, sans-serif';
        await Promise.all([...document.images].map(image => image.decode()));
      }, html);
      const shot = await page._client().send('Page.captureScreenshot', {format: 'png'});
      writeFileSync(resolve(checkDir, file), Buffer.from(shot.value.data, 'base64'));
    };
    const backgrounds = ['#ffffff', '#122b55', 'conic-gradient(#dce1e8 25%,#fff 0 50%,#dce1e8 0 75%,#fff 0) 0 0/24px 24px'];
    await screenshot('comparison.png', 1200, 1110, `<head><meta charset="utf-8"><style>body{margin:0;background:#fff9ef;font-family:sans-serif;color:#122b55}h1{font-size:24px;margin:16px}.row{display:flex;margin:8px 16px;gap:8px}.cell{width:280px;height:310px;text-align:center}.art{height:280px;display:flex;align-items:center;justify-content:center}.art img{max-width:250px;max-height:265px}</style></head><body><h1>元画像 / 白背景 / 濃紺背景 / 透過確認（左から）</h1>${previews.map(p => `<div class="row"><div class="cell">${p.name}：元画像<div class="art"><img src="${p.originalCrop}"></div></div>${backgrounds.map(bg => `<div class="cell">切り出し<div class="art" style="background:${bg}"><img src="${p.png}"></div></div>`).join('')}</div>`).join('')}</body>`);
    for (const p of previews) {
      // Scale the visible character itself to 45% of the 1920px phone frame.
      const scale = 864 / p.contentBounds[3];
      await screenshot(`${p.id}-large.png`, 1080, 1920, `<head><meta charset="utf-8"><style>body{margin:0;background:#fff9ef;color:#122b55;font-family:sans-serif}h1{position:absolute;top:140px;left:90px;font-size:52px}p{position:absolute;top:260px;left:90px;font-size:30px}.character{position:absolute;left:50%;top:500px;transform:translateX(-50%)}.caption{position:absolute;left:90px;right:150px;top:1500px;padding:32px;border:2px solid #deedf7;font-size:40px;background:white}</style></head><body><h1>${p.name}</h1><p>PNG切り出し試験 · キャラ高さ45%</p><img class="character" src="${p.png}" style="width:${p.width * scale}px;height:${p.height * scale}px"><div class="caption">大きく表示したときの輪郭・小物・画質を確認</div></body>`);
    }
    const manifestPath = resolve(root, 'public/assets/manifest.json');
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    const files = new Set(reports.map(report => report.file));
    manifest.assets = manifest.assets.filter(asset => !files.has(asset.file)).concat(reports);
    writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
    writeFileSync(resolve(checkDir, 'verification.json'), JSON.stringify({characters: reports, sourceFilesUnchanged: characters.every(c => {
      const r = reports.find(report => report.id === c.id);
      return hash(readFileSync(resolve(materialRoot, c.source))) === r.sourceSha256;
    })}, null, 2) + '\n');
    console.log(JSON.stringify(reports.map(({name, width, height, sourceContentBounds, modifiedRgb}) => ({name, width, height, sourceContentBounds, modifiedRgb})), null, 2));
  } finally {await browser.close({silent: true});}
})().catch(error => {console.error(error); process.exitCode = 1;});
