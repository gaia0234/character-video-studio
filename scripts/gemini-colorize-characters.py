#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Gemini画像モデルで設定シート由来の線画を指定色へ着色する（2026-10-21 本人許可の限定作業）。

許可範囲: エルダーチャンネルの新キャラ3体の線画（Transfer/キャラ参考由来の切出し画像）に対し、
         帽子の下のリボン帯と蝶ネクタイのみを各キャラ指定色に着色する。生成は3回まで。
禁止: キーの表示・他用途の生成・上限を超える再試行・他キャラ/他画像の処理。
使い方: python3 gemini-colorize-characters.py <モデル> <着色仕様JSON>
仕様JSON: [{"key":"homer","source":"...png","color":"#C8322C","out":"...png"}, ...]
"""
import base64
import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT = '/home/ds-work/projects/character-video-studio'
API = 'https://generativelanguage.googleapis.com'
PROMPT = (
    'You are editing a black-ink line drawing of a Victorian-style cartoon gentleman. '
    'Keep the character EXACTLY as drawn: same pose, same proportions, same line art, same face, '
    'same hat, same props. Do not redraw, restyle, add or remove anything. '
    'Change ONLY these two areas to the requested color: '
    '(1) the ribbon band on the hat, the strip sitting just above the hat brim (the brim itself stays black); '
    '(2) the small bow tie at the collar. '
    'Everything else stays black ink on a plain white background. '
    'Flat fill, no gradients, no shadow. Output the same image on a white background.'
)


def load_key():
    key = (os.environ.get('GEMINI_API_KEY') or '').strip()
    src = 'env'
    if not key:
        src = '.env'
        try:
            raw = Path(ROOT, '.env').read_bytes()
        except OSError as e:
            return None, src, '.env読取失敗 errno=%s' % e.errno
        for line in raw.split(b'\n'):
            s = line.decode('utf-8', 'ignore').strip()
            if s.startswith('GEMINI_API_KEY') and '=' in s:
                key = s.split('=', 1)[1].strip().strip('"').strip("'").strip()
                break
    if not key:
        return None, src, 'keyなし'
    return key, src, None


def post(model, key, payload, timeout=300):
    path = '/v1beta/models/%s:generateContent' % model
    req = urllib.request.Request(API + path, method='POST')
    req.add_header('x-goog-api-key', key)
    req.add_header('content-type', 'application/json')
    body = json.dumps(payload).encode('utf-8')
    req.data = body
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return json.loads(r.read().decode('utf-8')), None, r.status
    except urllib.error.HTTPError as e:
        detail = ''
        try:
            err = (json.loads(e.read()[:600].decode('utf-8', 'ignore')).get('error') or {})
            detail = 'code=%s status=%s msg=%s' % (err.get('code'), err.get('status'), str(err.get('message'))[:160])
        except Exception:
            detail = 'body-unparsed'
        return None, 'http status=%d %s' % (e.code, detail), e.code
    except Exception as e:
        return None, 'error(%s)' % str(e)[:120], -1


def extract_image(data):
    for cand in (data.get('candidates') or []):
        content = cand.get('content') or {}
        for part in (content.get('parts') or []):
            inline = part.get('inlineData') or part.get('inline_data')
            if inline and inline.get('data'):
                return inline.get('mimeType') or inline.get('mime_type') or 'image/png', inline['data']
    return None, None


def main(argv):
    if len(argv) < 2:
        print(__doc__)
        return 2
    model = argv[0]
    spec = json.loads(Path(argv[1]).read_text(encoding='utf-8'))
    key, keysrc, kerr = load_key()
    if not key:
        print('BLOCKED (key): %s' % kerr)
        return 2
    print('model=%s keySource=%s items=%d' % (model, keysrc, len(spec)))
    for item in spec:
        src = Path(item['source'])
        dst = Path(item['out'])
        if dst.exists():
            print('%s: skip (existing)' % dst.name)
            continue
        b64 = base64.b64encode(src.read_bytes()).decode('ascii')
        payload = {
            'contents': [{'role': 'user', 'parts': [
                {'inline_data': {'mime_type': 'image/png', 'data': b64}},
                {'text': PROMPT + ' Use exactly this color: %s' % item['color']},
            ]}],
            'generationConfig': {'responseModalities': ['TEXT', 'IMAGE']},
        }
        data, err, status = post(model, key, payload)
        if err:
            print('%s: FAILED %s' % (dst.name, err))
            continue
        mime, img = extract_image(data)
        if not img:
            print('%s: no image in response' % dst.name)
            continue
        raw = base64.b64decode(img)
        dst.parent.mkdir(parents=True, exist_ok=True)
        dst.write_bytes(raw)
        print('%s: saved %s bytes (mime=%s)' % (dst.name, len(raw), mime))
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
