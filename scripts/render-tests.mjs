import path from 'node:path';
import {bundle} from '@remotion/bundler';
import {getCompositions, openBrowser, renderMedia} from '@remotion/renderer';

const browserExecutable = process.argv.find((arg) => arg.startsWith('--browser-executable='))?.slice('--browser-executable='.length);
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const browser = await openBrowser('chrome', {browserExecutable});
try {
  const compositions = await getCompositions(serveUrl, {puppeteerInstance: browser});
  for (const [id, outputLocation] of [
    ['TestRanking3', 'output/test-ranking-3.mp4'],
    ['TestCollection5', 'output/test-collection-5.mp4'],
  ]) {
    const composition = compositions.find((item) => item.id === id);
    if (!composition) throw new Error(`Composition not found: ${id}`);
    console.log(`Rendering ${id}: ${composition.durationInFrames} frames`);
    let lastProgress = -1;
    await renderMedia({serveUrl, composition, outputLocation, codec: 'h264', pixelFormat: 'yuv420p',
      concurrency: 2, puppeteerInstance: browser, onProgress: ({progress}) => {
        const step = Math.floor(progress * 10);
        if (step > lastProgress) {lastProgress = step; console.log(`${id}: ${step * 10}%`);}
      }});
    console.log(outputLocation);
  }
} finally {
  await browser.close({silent: true});
}
