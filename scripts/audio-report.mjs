#!/usr/bin/env node
// Audio report: WAV duration, 0.05s RMS windows, and silent spans below a threshold.
// Usage:
//   node scripts/audio-report.mjs --input public/audio/.../v19-ch1-01.wav \
//     --output output/toyota-ch1-opening-20261102/audio-report.json
// Optional: --window 0.05 --threshold -40 --min-silence 0.15

import fs from 'node:fs';
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
const root = process.cwd();
const input = path.resolve(root, args.input || 'public/audio/toyota-v19-chapter1-20261029/v19-ch1-01.wav');
const output = path.resolve(root, args.output || 'output/toyota-ch1-opening-20261102/audio-report.json');
const windowSeconds = Number(args.window ?? 0.05);
const thresholdDbfs = Number(args.threshold ?? -40);
const minSilenceSeconds = Number(args['min-silence'] ?? 0.15);

if (!(windowSeconds > 0)) throw new Error('--window must be > 0');
if (!Number.isFinite(thresholdDbfs)) throw new Error('--threshold must be a number');
if (!(minSilenceSeconds >= 0)) throw new Error('--min-silence must be >= 0');

const buf = fs.readFileSync(input);
if (buf.toString('ascii', 0, 4) !== 'RIFF' || buf.toString('ascii', 8, 12) !== 'WAVE') {
  throw new Error(`Not a RIFF/WAVE file: ${input}`);
}

let offset = 12;
let fmt = null;
let data = null;
while (offset + 8 <= buf.length) {
  const id = buf.toString('ascii', offset, offset + 4);
  const size = buf.readUInt32LE(offset + 4);
  const body = offset + 8;
  const end = Math.min(buf.length, body + size);
  if (id === 'fmt ') {
    fmt = {
      audioFormat: buf.readUInt16LE(body),
      channels: buf.readUInt16LE(body + 2),
      sampleRate: buf.readUInt32LE(body + 4),
      byteRate: buf.readUInt32LE(body + 8),
      blockAlign: buf.readUInt16LE(body + 12),
      bitsPerSample: buf.readUInt16LE(body + 14),
    };
  } else if (id === 'data') {
    data = buf.subarray(body, end);
  }
  offset = body + size + (size % 2);
}

if (!fmt || !data) throw new Error('WAV is missing fmt or data chunk');
if (!fmt.channels || !fmt.sampleRate || !fmt.blockAlign) throw new Error('Invalid WAV fmt chunk');

const bytesPerSample = fmt.bitsPerSample / 8;
const frames = Math.floor(data.length / fmt.blockAlign);
if (frames <= 0) throw new Error('WAV contains no frames');

const readSample = (byteOffset, sampleIndex) => {
  const p = byteOffset + sampleIndex * bytesPerSample;
  if (fmt.audioFormat === 3) {
    if (fmt.bitsPerSample === 32) return data.readFloatLE(p);
    if (fmt.bitsPerSample === 64) return data.readDoubleLE(p);
    throw new Error(`Unsupported float WAV: ${fmt.bitsPerSample} bits`);
  }
  if (fmt.bitsPerSample === 16) return data.readInt16LE(p) / 32768;
  if (fmt.bitsPerSample === 24) {
    const v = data.readUIntLE(p, 3);
    return (v > 0x7fffff ? v - 0x1000000 : v) / 8388608;
  }
  if (fmt.bitsPerSample === 32) return data.readInt32LE(p) / 2147483648;
  throw new Error(`Unsupported PCM WAV: ${fmt.bitsPerSample} bits`);
};

const sampleRate = fmt.sampleRate;
const channels = fmt.channels;
const durationSeconds = frames / sampleRate;
const windowFrames = Math.max(1, Math.round(windowSeconds * sampleRate));
const rms = [];
const silences = [];
let silentStart = null;
let silentEnd = null;

const closeSilence = () => {
  if (silentStart === null) return;
  const startSec = silentStart / sampleRate;
  const endSec = (silentEnd ?? silentStart + windowFrames) / sampleRate;
  if (endSec - startSec >= minSilenceSeconds - 1e-9) {
    silences.push({
      start: Number(startSec.toFixed(3)),
      end: Number(endSec.toFixed(3)),
      duration: Number((endSec - startSec).toFixed(3)),
    });
  }
  silentStart = null;
  silentEnd = null;
};

for (let s = 0; s < frames; s += windowFrames) {
  const end = Math.min(frames, s + windowFrames);
  let sumSq = 0;
  let count = 0;
  for (let f = s; f < end; f += 1) {
    const base = f * fmt.blockAlign;
    for (let ch = 0; ch < channels; ch += 1) {
      const v = readSample(base, ch);
      sumSq += v * v;
      count += 1;
    }
  }
  const rmsLinear = count > 0 ? Math.sqrt(sumSq / count) : 0;
  const dbfs = rmsLinear > 0 ? 20 * Math.log10(rmsLinear) : -Infinity;
  const startSec = s / sampleRate;
  const endSec = end / sampleRate;
  rms.push({
    start: Number(startSec.toFixed(3)),
    end: Number(endSec.toFixed(3)),
    dbfs: Number.isFinite(dbfs) ? Number(dbfs.toFixed(2)) : -999,
  });
  if (dbfs < thresholdDbfs) {
    if (silentStart === null) silentStart = s;
    silentEnd = end;
  } else {
    closeSilence();
  }
}
closeSilence();

const report = {
  file: input,
  sampleRate,
  channels,
  bitsPerSample: fmt.bitsPerSample,
  audioFormat: fmt.audioFormat === 3 ? 'float' : 'pcm',
  frames,
  durationSeconds: Number(durationSeconds.toFixed(3)),
  windowSeconds,
  windowFrames,
  silenceThresholdDbfs: thresholdDbfs,
  silenceMinSeconds: minSilenceSeconds,
  rms,
  silences,
};

fs.mkdirSync(path.dirname(output), {recursive: true});
fs.writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);

const longest = silences.reduce((best, s) => (s.duration > (best?.duration ?? 0) ? s : best), null);
console.log(`audio-report: ${path.relative(root, input)} -> ${path.relative(root, output)}`);
console.log(`duration=${durationSeconds.toFixed(3)}s sampleRate=${sampleRate} channels=${channels} bits=${fmt.bitsPerSample}`);
console.log(`windows=${rms.length} (${windowSeconds}s) silences=${silences.length} threshold=${thresholdDbfs}dBFS min=${minSilenceSeconds}s`);
if (longest) console.log(`longest_silence=${longest.start}-${longest.end}s (${longest.duration}s)`);
