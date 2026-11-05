#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""V11の区間レンダー・結合・音量統一の補助（1コマンドで回せるようにする）。

  python3 scripts/render-longform-v11.py --parts 03            # 指定区間だけ再レンダー（修正後）
  python3 scripts/render-longform-v11.py --concat               # 5区間を結合 → loudnorm 2-pass → 最終MP4

前提: src/data/longform/toyota01-v11.json の part境界が正本。区間は --frames で厳密に切り出すため
      結合時の欠落/重複が起きない。既存MP4は上書きする（同一区間の再出力）。
"""
import argparse
import json
import hashlib
import os
import re
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FFMPEG = os.path.join(ROOT, 'node_modules/@remotion/compositor-linux-x64-gnu/ffmpeg')
FFPROBE = os.path.join(ROOT, 'node_modules/@remotion/compositor-linux-x64-gnu/ffprobe')
CHROME = '/home/ds-work/.local/lib/chrome-headless-shell/chrome-headless-shell'
REVIEW = os.path.join(ROOT, 'output/longform-v11-review')
TMPDIR = os.path.join(REVIEW, 'tmp-render')
DATA = os.path.join(ROOT, 'src/data/longform/toyota01-v11.json')
FULL = os.path.join(ROOT, 'output/longform-toyota01-v11-full.mp4')
FINAL = os.path.join(ROOT, 'output/longform-toyota01-v11-lufs14.mp4')
ENTRY = 'src/index-v11.ts'
COMPOSITION = 'LongformToyota01V11'


def run(cmd, log=None):
    print('+ ' + ' '.join(cmd[:6]) + ' ...', flush=True)
    p = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
    out = p.stdout.decode('utf-8', 'ignore')
    if log:
        with open(log, 'a', encoding='utf-8') as f:
            f.write(out)
    print(f'  exit={p.returncode}', flush=True)
    return p.returncode, out


HASHES = os.path.join(REVIEW, 'part-hashes.json')
FINGERPRINT_FILES = ('src/longform/LongformToyota01V11.tsx', 'src/Root-v11.tsx', 'src/index-v11.ts',
                     'src/data/longform/toyota01-v11.json')


def part_fingerprint(part, data, scale, crf):
    """区間の内容（sceneデータ＋TSX＋レンダー条件）から指紋を作る。変更がなければ再レンダーを省く。"""
    h = hashlib.sha256()
    scenes = [s for s in data['scenes'] if s['part'] == part['id']]
    h.update(json.dumps(scenes, ensure_ascii=False, sort_keys=True).encode('utf-8'))
    for rel in FINGERPRINT_FILES[:-1]:
        fp = os.path.join(ROOT, rel)
        if os.path.isfile(fp):
            h.update(open(fp, 'rb').read())
    h.update(f"{part['startFrame']}-{part['endFrame']}|scale={scale}|crf={crf}".encode('utf-8'))
    return h.hexdigest()


def load_hashes():
    try:
        return json.load(open(HASHES, encoding='utf-8'))
    except Exception:
        return {}


def render_part(part, data, scale=None, crf=None, force=False, preview=False):
    suffix = '-preview' if preview else ''
    out = os.path.join(ROOT, 'output/longform-toyota01-v11-part%02d%s.mp4' % (part['id'], suffix))
    hashes = load_hashes()
    fp = part_fingerprint(part, data, scale, crf)
    if not preview and not force and hashes.get(str(part['id'])) == fp and os.path.isfile(out):
        print(f"part{part['id']}: 変更なし（再レンダー省略）", flush=True)
        return 0, ''
    env = dict(os.environ)
    env['LD_LIBRARY_PATH'] = '/home/ds-work/.local/lib/chrome-headless-shell'
    env['TMPDIR'] = TMPDIR
    os.makedirs(TMPDIR, exist_ok=True)
    cmd = [os.path.join(ROOT, 'node_modules/.bin/remotion'), 'render', ENTRY, COMPOSITION, out,
           f"--frames={part['startFrame']}-{part['endFrame']}", '--codec=h264', '--pixel-format=yuv420p',
           '--concurrency=2', f'--browser-executable={CHROME}']
    if scale:
        cmd.append(f'--scale={scale}')
    if crf:
        cmd.append(f'--crf={crf}')
    rc, log = run(cmd, os.path.join(REVIEW, 'render-parts.log'))
    if rc == 0 and not preview and os.path.isfile(out):
        hashes[str(part['id'])] = fp
        with open(HASHES, 'w', encoding='utf-8') as f:
            json.dump(hashes, f, ensure_ascii=False, indent=2)
    return rc, log


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--parts', nargs='*', type=int, help='再レンダーする区間番号（例: 03 04）')
    ap.add_argument('--concat', action='store_true', help='5区間を結合し loudnorm 2-pass をかける')
    ap.add_argument('--scale', type=float, help='プレビュー用の縮小率（例 0.5）。出力は *-preview.mp4')
    ap.add_argument('--crf', type=int, help='プレビュー用のCRF（例 30）')
    ap.add_argument('--force', action='store_true', help='内容が同じでも再レンダーする')
    args = ap.parse_args()
    data = json.load(open(DATA, encoding='utf-8'))
    parts = {p['id']: p for p in data['parts']}

    if args.parts:
        for pid in args.parts:
            part = parts.get(pid)
            if part is None:
                print(f'part{pid} がデータにありません')
                return 2
            preview = bool(args.scale or args.crf)
            rc, _ = render_part(part, data, args.scale, args.crf, args.force, preview)
            if rc != 0:
                print(f'part{pid} のレンダーが失敗（exit={rc}）')
                return rc
    if not args.concat:
        return 0

    # 結合（同一条件・-c copy）
    list_path = os.path.join(REVIEW, 'concat-list.txt')
    with open(list_path, 'w', encoding='utf-8') as f:
        for pid in sorted(parts):
            f.write("file '../longform-toyota01-v11-part%02d.mp4'\n" % pid)
    rc, _ = run([FFMPEG, '-hide_banner', '-nostats', '-y', '-f', 'concat', '-safe', '0', '-i', list_path,
                 '-c', 'copy', FULL], os.path.join(REVIEW, 'concat.log'))
    if rc != 0:
        return rc
    # loudnorm 2-pass（I=-14 / TP=-2.2）
    rc, out = run([FFMPEG, '-hide_banner', '-nostats', '-i', FULL, '-vn',
                   '-af', 'loudnorm=I=-14:TP=-2.2:LRA=11:print_format=json', '-f', 'null', '-'],
                  os.path.join(REVIEW, 'loudnorm-pass1.log'))
    m = re.findall(r'\{[^{}]*"input_i"[^{}]*\}', out, flags=re.S)
    if not m:
        print('loudnorm測定JSONが取得できません')
        return 3
    meas = json.loads(m[-1])
    i, tp, lra, th = meas['input_i'], meas['input_tp'], meas['input_lra'], meas['input_thresh']
    off = meas.get('target_offset', '0.0')
    print(f'measured: I={i} TP={tp} LRA={lra} thresh={th} offset={off}')
    # AACエンコード後のtrue peakオーバーシュート（実測+0.9dB程度）を見込み、TP目標は-3.0にする
    rc, _ = run([FFMPEG, '-hide_banner', '-nostats', '-y', '-i', FULL,
                 '-af', f'loudnorm=I=-14:TP=-3.0:LRA=11:measured_I={i}:measured_TP={tp}:'
                       f'measured_LRA={lra}:measured_thresh={th}:offset={off}',
                 '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', FINAL],
                os.path.join(REVIEW, 'loudnorm-pass2.log'))
    if rc != 0:
        return rc
    # 最終MP4そのものを実測（I/TP/LRA）して証拠へ残す
    rc, out = run([FFMPEG, '-hide_banner', '-nostats', '-i', FINAL, '-vn',
                   '-af', 'loudnorm=I=-14:TP=-2.2:LRA=11:print_format=json', '-f', 'null', '-'],
                  os.path.join(REVIEW, 'final-loudnorm.log'))
    m = re.findall(r'\{[^{}]*"input_i"[^{}]*\}', out, flags=re.S)
    if m:
        fm = json.loads(m[-1])
        with open(os.path.join(REVIEW, 'final-loudnorm.json'), 'w', encoding='utf-8') as f:
            json.dump(fm, f, ensure_ascii=False, indent=2)
        print(f'final measured: I={fm["input_i"]} TP={fm["input_tp"]} LRA={fm["input_lra"]}')
    rc, out = run([FFPROBE, '-v', 'error', '-show_streams', '-show_format', '-of', 'json', FINAL],
                  os.path.join(REVIEW, 'final-ffprobe.log'))
    print(out[:1200])
    print('final:', FINAL, os.path.getsize(FINAL) if os.path.isfile(FINAL) else 'missing')
    return 0


if __name__ == '__main__':
    sys.exit(main())
