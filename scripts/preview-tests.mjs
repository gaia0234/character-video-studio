import {mkdir} from 'node:fs/promises';
import path from 'node:path';
import {bundle} from '@remotion/bundler';
import {getCompositions, openBrowser, renderStill} from '@remotion/renderer';

const browserExecutable = process.argv.find((arg) => arg.startsWith('--browser-executable='))?.slice('--browser-executable='.length);
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const browser = await openBrowser('chrome', {browserExecutable});
try {
  const compositions = await getCompositions(serveUrl, {puppeteerInstance: browser});
  await mkdir('output/stills', {recursive: true});
  for (const id of ['TestRanking3', 'TestCollection5']) {
    const composition = compositions.find((item) => item.id === id);
    if (!composition) throw new Error(`Composition not found: ${id}`);
    const video = composition.props.video;
    const fps = composition.fps;
    const frames = [Math.round(video.introSeconds * fps / 2)];
    let start = Math.round(video.introSeconds * fps);
    for (const scene of video.scenes) {
      const duration = Math.round(scene.seconds * fps);
      frames.push(start + Math.min(24, duration - 1));
      for (const comment of scene.comments ?? []) {
        frames.push(start + Math.min(Math.round(comment.startSeconds * fps) + 12, duration - 1));
      }
      start += duration;
    }
    frames.push(start + Math.round(video.endingSeconds * fps / 2));
    for (const frame of frames) {
      const output = `output/stills/${id}-${String(frame).padStart(4, '0')}.png`;
      await renderStill({serveUrl, composition, frame, output, puppeteerInstance: browser});
      console.log(output);
    }
  }
} finally {
  await browser.close({silent: true});
}
