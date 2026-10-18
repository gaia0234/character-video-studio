// レビュー用コマ送りシート生成: node scripts/review-longform.mjs <input.mp4>
// 同梱ffmpeg(@remotion/compositor-linux-x64-gnu)にはdrawtext/overlay/tileが無いため:
//   抽出=ffmpeg(rawvideo rgba) → タイムコード焼き込み=内蔵ビットマップフォント →
//   8x4=32枚/シート合成とPNG化=node標準API(node:zlib)。決定論・外部依存なし。
import {spawnSync} from 'node:child_process';
import {mkdirSync, rmSync, writeFileSync, existsSync} from 'node:fs';
import {join, dirname} from 'node:path';
import {inflateSync, deflateSync} from 'node:zlib';
import {fileURLToPath} from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const ffmpeg = join(root, 'node_modules/@remotion/compositor-linux-x64-gnu/ffmpeg');
const input = process.argv[2];

if (!input || !(existsSync(join(root, input)) || existsSync(input))) {
  console.error('使い方: npm run review:longform -- output/<file>.mp4（存在する入力を指定）');
  process.exit(2);
}

// 所要時間の取得（ffprobeが無い前提のため ffmpeg -i のstderrから解析）
const probe = spawnSync(ffmpeg, ['-i', input], {encoding: 'utf8'});
const match = String(probe.stderr).match(/Duration:\s*(\d+):(\d+):([\d.]+)/);
if (!match) {
  console.error('Durationを解析できませんでした');
  console.error(String(probe.stderr).split('\n').filter(Boolean).slice(-4).join('\n'));
  process.exit(2);
}
const duration = Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3]);

const OUT_W = 480;
const OUT_H = 270; // 1920x1080 → 480x270
const COLS = 8;
const ROWS = 4;
const PER_SHEET = COLS * ROWS; // 32枚/シート
const STEP = 0.5;

const outDir = join(root, 'output/longform-review');
rmSync(outDir, {recursive: true, force: true});
mkdirSync(outDir, {recursive: true});

// --- 内蔵 5x7 ビットマップフォント（0-9 . s 空白） ---
const GLYPHS = {
  '0': [0b01110, 0b10001, 0b10011, 0b10101, 0b11001, 0b10001, 0b01110],
  '1': [0b00100, 0b01100, 0b00100, 0b00100, 0b00100, 0b00100, 0b01110],
  '2': [0b01110, 0b10001, 0b00001, 0b00110, 0b01000, 0b10000, 0b11111],
  '3': [0b11111, 0b00010, 0b00100, 0b00010, 0b00001, 0b10001, 0b01110],
  '4': [0b00010, 0b00110, 0b01010, 0b10010, 0b11111, 0b00010, 0b00010],
  '5': [0b11111, 0b10000, 0b11110, 0b00001, 0b00001, 0b10001, 0b01110],
  '6': [0b00110, 0b01000, 0b10000, 0b11110, 0b10001, 0b10001, 0b01110],
  '7': [0b11111, 0b10001, 0b00010, 0b00100, 0b01000, 0b01000, 0b01000],
  '8': [0b01110, 0b10001, 0b10001, 0b01110, 0b10001, 0b10001, 0b01110],
  '9': [0b01110, 0b10001, 0b10001, 0b01111, 0b00001, 0b00010, 0b01100],
  '.': [0, 0, 0, 0, 0, 0b01100, 0b01100],
  s: [0, 0b01111, 0b10000, 0b01110, 0b00001, 0b10001, 0b01110],
  ' ': [0, 0, 0, 0, 0, 0, 0],
};
const SCALE = 2; // 1フォントpx = 2画素
const CHAR_W = 5 * SCALE + SCALE; // 10+2

// --- PNGデコード（ffmpegのimage2pipe/png出力: 8bit・RGBA・ノンインターレース前提） ---
const PAETH = (a, b, c) => {
  const p = a + b - c;
  const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
};
function decodePng(buf) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (buf.length < 8 || !buf.subarray(0, 8).equals(sig)) throw new Error('PNGシグネ不一致');
  let pos = 8;
  let width = 0, height = 0, bitDepth = 0, colorType = 0, interlace = 0;
  const idat = [];
  while (pos + 12 <= buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.subarray(pos + 4, pos + 8).toString('ascii');
    const data = buf.subarray(pos + 8, pos + 8 + len);
    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
      interlace = data[12];
    } else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') break;
    pos += 12 + len;
  }
  if (bitDepth !== 8 || colorType !== 6 || interlace !== 0) {
    throw new Error(`予期しないPNG形式: bit=${bitDepth} color=${colorType} interlace=${interlace}`);
  }
  const raw = inflateSync(Buffer.concat(idat));
  const stride = width * 4;
  const out = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y++) {
    const f = raw[y * (stride + 1)];
    const src = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    for (let x = 0; x < stride; x++) {
      const a = x >= 4 ? out[y * stride + x - 4] : 0;
      const b = y > 0 ? out[(y - 1) * stride + x] : 0;
      const c = x >= 4 && y > 0 ? out[(y - 1) * stride + x - 4] : 0;
      let v = src[x];
      if (f === 1) v += a;
      else if (f === 2) v += b;
      else if (f === 3) v += (a + b) >> 1;
      else if (f === 4) v += PAETH(a, b, c);
      out[y * stride + x] = v & 0xff;
    }
  }
  return {width, height, data: out};
}

// シート1枚ぶんのRGBAバッファにタイムコードを焼き込む
function drawLabel(sheet, tileX, tileY, text) {
  const margin = 4;
  const width = text.length * CHAR_W * SCALE;
  // 半透明の黒帯（ブレンド率0.55）
  for (let y = -2; y < 7 * SCALE + 2; y++) {
    for (let x = -3; x < width + 3; x++) {
      const px = tileX + margin + x;
      const py = tileY + margin + y;
      if (px < 0 || py < 0 || px >= OUT_W * COLS || py >= OUT_H * ROWS) continue;
      const o = (py * OUT_W * COLS + px) * 4;
      const a = 0.45; // 残す割合
      sheet[o] = Math.round(sheet[o] * a);
      sheet[o + 1] = Math.round(sheet[o + 1] * a);
      sheet[o + 2] = Math.round(sheet[o + 2] * a);
    }
  }
  // 縁取りなしの白文字
  let cursor = 0;
  for (const ch of text) {
    const glyph = GLYPHS[ch] ?? GLYPHS[' '];
    for (let gy = 0; gy < 7; gy++) {
      for (let gx = 0; gx < 5; gx++) {
        if (!(glyph[gy] & (1 << (4 - gx)))) continue;
        for (let sy = 0; sy < SCALE; sy++) {
          for (let sx = 0; sx < SCALE; sx++) {
            const px = tileX + margin + cursor + gx * SCALE + sx;
            const py = tileY + margin + gy * SCALE + sy;
            const o = (py * OUT_W * COLS + px) * 4;
            sheet[o] = 255; sheet[o + 1] = 255; sheet[o + 2] = 255;
          }
        }
      }
    }
    cursor += CHAR_W * SCALE;
  }
}

// --- PNGエンコード（RGBA・フィルタ0のみ・node:zlib） ---
const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
};
function encodePng(width, height, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0; // filter none
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const times = [];
for (let t = 0; t < duration - 1e-6; t += STEP) times.push(Math.round(t * 10) / 10);

// シート単位で抽出→合成
const indexLines = [];
const sheetFiles = [];
for (let s = 0; s * PER_SHEET < times.length; s++) {
  const sheetTiles = times.slice(s * PER_SHEET, (s + 1) * PER_SHEET);
  const sheet = Buffer.alloc(OUT_W * COLS * OUT_H * ROWS * 4, 255);
  for (let k = 0; k < sheetTiles.length; k++) {
    const t = sheetTiles[k];
    const col = k % COLS;
    const row = Math.floor(k / COLS) % ROWS;
    const out = spawnSync(ffmpeg, ['-y', '-ss', t.toFixed(1), '-i', input, '-frames:v', '1',
      '-vf', `scale=${OUT_W}:${OUT_H}`, '-pix_fmt', 'rgba', '-f', 'image2pipe', '-vcodec', 'png',
      'pipe:1'],
      {encoding: 'buffer', maxBuffer: 64 * 1024 * 1024});
    if (out.status !== 0 || !out.stdout || out.stdout.length < 8) {
      console.error(`フレーム抽出失敗: t=${t.toFixed(1)}s (status=${out.status})`);
      process.exit(1);
    }
    let frame;
    try {
      frame = decodePng(out.stdout);
    } catch (e) {
      console.error(`PNGデコード失敗: t=${t.toFixed(1)}s (${e.message})`);
      process.exit(1);
    }
    if (frame.width !== OUT_W || frame.height !== OUT_H) {
      console.error(`フレームサイズ不一致: t=${t.toFixed(1)}s ${frame.width}x${frame.height}`);
      process.exit(1);
    }
    const base = (row * OUT_H * OUT_W * COLS + col * OUT_W) * 4;
    for (let y = 0; y < OUT_H; y++) {
      frame.data.copy(sheet, base + y * OUT_W * COLS * 4, y * OUT_W * 4, (y + 1) * OUT_W * 4);
    }
    drawLabel(sheet, col * OUT_W, row * OUT_H, `${t.toFixed(1)}s`);
    indexLines.push(`tile ${String(s * PER_SHEET + k).padStart(4, '0')}  t=${t.toFixed(1)}s  `
      + `sheet-${String(s + 1).padStart(2, '0')}  r${row + 1}c${col + 1}`);
  }
  const sheetName = `sheet-${String(s + 1).padStart(2, '0')}.png`;
  writeFileSync(join(outDir, sheetName), encodePng(OUT_W * COLS, OUT_H * ROWS, sheet));
  sheetFiles.push(sheetName);
}

writeFileSync(join(outDir, 'frames-index.txt'), indexLines.join('\n') + '\n');
console.log(`入力: ${input} / duration ${match[0].slice(10)} / ${times.length}コマ / ${sheetFiles.length}シート`);
for (const f of sheetFiles) console.log(`  output/longform-review/${f}`);
console.log('frames-index.txt を同フォルダへ出力しました');
