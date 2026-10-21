// V10台本+音声実尺の検査: node scripts/check-longform-v10.mjs
// node:fs/path 標準APIのみ。ERRORがあれば exit 1、WARNのみなら exit 0。
// 境界判断（開始0.4s＋末尾0.5s込めの音声収まり、cue収まり）は純関数としてexportし、
// check-longform-v10.test.mjsが再利用する。
import {readFileSync, existsSync} from 'node:fs';
import {join, dirname} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

const FPS = 30;
const START_SECONDS = 0.4;
const TAIL_SECONDS = 0.5;
// Codex固定集計（2026-10-20・台本第2〜3節）。本検査は値の固定照合のみで再計算しない。
const PLANNED_TOTAL_SECONDS = 1020.0;
const TOTAL_SPOKEN_CHARS = 4536;
const SCENES_PER_CHAPTER = {0: 10, 1: 10, 2: 7, 3: 7, 4: 7, 5: 7, 6: 7, 7: 5};
// （章, 固定予定秒, 固定発話文字数）
const FIXED_CHAPTER = [
  [0, 68.2, 304], [1, 77.2, 345], [2, 162.1, 723], [3, 142.4, 628],
  [4, 128.1, 570], [5, 151.1, 675], [6, 185.0, 827], [7, 105.9, 464],
];
const FORBIDDEN_SPELL = ['EV', 'HEV', 'PHEV', 'BEV', 'THS', 'G21', 'RAV4', 'CO2'];

const round3 = (n) => Math.round(n * 1000) / 1000;
export const framesFor = (seconds, fps = FPS) => Math.round(seconds * fps);

// 音がsceneに収まるか（開始offset＋末尾余白込み・フレーム切上げで判定）
export function evaluateAudioWindow({audioSeconds, startSeconds = START_SECONDS, tailSeconds = TAIL_SECONDS, sceneSeconds, fps = FPS}) {
  const requiredSeconds = audioSeconds + startSeconds + tailSeconds;
  const requiredFrames = Math.ceil(requiredSeconds * fps - 1e-9);
  const limitFrames = Math.round(sceneSeconds * fps);
  const excessFrames = Math.max(0, requiredFrames - limitFrames);
  const ok = excessFrames === 0;
  return {ok, requiredSeconds: round3(requiredSeconds), requiredFrames, limitFrames, excessFrames,
    reason: ok ? null : `必要尺${requiredSeconds.toFixed(2)}s（開始${startSeconds}s＋末尾${tailSeconds}s込み・${requiredFrames}f）がscene ${sceneSeconds.toFixed(2)}s（${limitFrames}f）を超過（${excessFrames}f）`};
}

// cue収まり（scene内・順序・非重複）
export function evaluateCueFit(cues, sceneFrames, fps = FPS) {
  const issues = [];
  let prevEnd = 0;
  cues.forEach((cue, i) => {
    const start = framesFor(cue.start, fps);
    const end = framesFor(cue.end, fps);
    if (start < prevEnd) issues.push(`cue${i} 開始が前cueの終端より前: ${start}f < ${prevEnd}f`);
    if (end <= start) issues.push(`cue${i} end<=start`);
    if (end > sceneFrames) issues.push(`cue${i} 終端${end}fがscene(${sceneFrames}f)を超過`);
    prevEnd = Math.max(prevEnd, end);
  });
  return {ok: issues.length === 0, issues};
}

// RIFF/WAVE（PCM mono 16bit 24kHz前提）のヘッダ検査と実尺
export function parseWav(buffer) {
  const fail = (m) => ({error: m});
  if (buffer.length < 12 || buffer.toString('ascii', 0, 4) !== 'RIFF' || buffer.toString('ascii', 8, 12) !== 'WAVE') return fail('RIFF/WAVEシグネ不一致');
  let pos = 12;
  let channels = 0, sampleRate = 0, bits = 0;
  while (pos + 8 <= buffer.length) {
    const id = buffer.toString('ascii', pos, pos + 4);
    const size = buffer.readUInt32LE(pos + 4);
    if (id === 'fmt ') {
      if (size < 16) return fail('fmt chunk不良');
      const format = buffer.readUInt16LE(pos + 8);
      channels = buffer.readUInt16LE(pos + 10);
      sampleRate = buffer.readUInt32LE(pos + 12);
      bits = buffer.readUInt16LE(pos + 22);
      if (format !== 1) return fail(`非PCM(fmt=${format})`);
    } else if (id === 'data') {
      if (!channels || !sampleRate) return fail('dataがfmtより先にあります');
      const dataSize = Math.min(size, buffer.length - pos - 8);
      return {channels, sampleRate, bits, durationSeconds: dataSize / (channels * bits / 8 * sampleRate)};
    }
    pos += 8 + size + (size % 2);
  }
  return fail('data chunkがありません');
}

// --- 本体検査（CLIで実行されたときのみ動作。テストは純関数だけimportする） ---
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const main = () => {
const dataPath = join(root, 'src/data/longform/toyota01-v10.json');
const voicePath = join(root, 'src/data/longform/toyota01-v10-voice.json');
const errors = [];
const warns = [];
const error = (id, field, message) => errors.push(`ERROR ${id} [${field}] ${message}`);
const warn = (id, field, message) => warns.push(`WARN  ${id} [${field}] ${message}`);

if (!existsSync(dataPath)) {
  console.error(`検査対象がありません: ${dataPath}（先にscripts/build-longform-v10.pyで生成）`);
  process.exit(1);
}
const data = JSON.parse(readFileSync(dataPath, 'utf8'));
const voice = JSON.parse(readFileSync(voicePath, 'utf8'));

// 固定集計値との一致（再計算ではなく固定照合）
const speakerOfBeat = (b) => b.speaker;
if (!Array.isArray(data.scenes) || data.scenes.length !== 60) {
  error('root', 'scenes', `scene数が60ではありません（${data.scenes?.length ?? '無'}）`);
}
const counted = {0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0};
const seenIds = new Set();
let plannedSum = 0;
const charByChapter = {0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0};
const charTotal = {v: 0};
const beatFiles = [];
const sceneBeats = new Map((voice.beats ?? []).map((b) => [b.id, b]));
const sceneIdsFromBeats = new Set((voice.beats ?? []).map((b) => b.sceneId));

let elapsedFrames = 0;
console.log('シーン    開始f   開始s     章       秒   実音(beat合成)  cue数');
for (const scene of data.scenes) {
  const id = scene.id ?? '(no id)';
  if (!scene.id) { error(id, 'id', 'idがありません'); continue; }
  if (seenIds.has(id)) error(id, 'id', 'idが重複しています');
  seenIds.add(id);
  const m = /^[0-7]-\d{1,2}$/.exec(id);
  if (!m) error(id, 'id', 'ID形式がV10章構成(0-7)に一致しません');
  if (!('chapterNo' in scene)) error(id, 'chapterNo', 'chapterNoがありません');
  else {
    const ch = scene.chapterNo;
    if (!(ch in SCENES_PER_CHAPTER)) error(id, 'chapterNo', '章番号0-7の範囲外です');
    else counted[ch] += 1;
  }
  if (typeof scene.frames !== 'number' || !Number.isInteger(scene.frames)) {
    error(id, 'frames', 'framesが整数ではありません');
  } else if (framesFor(scene.seconds ?? 0) !== scene.frames) {
    error(id, 'frames', `frames(${scene.frames}) != round(seconds*30)=${framesFor(scene.seconds ?? 0)}`);
  }
  if (!(typeof scene.plannedSeconds === 'number' && scene.plannedSeconds > 0)) {
    error(id, 'plannedSeconds', 'plannedSecondsが正の数ではありません');
  } else {
    plannedSum += scene.plannedSeconds;
    if ((scene.seconds ?? 0) < scene.plannedSeconds - 0.001) {
      error(id, 'seconds', `scene秒${scene.seconds.toFixed(3)}sが台本予定秒${scene.plannedSeconds}sを下回っています`);
    }
  }
  const isCard = scene.visual === 'chapterCard';
  if (isCard && scene.audio) error(id, 'audio', '章カードに音声が付いています');
  if (!isCard && !scene.audio) error(id, 'audio', '発話sceneにaudioがありません');

  let wavInfo = null;
  if (scene.audio) {
    const wavPath = join(root, 'public', scene.audio.src);
    if (!existsSync(wavPath)) {
      error(id, 'audio', `音声ファイルが存在しません: public/${scene.audio.src}`);
    } else {
      wavInfo = parseWav(readFileSync(wavPath));
      if (wavInfo.error) error(id, 'audio', `WAV形式不良: ${wavInfo.error}`);
      else {
        if (wavInfo.channels !== 1 || wavInfo.bits !== 16 || wavInfo.sampleRate !== 24000) {
          error(id, 'audio', `WAV形式が24kHz/mono/16bitではありません（${wavInfo.sampleRate}/${wavInfo.channels}ch/${wavInfo.bits}bit）`);
        }
        if (Math.abs(wavInfo.durationSeconds - scene.audio.seconds) > 0.003) {
          error(id, 'audio.seconds', `JSON ${scene.audio.seconds.toFixed(3)}s と実WAV ${wavInfo.durationSeconds.toFixed(3)}s が不一致`);
        }
        // 開始0.4s＋末尾0.5s込みでsceneに収まること（境界テスト済み関数）
        const win = evaluateAudioWindow({audioSeconds: wavInfo.durationSeconds, sceneSeconds: scene.seconds});
        if (!win.ok) error(id, 'audio.window', win.reason);
      }
    }
    if (!String(scene.audio.src).startsWith('audio/longform-toyota01-v10/')) {
      error(id, 'audio.src', `srcがV10専用ディレクトリ外です: ${scene.audio.src}`);
    }
  }

  // cue
  const cues = scene.cues ?? [];
  if (!isCard && cues.length === 0) error(id, 'cues', '発話sceneに字幕cueがありません');
  if (isCard && cues.length > 0) error(id, 'cues', '章カードに字幕cueが付いています');
  if (cues.some((c) => c.text.length > 60)) error(id, 'cues', '60文字超のcueがあります');
  if (cues.some((c) => c.text.length > 40)) warn(id, 'cues', `40文字超のcueがあります（${cues.filter((c) => c.text.length > 40).length}件）`);
  const coverText = cues.map((c) => c.text).join('');
  const beatTexts = (scene.beats ?? []).map((b) => b.text ?? '').join('');
  if (!isCard && coverText.length === 0) error(id, 'cues', 'cueテキストが空です');
  if (!isCard && coverText !== beatTexts) {
    error(id, 'cues', `cue連結とbeat本文が不一致（${coverText.length}字 vs ${beatTexts.length}字）`);
  }
  if (cues.length > 0) {
    const fit = evaluateCueFit(cues, scene.frames ?? framesFor(scene.seconds ?? 0));
    for (const msg of fit.issues) error(id, 'cues.fit', msg);
  }
  // beat整合（voice JSONとの一致・beatWAVの存在・scene内合成尺）
  const beats = scene.beats ?? [];
  let cursor = 0;
  let composed = 0;
  for (let i = 0; i < beats.length; i++) {
    const b = beats[i];
    const vb = sceneBeats.get(b.id);
    if (!vb) { error(id, 'beats', `voice JSONにbeat ${b.id} がありません`); continue; }
    if (vb.speaker !== b.speaker) error(b.id, 'speaker', `話者不一致 voice=${vb.speaker} data=${b.speaker}`);
    const beatWav = join(root, 'public', vb.audio?.src ?? '');
    if (!existsSync(beatWav)) error(b.id, 'beats', `beat音声が存在しません: ${vb.audio?.src}`);
    else {
      const info = parseWav(readFileSync(beatWav));
      if (info.error) error(b.id, 'beats', `beatWAV形式不良: ${info.error}`);
      else if (Math.abs(info.durationSeconds - (vb.audio?.seconds ?? -1)) > 0.003) {
        error(b.id, 'beats', `beat実WAV ${info.durationSeconds.toFixed(3)}s とJSON ${(vb.audio?.seconds ?? 0).toFixed(3)}s が不一致`);
      } else beatFiles.push(vb.audio.src);
    }
    if (Math.abs((b.startSecond ?? -1) - cursor) > 0.002) {
      error(b.id, 'beats', `scene内開始${(b.startSecond ?? 0).toFixed(3)}s が合成規則（前beatの実尺+間0.3s）の${cursor.toFixed(3)}sと不一致`);
    }
    cursor += (vb.audio?.seconds ?? 0) + (i < beats.length - 1 ? (vb.pauseSeconds ?? 0) : 0);
    if (i === beats.length - 1) composed = cursor;
    const spoken = vb.spokenText ?? '';
    for (const token of FORBIDDEN_SPELL) {
      if (spoken.includes(token)) error(b.id, 'spokenText', `読替え漏れの可能性: ${token}`);
    }
    const leftover = [...spoken.matchAll(/(\d{4})年/g)].filter((mm) => !(mm[1] === '2030'));
    if (leftover.length > 0) warn(b.id, 'spokenText', `4桁年がそのまま残っています: ${spoken.match(/(\d{4})年/g)}`);
  }
  if (scene.audio && beats.length > 0 && Math.abs(composed - scene.audio.seconds) > 0.003) {
    error(id, 'beats', `beat合成尺${composed.toFixed(3)}s とscene audio.seconds ${scene.audio.seconds.toFixed(3)}s が不一致`);
  }
  if (!isCard && beats.length === 0) error(id, 'beats', '発話sceneにbeatがありません');
  for (const b of beats) charByChapter[scene.chapterNo ?? 0] += (b.text ?? '').length;
  charTotal.v += beats.reduce((s, b) => s + (b.text ?? '').length, 0);

  console.log(`${id.padEnd(8)} ${String(elapsedFrames).padStart(6)} ${((elapsedFrames) / 30).toFixed(2).padStart(8)}  ${String(scene.chapterNo ?? '-').padStart(3)}  ${(scene.seconds ?? 0).toFixed(3).padStart(7)}` +
    `  ${scene.audio ? (scene.audio.seconds ?? 0).toFixed(3) : '--'}s  ${String(cues.length).padStart(2)}cue ${beats.length}beat`);
  elapsedFrames += scene.frames ?? 0;
}

// 章別の固定値照合（既存の固定集計値と、実データの台詞取り込みを比較する固定検査）
for (const [ch, sec, chars] of FIXED_CHAPTER) {
  if (counted[ch] !== SCENES_PER_CHAPTER[ch]) error(`章${ch}`, 'scene数', `${counted[ch]}件（期待${SCENES_PER_CHAPTER[ch]}）`);
  if (Math.abs((data.plannedChapterSeconds?.[ch] ?? -1) - sec) > 0.051) {
    error(`章${ch}`, 'plannedChapterSeconds', `固定値${sec}とJSON ${data.plannedChapterSeconds?.[ch]} が不一致`);
  }
  if (!(typeof data.chapterSeconds?.[ch] === 'number' && data.chapterSeconds[ch] + 0.051 >= sec)) {
    error(`章${ch}`, 'chapterSeconds', `実章秒${data.chapterSeconds?.[ch]}が台本予定秒${sec}を下回っています`);
  }
  if (charByChapter[ch] !== chars) {
    error(`章${ch}`, 'charCount', `固定発話文字数${chars}に対し実取り込み${charByChapter[ch]}字（字幕正文の取りこぼし/過剰の可能性）`);
  }
}
if (Math.abs(plannedSum - PLANNED_TOTAL_SECONDS) > 0.051) {
  error('root', 'plannedSeconds合計', `固定合計${PLANNED_TOTAL_SECONDS}に対し${plannedSum.toFixed(3)}s`);
}
if (charTotal.v !== TOTAL_SPOKEN_CHARS) {
  error('root', 'charTotal', `固定合計${TOTAL_SPOKEN_CHARS}に対し実取り込み${charTotal.v}字`);
}
if (data.durationFrames !== elapsedFrames) {
  error('root', 'durationFrames', `JSON ${data.durationFrames} とscene合計round秒×30=${elapsedFrames} が不一致`);
}
const spec = data.audioSpec ?? {};
if (spec.fps !== FPS || Math.abs((spec.startSeconds ?? -1) - START_SECONDS) > 1e-9 || Math.abs((spec.tailSeconds ?? -1) - TAIL_SECONDS) > 1e-9) {
  error('root', 'audioSpec', `fps/start/tailが${FPS}/${START_SECONDS}/${TAIL_SECONDS}と一致しません`);
}
const totalSeconds = elapsedFrames / FPS;
if (totalSeconds < 900 || totalSeconds > 1200) {
  error('root', 'totalSeconds', `総尺${totalSeconds.toFixed(1)}sが15〜20分の窓外です。Codexへ報告し、無段速度変更で合せてはならない`);
}
// voice JSON側のbeat総数と、データ側のbeat全件が一致するか（片落ちチェック）
const dataBeatIds = new Set((data.scenes ?? []).flatMap((s) => (s.beats ?? []).map((b) => b.id)));
for (const b of voice.beats ?? []) {
  if (!dataBeatIds.has(b.id)) error(b.id, 'beats', 'voice JSON側のbeatがdata JSONに反映されていません');
}
if ((voice.beats ?? []).some((b) => !sceneIdsFromBeats.has(b.sceneId))) {
  warn('root', 'beats', 'voice JSONにsceneId無しbeatがあります');
}

console.log(`合計: ${data.scenes.length}シーン / ${elapsedFrames}フレーム / official=${data.durationFrames} / 総尺${totalSeconds.toFixed(1)}s / beat ${(voice.beats ?? []).length}本`);
for (const line of warns) console.log(line);
for (const line of errors) console.log(line);
console.log(`結果: ERROR ${errors.length}件 / WARN ${warns.length}件`);
process.exit(errors.length > 0 ? 1 : 0);
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
