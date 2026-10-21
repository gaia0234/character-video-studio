#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""エルダーチャンネル 新キャラ3体の画像生成（Gemini image / 2026-10-21 本人指示「キャラを生成する」）。

担当工程: scripts/generate-elder-characters-gemini.py と public/assets/drafts/elder-characters-2026-10-21/
          および output/elder-channel-characters-2026-10-21/ のみ。
仕様: Python標準ライブラリのみ。GET /v1beta/models(1回) → POST /v1beta/models/{model}:generateContent
      （1枚=1POST・同一呼び出しの自動リトライなし。400時はフィールド表記差の代替形を1回だけ試す）。
キー: GEMINI_API_KEY環境変数か 案子逸失/.env の同名値をメモリのみで読む。URL/引数/出力へキー値を書かない。
禁止: キー表示・外部送信（Gemini API以外の送信なし）・既存ファイルの上書き（同名があればskip）・自動モデル切替の連鎖。
"""
import base64
import hashlib
import json
import os
import struct
import sys
import urllib.error
import urllib.request

ROOT = '/home/ds-work/projects/character-video-studio'
OUTDIR = os.path.join(ROOT, 'output/elder-channel-characters-2026-10-21')
DEST = os.path.join(ROOT, 'public/assets/drafts/elder-characters-2026-10-21')
API = 'https://generativelanguage.googleapis.com'
MODEL = 'gemini-3-pro-image'
FALLBACK_MODEL = 'gemini-3.1-flash-image'
RECORD = os.path.join(ROOT, 'sources/elder-channel-characters-imagegen-2026-10-21.json')
PLACEHOLDERS = {'gemini_api_key', 'your_api_key', 'your_key_', 'xxx', 'unset', 'none', 'test', 'sample'}

STYLE = (
    '白黒の手描きペン画。細い一定幅の線で輪郭を描き、陰影はハッチング（線描の網掛け）で表す。'
    '配色は白・黒・グレーのみで、差し色1色（部位を個別指定）だけを使う。'
    '背景は純白。文字・透かし・署名・ロゴは入れない。'
    '線は太く均一にし、顔と目は高齢者にも読み取れるように大きめに描く。'
)

CHARACTERS = [
    {
        'key': 'homer',
        'name': 'ホーマー',
        'role': '日本称賛役',
        'aspect': '3:4',
        'desc': (
            '1体だけ、全身、正面、立ち姿。明るく元気な紳士。'
            '卵型の顔（頬が一番広くなる輪郭）、にっこりと笑う口元、目尻が少し下がった年上の優しさ。'
            '背筋が伸びた姿勢。燕尾服、胸の蝶ネクタイは赤、燕尾服の裏地も赤。'
            '白いシルクハットで、帽子の帯は赤。片手に開いた傘を持ち、もう片手を軽く上げて挨拶する。'
        ),
    },
    {
        'key': 'judd',
        'name': 'ジャッド',
        'role': '日本批判役',
        'aspect': '3:4',
        'desc': (
            '1体だけ、全身、正面、立ち姿。くたびれた紳士。'
            '丸みのある三角形の顔（上あごに向かって細くなる輪郭）、わずかにしかめた悲嘆の表情、目の下にわずかな疲れの影。'
            '少し猫背で前かがみ。燕尾服、蝶ネクタイは青、燕尾服の裏地も青。シルクハット。右手に杖を握る。'
        ),
    },
    {
        'key': 'kent',
        'name': 'ケント',
        'role': '検証役',
        'aspect': '3:4',
        'desc': (
            '1体だけ、全身、正面、立ち姿。探究心のある紳士。'
            '角丸四角の顔（四隅が丸い四角輪郭）、眉を上げて「ほんとうか？」と問いかける真剣な表情。'
            '燕尾服、蝶ネクタイは緑、燕尾服の裏地も緑。山高帽子。片手に虫眼鏡、もう片手に手帳を持つ。'
        ),
    },
]

SET = {
    'key': 'set',
    'name': '3体セット',
    'role': '整合確認用',
    'aspect': '16:9',
    'desc': (
        '3体並べて、全身、正面、立ち姿。同じ大きさ・同じ線の太さ・同じスタイルで描く。'
        '左：赤の差し色の卵型顔で笑う、傘を持った紳士。'
        '中央：青の差し色の三角顔で猫背の、杖を持った紳士。'
        '右：緑の差し色の角丸四角顔で虫眼鏡と手帳を持った紳士。'
    ),
}


def load_key():
    key = (os.environ.get('GEMINI_API_KEY') or '').strip()
    src = 'env'
    if not key:
        src = '.env'
        try:
            with open(os.path.join(ROOT, '.env'), 'rb') as f:
                raw = f.read()
        except OSError as e:
            return None, src, '.env読取失敗 errno=%s' % e.errno
        for line in raw.split(b'\n'):
            s = line.decode('utf-8', 'ignore').strip()
            if s.startswith('GEMINI_API_KEY') and '=' in s:
                key = s.split('=', 1)[1].strip().strip('"').strip("'").strip()
                break
    if key.lower() in PLACEHOLDERS:
        return None, src, 'keyがplaceholder相当(%s)' % src
    if key:
        return key, src, None
    return None, src, 'keyが見つからない/空(%s)' % src


def http_json(path, method, key, payload=None, timeout=300):
    req = urllib.request.Request(API + path, method=method)
    req.add_header('x-goog-api-key', key)
    body = None
    if payload is not None:
        body = json.dumps(payload).encode('utf-8')
        req.add_header('content-type', 'application/json')
        req.add_header('content-length', str(len(body)))
    try:
        with urllib.request.urlopen(req, timeout=timeout, data=body) as r:
            return json.loads(r.read().decode('utf-8')), None, r.status
    except urllib.error.HTTPError as e:
        # エラー本文はcode/message/statusのみ要約する（ヘッダ・キーは読まない・出さない）
        detail = ''
        try:
            raw = e.read()[:600].decode('utf-8', 'ignore')
            err = (json.loads(raw).get('error') or {})
            detail = 'code=%s status=%s msg=%s' % (err.get('code'), err.get('status'),
                                                   str(err.get('message'))[:200])
        except Exception:
            detail = 'body-unparsed'
        return None, 'http status=%d %s' % (e.code, detail), e.code
    except urllib.error.URLError as e:
        return None, 'urlerror(%s)' % str(getattr(e, 'reason', e))[:120], -1
    except Exception as e:
        return None, 'error(%s)' % str(e)[:120], -1


def list_models(key):
    names = set()
    token = None
    for _ in range(20):
        path = '/v1beta/models?pageSize=200' + ('' if token is None else '&pageToken=' + token)
        data, err, _ = http_json(path, 'GET', key, timeout=60)
        if err:
            return names, err
        for m in data.get('models', []):
            n = (m.get('name') or '').replace('models/', '')
            if n:
                names.add(n)
        token = data.get('nextPageToken')
        if not token:
            break
    return names, None


def png_size(path):
    try:
        with open(path, 'rb') as f:
            head = f.read(33)
        if head[:8] != b'\x89PNG\r\n\x1a\n':
            return None
        w, h = struct.unpack('>II', head[16:24])
        return w, h
    except OSError:
        return None


def build_payload(prompt, aspect, ref_b64=None):
    parts = []
    if ref_b64:
        parts.append({'inline_data': {'mime_type': 'image/png', 'data': ref_b64}})
        parts.append({'text': prompt})
    else:
        parts.append({'text': prompt})
    return {
        'contents': [{'role': 'user', 'parts': parts}],
        'generationConfig': {
            'responseModalities': ['TEXT', 'IMAGE'],
            'imageConfig': {'aspectRatio': aspect},
        },
    }


def build_payload_snake(prompt, aspect, ref_b64=None):
    payload = build_payload(prompt, aspect, ref_b64)
    payload['generation_config'] = payload.pop('generationConfig')
    payload['generation_config']['response_modalities'] = payload['generation_config'].pop('responseModalities')
    payload['generation_config']['image_config'] = payload['generation_config'].pop('imageConfig')
    payload['generation_config']['image_config']['aspect_ratio'] = payload['generation_config']['image_config'].pop('aspectRatio')
    return payload


def extract_image(data):
    texts = []
    for cand in (data.get('candidates') or []):
        content = cand.get('content') or {}
        for part in (content.get('parts') or []):
            inline = part.get('inlineData') or part.get('inline_data')
            if inline and inline.get('data'):
                return inline.get('mimeType') or inline.get('mime_type') or 'image/png', inline['data']
            if part.get('text'):
                texts.append(part['text'])
    return None, None, texts


def generate_one(key, model, prompt, aspect, ref_b64=None, tag='item'):
    """1回だけPOST。400時はフィールド表記差の代替形を1回だけ試す（同一呼び出しの自動リトライではない）。"""
    attempts = []
    for shape, builder in (('camel', build_payload), ('snake', build_payload_snake)):
        payload = builder(prompt, aspect, ref_b64)
        reqfile = os.path.join(OUTDIR, 'request-%s-%s.json' % (tag, shape))
        with open(reqfile, 'w', encoding='utf-8') as f:
            json.dump(payload, f, ensure_ascii=False, indent=2)
        data, err, status = http_json('/v1beta/models/%s:generateContent' % model, 'POST', key,
                                      payload=payload, timeout=300)
        attempts.append({'shape': shape, 'httpStatus': status, 'error': err,
                         'requestFile': os.path.relpath(reqfile, ROOT)})
        if err:
            if status == 400 and shape == 'camel':
                continue
            return None, attempts, status
        mime, b64, texts = extract_image(data)
        if not b64:
            attempts[-1]['noImage'] = True
            attempts[-1]['textReply'] = (texts or [''])[0][:200]
            if status == 200 and shape == 'camel':
                continue
            return None, attempts, status
        return {'mime': mime, 'b64': b64, 'texts': texts}, attempts, status
    return None, attempts, None


def save_png(b64, path):
    raw = base64.b64decode(b64)
    with open(path, 'wb') as f:
        f.write(raw)
    return len(raw), hashlib.sha256(raw).hexdigest()


def main():
    os.makedirs(OUTDIR, exist_ok=True)
    os.makedirs(DEST, exist_ok=True)
    model_override = None
    only = None
    argv = sys.argv[1:]
    i = 0
    while i < len(argv):
        if argv[i] == '--model' and i + 1 < len(argv):
            model_override = argv[i + 1]
            i += 2
        elif argv[i] == '--only' and i + 1 < len(argv):
            only = argv[i + 1]
            i += 2
        else:
            i += 1
    key, keysrc, kerr = load_key()
    result = {
        'task': 'エルダーチャンネル 新キャラ3体の画像生成（Gemini image）',
        'date': '2026-10-21',
        'approval': '本人指示「音声はGemini TTSで作成・今は保留。キャラを生成する」',
        'model': MODEL, 'fallbackModel': FALLBACK_MODEL, 'keySource': keysrc,
        'status': 'ok', 'items': [], 'failures': [], 'unverified': [], 'leftoverTemps': [],
    }
    if kerr:
        result['status'] = 'blocked_key'
        result['blockReason'] = kerr
        with open(os.path.join(OUTDIR, 'result.json'), 'w', encoding='utf-8') as f:
            json.dump(result, f, ensure_ascii=False, indent=2)
        print('BLOCKED (key): %s' % kerr)
        return 2

    names, merr = list_models(key)
    if merr:
        result['status'] = 'blocked_models'
        result['blockReason'] = merr
        with open(os.path.join(OUTDIR, 'result.json'), 'w', encoding='utf-8') as f:
            json.dump(result, f, ensure_ascii=False, indent=2)
        print('BLOCKED (models): %s' % merr)
        return 3
    result['modelAvailable'] = MODEL in names
    result['fallbackAvailable'] = FALLBACK_MODEL in names
    if MODEL not in names and FALLBACK_MODEL not in names:
        result['status'] = 'blocked_model_missing'
        result['blockReason'] = 'neither %s nor %s in models list' % (MODEL, FALLBACK_MODEL)
        with open(os.path.join(OUTDIR, 'result.json'), 'w', encoding='utf-8') as f:
            json.dump(result, f, ensure_ascii=False, indent=2)
        print('BLOCKED: image model not available')
        return 3
    model = model_override or (MODEL if MODEL in names else FALLBACK_MODEL)
    result['modelUsed'] = model
    result['modelOverride'] = model_override
    if model not in names:
        result['status'] = 'blocked_model_missing'
        result['blockReason'] = '%s not in models list' % model
        with open(os.path.join(OUTDIR, 'result.json'), 'w', encoding='utf-8') as f:
            json.dump(result, f, ensure_ascii=False, indent=2)
        print('BLOCKED: model not available')
        return 3
    if model != MODEL and not model_override:
        result['notes'] = ['%s が使えないため %s を使用' % (MODEL, FALLBACK_MODEL)]

    # ①3体セット（整合確認・以降の出 Individuals の参照画像）
    set_item = SET
    set_prompt = (STYLE + set_item['desc'] +
                  '差し色はそれぞれ 赤い蝶ネクタイと赤い帽子のリボンと赤い裏地／青い蝶ネクタイと青い帽子のリボンと青い裏地／'
                  '緑の蝶ネクタイと緑の帽子のリボンと緑の裏地 の3色だけを使う。')
    set_path = os.path.join(DEST, 'set-v1.png')
    if only and only != 'set':
        pass
    elif os.path.exists(set_path):
        result['items'].append({'key': 'set', 'file': os.path.relpath(set_path, ROOT),
                                 'status': 'skipped_existing'})
    else:
        got, attempts, status = generate_one(key, model, set_prompt, set_item['aspect'], None, 'set')
        result['setAttempts'] = attempts
        if got:
            size, sha = save_png(got['b64'], set_path)
            result['items'].append({'key': 'set', 'name': set_item['name'], 'model': model,
                                    'aspect': set_item['aspect'], 'file': os.path.relpath(set_path, ROOT),
                                    'bytes': size, 'sha256': sha, 'pngSize': png_size(set_path),
                                    'promptSha256': hashlib.sha256(set_prompt.encode('utf-8')).hexdigest(),
                                    'status': 'ok'})
        else:
            result['failures'].append({'key': 'set', 'attempts': attempts, 'httpStatus': status})
            result['status'] = 'partial'

    ref_b64 = None
    if os.path.exists(set_path):
        with open(set_path, 'rb') as f:
            ref_b64 = base64.b64encode(f.read()).decode('ascii')

    # ②各キャラクターの立ち絵（セットを参照画像に）
    for item in [CHARACTERS[0], CHARACTERS[1], CHARACTERS[2]]:
        if only and only != item['key']:
            continue
        path = os.path.join(DEST, '%s-v1.png' % item['key'])
        if os.path.exists(path):
            result['items'].append({'key': item['key'], 'file': os.path.relpath(path, ROOT),
                                     'status': 'skipped_existing'})
            continue
        prompt = STYLE + item['desc']
        if ref_b64:
            prompt = ('添付の参照画像に描かれた3体のうち「%s」（%s）の同一人物として描く。'
                      '顔型・衣装・差し色・線画スタイルは参照画像と厳密に一致させ、構図だけ変更する。'
                      % (item['name'], item['role'])) + prompt
        got, attempts, status = generate_one(key, model, prompt, item['aspect'], ref_b64, item['key'])
        result.setdefault('attempts', {})[item['key']] = attempts
        if got:
            size, sha = save_png(got['b64'], path)
            result['items'].append({'key': item['key'], 'name': item['name'], 'role': item['role'],
                                    'model': model, 'aspect': item['aspect'],
                                    'file': os.path.relpath(path, ROOT), 'bytes': size, 'sha256': sha,
                                    'pngSize': png_size(path),
                                    'promptSha256': hashlib.sha256(prompt.encode('utf-8')).hexdigest(),
                                    'usedReferenceImage': bool(ref_b64), 'status': 'ok'})
        else:
            result['failures'].append({'key': item['key'], 'attempts': attempts, 'httpStatus': status})
            result['status'] = 'partial'

    result['unverified'] = [
        '生成画像の造形・配色・顔型の一致は本人目視待ち（自動判定はしていない）',
        '透明背景かどうかは未検証。必要なら既存の切抜き処理で背景除去する',
        'usage/実請求額・無料枠の適用はAPI応答のusageのみ',
    ]
    with open(os.path.join(OUTDIR, 'result.json'), 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    with open(RECORD, 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    for item in result['items']:
        print('%s: %s %s' % (item.get('key'), item.get('status'), item.get('pngSize', '')))
    print('status=%s failures=%d' % (result['status'], len(result['failures'])))
    return 0 if result['status'] == 'ok' else 1


if __name__ == '__main__':
    sys.exit(main())
