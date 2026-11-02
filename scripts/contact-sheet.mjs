#!/usr/bin/env node
// Contact sheet: render frames of a Remotion composition at a fixed interval and
// compose them into one PNG with a seconds label under/above each tile.
//
// Usage:
//   node scripts/contact-sheet.mjs \
//     --entry src/index-toyota-replan-storyboard-20261102-rev3.tsx \
//     --composition ToyotaReplanStoryboard20261102Rev3 \
//     --start 0 --end 29 --interval 0.5 \
//     --output output/toyota-ch1-opening-20261102/contact-rev3-test.png
//
// Optional: --columns 3 --thumb-width 480 --frames-dir /tmp/opencode/contact-frames
// Requires: python3 + Pillow for the final composition (no new npm dependency).

import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const parseArgs = (argv) => {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (!a.startsWith('--')) continue;
    const key = a.slice(2);
    const next = argv[i + 1];
    if (next && !next.startsWith('--')) {
      args[key] = next;
      i += 1;
    } else {
      args[key] = true;
    }
  }
  return args;
};

const args = parseArgs(process.argv.slice(2));
if (args.help) {
  console.log(`Usage: node scripts/contact-sheet.mjs --entry <entry.tsx> --composition <id> [--start 0] [--end N] [--interval 0.5] [--output <png>] [--columns 3] [--thumb-width 480] [--temp-dir <dir>]`);
  process.exit(0);
}

const root = process.cwd();
// /tmp is a small tmpfs in this environment. Keep Remotion's throwaway bundles
// under the user's cache unless the caller explicitly supplies TMPDIR.
const tempRoot = path.resolve(args['temp-dir'] || process.env.REMOTION_TMPDIR || path.join(os.homedir(), '.cache', 'remotion-tmp'));
fs.mkdirSync(tempRoot, {recursive: true});
process.env.TMPDIR = tempRoot;

const require = createRequire(import.meta.url);
const {bundle} = require('@remotion/bundler');
const {openBrowser, renderStill, selectComposition} = require('@remotion/renderer');

const entry = path.resolve(root, args.entry || 'src/index.ts');
const compositionId = args.composition;
const interval = Number(args.interval ?? 0.5);
const columns = Math.max(1, Number(args.columns ?? 3));
const thumbWidth = Math.max(160, Number(args['thumb-width'] ?? 480));
const output = path.resolve(root, args.output || 'output/contact-sheet.png');
const framesDir = path.resolve(root, args['frames-dir'] || path.join(tempRoot, 'opencode', `contact-${Date.now()}`));
const browserExecutable = process.env.REMOTION_BROWSER_EXECUTABLE || '/home/ds-work/.local/lib/chrome-headless-shell/chrome-headless-shell';

if (!compositionId) throw new Error('--composition is required');
if (!(interval > 0)) throw new Error('--interval must be > 0');
if (!fs.existsSync(browserExecutable)) throw new Error(`Browser executable not found: ${browserExecutable}`);

const bundlePath = await bundle({
  entryPoint: entry,
  publicDir: path.resolve(root, 'public'),
  outDir: null,
  // Throwaway bundle: symlink public instead of copying the multi-GB audio assets.
  symlinkPublicDir: true,
});

const browser = await openBrowser('chrome', {
  browserExecutable,
  chromeMode: 'headless-shell',
  chromiumOptions: {gl: 'swangle'},
  logLevel: 'error',
});

try {
  const composition = await selectComposition({
    serveUrl: bundlePath,
    id: compositionId,
    puppeteerInstance: browser,
    browserExecutable,
    chromiumOptions: {gl: 'swangle'},
    inputProps: {},
    logLevel: 'error',
  });

  const duration = composition.durationInFrames;
  const fps = composition.fps;
  const start = Math.max(0, Math.min(duration - 1, Number(args.start ?? 0)));
  const requestedEnd = Number(args.end ?? duration - 1);
  const end = Math.max(start, Math.min(duration - 1, requestedEnd));
  const step = Math.max(1, Math.round(interval * fps));
  const frames = [];
  for (let f = start; f <= end; f += step) frames.push(f);
  if (frames.length === 0) frames.push(start);

  fs.mkdirSync(framesDir, {recursive: true});
  const rendered = [];
  for (const frame of frames) {
    const file = path.join(framesDir, `frame-${String(frame).padStart(5, '0')}.png`);
    process.stdout.write(`render frame ${frame}/${duration - 1} ... `);
    await renderStill({
      composition,
      serveUrl: bundlePath,
      output: file,
      frame,
      imageFormat: 'png',
      puppeteerInstance: browser,
      browserExecutable,
      chromiumOptions: {gl: 'swangle'},
      inputProps: {},
      logLevel: 'error',
    });
    const seconds = frame / fps;
    rendered.push({
      path: file,
      frame,
      seconds: Number(seconds.toFixed(3)),
      label: `${seconds.toFixed(1)}s / f${frame}`,
    });
    console.log('done');
  }

  const font = path.resolve(root, 'public/assets/fonts/NotoSansJP.ttf');
  const metaPath = path.join(framesDir, 'contact-meta.json');
  fs.writeFileSync(metaPath, JSON.stringify({
    output,
    title: `${compositionId} / ${interval}s interval`,
    columns,
    thumbWidth,
    font,
    frames: rendered,
  }, null, 2));

  const pyPath = path.join(framesDir, 'compose-contact-sheet.py');
  fs.writeFileSync(pyPath, String.raw`
import json, os, sys
from PIL import Image, ImageDraw, ImageFont

meta = json.load(open(sys.argv[1], encoding='utf-8'))
frames = meta['frames']
if not frames:
    raise SystemExit('no frames')
columns = max(1, int(meta.get('columns', 3)))
columns = min(columns, len(frames))
thumb_w = int(meta.get('thumbWidth', 480))
first = Image.open(frames[0]['path']).convert('RGB')
thumb_h = round(thumb_w * first.height / first.width)
label_h = 38
gap = 18
margin = 24
header_h = 64 if meta.get('title') else 0
rows = (len(frames) + columns - 1) // columns
sheet_w = margin * 2 + columns * thumb_w + (columns - 1) * gap
sheet_h = margin * 2 + header_h + rows * (thumb_h + label_h) + (rows - 1) * gap
sheet = Image.new('RGB', (sheet_w, sheet_h), (245, 240, 229))
draw = ImageDraw.Draw(sheet)

def load_font(size):
    path = meta.get('font')
    if path and os.path.exists(path):
        try:
            return ImageFont.truetype(path, size)
        except Exception:
            pass
    return ImageFont.load_default()

title_font = load_font(26)
label_font = load_font(20)
if meta.get('title'):
    draw.text((margin, margin), meta['title'], fill=(41, 55, 71), font=title_font)

for i, item in enumerate(frames):
    col = i % columns
    row = i // columns
    x = margin + col * (thumb_w + gap)
    y = margin + header_h + row * (thumb_h + label_h + gap)
    label_bar = (x, y, x + thumb_w, y + label_h)
    draw.rectangle(label_bar, fill=(38, 49, 63))
    label = item['label']
    bbox = draw.textbbox((0, 0), label, font=label_font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    draw.text((x + (thumb_w - tw) / 2, y + (label_h - th) / 2 - 2), label, fill=(255, 252, 245), font=label_font)
    img = Image.open(item['path']).convert('RGB').resize((thumb_w, thumb_h), Image.LANCZOS)
    sheet.paste(img, (x, y + label_h))

os.makedirs(os.path.dirname(meta['output']), exist_ok=True)
sheet.save(meta['output'])
print(f"contact-sheet: {meta['output']} ({sheet_w}x{sheet_h}, {len(frames)} frames)")
`);

  execFileSync('python3', [pyPath, metaPath], {stdio: 'inherit'});
  console.log(`contact-sheet: ${output}`);
  console.log(`frames: ${frames.join(', ')} (${frames.length} tiles, fps=${fps}, duration=${duration})`);
} finally {
  await browser.close({silent: true}).catch(() => undefined);
  fs.rmSync(bundlePath, {recursive: true, force: true});
}
