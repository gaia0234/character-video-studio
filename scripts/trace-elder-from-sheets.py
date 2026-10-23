#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""元画像（設定シート切出しPNG）からエルダーチャンネル用フラットベクターSVGを生成する。

標準ライブラリのみで動作（外部AI API・外部ライブラリ不使用）。

手順:
  1. PNG復号（zlib＋フィルタ解除）
  2. 暗マスク（黒いインク部分）を作成
  3. 閉字処理（膨張→収縮）でハッチングの白い隙間を面として統合
  4. 輪郭エッジを連結してループ化し、面積でノイズを除去
  5. Douglas-Peuckerで単純化してSVGパスへ
  6. 差し色（帽子の帯・蝶ネクタイ）だけ彩色して別パスで重ねる

前回の不採用トレーサとの差: ハッチングの白抜きを残さず黒い面へ統合すること。
出力先: public/assets/characters/elder-svg/{homer,judd,kent}.svg
"""
import argparse
import json
import pathlib
import struct
import sys
import zlib
from collections import deque

ROOT = pathlib.Path(__file__).resolve().parents[1]
# 元画像（設定シート切出し）。原本は共有フォルダの参考-設定シート切出し/ から取り込み済み。
SRC = ROOT / 'public/assets/characters/elder-source'
OUT = ROOT / 'public/assets/characters/elder-svg'

CHARS = {
    # name: (元画像, 差し色)  色は元画像の実測値と完全一致（赤200,50,44 / 青43,95,168 / 緑46,125,79）
    'homer': ('homer.png', '#C8322C'),
    'judd': ('judd.png', '#2B5FA8'),
    'kent': ('kent.png', '#2E7D4F'),
}

TH_DARK = 140        # 暗とみなす輝度しきい値
FILL_T = 13          # 横・縦どちらの細さでこの値以下の白帯は黒で埋める（実測: ノイズ≤13/本物の白≥19）
INNER_T = 8          # 本物の白穴の内側でもこの値以下の細部は埋める（実測: 穴の端は1〜7px/中心は14px以上）
MIN_LOOP_AREA = 80   # これ未満のループ（ノイズ穴・粉）は破棄
DP_TOL = 1.2         # Douglas-Peucker の許容誤差（px）
SAT_MIN = 70         # 差し色とみなす彩度差
ACC_CLOSE_R = 2      # 差し色の閉字半径
ACC_MIN_AREA = 40    # 差し色の最小面積
ACC_Y_MAX = 0.45     # 差し色として採用する重心yの上限（裾の裏地は着色対象外のため除外）


# ---------------------------------------------------------------- PNG復号

def decode_png(path):
    data = pathlib.Path(path).read_bytes()
    pos = 8
    idat = b''
    ihdr = None
    while pos < len(data):
        length, typ = struct.unpack('>I4s', data[pos:pos + 8])
        body = data[pos + 8:pos + 8 + length]
        if typ == b'IHDR':
            ihdr = struct.unpack('>IIBBBBB', body)
        elif typ == b'IDAT':
            idat += body
        elif typ == b'IEND':
            break
        pos += 12 + length
    width, height, bit_depth, color_type, _, _, interlace = ihdr
    if bit_depth != 8 or interlace != 0:
        raise SystemExit('非対応のPNG形式: depth=%d interlace=%d' % (bit_depth, interlace))
    channels = {0: 1, 2: 3, 4: 2, 6: 4}.get(color_type)
    if channels is None:
        raise SystemExit('非対応のカラータイプ: %d' % color_type)
    raw = zlib.decompress(idat)
    stride = width * channels
    out = bytearray(stride * height)
    prev = bytearray(stride)
    offset = 0
    for y in range(height):
        filt = raw[offset]
        offset += 1
        line = bytearray(raw[offset:offset + stride])
        offset += stride
        if filt == 1:
            for x in range(channels, stride):
                line[x] = (line[x] + line[x - channels]) & 255
        elif filt == 2:
            for x in range(stride):
                line[x] = (line[x] + prev[x]) & 255
        elif filt == 3:
            for x in range(stride):
                left = line[x - channels] if x >= channels else 0
                line[x] = (line[x] + ((left + prev[x]) >> 1)) & 255
        elif filt == 4:
            for x in range(stride):
                a = line[x - channels] if x >= channels else 0
                b = prev[x]
                c = prev[x - channels] if x >= channels else 0
                p = a + b - c
                pa, pb, pc = abs(p - a), abs(p - b), abs(p - c)
                if pa <= pb and pa <= pc:
                    pred = a
                elif pb <= pc:
                    pred = b
                else:
                    pred = c
                line[x] = (line[x] + pred) & 255
        elif filt != 0:
            raise SystemExit('未知のフィルタ: %d' % filt)
        out[y * stride:(y + 1) * stride] = line
        prev = line
    return width, height, channels, bytes(out)


# ---------------------------------------------------------------- マスク処理

def integral_image(mask, width, height):
    """mask(0/1のbytes)の積分画像。index = y*(width+1)+x+1"""
    ii = [0] * ((width + 1) * (height + 1))
    stride = width + 1
    for y in range(height):
        row = 0
        cur = (y + 1) * stride
        prev = y * stride
        base = y * width
        for x in range(width):
            row += mask[base + x]
            ii[cur + x + 1] = ii[prev + x + 1] + row
    return ii


def box_sum(ii, width, height, x0, y0, x1, y1):
    """[x0,x1)×[y0,y1) の和（画像外は0でクリップ）"""
    x0 = max(x0, 0)
    y0 = max(y0, 0)
    x1 = min(x1, width)
    y1 = min(y1, height)
    if x0 >= x1 or y0 >= y1:
        return 0
    stride = width + 1
    a = ii[y1 * stride + x1]
    b = ii[y0 * stride + x1]
    c = ii[y1 * stride + x0]
    d = ii[y0 * stride + x0]
    return a - b - c + d


def dilate_box(mask, width, height, radius):
    ii = integral_image(mask, width, height)
    out = bytearray(width * height)
    for y in range(height):
        y0, y1 = y - radius, y + radius + 1
        base = y * width
        for x in range(width):
            if mask[base + x]:
                out[base + x] = 1
            elif box_sum(ii, width, height, x - radius, y0, x + radius + 1, y1):
                out[base + x] = 1
    return bytes(out)


def erode_box(mask, width, height, radius):
    ii = integral_image(mask, width, height)
    out = bytearray(width * height)
    box = (2 * radius + 1) ** 2
    for y in range(height):
        y0, y1 = y - radius, y + radius + 1
        base = y * width
        for x in range(width):
            if not mask[base + x]:
                continue
            # 画像外は1とみなして端での削れを防ぐ
            x0, x1 = max(x - radius, 0), min(x + radius + 1, width)
            yy0, yy1 = max(y - radius, 0), min(y + radius + 1, height)
            total = (x1 - x0) * (yy1 - yy0)
            if box_sum(ii, width, height, x0, yy0, x1, yy1) == total:
                out[base + x] = 1
    return bytes(out)


def close_mask(mask, width, height, radius):
    return erode_box(dilate_box(mask, width, height, radius), width, height, radius)


def white_holes(mask, width, height):
    """囲まれた白い領域（穴）を返す。画像外周に触れる白は背景として除く。"""
    seen = bytearray(width * height)
    holes = []
    for start in range(width * height):
        if mask[start] or seen[start]:
            continue
        q = deque([start])
        seen[start] = 1
        cells = [start]
        border = False
        while q:
            cur = q.popleft()
            cx, cy = cur % width, cur // width
            if cx == 0 or cy == 0 or cx == width - 1 or cy == height - 1:
                border = True
            for nx, ny in ((cx - 1, cy), (cx + 1, cy), (cx, cy - 1), (cx, cy + 1)):
                if nx < 0 or ny < 0 or nx >= width or ny >= height:
                    continue
                ni = ny * width + nx
                if not mask[ni] and not seen[ni]:
                    seen[ni] = 1
                    q.append(ni)
                    cells.append(ni)
        if not border:
            holes.append(cells)
    return holes


def pixel_minrun(i, mask, width, height):
    """画素を含む白ランのうち、短い方（横・縦）の長さ"""
    x, y = i % width, i // width
    x0 = x
    while x0 > 0 and not mask[y * width + x0 - 1]:
        x0 -= 1
    x1 = x
    while x1 < width - 1 and not mask[y * width + x1 + 1]:
        x1 += 1
    y0 = y
    while y0 > 0 and not mask[(y0 - 1) * width + x]:
        y0 -= 1
    y1 = y
    while y1 < height - 1 and not mask[(y1 + 1) * width + x]:
        y1 += 1
    return min(x1 - x0 + 1, y1 - y0 + 1)


def thickness_stats(cells, mask, width, height):
    """穴の厚み = 各画素の min(横の白ラン, 縦の白ラン) の最大値"""
    best = 0
    for i in cells:
        val = pixel_minrun(i, mask, width, height)
        if val > best:
            best = val
    return best


def fill_thin_white(mask, width, height, limit):
    """横または縦の白ランがlimit以下の白画素を黒で埋める。
    ハッチングの細い白線は潰れ、顔・シャツ・眼鏡などの広い白は残る。"""
    out = bytearray(mask)
    for y in range(height):
        base = y * width
        x = 0
        while x < width:
            if mask[base + x]:
                x += 1
                continue
            start = x
            while x < width and not mask[base + x]:
                x += 1
            if x - start <= limit and start > 0 and x < width:
                for i in range(start, x):
                    out[base + i] = 1
    for x in range(width):
        y = 0
        while y < height:
            if mask[y * width + x]:
                y += 1
                continue
            start = y
            while y < height and not mask[y * width + x]:
                y += 1
            if y - start <= limit and start > 0 and y < height:
                for i in range(start, y):
                    out[i * width + x] = 1
    return bytes(out)


# ---------------------------------------------------------------- 輪郭抽出

def trace_loops(mask, width, height, get):
    """maskから輪郭ループを返す。get(x,y)が面ならTrue。
    面に接するセルの境界エッジを連結する。角同士の接触は右折優先で分割する。"""
    edges = {}

    def add(sx, sy, ex, ey):
        edges.setdefault((sx, sy), []).append((ex, ey))

    for y in range(height):
        for x in range(width):
            if not get(x, y):
                continue
            if y == 0 or not get(x, y - 1):
                add(x + 1, y, x, y)
            if x == 0 or not get(x - 1, y):
                add(x, y, x, y + 1)
            if y + 1 >= height or not get(x, y + 1):
                add(x, y + 1, x + 1, y + 1)
            if x + 1 >= width or not get(x + 1, y):
                add(x + 1, y + 1, x + 1, y)

    loops = []
    for start in list(edges.keys()):
        while edges.get(start):
            first = edges[start].pop()
            if not edges[start]:
                del edges[start]
            loop = [start]
            cur = first
            prev_dir = (first[0] - start[0], first[1] - start[1])
            loop.append(cur)
            guard = 0
            while cur != start:
                guard += 1
                if guard > 4_000_000:
                    raise SystemExit('ループ連結が収束しません')
                cands = edges.get(cur)
                if not cands:
                    break
                # 右折→直進→左折→後退の優先順で連結する
                order = ((-prev_dir[1], prev_dir[0]), prev_dir,
                         (prev_dir[1], -prev_dir[0]), (-prev_dir[0], -prev_dir[1]))
                pick = None
                for want in order:
                    for i, (ex, ey) in enumerate(cands):
                        if (ex - cur[0], ey - cur[1]) == want:
                            pick = i
                            break
                    if pick is not None:
                        break
                if pick is None:
                    pick = 0
                nxt = cands.pop(pick)
                if not cands:
                    del edges[cur]
                prev_dir = (nxt[0] - cur[0], nxt[1] - cur[1])
                if nxt == start:
                    break
                loop.append(nxt)
                cur = nxt
            if len(loop) >= 4:
                loops.append(loop)
    return loops


def shoelace(loop):
    area = 0
    n = len(loop)
    for i in range(n):
        x0, y0 = loop[i]
        x1, y1 = loop[(i + 1) % n]
        area += x0 * y1 - x1 * y0
    return area / 2.0


def simplify(points, tolerance):
    """反復版Douglas-Peucker"""
    if len(points) < 3:
        return points
    keep = [False] * len(points)
    keep[0] = keep[-1] = True
    stack = [(0, len(points) - 1)]
    tol2 = tolerance * tolerance
    while stack:
        first, last = stack.pop()
        if last <= first + 1:
            continue
        x0, y0 = points[first]
        x1, y1 = points[last]
        dx, dy = x1 - x0, y1 - y0
        norm = dx * dx + dy * dy
        best = -1.0
        best_i = -1
        for i in range(first + 1, last):
            px, py = points[i]
            if norm == 0:
                dist = (px - x0) ** 2 + (py - y0) ** 2
            else:
                cross = abs(dx * (py - y0) - dy * (px - x0))
                dist = (cross * cross) / norm
            if dist > best:
                best = dist
                best_i = i
        if best > tol2 and best_i != -1:
            keep[best_i] = True
            stack.append((first, best_i))
            stack.append((best_i, last))
    return [p for p, k in zip(points, keep) if k]


def path_d(loops, scale=1.0, dx=0.0, dy=0.0):
    parts = []
    for loop in loops:
        coords = []
        for x, y in loop:
            coords.append('%g %g' % (round((x + dx) * scale, 1), round((y + dy) * scale, 1)))
        parts.append('M' + ' L'.join(coords) + ' Z')
    return ' '.join(parts)


# ---------------------------------------------------------------- コンポーネント

def components(mask, width, height, min_area, get=None):
    """4連結成分を返す [(area, [(x,y)...]メモリ節約のためbboxとピクセル集合は呼び出し側で再集計)]"""
    labels = [-1] * (width * height)
    comps = []
    idx = 0
    for start in range(width * height):
        if labels[start] != -1:
            continue
        if get is not None and not mask[start]:
            continue
        if not mask[start]:
            continue
        q = deque([start])
        labels[start] = len(comps)
        cells = [start]
        while q:
            cur = q.popleft()
            cx, cy = cur % width, cur // width
            for nx, ny in ((cx - 1, cy), (cx + 1, cy), (cx, cy - 1), (cx, cy + 1)):
                if nx < 0 or ny < 0 or nx >= width or ny >= height:
                    continue
                ni = ny * width + nx
                if labels[ni] == -1 and mask[ni]:
                    labels[ni] = len(comps)
                    q.append(ni)
                    cells.append(ni)
        comps.append(cells)
    return labels, [c for c in comps if len(c) >= min_area]


# ---------------------------------------------------------------- SVG生成

def build_char(name, src_file, accent, report=False):
    width, height, channels, pixels = decode_png(SRC / src_file)

    dark = bytearray(width * height)
    sat = bytearray(width * height)
    for i in range(width * height):
        base = i * channels
        r, g, b = pixels[base], pixels[base + 1], pixels[base + 2]
        lum = (r * 299 + g * 587 + b * 114) // 1000
        if lum < TH_DARK or (max(r, g, b) - min(r, g, b)) > SAT_MIN:
            dark[i] = 1
        if max(r, g, b) - min(r, g, b) > SAT_MIN:
            sat[i] = 1

    if report:
        holes = white_holes(bytes(dark), width, height)
        stats = sorted(
            ((len(h), thickness_stats(h, bytes(dark), width, height)) for h in holes),
            reverse=True)
        print('%s %dx%d 暗画素=%d 穴=%d' % (name, width, height, sum(dark), len(holes)))
        for area, thick in stats[:16]:
            print('   穴 area=%-6d 厚み=%d' % (area, thick))
        return None

    body = fill_thin_white(bytes(dark), width, height, FILL_T)

    # 囲まれた白（顔・シャツ・手・眼鏡など）で十分太いものは残す。ただし穴の内側の
    # 細い部分（端の尖り・細い白線）は INNER_T 以下なので、潰したままにする。
    dark_bytes = bytes(dark)
    protected = bytearray(width * height)
    kept_holes = 0
    for hole in white_holes(dark_bytes, width, height):
        if thickness_stats(hole, dark_bytes, width, height) <= FILL_T:
            continue
        kept_holes += 1
        for i in hole:
            if pixel_minrun(i, dark_bytes, width, height) > INNER_T:
                protected[i] = 1
    body_arr = bytearray(body)
    for i in range(width * height):
        if protected[i]:
            body_arr[i] = 0
    body = bytes(body_arr)

    def get_body(x, y):
        return body[y * width + x] == 1

    loops = trace_loops(body, width, height, get_body)
    kept = []
    dropped = 0
    for loop in loops:
        if abs(shoelace(loop)) >= MIN_LOOP_AREA:
            kept.append(simplify(loop, DP_TOL))
        else:
            dropped += 1

    # 差し色（帯・蝶ネクタイ）。裾の裏地は重心が下寄りなので除外される。
    acc_mask = close_mask(bytes(sat), width, height, ACC_CLOSE_R)
    labels, comps = components(acc_mask, width, height, ACC_MIN_AREA)
    accents = []
    for cells in comps:
        xs = [i % width for i in cells]
        ys = [i // width for i in cells]
        cx, cy = sum(xs) / len(xs), sum(ys) / len(ys)
        if cy > ACC_Y_MAX * height:
            continue
        sub = bytearray(width * height)
        for i in cells:
            sub[i] = 1

        def get_sub(x, y, _s=sub):
            return _s[y * width + x] == 1

        sub_loops = trace_loops(bytes(sub), width, height, get_sub)
        sub_kept = [simplify(l, DP_TOL) for l in sub_loops if abs(shoelace(l)) >= 20]
        accents.append({
            'area': len(cells),
            'centroid': (round(cx, 1), round(cy, 1)),
            'bbox': (min(xs), min(ys), max(xs), max(ys)),
            'loops': sub_kept,
        })

    # 顔の穴の内側にある目・口は別のパスに分け、idを付ける。
    # 表情差分はこの口パスだけを差し替えて作る（元画像の位置を保持するため）。
    body_holes = white_holes(body, width, height)
    face_cells = []
    for hole in body_holes:
        cy = sum(i // width for i in hole) / len(hole)
        if cy < 0.5 * height and (not face_cells or len(hole) > len(face_cells)):
            face_cells = hole
    fx0 = min(i % width for i in face_cells)
    fx1 = max(i % width for i in face_cells)
    fy0 = min(i // width for i in face_cells)
    fy1 = max(i // width for i in face_cells)
    body_loops, face_loops = [], []
    for loop in kept:
        lx0 = min(p[0] for p in loop)
        lx1 = max(p[0] for p in loop)
        ly0 = min(p[1] for p in loop)
        ly1 = max(p[1] for p in loop)
        if lx0 >= fx0 and lx1 <= fx1 and ly0 >= fy0 and ly1 <= fy1:
            face_loops.append(loop)
        else:
            body_loops.append(loop)
    face_loops.sort(key=lambda l: max(p[1] for p in l))
    mouth_loops = face_loops[-1:]
    eye_loops = face_loops[:-1]

    def bbox_of(loop_groups):
        if not loop_groups:
            return None
        xs = [p[0] for l in loop_groups for p in l]
        ys = [p[1] for l in loop_groups for p in l]
        return [min(xs), min(ys), max(xs), max(ys)]

    layout = {
        'viewBox': [width, height],
        'face': [fx0, fy0, fx1, fy1],
        'eyes': bbox_of(eye_loops),
        'mouth': bbox_of(mouth_loops),
    }

    svg = ['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %d %d" width="%d" height="%d" '
           'role="img" aria-label="%s">' % (width, height, width, height, name)]
    svg.append('  <title>%s（元画像トレース）</title>' % name)
    svg.append('  <path id="body" fill="#111111" fill-rule="evenodd" d="%s"/>' %
               path_d(body_loops))
    if eye_loops:
        svg.append('  <path id="eyes" fill="#111111" fill-rule="evenodd" d="%s"/>' %
                   path_d(eye_loops))
    if mouth_loops:
        svg.append('  <path id="mouth" fill="#111111" fill-rule="evenodd" d="%s"/>' %
                   path_d(mouth_loops))
    for i, a in enumerate(accents):
        svg.append('  <path class="accent" fill="%s" fill-rule="evenodd" d="%s"/>' %
                   (accent, path_d(a['loops'])))
    svg.append('</svg>')
    text = '\n'.join(svg) + '\n'
    out = OUT / ('%s.svg' % name)
    out.write_text(text, encoding='utf-8')
    return {
        'name': name,
        'size': (width, height),
        'loops': len(body_loops),
        'accents': len(accents),
        'bytes': len(text.encode('utf-8')),
        'layout': layout,
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--report', action='store_true', help='生成せず実測値のみ表示')
    args = ap.parse_args()
    results = []
    for name, (src_file, accent) in CHARS.items():
        res = build_char(name, src_file, accent, report=args.report)
        if res:
            results.append(res)
            print('%s: %dループ/差し色%d/%d bytes %dx%d' % (
                res['name'], res['loops'], res['accents'], res['bytes'],
                res['size'][0], res['size'][1]))
    if results:
        (OUT / 'trace-source.json').write_text(
            'source=%s\nchars=%s\nparams=TH_DARK:%d FILL_T:%d INNER_T:%d MIN_LOOP_AREA:%d DP_TOL:%.1f\n'
            % (SRC, ','.join(CHARS), TH_DARK, FILL_T, INNER_T, MIN_LOOP_AREA, DP_TOL),
            encoding='utf-8')
        # 表情差分の生成元になる口・目の位置（元画像ピクセル座標）
        (OUT / 'face-layout.json').write_text(
            json.dumps({r['name']: r['layout'] for r in results},
                       ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        print('出力先:', OUT)
    return 0


if __name__ == '__main__':
    sys.exit(main())
