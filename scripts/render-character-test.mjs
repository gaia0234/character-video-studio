import {mkdir, readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {bundle} from '@remotion/bundler';
import {getCompositions, openBrowser, renderMedia, renderStill} from '@remotion/renderer';

const browserExecutable = process.argv.find(arg => arg.startsWith('--browser-executable='))?.slice('--browser-executable='.length);
const voiced = process.argv.includes('--voice');
const id = voiced ? 'TestCharacterDialogueVoice' : 'TestCharacterDialogue';
const outputDirectory = voiced ? 'output/character-dialogue-voice' : 'output/character-dialogue-study-room';
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const browser = await openBrowser('chrome', {browserExecutable});
try {
  const composition = (await getCompositions(serveUrl, {puppeteerInstance: browser})).find(c => c.id === id);
  if (!composition) throw new Error(`${id} missing`);
  if (!voiced && composition.durationInFrames !== 900) throw new Error('Expected 30 seconds at 30fps');
  const dialogue = JSON.parse(await readFile(voiced ? 'src/data/tests/character-dialogue-voice.json' : 'src/data/tests/character-dialogue.json', 'utf8'));
  let offset = 0;
  const voiceFrames = dialogue.beats.flatMap(beat => {
    const duration = Math.round(beat.seconds * composition.fps);
    const frames = [offset, offset + Math.min(45, duration - 1), offset + duration - 1];
    offset += duration;
    return frames;
  });
  await mkdir(`${outputDirectory}/stills`, {recursive: true});
  for (const frame of process.argv.includes('--video-only') ? [] : voiced ? voiceFrames : [0, 45, 149, 150, 210, 329, 375, 479, 480, 525, 600, 719, 765, 809, 855, 899]) {
    const output = `${outputDirectory}/stills/frame-${String(frame).padStart(3, '0')}.png`;
    await renderStill({serveUrl, composition, frame, output, puppeteerInstance: browser});
    console.log(output);
  }
  if (!process.argv.includes('--stills-only')) {
    let lastStep = -1;
    await renderMedia({serveUrl, composition, outputLocation: voiced ? 'output/test-character-dialogue-voice.mp4' : 'output/test-character-dialogue-study-room.mp4',
      codec: 'h264', pixelFormat: 'yuv420p', concurrency: 2, puppeteerInstance: browser,
      onProgress: ({progress}) => {
        const step = Math.floor(progress * 10);
        if (step > lastStep) {lastStep = step; console.log(`MP4: ${step * 10}%`);}
      }});
  }
  await writeFile(`${outputDirectory}/render-info.json`, JSON.stringify({composition: composition.id,
    width: composition.width, height: composition.height, fps: composition.fps,
    frames: composition.durationInFrames, seconds: composition.durationInFrames / composition.fps,
    sound: voiced ? 'VOICEVOX dialogue' : 'silent', stillsOnly: process.argv.includes('--stills-only')}, null, 2) + '\n');
} finally {await browser.close({silent: true});}
