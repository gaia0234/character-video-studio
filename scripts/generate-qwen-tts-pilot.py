#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Qwen TTS限定試聴（1候補/1回のみ・2026-10-21本人承認の限定作業）。

担当工程: scripts/generate-qwen-tts-pilot.py ＋ output/qwen-tts-pilot-2026-10-21-resume1/ 配下のみ編集。
仕様: Python標準ライブラリのみ。固定request.jsonを先に保存し、POSTは1回のみ（auto retryなし）。
キーはDASHSCOPE_API_KEY環境変数か案子.envの同名値のみメモリ読取。APIキー/署名URL/生応答/例外URLは
ログ・result.jsonのいずれにも残さない（例外時はstatus/code・例外種別のurboのみ記録）。
別region/別voice/別modelへの再試行・2回目生成は行わない。
"""
import array, base64, hashlib, io, json, math, os, sys, urllib.error, urllib.parse, urllib.request, wave

ROOT = '/home/ds-work/projects/character-video-studio'
OUTDIR = os.path.join(ROOT, 'output/qwen-tts-pilot-2026-10-21-resume1')
REQPATH = os.path.join(OUTDIR, 'request.json')
RESULT = os.path.join(OUTDIR, 'result.json')
OUTWAV = os.path.join(OUTDIR, 'qwen-eldric-sage-2-6-b1.wav')
VOICEJSON = os.path.join(ROOT, 'src/data/longform/toyota01-v10-voice.json')
GEMREQ = os.path.join(ROOT, 'output/gemini-tts-pilot-2026-10-21/request.json')
GEMRESULT = os.path.join(ROOT, 'output/gemini-tts-pilot-2026-10-21/result.json')
ENDPOINT = 'https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation'
ENDPOINT_HOST = 'dashscope-intl.aliyuncs.com'
MODEL = 'qwen3-tts-flash'
VOICE = 'Eldric Sage'
LANGUAGE = 'Japanese'
BEAT_ID = '2-6-b1'
ALLOWED_AUDIO_HOST_SUFFIX = ('aliyuncs.com',)
PLACEHOLDERS = {'dashscope_api_key', 'your_api_key', 'your_key_', 'xxx', 'unset', 'none', 'test', 'sample'}


def load_key():
    """DASHSCOPE_API_KEYをメモリのみで取得（表示・記録しない）。"""
    key = (os.environ.get('DASHSCOPE_API_KEY') or '').strip()
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
            if s.startswith('DASHSCOPE_API_KEY') and '=' in s:
                key = s.split('=', 1)[1].strip().strip('"').strip("'").strip()
                break
    if key.lower() in PLACEHOLDERS:
        return None, src, 'keyがplaceholder相当(%s)' % src
    if key:
        return key, src, None
    return None, src, 'keyが見つからない/空(%s)' % src


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


def wave_stats(path):
    with wave.open(path, 'rb') as w:
        ch = w.getnchannels()
        sw = w.getsampwidth()
        fr = w.getframerate()
        declared_frames = w.getnframes()
        raw = w.readframes(declared_frames)
        frames = len(raw) // (ch * sw)
    a = array.array('h')
    if sw == 2:
        a.frombytes(raw)
    peak = 0
    ssq = 0
    n = len(a)
    if n:
        mx = max(a)
        mn = min(a)
        peak = mx if mx > -mn else -mn
        ssq = sum(v * v for v in a)
    rms = math.sqrt(ssq / n) if n else 0.0
    return {
        'format': 'RIFF/WAVE(PCM16)',
        'channels': ch, 'sampleWidthBytes': sw, 'sampleRateHz': fr, 'frames': frames,
        'seconds': round(frames / fr, 4) if fr else None,
        'peakDBFS': round(20 * math.log10(peak / 32768.0), 2) if peak else None,
        'rmsDBFS': round(20 * math.log10(rms / 32768.0), 2) if n else None,
        'nonSilent': peak > 0,
    }


def write_result(res):
    with open(RESULT, 'w', encoding='utf-8') as f:
        json.dump(res, f, ensure_ascii=False, indent=2)


def normalize_wave_header(audio):
    """APIの不定長RIFFヘッダーを実PCM量で確定する。サンプルは変更しない。"""
    with wave.open(io.BytesIO(audio), 'rb') as w:
        params = w.getparams()
        pcm = w.readframes(w.getnframes())
    if params.sampwidth != 2 or params.comptype != 'NONE' or len(pcm) % (params.nchannels * params.sampwidth):
        raise ValueError('unsupported or incomplete PCM')
    target = io.BytesIO()
    with wave.open(target, 'wb') as w:
        w.setparams(params)
        w.writeframes(pcm)
    return target.getvalue()


def post_once(key, payload):
    """POSTは1回のみ。例外時はstatus/code・例外種別のみ返す（URL・本文・キーは返さない）。"""
    req = urllib.request.Request(ENDPOINT, method='POST')
    req.add_header('Authorization', 'Bearer ' + key)
    req.add_header('Content-Type', 'application/json')
    req.add_header('Content-Length', str(len(payload)))
    req.data = payload
    try:
        with urllib.request.urlopen(req, timeout=180) as r:
            return json.loads(r.read().decode('utf-8')), None, r.status
    except urllib.error.HTTPError as e:
        return None, 'http status=%d code=%d' % (e.code, e.code), e.code
    except urllib.error.URLError as e:
        return None, 'urlerror(%s)' % type(getattr(e, 'reason', e)).__name__, -1
    except Exception as e:
        return None, 'exception(%s)' % type(e).__name__, -1


def secure_audio_url(url):
    """公式応答のHTTP URLをHTTPS化。署名のpath/queryはそのまま保持する。"""
    p = urllib.parse.urlsplit(url)
    host = (p.hostname or '').lower()
    if (p.scheme not in ('http', 'https') or p.username or p.password
            or p.port not in (None, 80, 443)
            or not any(host == s or host.endswith('.' + s) for s in ALLOWED_AUDIO_HOST_SUFFIX)):
        raise ValueError('audio URL scheme/host not allowed')
    return urllib.parse.urlunsplit(('https', host, p.path, p.query, ''))


class AudioRedirectHandler(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return super().redirect_request(req, fp, code, msg, headers, secure_audio_url(newurl))


def fetch_audio(url):
    """署名URLからWAV取得。認証ヘッダーは付けない。失敗はstatus/code・種別のみ。"""
    req = urllib.request.Request(url, method='GET')
    try:
        opener = urllib.request.build_opener(AudioRedirectHandler())
        with opener.open(req, timeout=120) as r:
            return r.read(), None, r.status
    except urllib.error.HTTPError as e:
        return None, 'http status=%d code=%d' % (e.code, e.code), e.code
    except urllib.error.URLError as e:
        return None, 'urlerror(%s)' % type(getattr(e, 'reason', e)).__name__, -1
    except Exception as e:
        return None, 'exception(%s)' % type(e).__name__, -1


def main():
    os.makedirs(OUTDIR, exist_ok=True)
    if os.path.exists(RESULT):
        print('ABORTED: result.json exists (1 generation only)')
        return 2
    if os.path.exists(OUTWAV):
        print('ABORTED: output wav exists (no overwrite)')
        return 2

    res = {
        'task': 'Qwen TTS limited trial 1 candidate/1 generation (2-6-b1 male narration)',
        'date': '2026-10-21',
        'status': 'in_progress',
        'model': MODEL, 'voice': VOICE, 'language_type': LANGUAGE,
        'endpointHost': ENDPOINT_HOST,
        'failureCount': 0, 'failures': [], 'unverified': [], 'leftoverTemps': [], 'notes': [],
    }

    # ①固定request.jsonを先に保存（Gemini 2-6-b1と同一原文）
    text = None
    try:
        with open(VOICEJSON, 'rb') as f:
            vj = json.loads(f.read().decode('utf-8'))
        beat = find_beat(vj, BEAT_ID)
        if beat is not None:
            text = beat.get('text')
    except Exception as e:
        res['notes'].append('voice JSON read failed: %s' % type(e).__name__)
    if not text:
        try:
            with open(GEMREQ, 'rb') as f:
                greq = json.loads(f.read().decode('utf-8'))
            text = greq['input'][0]['content'][0]['text']
            res['notes'].append('text taken from Gemini request.json')
        except Exception as e:
            res['status'] = 'blocked_text'
            res['blockReason'] = '元テキスト取得失敗(%s)' % type(e).__name__
            write_result(res)
            print('BLOCKED: source text unavailable')
            return 2
    gem_text = None
    try:
        with open(GEMREQ, 'rb') as f:
            greq = json.loads(f.read().decode('utf-8'))
        gem_text = greq['input'][0]['content'][0]['text']
    except Exception:
        pass
    res['textLen'] = len(text)
    res['textSha256-16'] = hashlib.sha256(text.encode('utf-8')).hexdigest()[:16]
    res['textMatchesGemini2-6-b1'] = (gem_text == text) if gem_text is not None else None
    if os.path.exists(REQPATH):
        with open(REQPATH, 'rb') as f:
            payload = f.read()
        res['requestFile'] = 'output/qwen-tts-pilot-2026-10-21-resume1/request.json (existing, used as-is)'
    else:
        payload = json.dumps({'model': MODEL, 'input': {'text': text, 'voice': VOICE, 'language_type': LANGUAGE}},
                              ensure_ascii=False).encode('utf-8')
        with open(REQPATH, 'wb') as f:
            f.write(payload)
        res['requestFile'] = 'output/qwen-tts-pilot-2026-10-21-resume1/request.json (saved before POST)'
    res['requestSha256-16'] = hashlib.sha256(payload).hexdigest()[:16]

    # ②キー（依存未充足なら未実施報告・API呼出しなし）
    key, keysrc, kerr = load_key()
    res['keySource'] = keysrc
    if kerr:
        res['status'] = 'blocked_key'
        res['blockReason'] = kerr
        res['unverified'].append('key未充足のため生成は未実施（実行失敗として加算しない）')
        write_result(res)
        print('BLOCKED (key): %s' % kerr)
        return 2

    # ③in_progressで記録（2回目生成を防ぐ）→ POST 1回
    write_result(res)
    data, err, status = post_once(key, payload)
    res['postHttpStatus'] = status
    if err:
        res['status'] = 'error_post'
        res['postError'] = err
        res['failureCount'] = 1
        res['failures'] = [err]
        write_result(res)
        print('POST ERROR: %s' % err)
        return 3

    res['requestId'] = str(data.get('request_id'))[:80]
    u = data.get('usage') or {}
    if isinstance(u, dict):
        res['usage'] = {k: v for k, v in u.items() if isinstance(v, (int, float, str))}
    out = data.get('output') or {}
    if isinstance(out, list):
        out = out[0] if out and isinstance(out[0], dict) else {}
    audio_block = out.get('audio') or {}
    if isinstance(audio_block, list):
        audio_block = audio_block[0] if audio_block and isinstance(audio_block[0], dict) else {}
    url = audio_block.get('url')
    b64data = audio_block.get('data')

    audio = None
    if url:
        p = urllib.parse.urlsplit(url)
        res['audioUrlSchemeReceived'] = p.scheme
        res['audioUrlHostReceived'] = p.hostname
        try:
            url = secure_audio_url(url)
        except ValueError:
            res['status'] = 'error_url_scheme'
            res['blockReason'] = 'audio url scheme/host not allowed'
            res['failureCount'] = 1
            res['failures'] = ['audio url scheme/host not allowed']
            write_result(res)
            print('ERROR: audio url scheme/host not allowed (no download)')
            return 3
        res['audioHostChecked'] = 'Alibaba domain boundary verified; HTTPS enforced including redirects'
        audio, derr, dstatus = fetch_audio(url)
        res['downloadHttpStatus'] = dstatus
        if derr:
            res['status'] = 'error_download'
            res['downloadError'] = derr
            res['failureCount'] = 1
            res['failures'] = [derr]
            write_result(res)
            print('DOWNLOAD ERROR: %s' % derr)
            return 3
    elif b64data:
        audio = base64.b64decode(b64data)
        res['audioHostChecked'] = 'inline base64 (no url)'
    else:
        res['status'] = 'error_shape'
        res['blockReason'] = 'response has neither output.audio.url nor data'
        res['failureCount'] = 1
        res['failures'] = ['response shape: no audio url/data']
        write_result(res)
        print('ERROR: response shape (no audio url/data)')
        return 3

    if not (audio[:4] == b'RIFF' and audio[8:12] == b'WAVE'):
        res['status'] = 'error_format'
        res['blockReason'] = 'downloaded audio is not RIFF/WAVE'
        res['failureCount'] = 1
        res['failures'] = ['not RIFF/WAVE']
        write_result(res)
        print('ERROR: not RIFF/WAVE')
        return 3

    with open(os.path.join(OUTDIR, 'qwen-api-original.wav'), 'xb') as f:
        f.write(audio)
    audio = normalize_wave_header(audio)
    res['headerNormalized'] = 'RIFF/data sizes set to actual PCM length; samples unchanged; API original retained'
    with open(OUTWAV, 'xb') as f:
        f.write(audio)
    gen = wave_stats(OUTWAV)
    res['generated'] = gen
    res['audioSummary'] = {
        'bytes': len(audio),
        'sha256': hashlib.sha256(audio).hexdigest(),
        'file': 'output/qwen-tts-pilot-2026-10-21-resume1/qwen-eldric-sage-2-6-b1.wav',
    }
    try:
        with open(GEMRESULT, 'rb') as f:
            gres = json.loads(f.read().decode('utf-8'))
        g = gres.get('generated') or {}
        cmp = {'reference': 'gemini 2-6-b1 (Charon)', 'geminiSeconds': g.get('seconds'), 'geminiRmsDBFS': g.get('rmsDBFS')}
        if g.get('seconds') and gen.get('seconds'):
            cmp['durationDeltaSeconds'] = round(gen['seconds'] - g['seconds'], 4)
        if g.get('rmsDBFS') is not None and gen.get('rmsDBFS') is not None:
            cmp['rmsDeltaDB'] = round(gen['rmsDBFS'] - g['rmsDBFS'], 2)
        res['comparison'] = cmp
    except Exception as e:
        res['notes'].append('Gemini comparison unavailable: %s' % type(e).__name__)

    res['status'] = 'ok'
    res['unverified'].extend([
        '主観的な音質・自然な日本語読み・THSの読み方（Qwen側は指示制御パラメータなし）は本人確認待ち',
        'キーの地域/無料枠/実請求額は未確認（usageのみ記録）',
    ])
    res['leftoverTemps'] = []
    write_result(res)
    print('RESULT: status=%s model=%s voice=%s seconds=%s rmsDBFS=%s wavBytes=%d sha16=%s' % (
        res['status'], MODEL, VOICE, gen.get('seconds'), gen.get('rmsDBFS'), len(audio),
        res['audioSummary']['sha256'][:16]))
    return 0


if __name__ == '__main__':
    try:
        sys.exit(main())
    except Exception as e:
        try:
            if not os.path.exists(RESULT):
                with open(RESULT, 'w', encoding='utf-8') as f:
                    json.dump({'status': 'error_internal', 'errorType': type(e).__name__, 'date': '2026-10-21'},
                              f, ensure_ascii=False, indent=2)
        except Exception:
            pass
        print('INTERNAL ERROR: %s' % type(e).__name__)
        sys.exit(1)
