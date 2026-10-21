#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""エルダーチャンネル設定シートの加工ツール（純Python標準ライブラリのみ・外部AI API不要）。

サブコマンド:
  info    <png>                      寸法・色形式
  ascii   <png> --box x,y,w,h [--cols N]  領域の濃度マップ（位置特定用）
  build   --rules rules.json         設定JSONに従い 切り出し→背景除去→差し色塗り→保存
  preview <png> --box ... --out ...   領域切り出しの保存（位置確認用）

設計: PNGは8bit RGB/RGBA・非インターレースのみ。外部ライブラリ・ffmpeg・ブラウザ不要。
背景除去は画像外周から白（輝度230以上）をflood fillして透明化。内部の白は残す（線画の白地）。
差し色は位置指定ルールで対象領域の黒ハッチングを色置換（線画の密度は保持）。
"""
import json
import os
import struct
import sys
import zlib

WHITE_CUT = 230        # 背景とみなす白の閾値（輝度）
INK_MAX = 110          # 線画（黒ハッチング）とみなす最大輝度


# ---------------------------------------------------------------- PNG I/O
def read_png(path):
    with open(path, 'rb') as f:
        data = f.read()
    if data[:8] != b'\x89PNG\r\n\x1a\n':
        raise ValueError('not a png: %s' % path)
    pos = 8
    idat = []
    width = height = depth = ctype = None
    interlace = 0
    while pos < len(data):
        length = struct.unpack('>I', data[pos:pos + 4])[0]
        ctag = data[pos + 4:pos + 8]
        body = data[pos + 8:pos + 8 + length]
        pos += 12 + length
        if ctag == b'IHDR':
            width, height, depth, ctype, _comp, _filt, interlace = struct.unpack('>IIBBBBB', body)
        elif ctag == b'IDAT':
            idat.append(body)
        elif ctag == b'IEND':
            break
    if depth != 8 or ctype not in (2, 6) or interlace != 0:
        raise ValueError('unsupported png (depth=%s ctype=%s interlace=%s)' % (depth, ctype, interlace))
    bpp = 3 if ctype == 2 else 4
    raw = zlib.decompress(b''.join(idat))
    stride = width * bpp
    out = bytearray(height * stride)
    prev = bytearray(stride)
    p = 0
    for y in range(height):
        ft = raw[p]
        p += 1
        line = bytearray(raw[p:p + stride])
        p += stride
        if ft == 1:
            for i in range(bpp, stride):
                line[i] = (line[i] + line[i - bpp]) & 0xFF
        elif ft == 2:
            for i in range(stride):
                line[i] = (line[i] + prev[i]) & 0xFF
        elif ft == 3:
            for i in range(stride):
                left = line[i - bpp] if i >= bpp else 0
                line[i] = (line[i] + ((left + prev[i]) >> 1)) & 0xFF
        elif ft == 4:
            for i in range(stride):
                a = line[i - bpp] if i >= bpp else 0
                b = prev[i]
                c = prev[i - bpp] if i >= bpp else 0
                pp = a + b - c
                pa, pb, pc = abs(pp - a), abs(pp - b), abs(pp - c)
                pr = a if (pa <= pb and pa <= pc) else (b if pb <= pc else c)
                line[i] = (line[i] + pr) & 0xFF
        out[y * stride:(y + 1) * stride] = line
        prev = line
    # RGB/RGBA -> RGBA
    rgba = bytearray(width * height * 4)
    if bpp == 3:
        for i in range(width * height):
            s = i * 3
            d = i * 4
            rgba[d:d + 4] = bytes((out[s], out[s + 1], out[s + 2], 255))
    else:
        rgba[:] = out
    return width, height, rgba


def write_png(path, width, height, rgba):
    raw = bytearray()
    stride = width * 4
    for y in range(height):
        raw.append(0)
        raw += rgba[y * stride:(y + 1) * stride]
    comp = zlib.compress(bytes(raw), 6)

    def chunk(tag, body):
        return (struct.pack('>I', len(body)) + tag + body +
                struct.pack('>I', zlib.crc32(tag + body) & 0xFFFFFFFF))

    ihdr = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)
    with open(path, 'wb') as f:
        f.write(b'\x89PNG\r\n\x1a\n')
        f.write(chunk(b'IHDR', ihdr))
        f.write(chunk(b'IDAT', comp))
        f.write(chunk(b'IEND', b''))


# ---------------------------------------------------------------- helpers
def lum(r, g, b):
    return (r * 299 + g * 587 + b * 114) // 1000


def crop(rgba, w, h, box):
    x, y, cw, ch = box
    x = max(0, min(x, w - 1))
    y = max(0, min(y, h - 1))
    cw = max(1, min(cw, w - x))
    ch = max(1, min(ch, h - y))
    out = bytearray(cw * ch * 4)
    for j in range(ch):
        s = ((y + j) * w + x) * 4
        out[j * cw * 4:(j + 1) * cw * 4] = rgba[s:s + cw * 4]
    return cw, ch, out, (x, y)


def ink_bbox(rgba, w, h, threshold=250):
    x0, y0, x1, y1 = w, h, 0, -1
    for y in range(h):
        row = y * w * 4
        for x in range(w):
            i = row + x * 4
            if lum(rgba[i], rgba[i + 1], rgba[i + 2]) < threshold:
                if x < x0:
                    x0 = x
                if x > x1:
                    x1 = x
                if y < y0:
                    y0 = y
                if y > y1:
                    y1 = y
    if x1 < 0:
        return None
    return (x0, y0, x1 - x0 + 1, y1 - y0 + 1)


def cutout_background(rgba, w, h):
    """外周から白（輝度>=WHITE_CUT）をflood fillして透明化。内部の白は残す。"""
    seen = bytearray(w * h)
    filled = bytearray(w * h)
    stack = []
    for x in range(w):
        for y in (0, h - 1):
            stack.append((x, y))
    for y in range(h):
        for x in (0, w - 1):
            stack.append((x, y))
    while stack:
        x, y = stack.pop()
        if x < 0 or y < 0 or x >= w or y >= h:
            continue
        idx = y * w + x
        if seen[idx]:
            continue
        seen[idx] = 1
        i = idx * 4
        if lum(rgba[i], rgba[i + 1], rgba[i + 2]) < WHITE_CUT:
            continue
        filled[idx] = 1
        stack.append((x + 1, y))
        stack.append((x - 1, y))
        stack.append((x, y + 1))
        stack.append((x, y - 1))
    for idx in range(w * h):
        if filled[idx]:
            rgba[idx * 4 + 3] = 0
    return rgba


def recolor(rgba, w, h, box, rgb, max_lum=INK_MAX, min_lum=0):
    x, y, cw, ch = box
    x = max(0, min(x, w - 1))
    y = max(0, min(y, h - 1))
    cw = max(0, min(cw, w - x))
    ch = max(0, min(ch, h - y))
    r0, g0, b0 = rgb
    count = 0
    for j in range(ch):
        base = ((y + j) * w + x) * 4
        for i in range(cw):
            p = base + i * 4
            if rgba[p + 3] == 0:
                continue
            L = lum(rgba[p], rgba[p + 1], rgba[p + 2])
            if min_lum <= L <= max_lum:
                # ハッチングの濃淡を保つため、元の明るさ比で色をallocate
                ratio = L / max_lum
                rgba[p] = min(255, int(r0 * (0.55 + 0.45 * ratio)) + (255 - r0) * 0)
                rgba[p + 1] = min(255, int(g0 * (0.55 + 0.45 * ratio)))
                rgba[p + 2] = min(255, int(b0 * (0.55 + 0.45 * ratio)))
                count += 1
    return count


def recolor_line(rgba, w, h, p1, p2, width, rgb, max_lum=INK_MAX, min_lum=0):
    """2点間の帯（幅width px）内の線画ピクセルを色置換。帽子の帯などに使う。"""
    x1, y1 = p1
    x2, y2 = p2
    dx, dy = x2 - x1, y2 - y1
    length = (dx * dx + dy * dy) ** 0.5 or 1.0
    half = max(1, width // 2)
    r0, g0, b0 = rgb
    count = 0
    xmin = max(0, int(min(x1, x2) - half - 2))
    xmax = min(w - 1, int(max(x1, x2) + half + 2))
    ymin = max(0, int(min(y1, y2) - half - 2))
    ymax = min(h - 1, int(max(y1, y2) + half + 2))
    for y in range(ymin, ymax + 1):
        for x in range(xmin, xmax + 1):
            i = (y * w + x) * 4
            if rgba[i + 3] == 0:
                continue
            t = ((x - x1) * dx + (y - y1) * dy) / (length * length)
            if t < 0 or t > 1:
                continue
            dist = abs((x - x1) * dy - (y - y1) * dx) / length
            if dist > half:
                continue
            L = lum(rgba[i], rgba[i + 1], rgba[i + 2])
            if not (min_lum <= L <= max_lum):
                continue
            ratio = L / max(max_lum, 1)
            rgba[i] = min(255, int(r0 * (0.55 + 0.45 * ratio)))
            rgba[i + 1] = min(255, int(g0 * (0.55 + 0.45 * ratio)))
            rgba[i + 2] = min(255, int(b0 * (0.55 + 0.45 * ratio)))
            count += 1
    return count


def recolor_poly(rgba, w, h, points, rgb, max_lum=INK_MAX, min_lum=0):
    """多角形内の線画ピクセルを色置換。燕尾服の裏地などに使う。"""
    xs = [p[0] for p in points]
    ys = [p[1] for p in points]
    x0, x1 = max(0, int(min(xs))), min(w - 1, int(max(xs)))
    y0, y1 = max(0, int(min(ys))), min(h - 1, int(max(ys)))
    r0, g0, b0 = rgb
    count = 0
    n = len(points)
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            inside = False
            j = n - 1
            for i in range(n):
                xi, yi = points[i]
                xj, yj = points[j]
                if (yi > y) != (yj > y):
                    if x < (xj - xi) * (y - yi) / ((yj - yi) or 1e-9) + xi:
                        inside = not inside
                j = i
            if not inside:
                continue
            p = (y * w + x) * 4
            if rgba[p + 3] == 0:
                continue
            L = lum(rgba[p], rgba[p + 1], rgba[p + 2])
            if not (min_lum <= L <= max_lum):
                continue
            ratio = L / max(max_lum, 1)
            rgba[p] = min(255, int(r0 * (0.55 + 0.45 * ratio)))
            rgba[p + 1] = min(255, int(g0 * (0.55 + 0.45 * ratio)))
            rgba[p + 2] = min(255, int(b0 * (0.55 + 0.45 * ratio)))
            count += 1
    return count


def ascii_map(rgba, w, h, box, cols=60):
    x, y, cw, ch = box
    rows = max(1, int(cols * (ch / max(1, cw)) / 2.0))
    grid = []
    for ry in range(rows):
        line = []
        for rx in range(cols):
            sx0 = x + int(cw * rx / cols)
            sx1 = max(sx0 + 1, x + int(cw * (rx + 1) / cols))
            sy0 = y + int(ch * ry / rows)
            sy1 = max(sy0 + 1, y + int(ch * (ry + 1) / rows))
            dark = total = 0
            for sy in range(sy0, min(sy1, h)):
                base = (sy * w + sx0) * 4
                for sx in range(sx0, min(sx1, w)):
                    i = base + (sx - sx0) * 4
                    total += 1
                    if lum(rgba[i], rgba[i + 1], rgba[i + 2]) < INK_MAX:
                        dark += 1
            ratio = (dark / total) if total else 0
            line.append('#' if ratio > 0.6 else ('+' if ratio > 0.3 else ('.' if ratio > 0.08 else ' ')))
        grid.append(''.join(line))
    return '\n'.join(grid)


# ---------------------------------------------------------------- commands
def cmd_info(path):
    w, h, _ = read_png(path)
    print('%s %dx%d' % (os.path.basename(path), w, h))


def cmd_ascii(path, box, cols):
    w, h, rgba = read_png(path)
    print(ascii_map(rgba, w, h, box, cols))


def cmd_build(rules_path):
    with open(rules_path, encoding='utf-8') as f:
        rules = json.load(f)
    outdir = rules['outDir']
    os.makedirs(outdir, exist_ok=True)
    report = []
    for item in rules['characters']:
        src = item['source']
        w, h, rgba = read_png(src)
        cw, ch, cropped, origin = crop(rgba, w, h, item['crop'])
        if item.get('tighten'):
            bb = ink_bbox(cropped, cw, ch)
            if bb:
                x, y, bw, bh = bb
                pad = item.get('pad', 4)
                x = max(0, x - pad)
                y = max(0, y - pad)
                bw = min(cw - x, bw + 2 * pad)
                bh = min(ch - y, bh + 2 * pad)
                cw2, ch2, cropped2, origin2 = crop(cropped, cw, ch, (x, y, bw, bh))
                cropped, cw, ch = cropped2, cw2, ch2
                origin = (origin[0] + x, origin[1] + y)
        if item.get('cutout', True):
            cutout_background(cropped, cw, ch)
        painted = []
        for rule in item.get('rules', []):
            # 規則座標は「設定シート原本」の座標（切り出し位置が変わってもrulesは不変）
            mode = rule['mode']
            color = tuple(rule['color'])
            ox, oy = origin
            if mode in ('ink', 'ink-soft', 'light'):
                b = rule['box']
                box = (b[0] - ox, b[1] - oy, b[2], b[3])
                n = recolor(cropped, cw, ch, box, color,
                            INK_MAX if mode == 'ink' else (170 if mode == 'ink-soft' else 255),
                            0 if mode != 'light' else 200)
            elif mode == 'line':
                p1 = (rule['p1'][0] - ox, rule['p1'][1] - oy)
                p2 = (rule['p2'][0] - ox, rule['p2'][1] - oy)
                n = recolor_line(cropped, cw, ch, p1, p2, rule['width'], color, INK_MAX, 0)
            elif mode == 'poly':
                pts = [(p[0] - ox, p[1] - oy) for p in rule['points']]
                n = recolor_poly(cropped, cw, ch, pts, color, INK_MAX, 0)
            else:
                n = 0
            painted.append({'rule': rule, 'pixels': n})
        out = os.path.join(outdir, item['out'])
        write_png(out, cw, ch, cropped)
        report.append({'character': item.get('name'), 'out': out, 'size': [cw, ch],
                       'origin': list(origin), 'painted': painted})
        print('%s -> %s (%dx%d) %s' % (item.get('name'), out, cw, ch,
                                       [(p['rule']['mode'], p['rule'].get('color'), p['pixels']) for p in painted]))
    with open(os.path.join(outdir, 'build-report.json'), 'w', encoding='utf-8') as f:
        json.dump(report, f, ensure_ascii=False, indent=2)


def cmd_preview(path, box, out):
    w, h, rgba = read_png(path)
    cw, ch, cropped, _ = crop(rgba, w, h, box)
    write_png(out, cw, ch, cropped)
    print('saved %s (%dx%d)' % (out, cw, ch))


def main(argv):
    if not argv:
        print(__doc__)
        return 2
    cmd = argv[0]
    args = argv[1:]
    if cmd == 'info':
        cmd_info(args[0])
    elif cmd == 'ascii':
        box = tuple(int(v) for v in args[1].split(','))
        cols = int(args[2]) if len(args) > 2 else 60
        cmd_ascii(args[0], box, cols)
    elif cmd == 'build':
        cmd_build(args[0])
    elif cmd == 'preview':
        cmd_preview(args[0], tuple(int(v) for v in args[1].split(',')), args[2])
    else:
        print(__doc__)
        return 2
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
