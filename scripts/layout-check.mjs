#!/usr/bin/env node
// Layout check: render one frame of a Remotion composition and measure real DOM
// rectangles without changing the target source.
//
// Usage:
//   node scripts/layout-check.mjs \
//     --entry src/index-toyota-motion-pilot01-rev3.tsx \
//     --composition ToyotaMotionPilot01Rev3 --frame 360 \
//     --spec output/toyota-ch1-opening-20261102/layout-spec-rev3.json \
//     --json output/toyota-ch1-opening-20261102/layout-check-rev3.json \
//     --screenshot output/toyota-ch1-opening-20261102/layout-check-rev3.png
//
// Exit codes: 0 = all checks passed, 1 = layout issues found, 2 = tool/runtime error.
// The spec supports:
//   elements: [{id, selector|dataCheckId, text?, contains?, filter?: {computed?: {}, rect?: {w,h,tolerance?}},
//               index?, space?: "layout"|"screen", expect?: {x,y,w,h,tolerance?,space?}, allowOutOfBounds?}]
//   overlaps: [{id, a, b, space?: "layout"|"screen", tolerance?}]
//   ratios:   [{id, a, b, dimension: "width"|"height", box?: "css"|"border"|"screen",
//               expected, tolerance?}]
// Ratios are measured as value(b) / value(a).

import {createRequire} from 'node:module';
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

// Any error outside the main try (module loading, temp dir) is a tool error.
process.on('uncaughtException', (error) => {
  console.error(`layout-check: ERROR: ${error?.stack ?? error}`);
  process.exit(2);
});

const args = parseArgs(process.argv.slice(2));
if (args.help) {
  console.log(`Usage: node scripts/layout-check.mjs --entry <entry.tsx> --composition <id> --frame <N> --spec <json> [--json <out>] [--screenshot <png>] [--temp-dir <dir>]`);
  process.exit(0);
}

const root = process.cwd();
const tempRoot = path.resolve(args['temp-dir'] || process.env.REMOTION_TMPDIR || path.join(os.homedir(), '.cache', 'remotion-tmp'));
fs.mkdirSync(tempRoot, {recursive: true});
process.env.TMPDIR = tempRoot;

const require = createRequire(import.meta.url);
const {bundle} = require('@remotion/bundler');
const {RenderInternals, openBrowser, selectComposition} = require('@remotion/renderer');
const rendererDist = path.dirname(require.resolve('@remotion/renderer'));
const {setPropsAndEnv} = require(path.join(rendererDist, 'set-props-and-env.js'));
const {seekToFrame} = require(path.join(rendererDist, 'seek-to-frame.js'));

const entry = path.resolve(root, args.entry || 'src/index.ts');
const compositionId = args.composition;
const frame = Number(args.frame);
const specPath = args.spec ? path.resolve(root, args.spec) : null;
const jsonOut = args.json ? path.resolve(root, args.json) : null;
const screenshotOut = args.screenshot ? path.resolve(root, args.screenshot) : null;
const browserExecutable = args['browser-executable'] || process.env.REMOTION_BROWSER_EXECUTABLE || '/home/ds-work/.local/lib/chrome-headless-shell/chrome-headless-shell';
const timeout = Number(args.timeout ?? 60000);

let spec = null;
let bundlePath = null;
let server = null;
let browser = null;
let page = null;
let exitCode = 0;
// Startup failures are tool errors (exit 2), not layout issues (exit 1).
try {
  if (!compositionId) throw new Error('--composition is required');
  if (!Number.isInteger(frame) || frame < 0) throw new Error('--frame must be a non-negative integer');
  if (!specPath) throw new Error('--spec is required');
  if (!fs.existsSync(specPath)) throw new Error(`Spec not found: ${specPath}`);
  if (!fs.existsSync(browserExecutable)) throw new Error(`Browser executable not found: ${browserExecutable}`);

  spec = JSON.parse(fs.readFileSync(specPath, 'utf8'));
  if (!Array.isArray(spec.elements)) throw new Error('spec.elements must be an array');

  bundlePath = await bundle({
    entryPoint: entry,
    publicDir: path.resolve(root, 'public'),
    outDir: null,
    symlinkPublicDir: true,
  });

  server = await RenderInternals.prepareServer({
    webpackConfigOrServeUrl: bundlePath,
    port: null,
    remotionRoot: root,
    offthreadVideoThreads: null,
    logLevel: 'error',
    indent: false,
    offthreadVideoCacheSizeInBytes: null,
    binariesDirectory: null,
    forceIPv4: false,
    sampleRate: 48000,
  });

  browser = await openBrowser('chrome', {
    browserExecutable,
    chromeMode: 'headless-shell',
    chromiumOptions: {gl: 'swangle'},
    logLevel: 'error',
  });

  const composition = await selectComposition({
    serveUrl: server.serveUrl,
    id: compositionId,
    puppeteerInstance: browser,
    browserExecutable,
    chromiumOptions: {gl: 'swangle'},
    inputProps: {},
    logLevel: 'error',
  });
  if (frame >= composition.durationInFrames) {
    throw new Error(`frame ${frame} is outside 0..${composition.durationInFrames - 1}`);
  }

  page = await browser.newPage({
    context: server.sourceMap,
    logLevel: 'error',
    indent: false,
    pageIndex: 0,
    onBrowserLog: null,
    onLog: () => undefined,
  });
  await page.setViewport({width: composition.width, height: composition.height, deviceScaleFactor: 1});
  await setPropsAndEnv({
    serializedInputPropsWithCustomSchema: JSON.stringify(spec.inputProps ?? {}),
    envVariables: {},
    page,
    serveUrl: server.serveUrl,
    initialFrame: frame,
    timeoutInMilliseconds: timeout,
    proxyPort: null,
    retriesRemaining: 2,
    audioEnabled: false,
    videoEnabled: false,
    indent: false,
    logLevel: 'error',
    onServeUrlVisited: () => undefined,
    isMainTab: true,
    mediaCacheSizeInBytes: null,
    initialMemoryAvailable: null,
    darkMode: false,
    sampleRate: 48000,
  });
  await page.evaluate((bundleArgs) => {
    window.remotion_setBundleMode(bundleArgs);
  }, {
    type: 'composition',
    compositionName: composition.id,
    serializedResolvedPropsWithSchema: JSON.stringify(spec.inputProps ?? {}),
    compositionDurationInFrames: composition.durationInFrames,
    compositionFps: composition.fps,
    compositionHeight: composition.height,
    compositionWidth: composition.width,
    compositionDefaultCodec: composition.defaultCodec,
    compositionDefaultOutName: composition.defaultOutName,
    compositionDefaultVideoImageFormat: composition.defaultVideoImageFormat,
    compositionDefaultPixelFormat: composition.defaultPixelFormat,
    compositionDefaultProResProfile: composition.defaultProResProfile,
    compositionDefaultSampleRate: composition.defaultSampleRate,
  });
  await seekToFrame({
    frame,
    page,
    composition: composition.id,
    timeoutInMilliseconds: timeout,
    logLevel: 'error',
    indent: false,
    attempt: 0,
  });

  const raw = await page.evaluate((elementSpecs) => {
    const layoutRect = (el) => {
      let x = 0;
      let y = 0;
      let n = el;
      while (n) {
        x += n.offsetLeft || 0;
        y += n.offsetTop || 0;
        n = n.offsetParent;
      }
      return {x, y, w: el.offsetWidth, h: el.offsetHeight};
    };
    const measure = (el) => {
      const r = el.getBoundingClientRect();
      const s = getComputedStyle(el);
      return {
        tag: el.tagName,
        text: (el.textContent || '').trim().slice(0, 160),
        src: el.getAttribute ? el.getAttribute('src') : null,
        layout: layoutRect(el),
        screen: {x: r.x, y: r.y, w: r.width, h: r.height},
        css: {width: parseFloat(s.width), height: parseFloat(s.height)},
        computed: {width: s.width, height: s.height, backgroundColor: s.backgroundColor, opacity: s.opacity,
          position: s.position, fontSize: s.fontSize, lineHeight: s.lineHeight},
      };
    };
    const results = [];
    for (const item of elementSpecs) {
      let nodes = [];
      try {
        if (item.dataCheckId) {
          nodes = [...document.querySelectorAll(`[data-check-id="${CSS.escape(item.dataCheckId)}"]`)];
        } else if (item.selector) {
          nodes = [...document.querySelectorAll(item.selector)];
        }
      } catch (error) {
        results.push({id: item.id, error: String(error), matches: [], chosen: null, matchCount: 0});
        continue;
      }
      const filtered = nodes.filter((el) => {
        const text = (el.textContent || '').trim();
        if (item.text !== undefined && text !== item.text) return false;
        if (item.contains !== undefined && !text.includes(item.contains)) return false;
        if (item.filter?.computed) {
          const s = getComputedStyle(el);
          for (const [key, value] of Object.entries(item.filter.computed)) {
            if (s[key] !== value) return false;
          }
        }
        if (item.filter?.rect) {
          const r = layoutRect(el);
          const tolerance = Number(item.filter.rect.tolerance ?? 1);
          if (item.filter.rect.w !== undefined && Math.abs(r.w - item.filter.rect.w) > tolerance) return false;
          if (item.filter.rect.h !== undefined && Math.abs(r.h - item.filter.rect.h) > tolerance) return false;
        }
        return true;
      });
      const index = Number(item.index ?? 0);
      const chosen = filtered[index] ?? null;
      results.push({
        id: item.id,
        matchCount: filtered.length,
        chosen: chosen ? measure(chosen) : null,
        matches: filtered.slice(0, 5).map(measure),
      });
    }
    return {
      viewport: {width: document.documentElement.clientWidth, height: document.documentElement.clientHeight},
      results,
    };
  }, spec.elements);

  const byId = new Map();
  const elements = [];
  const issues = [];
  for (const result of raw.results) {
    if (result.error) {
      issues.push({type: 'selector', id: result.id, message: result.error});
      continue;
    }
    if (!result.chosen) {
      issues.push({type: 'missing', id: result.id, message: `element not found (matches=${result.matchCount})`});
      continue;
    }
    byId.set(result.id, result.chosen);
    const specItem = spec.elements.find((e) => e.id === result.id);
    const space = specItem.space === 'screen' ? 'screen' : 'layout';
    const rect = result.chosen[space];
    const expected = specItem.expect;
    let delta = null;
    let ok = true;
    if (expected) {
      const tolerance = Number(expected.tolerance ?? 0);
      delta = {
        x: Number((rect.x - expected.x).toFixed(2)),
        y: Number((rect.y - expected.y).toFixed(2)),
        w: Number((rect.w - expected.w).toFixed(2)),
        h: Number((rect.h - expected.h).toFixed(2)),
      };
      for (const key of ['x', 'y', 'w', 'h']) {
        if (Math.abs(delta[key]) > tolerance) ok = false;
      }
      if (!ok) issues.push({type: 'expect', id: result.id, space, expected, actual: rect, delta, tolerance});
    }
    if (!specItem.allowOutOfBounds) {
      const tolerance = Number(expected?.tolerance ?? 0);
      if (rect.x < -tolerance || rect.y < -tolerance || rect.x + rect.w > raw.viewport.width + tolerance || rect.y + rect.h > raw.viewport.height + tolerance) {
        ok = false;
        issues.push({type: 'out-of-bounds', id: result.id, space, rect, viewport: raw.viewport, tolerance});
      }
    }
    elements.push({
      id: result.id,
      found: true,
      matchCount: result.matchCount,
      space,
      rect,
      screen: result.chosen.screen,
      layout: result.chosen.layout,
      css: result.chosen.css,
      text: result.chosen.text,
      expected: expected ?? null,
      delta,
      ok,
    });
  }

  const overlaps = [];
  for (const pair of spec.overlaps ?? []) {
    const a = byId.get(pair.a);
    const b = byId.get(pair.b);
    const space = pair.space === 'screen' ? 'screen' : 'layout';
    if (!a || !b) {
      issues.push({type: 'overlap-missing', id: pair.id, message: `missing ${pair.a} or ${pair.b}`});
      continue;
    }
    const ra = a[space];
    const rb = b[space];
    const x = Math.max(ra.x, rb.x);
    const y = Math.max(ra.y, rb.y);
    const w = Math.max(0, Math.min(ra.x + ra.w, rb.x + rb.w) - x);
    const h = Math.max(0, Math.min(ra.y + ra.h, rb.y + rb.h) - y);
    const tolerance = Number(pair.tolerance ?? 0);
    const overlap = w > tolerance && h > tolerance;
    if (overlap) issues.push({type: 'overlap', id: pair.id, a: pair.a, b: pair.b, space, overlap: {x, y, w, h}, tolerance});
    overlaps.push({id: pair.id, a: pair.a, b: pair.b, space, overlap: {x, y, w, h}, area: w * h, ok: !overlap, tolerance});
  }

  const ratios = [];
  for (const ratio of spec.ratios ?? []) {
    const a = byId.get(ratio.a);
    const b = byId.get(ratio.b);
    if (!a || !b) {
      issues.push({type: 'ratio-missing', id: ratio.id, message: `missing ${ratio.a} or ${ratio.b}`});
      continue;
    }
    const box = ratio.box ?? 'css';
    const dimension = ratio.dimension === 'width' ? 'width' : 'height';
    const value = (item) => {
      if (box === 'screen') return item.screen[dimension === 'width' ? 'w' : 'h'];
      if (box === 'border') return item.layout[dimension === 'width' ? 'w' : 'h'];
      return item.css[dimension];
    };
    const av = value(a);
    const bv = value(b);
    const actual = av === 0 ? Infinity : bv / av;
    const expected = Number(ratio.expected);
    const tolerance = Number(ratio.tolerance ?? 0);
    const ok = Math.abs(actual - expected) <= tolerance;
    if (!ok) issues.push({type: 'ratio', id: ratio.id, a: ratio.a, b: ratio.b, box, dimension,
      actual: Number(actual.toFixed(4)), expected, tolerance, aValue: av, bValue: bv});
    ratios.push({id: ratio.id, a: ratio.a, b: ratio.b, box, dimension, aValue: av, bValue: bv,
      actual: Number(actual.toFixed(4)), expected, tolerance, ok});
  }

  const report = {
    composition: composition.id,
    frame,
    entry: path.relative(root, entry),
    spec: path.relative(root, specPath),
    viewport: raw.viewport,
    elements,
    overlaps,
    ratios,
    issues,
    ok: issues.length === 0,
  };

  if (jsonOut) {
    fs.mkdirSync(path.dirname(jsonOut), {recursive: true});
    fs.writeFileSync(jsonOut, `${JSON.stringify(report, null, 2)}\n`);
  }

  if (screenshotOut) {
    const client = page._client();
    const shot = await client.send('Page.captureScreenshot', {format: 'png', fromSurface: true});
    const screenshotData = shot?.value?.data ?? shot?.data;
    if (!screenshotData) throw new Error('Page.captureScreenshot returned no data');
    fs.mkdirSync(path.dirname(screenshotOut), {recursive: true});
    fs.writeFileSync(screenshotOut, Buffer.from(screenshotData, 'base64'));
  }

  console.log(`layout-check: ${composition.id} frame=${frame}`);
  for (const e of elements) {
    const d = e.delta ? ` delta=${JSON.stringify(e.delta)}` : '';
    console.log(`  element ${e.id}: ${e.ok ? 'OK' : 'FAIL'} ${e.space}=${JSON.stringify(e.rect)}${d}${e.text ? ` text="${e.text.slice(0, 40)}"` : ''}`);
  }
  for (const o of overlaps) {
    console.log(`  overlap ${o.id}: ${o.ok ? 'none' : 'FOUND'} ${JSON.stringify(o.overlap)}`);
  }
  for (const r of ratios) {
    console.log(`  ratio ${r.id}: ${r.ok ? 'OK' : 'FAIL'} ${r.aValue}/${r.bValue} -> ${r.actual} expected=${r.expected} tol=${r.tolerance}`);
  }
  if (jsonOut) console.log(`  json: ${path.relative(root, jsonOut)}`);
  if (screenshotOut) console.log(`  screenshot: ${path.relative(root, screenshotOut)}`);
  if (issues.length) {
    console.log(`layout-check: FAIL (${issues.length} issue${issues.length === 1 ? '' : 's'})`);
    for (const issue of issues) console.log(`  - ${issue.type}: ${JSON.stringify(issue)}`);
    exitCode = 1;
  } else {
    console.log('layout-check: PASS');
    exitCode = 0;
  }
} catch (error) {
  console.error(`layout-check: ERROR: ${error?.stack ?? error}`);
  exitCode = 2;
} finally {
  if (page) await page.close().catch(() => undefined);
  if (browser) await browser.close({silent: true}).catch(() => undefined);
  if (server) await server.closeServer(true).catch(() => undefined);
  if (bundlePath) fs.rmSync(bundlePath, {recursive: true, force: true});
}

process.exit(exitCode);
