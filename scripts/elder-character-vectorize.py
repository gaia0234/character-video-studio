#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""設定シート由来の着色済みキャラクターをSVGへベクタ化する（純Python標準ライブラリのみ）。

入力: scripts/elder-character-art.py の build で作成した着色済みPNG（透過/白地/黒線画/差し色）
出力: 白地（シルエット）＋黒線画（evenodd）＋差し色の3パスからなるSVG。
方式: 前景ピクセルの境界辺を方向付きで列挙して輪郭を連結し、Chaikinで角を丸めて
      Douglas-Peuckerで単純化する。絵そのものは変えず、形状は元PNGの輪郭をなぞるだけ。
差し色は currentColor 1属性で差し替え可能。
"""
import json
import math
import sys
from pathlib import Path

import importlib.util

spec = importlib.util.spec_from_file_location('elder_art', str(Path(__file__).resolve().parent / 'elder-character-art.py'))
art = importlib.util.module_from_spec(spec)
spec.loader.exec_module(art)


def trace_rings(mask, w, h):
    """方向付きマーチングスクエアで輪郭リングを得る（前景が進行方向の左側になるように統一）。"""
    grid = [[0] * (w + 2) for _ in range(h + 2)]
    for y in range(h):
        for x in range(w):
            if mask[y * w + x]:
                grid[y + 1][x + 1] = 1
    # 各ケースの有向線分（前景が左）。T/R/B/Lは各セルの上・右・下・左の交点。
    TABLE = {
        1: (('B', 'L'),),
        2: (('R', 'B'),),
        3: (('R', 'L'),),
        4: (('T', 'R'),),
        5: (('T', 'R'), ('B', 'L')),
        6: (('T', 'B'),),
        7: (('T', 'L'),),
        8: (('L', 'T'),),
        9: (('B', 'T'),),
        10: (('L', 'T'), ('R', 'B')),
        11: (('R', 'T'),),
        12: (('L', 'R'),),
        13: (('B', 'R'),),
        14: (('L', 'B'),),
    }

    def point(edge, x, y, tl, tr, bl, br):
        if edge == 'T':
            t = 0.5 if tl == tr else (1 if tl else 0)
            return (x + t, y)
        if edge == 'R':
            t = 0.5 if tr == br else (1 if tr else 0)
            return (x + 1, y + t)
        if edge == 'B':
            t = 0.5 if bl == br else (1 if bl else 0)
            return (x + t, y + 1)
        t = 0.5 if tl == bl else (1 if tl else 0)
        return (x, y + t)

    nxt = {}
    for y in range(h + 1):
        r0 = grid[y]
        r1 = grid[y + 1]
        for x in range(w + 1):
            tl, tr = r0[x], r0[x + 1]
            bl, br = r1[x], r1[x + 1]
            code = (tl << 3) | (tr << 2) | (br << 1) | bl
            segs = TABLE.get(code)
            if not segs:
                continue
            for a, b in segs:
                p = point(a, x, y, tl, tr, bl, br)
                q = point(b, x, y, tl, tr, bl, br)
                nxt.setdefault(p, []).append(q)
    rings = []
    used = set()
    for start in list(nxt.keys()):
        for first in nxt.get(start, []):
            if (start, first) in used:
                continue
            ring = [start]
            cur = first
            used.add((start, first))
            guard = 0
            while cur != start and guard < 500000:
                ring.append(cur)
                candidates = [c for c in nxt.get(cur, []) if (cur, c) not in used]
                if not candidates:
                    break
                used.add((cur, candidates[0]))
                cur = candidates[0]
                guard += 1
            if len(ring) >= 4:
                rings.append(ring)
    return rings


def chaikin(points, iterations=1):
    for _ in range(iterations):
        out = []
        n = len(points)
        for i in range(n):
            p0 = points[i]
            p1 = points[(i + 1) % n]
            out.append((0.75 * p0[0] + 0.25 * p1[0], 0.75 * p0[1] + 0.25 * p1[1]))
            out.append((0.25 * p0[0] + 0.75 * p1[0], 0.25 * p0[1] + 0.75 * p1[1]))
        points = out
    return points


def douglas_peucker(points, eps):
    if len(points) < 3:
        return points
    keep = [False] * len(points)
    keep[0] = keep[-1] = True
    stack = [(0, len(points) - 1)]
    while stack:
        i0, i1 = stack.pop()
        if i1 <= i0 + 1:
            continue
        x0, y0 = points[i0]
        x1, y1 = points[i1]
        dx, dy = x1 - x0, y1 - y0
        norm = math.hypot(dx, dy)
        if norm < 1e-9:
            continue
        maxd, idx = -1.0, i0
        for i in range(i0 + 1, i1):
            px, py = points[i]
            d = abs(dy * px - dx * py + x1 * y0 - y1 * x0) / norm
            if d > maxd:
                maxd, idx = d, i
        if maxd > eps:
            keep[idx] = True
            stack.append((i0, idx))
            stack.append((idx, i1))
    return [p for p, k in zip(points, keep) if k]


def path_data(rings, eps, smooth=1):
    parts = []
    for ring in rings:
        pts = chaikin(list(ring), smooth) if smooth else list(ring)
        simplified = douglas_peucker(pts, eps)
        if len(simplified) < 3:
            continue
        d = 'M%.1f %.1f' % simplified[0]
        for x, y in simplified[1:]:
            d += 'L%.1f %.1f' % (x, y)
        d += 'Z'
        parts.append(d)
    return ''.join(parts)


def classify(px, w, h):
    ink = bytearray(w * h)
    accent = bytearray(w * h)
    silhouette = bytearray(w * h)
    for y in range(h):
        base = y * w
        for x in range(w):
            i = (base + x) * 4
            if px[i + 3] == 0:
                continue
            silhouette[base + x] = 1
            r, g, b = px[i], px[i + 1], px[i + 2]
            if r > g + 45 and r > b + 45:
                accent[base + x] = 1
            elif b > r + 45 and b > g + 20:
                accent[base + x] = 1
            elif g > r + 30 and g > b + 15:
                accent[base + x] = 1
            elif art.lum(r, g, b) < 120:
                ink[base + x] = 1
    for i in range(w * h):
        if accent[i]:
            ink[i] = 0
    return silhouette, ink, accent


def build_svg(png_path, out_path, eps=0.6, smooth=1, accent_color='#c8322c'):
    w, h, px = art.read_png(str(png_path))
    silhouette, ink, accent = classify(px, w, h)
    sil_d = path_data(trace_rings(silhouette, w, h), eps, smooth)
    ink_d = path_data(trace_rings(ink, w, h), eps, smooth)
    acc_d = path_data(trace_rings(accent, w, h), eps, smooth) if any(accent) else ''
    # width/height属性は付けない（viewBoxのみで縮尺可）。差し色は currentColor 1属性で差し替え可能。
    svg = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %d %d" color="%s">\n'
           '  <title>%s</title>\n'
           '  <path d="%s" fill="#ffffff"/>\n'
           '  <path d="%s" fill="#111111" fill-rule="evenodd"/>\n' % (w, h, accent_color, png_path.stem, sil_d, ink_d))
    if acc_d:
        svg += '  <path d="%s" fill="currentColor" fill-rule="evenodd"/>\n' % acc_d
    svg += '</svg>\n'
    out_path.write_text(svg, encoding='utf-8')
    return {'file': str(out_path), 'size': [w, h], 'bytes': out_path.stat().st_size}


def main(argv):
    if len(argv) < 2:
        print(__doc__)
        return 2
    src_dir = Path(argv[0])
    out_dir = Path(argv[1])
    out_dir.mkdir(parents=True, exist_ok=True)
    eps = float(argv[2]) if len(argv) > 2 else 0.6
    smooth = int(argv[3]) if len(argv) > 3 else 1
    colors = {'homer': '#c8322c', 'judd': '#2b5fa8', 'kent': '#2e7d4f'}
    results = []
    for png in sorted(src_dir.glob('*.png')):
        if png.name.startswith('still-') or png.name == 'contact-sheet.png':
            continue
        res = build_svg(png, out_dir / (png.stem + '.svg'), eps, smooth,
                        colors.get(png.stem, '#c8322c'))
        results.append(res)
        print('%s -> %s (%d bytes)' % (png.name, res['file'], res['bytes']))
    (out_dir / 'vectorize-report.json').write_text(json.dumps(results, ensure_ascii=False, indent=2) + '\n',
                                                   encoding='utf-8')
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
