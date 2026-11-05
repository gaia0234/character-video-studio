// V11専用チェッカー（1回限りの確認用）。V10の検証関数を再利用し、35scene/5区間の実尺だけを検査する。
// 使い方: node scripts/check-longform-v11.mjs
// 旧60scene/1020秒の固定条件は持ち込まない。
import {readFileSync} from 'node:fs';
import {join, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {evaluateAudioWindow, evaluateCueFit, parseWav} from './check-longform-v10.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const FPS = 30;
const START_SECONDS = 0.4;
const TAIL_SECONDS = 0.5;
const errors = [];
const warns = [];
const error = (where, field, message) => errors.push(`${where} / ${field}: ${message}`);
const warn = (where, field, message) => warns.push(`${where} / ${field}: ${message}`);


// PCM16のpeak/RMS（非無音判定）
const pcmStats = (buffer) => {
  let pos = 12, channels = 1, rate = 24000, bits = 16, data = null;
  while (pos + 8 <= buffer.length) {
    const id = buffer.toString('ascii', pos, pos + 4);
    const size = buffer.readUInt32LE(pos + 4);
    if (id === 'fmt ') {
      channels = buffer.readUInt16LE(pos + 10);
      rate = buffer.readUInt32LE(pos + 12);
      bits = buffer.readUInt16LE(pos + 22);
    } else if (id === 'data') {
      data = buffer.subarray(pos + 8, pos + 8 + Math.min(size, buffer.length - pos - 8));
      break;
    }
    pos += 8 + size + (size % 2);
  }
  if (!data || bits !== 16) return {peak: 0, rms: 0, nonSilent: false};
  let peak = 0, sum = 0, n = 0;
  for (let i = 0; i + 1 < data.length; i += 2) {
    const v = data.readInt16LE(i);
    const a = Math.abs(v);
    if (a > peak) peak = a;
    sum += v * v;
    n++;
  }
  return {peak: peak / 32768, rms: n ? Math.sqrt(sum / n) / 32768 : 0, nonSilent: peak > 0};
};

const data = JSON.parse(readFileSync(join(root, 'src/data/longform/toyota01-v11.json'), 'utf8'));
const voice = JSON.parse(readFileSync(join(root, 'src/data/longform/toyota01-v11-voice.json'), 'utf8'));

const spec = data.audioSpec ?? {};
if (spec.fps !== FPS || Math.abs((spec.startSeconds ?? -1) - START_SECONDS) > 1e-9
    || Math.abs((spec.tailSeconds ?? -1) - TAIL_SECONDS) > 1e-9) {
  error('root', 'audioSpec', `fps/start/tailが${FPS}/${START_SECONDS}/${TAIL_SECONDS}と一致しません`);
}
const scenes = data.scenes ?? [];
if (scenes.length !== 35) error('root', 'scenes', `scene数が${scenes.length}（35）です`);
const ids = scenes.map((s) => s.id);
if (new Set(ids).size !== ids.length) error('root', 'scenes', 'scene idが重複しています');
ids.forEach((id, i) => {
  if (id !== `s${String(i + 1).padStart(2, '0')}`) error(id, 'id', `id順が想定と違います（${id}）`);
});

// 部構成とフレーム連結
const parts = data.parts ?? [];
if (parts.length !== 5) error('root', 'parts', `区間数が${parts.length}（5）です`);
let cursor = 0;
for (const part of parts) {
  if (part.startFrame !== cursor) error(`part${part.id}`, 'startFrame', `startFrame=${part.startFrame} != 前区間の終端+1 ${cursor}`);
  if (part.endFrame !== part.startFrame + part.frames - 1) error(`part${part.id}`, 'endFrame', 'endFrameとframesが不一致です');
  if (part.sceneIds.length < 3 || part.sceneIds.length > 9) warn(`part${part.id}`, 'sceneIds', `区間のscene数が${part.sceneIds.length}`);
  cursor = part.endFrame + 1;
}
if (cursor !== data.durationFrames) error('root', 'durationFrames', `区間合計${cursor} != durationFrames ${data.durationFrames}`);

// 総尺（目安は故事JSONのtargetTotalSeconds）
const totalSeconds = data.durationFrames / FPS;
const [lo, hi] = data.targetTotalSeconds ?? [1080, 1260];
if (totalSeconds < lo || totalSeconds > hi) {
  warn('root', 'totalSeconds', `総尺${totalSeconds.toFixed(1)}sが目安${lo}〜${hi}sの外です（削らず報告）`);
}

// 話者と声の対応
const speakers = new Set();
for (const scene of scenes) for (const line of scene.lines ?? []) speakers.add(line.speaker);
for (const name of ['ホーマー', 'ジャッド', 'ケント', 'ナレ2']) {
  if (!speakers.has(name)) error('root', 'speakers', `${name}の台詞がありません`);
}
const credits = (data.voiceCredits ?? []).join(',');
for (const name of ['玄野武宏', '青山龍星', '雀松朱司', 'Nemo']) {
  if (!credits.includes(name)) error('root', 'voiceCredits', `${name}のクレジットがありません`);
}

// sceneごとの実音・cue・WAV
let elapsed = 0;
for (const scene of scenes) {
  const sid = scene.id;
  const frames = Math.round(scene.seconds * FPS);
  if (scene.frames !== frames) error(sid, 'frames', `frames=${scene.frames} != seconds*30 ${frames}`);
  if (scene.startFrame !== elapsed) error(sid, 'startFrame', `startFrame=${scene.startFrame} != 累積${elapsed}`);
  elapsed += scene.frames;
  if (!scene.facts || scene.facts.length === 0) warn(sid, 'facts', '根拠ID（F/G）がありません');
  if (!scene.v10Id) warn(sid, 'v10Id', 'V10対応IDがありません');
  if (!scene.audio) {
    error(sid, 'audio', '音声がありません');
    continue;
  }
  const wavPath = join(root, 'public', scene.audio.src);
  let wav;
  try {
    wav = parseWav(readFileSync(wavPath));
  } catch (e) {
    error(sid, 'audio', `WAVを読めません: ${e.message}`);
    continue;
  }
  if (wav.error) {
    error(sid, 'audio', `WAV不正: ${wav.error}`);
    continue;
  }
  if (wav.sampleRate !== 24000 || wav.channels !== 1 || wav.bits !== 16) {
    error(sid, 'audio', `WAV仕様が24kHz/mono/16bit以外: ${wav.sampleRate}/${wav.channels}/${wav.bits}`);
  }
  if (Math.abs(wav.durationSeconds - scene.audio.seconds) > 0.003) {
    error(sid, 'audio', `実WAV ${wav.durationSeconds.toFixed(3)}s とJSON ${scene.audio.seconds.toFixed(3)}s が不一致`);
  }
  const st = pcmStats(readFileSync(wavPath));
  if (!st.nonSilent) error(sid, 'audio', `無音です（peak=${st.peak}）`);
  if (st.peak > 0.99) warn(sid, 'audio', `peak=${st.peak.toFixed(3)}がほぼ満幅`);
  const win = evaluateAudioWindow({audioSeconds: wav.durationSeconds, startSeconds: START_SECONDS,
    tailSeconds: TAIL_SECONDS, sceneSeconds: scene.seconds});
  if (!win.ok) error(sid, 'audioWindow', win.reason);
  const cues = scene.cues ?? [];
  const fit = evaluateCueFit(cues, scene.frames);
  if (!fit.ok) for (const issue of fit.issues) error(sid, 'cues', issue);
  const cueLineIds = new Set(cues.map((q) => q.lineId).filter(Boolean));
  if (cueLineIds.size !== (scene.lines ?? []).length) {
    error(sid, 'cues', `cueがカバーする台詞ID数${cueLineIds.size} != 台詞数${(scene.lines ?? []).length}`);
  }
  for (const cue of cues) {
    if (cue.end <= cue.start) error(sid, 'cues', `cueのend<=start: ${cue.lineId ?? cue.text.slice(0, 10)}`);
    if (cue.end - cue.start < 0.4) warn(sid, 'cues', `cueの表示が${(cue.end - cue.start).toFixed(2)}秒と短い: ${cue.lineId ?? ''}`);
  }
}

// 発話IDの対応（voice JSON ↔ data JSON）
const dataLineIds = new Set(scenes.flatMap((s) => (s.lines ?? []).map((l) => l.id)));
for (const scene of voice.scenes ?? []) {
  for (const line of scene.lines ?? []) {
    if (!dataLineIds.has(line.id)) error(line.id, 'lines', 'voice JSONの台詞がdata JSONに未反映');
    if (!line.audio) error(line.id, 'audio', 'voice JSONに音声情報がありません');
  }
}

const chars = scenes.reduce((sum, s) => sum + (s.lines ?? []).reduce((n, l) => n + (l.text ?? '').length, 0), 0);
console.log(`V11: ${scenes.length}シーン / ${(voice.scenes ?? []).length}区間 / ${(voice.scenes ?? []).reduce((n, s) => n + (s.lines ?? []).length, 0)}発話 / 字幕正文${chars}文字`);
console.log(`合計: ${data.durationFrames}フレーム / 総尺${totalSeconds.toFixed(1)}s (${(totalSeconds / 60).toFixed(2)}分) / 目安${lo}〜${hi}s`);
for (const part of parts) {
  console.log(`  part${part.id} ${part.title}: ${part.frames}f ${part.seconds.toFixed(1)}s (${(part.seconds / 60).toFixed(2)}分) scenes=${part.sceneIds.length}`);
}
for (const line of warns) console.log('WARN ' + line);
for (const line of errors) console.log('ERROR ' + line);
console.log(`結果: ERROR ${errors.length}件 / WARN ${warns.length}件`);
process.exit(errors.length > 0 ? 1 : 0);
