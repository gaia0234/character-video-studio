// v5b台本データ検査: node scripts/check-longform-v8.mjs
// node:fs/path の標準APIのみ。ERRORがあれば exit 1、WARNのみなら exit 0。
import {readFileSync, existsSync} from 'node:fs';
import {join, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const data = JSON.parse(readFileSync(join(root, 'src/data/longform/toyota01-v8.json'), 'utf8'));

const errors = [];
const warns = [];
const error = (sceneId, field, message) => errors.push(`ERROR ${sceneId} [${field}] ${message}`);
const warn = (sceneId, field, message) => warns.push(`WARN  ${sceneId} [${field}] ${message}`);

if (!Array.isArray(data.scenes) || data.scenes.length === 0) {
  error('root', 'scenes', 'scenes配列が存在しません');
  console.warn('検査対象が無いため終了します');
  process.exit(1);
}

// 累積時刻表と必須項目の検査
let elapsedFrames = 0;
const seenIds = new Set();
console.log('シーン   開始f  開始s   章badge                 年badge  秒');
for (const scene of data.scenes) {
  const id = scene.id ?? '(no id)';
  if (!scene.id) error(id, 'id', 'idがありません');
  else if (seenIds.has(scene.id)) error(scene.id, 'id', 'idが重複しています');
  if (scene.id) seenIds.add(scene.id);

  const subtitle = typeof scene.subtitle === 'string' ? scene.subtitle : '';
  if (!subtitle) error(scene.id, 'subtitle', '字幕文がありません');
  const textLength = subtitle.replace(/\n/g, '').length;
  if (subtitle && textLength > 40) {
    warn(scene.id, 'subtitle', `字幕文が41文字以上です（${textLength}文字）`);
  }

  if (!(typeof scene.seconds === 'number' && scene.seconds > 0)) {
    error(scene.id, 'seconds', 'secondsが正の数ではありません');
  }

  if (!scene.chapter) error(scene.id, 'chapter', '章badge(chapter)がありません');
  if (!('year' in scene)) {
    warn(scene.id, 'year', '年badge(year)のキーがありません');
  }

  if (scene.audio) {
    const wavPath = join(root, 'public', scene.audio.src);
    if (!existsSync(wavPath)) {
      error(scene.id, 'audio', `音声ファイルが存在しません: public/${scene.audio.src}`);
    } else {
      const limit = scene.seconds - 0.5;
      if (typeof scene.audio.seconds !== 'number' || scene.audio.seconds <= 0) {
        error(scene.id, 'audio.seconds', 'audio.secondsが正の数ではありません');
      } else if (scene.audio.seconds > limit) {
        error(scene.id, 'audio.seconds',
          `音声${scene.audio.seconds.toFixed(2)}sがシーン秒-0.5s（${limit.toFixed(2)}s）を超えています`);
      }
    }
  }

  const startSeconds = elapsedFrames / 30;
  console.log(`${id.padEnd(7)}${String(elapsedFrames).padStart(5)}  ${startSeconds.toFixed(2).padStart(6)}  `
    + `${(scene.chapter ?? '').padEnd(22)} ${(scene.year ?? '-').toString().padStart(4)}  ${scene.seconds}s`
    + `${scene.audio ? '  audio ' + scene.audio.seconds.toFixed(2) + 's' : '  audio なし'}`);
  elapsedFrames += Math.round((scene.seconds ?? 0) * 30);
}

// 合計フレーム数とofficial値の一致（公式の記号はJSON内 durationFrames）
const sum = typeof data.durationFrames === 'number'
  ? elapsedFrames
  : null;
if (sum === null) {
  error('root', 'durationFrames', 'durationFrames（公式の合計フレーム数）がJSONにありません');
} else if (data.durationFrames !== elapsedFrames) {
  error('root', 'durationFrames',
    `durationFrames(${data.durationFrames})とシーン合計秒x30(${elapsedFrames})が一致しません`);
}

console.log(`合計: ${data.scenes.length}シーン / ${elapsedFrames}フレーム / official=${data.durationFrames}`);
for (const line of warns) console.log(line);
for (const line of errors) console.log(line);
console.log(`結果: ERROR ${errors.length}件 / WARN ${warns.length}件`);
process.exit(errors.length > 0 ? 1 : 0);
