#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""線画PNG＋専用トレーサの線画パスJSONから、背景透明のSVGを組み立てる。

構成: 白地（シルエット＝不透明領域の外形）＋黒線画（imagetracerjsのトレース結果）
      ＋差し色（同じ線画パスをクリップ領域で切り出して塗る）。
差し色はSVGのルート要素のcolor属性1行で差し替え可能。

usage: python3 build-elder-svg.py <cutout.png> <ink.json> <spec.json> <out.svg>
  cutout.png: アルファを持つ切り出し画像（輪郭＝シルエットの取得元）
  ink.json   : tools/vectorizer/trace-ink.js の出力（線画パス）
spec: {"color":"#C8322C","ribbon":{"p1":[x,y],"p2":[x,y],"offset":30,"width":12},"bow":{"box":[x,y,w,h]}}
"""
import json
import math
import sys
from pathlib import Path

import importlib.util

spec_ = importlib.util.spec_from_file_location('elder_art', str(Path(__file__).resolve().parent / 'elder-character-art.py'))
art = importlib.util.module_from_spec(spec_)
spec_.loader.exec_module(art)

sys.path.insert(0, str(Path(__file__).resolve().parent))
import importlib.util as iu
vec_spec = iu.spec_from_file_location('elder_vec', str(Path(__file__).resolve().parent / 'elder-character-vectorize.py'))
vec = iu.module_from_spec(vec_spec)
vec_spec.loader.exec_module(vec)


def silhouette_path(png_path):
    """不透明領域（白地含む）の外形をマーチングスクエアで取り、白地パスにする。"""
    w, h, px = art.read_png(str(png_path))
    mask = bytearray(w * h)
    for y in range(h):
        for x in range(w):
            if px[(y * w + x) * 4 + 3] != 0:
                mask[y * w + x] = 1
    rings = vec.trace_rings(mask, w, h)
    parts = []
    for ring in rings:
        pts = vec.chaikin(list(ring), 1)
        simplified = vec.douglas_peucker(pts, 0.5)
        if len(simplified) < 3:
            continue
        d = 'M%.1f %.1f' % simplified[0]
        for x, y in simplified[1:]:
            d += 'L%.1f %.1f' % (x, y)
        parts.append(d + 'Z')
    return ' '.join(parts), w, h


def main(argv):
    if len(argv) < 4:
        print(__doc__)
        return 2
    lineart, ink_json, spec_file, out_svg = argv[0], argv[1], argv[2], argv[3]  # lineart=cutout(アルファあり)
    spec = json.loads(Path(spec_file).read_text(encoding='utf-8'))
    ink_data = json.loads(Path(ink_json).read_text(encoding='utf-8'))
    sil_d, w, h = silhouette_path(lineart)
    ink_d = ' '.join(ink_data['ink'])
    defs = []
    accents = []
    if spec.get('ribbon'):
        p1, p2 = spec['ribbon']['p1'], spec['ribbon']['p2']
        offset = spec['ribbon'].get('offset', 0)
        width = spec['ribbon'].get('width', 12)
        dx, dy = p2[0] - p1[0], p2[1] - p1[1]
        length = math.hypot(dx, dy) or 1.0
        ux, uy = dx / length, dy / length
        nx, ny = uy, -ux
        cx = (p1[0] + p2[0]) / 2 + nx * offset
        cy = (p1[1] + p2[1]) / 2 + ny * offset
        angle = math.degrees(math.atan2(uy, ux))
        defs.append('    <rect x="%.1f" y="%.1f" width="%.1f" height="%.1f" fill="#fff" '
                    'transform="translate(%.1f %.1f) rotate(%.2f)"/>' %
                    (-length / 2 - 14, -width / 2, length + 28, width, cx, cy, angle))
        accents.append('ribbon')
    if spec.get('bow'):
        x, y, bw, bh = spec['bow']['box']
        defs.append('    <rect x="%d" y="%d" width="%d" height="%d" fill="#fff"/>' % (x, y, bw, bh))
        accents.append('bow')
    out = ['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %d %d" color="%s">' % (w, h, spec.get('color', '#000000'))]
    out.append('  <title>%s</title>' % Path(out_svg).stem)
    if defs:
        out.append('  <defs>')
        for name in accents:
            out.append('    <clipPath id="clip-%s">' % name)
            out.append(defs[accents.index(name)])
            out.append('    </clipPath>')
        out.append('  </defs>')
    out.append('  <path d="%s" fill="#ffffff"/>' % sil_d)
    out.append('  <path d="%s" fill="#111111" fill-rule="evenodd"/>' % ink_d)
    for name in accents:
        out.append('  <path id="%s" d="%s" fill="currentColor" fill-rule="evenodd" clip-path="url(#clip-%s)"/>' % (name, ink_d, name))
    out.append('</svg>')
    Path(out_svg).write_text('\n'.join(out) + '\n', encoding='utf-8')
    print('%s: %d bytes (silhouette %d chars, ink %d chars)' % (Path(out_svg).name, Path(out_svg).stat().st_size, len(sil_d), len(ink_d)))
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
