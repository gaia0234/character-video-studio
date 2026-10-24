#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""元画像トレースSVGから表情差分を作る（純Python標準ライブラリのみ）。

基準SVGの `#mouth` のパスだけを差し替える。口の位置は face-layout.json に保存した
元画像の口bboxからの相対配置なので、キャラの形・顔・差し色は一切変わらない。
目・眉は元画像にないため足さない（キャラを勝手に変えない）。

usage: python3 build-elder-expressions.py
出力: public/assets/characters/elder-svg/{homer,judd,kent}-{expression}.svg
"""
import json
import re
from pathlib import Path

D = Path('/home/ds-work/projects/character-video-studio/public/assets/characters/elder-svg')

# 表情定義。w/h は元の口bboxに対する倍率、depth は弧の深さ。
# smile=下に膨らむ弧 / frown=上に膨らむ弧 / line=直線 / open=開いた楕円
EXPRESSIONS = {
    'homer': {
        'happy': {'kind': 'smile', 'w': 1.35, 'depth': 0.85},
        'cheer': {'kind': 'open', 'w': 1.15, 'h': 1.25},
    },
    'judd': {
        'sigh': {'kind': 'open', 'w': 1.0, 'h': 0.9},
        'stern': {'kind': 'line', 'w': 1.15},
    },
    'kent': {
        'nod': {'kind': 'line', 'w': 1.15},
        'think': {'kind': 'open', 'w': 1.25, 'h': 1.05},
    },
}


def mouth_element(spec, box, eyes=None):
    """口のパスを作る。

    eyes（目bbox）を渡すと、口の上端が目の下端から6px以上空くように下へ補正する。
    弧の端点は口bboxの中央の高さに置き、幅を広げても端が目の真下に出て重ならないようにする。
    """
    x0, y0, x1, y1 = box
    cx, cy = (x0 + x1) / 2.0, (y0 + y1) / 2.0
    w = (x1 - x0) * spec.get('w', 1.0)
    h = (y1 - y0) * spec.get('h', 1.0)
    sw = max(5.0, (y1 - y0) * 0.35)
    kind = spec['kind']
    depth = (y1 - y0) * spec.get('depth', 0.6)
    if kind not in ('smile', 'frown', 'line', 'open'):
        raise SystemExit('未知の口の種類: %s' % kind)

    def top_of(center_y):
        if kind == 'smile':
            return center_y - sw / 2
        if kind == 'frown':
            return center_y - depth / 2 - sw / 2
        if kind == 'line':
            return center_y - sw / 2
        return center_y - h / 2  # open

    if eyes:
        limit = eyes[3] + 6
        if top_of(cy) < limit:
            cy += limit - top_of(cy)

    if kind == 'smile':
        d = 'M%.1f %.1f Q%.1f %.1f %.1f %.1f' % (
            cx - w / 2, cy, cx, cy + h, cx + w / 2, cy)
        return ('<path id="mouth" fill="none" stroke="#111111" stroke-width="%.1f" '
                'stroke-linecap="round" d="%s"/>' % (sw, d))
    if kind == 'frown':
        d = 'M%.1f %.1f Q%.1f %.1f %.1f %.1f' % (
            cx - w / 2, cy, cx, cy - h, cx + w / 2, cy)
        return ('<path id="mouth" fill="none" stroke="#111111" stroke-width="%.1f" '
                'stroke-linecap="round" d="%s"/>' % (sw, d))
    if kind == 'line':
        d = 'M%.1f %.1f L%.1f %.1f' % (cx - w / 2, cy, cx + w / 2, cy)
        return ('<path id="mouth" fill="none" stroke="#111111" stroke-width="%.1f" '
                'stroke-linecap="round" d="%s"/>' % (sw, d))
    return ('<path id="mouth" fill="#111111" d="M%.1f %.1f a%.1f %.1f 0 1 0 %.1f 0 '
            'a%.1f %.1f 0 1 0 %.1f 0"/>' % (
                cx - w / 2, cy, w / 2, h / 2, w, w / 2, h / 2, -w))


def build(key, expression, spec, layout):
    src = (D / ('%s.svg' % key)).read_text(encoding='utf-8')
    box = layout.get('mouth')
    if not box:
        raise SystemExit('%s: 口の位置が face-layout.json にありません' % key)
    out = re.sub(r'<path id="mouth"[^>]*/>', mouth_element(spec, box, layout.get('eyes')),
                 src, count=1)
    if out == src:
        raise SystemExit('%s: 基準SVGに #mouth パスがありません' % key)
    out = re.sub(r'<title>.*?</title>', '<title>%s（%s）</title>' % (key, expression),
                 out, count=1, flags=re.S)
    path = D / ('%s-%s.svg' % (key, expression))
    path.write_text(out, encoding='utf-8')
    return path


def main():
    layout_all = json.loads((D / 'face-layout.json').read_text(encoding='utf-8'))
    made = []
    for key, exprs in EXPRESSIONS.items():
        layout = layout_all[key]
        for name, spec in exprs.items():
            p = build(key, name, spec, layout)
            made.append(str(p))
            print('%s: %d bytes' % (p.name, p.stat().st_size))
    (D / 'expressions.json').write_text(json.dumps(
        {k: sorted(v.keys()) for k, v in EXPRESSIONS.items()}, ensure_ascii=False, indent=2) + '\n',
        encoding='utf-8')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
