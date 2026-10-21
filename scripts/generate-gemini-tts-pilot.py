#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Gemini TTS初期試作（1候補/1回のみ・2026-10-21本人承認の限定作業）。

担当工程: scripts/generate-gemini-tts-pilot.py＋output/gemini-tts-pilot-2026-10-21/ 配下のみ編集。
仕様: Python標準ライブラリのみ。GET /v1beta/models(1取得) → POST /v1beta/interactions(1回・retryなし)。
キーはGEMINI_API_KEY環境変数か案子逸失/.envの同名値のみメモリ読取。URL/引数/出力へキー値を書かない。
例外時もstatus/codeだけ報告。レスポンスbase64/headersをログに出さない。
モデルが無い場合は別modelへ切替しない（blockedで停止）。
"""
import array, base64, hashlib, json, math, os, sys, urllib.error, urllib.request, wave

ROOT = '/home/ds-work/projects/character-video-studio'
OUTDIR = os.path.join(ROOT, 'output/gemini-tts-pilot-2026-10-21')
BASELINE = os.path.join(OUTDIR, 'baseline-voicevox-2-6-b1.wav')
OUTWAV = os.path.join(OUTDIR, 'gemini-charon-2-6-b1.wav')
REQPATH = os.path.join(OUTDIR, 'request.json')
RESULT = os.path.join(OUTDIR, 'result.json')
VOICEJSON = os.path.join(ROOT, 'src/data/longform/toyota01-v10-voice.json')
API = 'https://generativelanguage.googleapis.com'
TARGET = 'gemini-3.8-flash-tts'
BEAT_ID = '2-6-b1'
PLACEHOLDERS = {'gemini_api_key', 'your_api_key', 'your_key_', 'xxx', 'unset', 'none', 'test', 'sample'}


def load_key():
    """キーをメモリのみで取得する。表示・ログは一切しない。"""
    key = (os.environ.get('GEMINI_API_KEY') or '').strip()
    src = 'env'
    if not key:
        src = '.env'
        try:
            with open(os.path.join(ROOT, '.env'), 'rb') as f:
                raw = f.read()
        except OSError as e:
            return None, '', '.env読取失敗 errno=%s' % e.errno
        for line in raw.split(b'\n'):
            s = line.decode('utf-8', 'ignore').strip()
            if s.startswith('GEMINI_API_KEY') and '=' in s:
                v = s.split('=', 1)[1].strip().strip('"').strip("'").strip()
                key = v
                break
    if key.lower() in PLACEHOLDERS:
        return None, src, 'keyがplaceholder相当(%s)' % src
    if key:
        return key, src, None
    return None, src, 'keyが見つからない/空(%s)' % src


def http_json(path, method, key, payload=None, timeout=30):
    req = urllib.request.Request(API + path, method=method)
    req.add_header('x-goog-api-key', key)
    if payload is not None:
        req.add_header('content-type', 'application/json')
        req.add_header('content-length', str(len(payload)))
        req.data = payload
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return json.loads(r.read().decode('utf-8')), None, r.status
    except urllib.error.HTTPError as e:
        return None, 'http status=%d code=%d' % (e.code, e.code), e.code
    except urllib.error.URLError as e:
        reason = getattr(e, 'reason', None) or e
        return None, 'urlerror(%s)' % str(reason)[:120], -1


def list_models_safely(key):
    """対象model有無とTTS model名だけを返す（生JSON/キー一覧は出力しない）。"""
    names = []
    token = None
    fails = []
    for _ in range(20):
        path = '/v1beta/models?pageSize=200' + (('' if token is None else '&pageToken=' + token))
        data, err, status = http_json(path, 'GET', key)
        if err:
            fails.append('models-get %s' % err)
            return names, False, fails
        for m in data.get('models', []):
            n = (m.get('name') or '').replace('models/', '')
            if n:
                names.append(n)
        token = data.get('nextPageToken')
        if not token:
            break
    tts = [n for n in names if 'tts' in n.lower()]
    return names, True, fails


def wave_stats(path):
    with wave.open(path, 'rb') as w:
        ch = w.getnchannels()
        sw = w.getsampwidth()
        fr = w.getframerate()
        frames = w.getnframes()
        raw = w.readframes(frames)
    a = array.array('h')
    if sw == 2:
        a.frombytes(raw)
    peak = 0
    ssq = 0
    if len(a):
        mx = max(a)
        mn = min(a)
        peak = mx if mx > -mn else -mn
        ssq = sum(v * v for v in a)
    n = len(a)
    rms = math.sqrt(ssq / n) if n else 0.0
    return {
        'format': 'RIFF/WAVE(PCM16)',
        'channels': ch, 'sampleWidthBytes': sw, 'sampleRateHz': fr, 'frames': frames,
        'seconds': round(frames / fr, 4) if fr else None,
        'peakDBFS': round(20 * math.log10(peak / 32768.0), 2) if peak else None,
        'rmsDBFS': round(20 * math.log10(rms / 32768.0), 2) if n else None,
        'nonSilent': peak > 0,
    }


def find_beat(root, bid):
    if isinstance(root, dict):
        if root.get('id') == bid:
            return root
        for v in root.values():
            r = find_beat(v, bid)
            if r is not None:
                return r
    elif isinstance(root, list):
        for v in root:
            r = find_beat(v, bid)
            if r is not None:
                return r
    return None


def write_result(res):
    with open(RESULT, 'w', encoding='utf-8') as f:
        json.dump(res, f, ensure_ascii=False, indent=2)


def main():
    if os.path.exists(RESULT):
        print('ABORTED: result.json already exists (no overwrite)')
        return 2
    if os.path.exists(OUTWAV):
        print('ABORTED: %s already exists (no overwrite)' % os.path.basename(OUTWAV))
        return 2

    failures = []
    res = {
        'task': 'Gemini TTS pilot 1 Candidate/1 Generation (2-6-b1 male narration)',
        'date': '2026-10-21',
        'requestFile': 'output/gemini-tts-pilot-2026-10-21/request.json (sent as-is)',
        'targetModel': TARGET, 'voice': None, 'status': 'ok',
        'unverified': [], 'leftoverTemps': [], 'notes': [],  # filled below
    }

    # キー（メモリのみ・表示禁止）
    key, keysrc, kerr = load_key()
    res['keySource'] = keysrc
    if kerr:
        res['status'] = 'blocked_key'
        res['blockReason'] = kerr
        write_result(res)
        print('BLOCKED (key): %s' % kerr)
        return 2

    # request.jsonはそのままbytesで送る（再文言化しない）
    try:
        with open(REQPATH, 'rb') as f:
            payload = f.read()
        req = json.loads(payload.decode('utf-8'))
    except Exception as e:
        res['status'] = 'blocked_request_parse'
        res['blockReason'] = 'request.json parse fail: %s' % str(e)[:120]
        write_result(res)
        print('BLOCKED: request.json parse')
        return 2
    res['voice'] = (((req.get('generation_config') or {}).get('speech_config') or [{}])[0] or {}).get('voice')
    res['targetModel'] = req.get('model')

    # 台詞照合: request.jsonのtext vs voice JSONのbeat text（必要項目のみ・本文化出手なし）
    texts = []
    for item in req.get('input', []):
        for c in (item.get('content') or []):
            if c.get('type') == 'text':
                texts.append(c.get('text'))
    inText = texts[0] if texts else ''
    res['inputTextLen'] = len(inText)
    res['inputTextSha256-16'] = hashlib.sha256(inText.encode('utf-8')).hexdigest()[:16]
    try:
        with open(VOICEJSON, 'rb') as f:
            vj = json.loads(f.read().decode('utf-8'))
        beat = find_beat(vj, BEAT_ID)
        if beat is not None:
            res['voiceJsonBeatTextLen'] = len(beat.get('text') or '')
            res['textMatchesVoiceJson_2-6-b1'] = (beat.get('text') == inText)
            res['baselineSecondsExpected'] = ((beat.get('audio') or {}).get('seconds'))
        else:
            res['textMatchesVoiceJson_2-6-b1'] = None
            res['notes'].append('voice JSON beat not found')
    except Exception as e:
        res['textMatchesVoiceJson_2-6-b1'] = None
        res['notes'].append('voice JSON compare skipped: %s' % str(e)[:120])

    # ①モデル一覧（1取得系列・ページングは必要最小限）
    names, paginated_ok, modfails = list_models_safely(key)
    failures.extend(modfails)
    tts = [n for n in names if 'tts' in n.lower()]
    found_target = TARGET in names
    res['modelsCheck'] = {'targetFound': found_target, 'ttsModelNames': sorted(tts)[:10], 'totalKnown': len(names)}
    if not found_target:
        res['status'] = 'blocked_model_missing'
        res['blockReason'] = 'models list does not contain %s ( Switching to another model is prohibited )' % TARGET
        write_result(res)
        print('BLOCKED: %s not in models list' % TARGET)
        return 3

    # ②POST 1回のみ（auto retryなし・timeout180s）
    data, err, status = http_json('/v1beta/interactions', 'POST', key, payload=payload, timeout=180)
    res['postHttpStatus'] = status
    if err:
        res['status'] = 'error_post'
        res['postError'] = err   # status/codeのみ（headers/body/キーは出さない）
        res['unverified'].append('generation was not completed (no retry on HTTP error·reported back to Main on the error type)')
        write_result(res)
        print('POST ERROR: %s' % err)
        return 3

    res['responseId'] = str(data.get('id'))[:80]
    res['responseModel'] = data.get('model')
    u = data.get('usage') or data.get('usageMetadata') or {}
    if isinstance(u, dict):
        res['usage'] = {k: v for k, v in u.items() if isinstance(v, (int, float, str))}

    # ③抽出: steps[]→type=model_output→content[]→type=audio の最後のdata（base64）
    b64 = None
    mime = None
    for step in (data.get('steps') or []):
        if step.get('type') != 'model_output':
            continue
        for citem in (step.get('content') or []):
            if citem.get('type') == 'audio' and citem.get('data'):
                b64 = citem['data']
                mime = citem.get('mime_type') or citem.get('mimeType')
    if not b64:
        res['status'] = 'error_shape'
        res['blockReason'] = 'no audio data found in response steps'
        res['responseTopLevelKeys'] = sorted(data.keys())
        write_result(res)
        print('ERROR: response shape (no audio data)')
        return 3

    audio = base64.b64decode(b64)
    if not (audio[:4] == b'RIFF' and audio[8:12] == b'WAVE'):
        res['status'] = 'error_format'
        res['blockReason'] = 'decoded audio is not RIFF/WAVE'
        res['audioBytesPrefixOk'] = bool(audio[:4] == b'RIFF')
        write_result(res)
        print('ERROR: not RIFF/WAVE')
        return 3

    with open(OUTWAV, 'wb') as f:
        f.write(audio)
    res['audioSummary'] = {
        'mime': mime, 'bytes': len(audio),
        'sha256': hashlib.sha256(audio).hexdigest(),
        'file': 'output/gemini-tts-pilot-2026-10-21/gemini-charon-2-6-b1.wav',
    }

    # ④検証: 標準wave/array（形式・実尺・非無音・peak/rms）と既存baselineとの差
    gen_stats = wave_stats(OUTWAV)
    res['generated'] = gen_stats
    res['baseline'] = wave_stats(BASELINE)
    if res['baseline'].get('seconds') and gen_stats.get('seconds'):
        res['durationDeltaSeconds'] = round(gen_stats['seconds'] - res['baseline']['seconds'], 4)
    res['failureCount'] = len(failures)
    res['failures'] = failures
    res['unverified'].extend([
        '音質の聴感・正しい全文読み・苔自然さは本人確認待ち（自動値では断定しない）',
        'billing: 本人プロジェクトの実請求額/無料枠の適用はusageのみから部分記録',
    ])
    res['leftoverTemps'] = []  # 本実行は中間一時物を作らない
    write_result(res)
    print('RESULT: status=%s wavBytes=%d sha16=%s' % (res['status'], len(audio), res['audioSummary']['sha256'][:16]))
    return 0


if __name__ == '__main__':
    try:
        sys.exit(main())
    except Exception as e:
        try:
            res = {
                'status': 'error_internal',
                'error': str(e)[:200],
                'date': '2026-10-21',
            }
            if not os.path.exists(RESULT):
                with open(RESULT, 'w', encoding='utf-8') as f:
                    json.dump(res, f, ensure_ascii=False, indent=2)
        except Exception:
            pass
        print('INTERNAL ERROR: %s' % str(e)[:160])
        sys.exit(1)
