import browserExecutable from './browser-executable.cjs';
import path from 'node:path';
import {readFile, writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {bundle} from '@remotion/bundler';
import {openBrowser, selectComposition, renderMedia, renderStill} from '@remotion/renderer';
import {editorProjectSchema, projectToDialogue, hasFreshAudio} from '../.editor/shared.mjs';

const [snapshot, output] = process.argv.slice(2);
const project = editorProjectSchema.parse(JSON.parse(await readFile(snapshot, 'utf8')));
if (project.beats.some(beat => !hasFreshAudio(beat))) throw new Error('音声の更新が必要です');
const inputProps = {dialogue: projectToDialogue(project)};
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const browser = await openBrowser('chrome', {browserExecutable: browserExecutable(process.env.KNOWLEDGE_EDITOR_BROWSER)});
try {
  const composition = await selectComposition({serveUrl, id: 'EditorDialogue', inputProps, puppeteerInstance: browser});
  await renderStill({serveUrl, composition, inputProps, frame: 45,
    output: path.join(path.dirname(output), 'preview.png'), puppeteerInstance: browser});
  let last = -1;
  await renderMedia({serveUrl, composition, inputProps, outputLocation: output, codec: 'h264',
    pixelFormat: 'yuv420p', concurrency: 2, puppeteerInstance: browser, onProgress: ({progress}) => {
      const percent = Math.floor(progress * 100);
      if (percent > last) {last = percent; console.log(`PROGRESS:${progress}`);}
    }});
  const probe = JSON.parse(execFileSync('node_modules/@remotion/compositor-linux-x64-gnu/ffprobe',
    ['-v','error','-count_frames','-show_streams','-show_format','-of','json',output], {encoding: 'utf8'}));
  const video = probe.streams.find(s => s.codec_type === 'video');
  if (!probe.streams.some(s => s.codec_type === 'audio') || video.width !== 1080 || video.height !== 1920 ||
    Number(video.nb_read_frames) !== composition.durationInFrames || video.r_frame_rate !== '30/1') throw new Error('動画の検証に失敗しました');
  await writeFile(path.join(path.dirname(output), 'render-info.json'), JSON.stringify({title: project.title,
    seconds: composition.durationInFrames / 30, frames: composition.durationInFrames, probe}, null, 2));
} finally {await browser.close({silent: true});}
