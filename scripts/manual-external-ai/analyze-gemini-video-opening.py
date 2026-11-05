#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Gemini 3.8 Flash 比較分析 attempt2（本人「進める」承認：診断1回＋再試行）。

変化点（attempt1のHTTP400に対して）:
  Phase0: GET /v1beta/models で対象model idの実在だけを確認（生一覧は保存しない）
  Phase1: 動画A=inline clip のみでもう1回POST（YouTube URIを切り離して原因を二分）
  Phase2: Phase1が成功した場合のみA+B比較（本番成果物）
  エラー時はstatus/code＋サニタイズ済みmessageのみ記録（URL/署名/鍵/本文blobは保存しない）
  attempt1のclip/request.json/result.jsonは上書きせず、attempt2は別名で保存する。
禁止: 3回目以上のPOST、別model、追加Transcribe/Lite、本編変更、共有、削除、commit/push。
"""
import base64, hashlib, json, os, re, sys, urllib.error, urllib.request

ROOT = '/home/ds-work/projects/character-video-studio'
OUTDIR = os.path.join(ROOT, 'output/gemini-video-opening-review-2026-10-21')
CLIP = os.path.join(OUTDIR, 'clip-v10-opening-120s.mp4')
CLIP_REL = 'output/gemini-video-opening-review-2026-10-21/clip-v10-opening-120s.mp4'
A1_RESULT = os.path.join(OUTDIR, 'result.json')
A2_REQ = os.path.join(OUTDIR, 'request-attempt2.json')
A2_RESULT = os.path.join(OUTDIR, 'result-attempt2.json')
A2_RESULT_A = os.path.join(OUTDIR, 'result-attempt2-partA.json')
A2_REVIEW = os.path.join(OUTDIR, 'review-attempt2.md')
A2_REVIEW_A = os.path.join(OUTDIR, 'review-attempt2-partA.md')
API = 'https://generativelanguage.googleapis.com/v1beta/interactions'
MODELS_API = 'https://generativelanguage.googleapis.com/v1beta/models'
MODEL = 'gemini-3.8-flash'
YOUTUBE = 'https://www.youtube.com/watch?v=3xdIwOjzUL8'
CLIP_SECONDS = 120

INSTRUCTION_AB = '''あなたは動画比較の観測者です。比較対象は動画A（現行V10の冒頭0〜120秒）と動画B（参考の深読み地図の冒頭0〜120秒）のみです。全尺の検査でも事実検証でもありません。

手順と要件:
1. AとBそれぞれの0〜120秒を実際に観測し、事実をA/Bを区別して時刻付きで列挙する（A: mm:ss / B: mm:ss）。
2. 比較観点（各A/B、時刻付き）: キャラ造形（輪郭・表情・視認性）、出番と役割の作り、動きの量と単純さ、字幕と数値の可読性、声の低さ・自然さ・抑揚・間、導入での問いの提示と根拠提示。
3. 各主張には根拠時刻・確度（高/中/低）・反例（あれば）・未確認事項を必ず添える。確度の高い主張だけを残さない。
4. 音声は実際に取得・確認できた場合のみ「聴取した」と書き、取得できなかった場合は「不明（音声未取得）」と明記する。推測で聞こえたことにしない。
5. ユーザーの所見（参考は声が自然で人間が話しているように感じ、動きは単純という評価）は仮説として扱い、あなたの観測と区別して併記する。評価に沿って結論を誘導しない。
6. 映像だけから確定しない項目（参考のTTSブランドやモデル、素材の生成方法、視聴者層など）は推定ifanば「推定・未確認」と明示する。
7. 最後に、現行V10の冒頭で最優先すべき改善を3件、それぞれ期待効果と実装負担を添えて提案する。
8. 最後に、サンプリングの限界（各120秒・1fpsの静的処理・音声の実取得可否など）と未取得事項を明示する。'''

INSTRUCTION_A = '''あなたは動画A（現行V10の冒頭0〜120秒）の観測者です。全尺の検査でも事実検証でもありません。

手順と要件:
1. 動画Aの0〜120秒を実際に観測し、事実を時刻付きで列挙する（mm:ss）。
2. 観点: キャラ造形（輪郭・表情・視認性）、出番と役割の作り、動きの量と単純さ、字幕と数値の可読性、声の低さ・自然さ・抑揚・間、導入での問いの提示と根拠提示。
3. 各主張には根拠時刻・確度（高/中/低）・反例（あれば）・未確認事項を必ず添える。
4. 音声は実際に取得・確認できた場合のみ「聴取した」と書き、取得できなかった場合は「不明（音声未取得）」と明記する。推測で聞こえたことにしない。
5. 映像だけから確定しない項目は推定ifanば「推定・未確認」と明示する。
6. 最後に、現行V10の冒頭で最優先すべき改善を3件、それぞれ期待効果と実装負担を添えて提案する。
7. 最後に、サンプリングの限界（0〜120秒・1fpsの静的処理・音声の実取得可否）と未取得事項を明示する。'''

FAILURES = []


def sanitize(text):
    t = text or ''
    t = re.sub(r'https?://\S+', '[url]', t)
    t = re.sub(r'[A-Za-z0-9+/=_\-]{80,}', '[blob]', t)
    return t[:280]


def sha256_file(path):
    h = hashlib.sha256()
    with open(path, 'rb') as f:
        for chunk in iter(lambda: f.read(1 << 20), b''):
            h.update(chunk)
    return h.hexdigest()


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
    if not key or key.lower() in {'gemini_api_key', 'your_api_key', 'xxx', 'unset', 'none'}:
        return None, src, 'keyが見つからない/空/placeholder(%s)' % src
    return key, src, None


def write_json(path, obj):
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(obj, f, ensure_ascii=False, indent=2)


def error_fields(body_bytes):
    """エラー本文からstatus/code/サニタイズ済みmessageのみを取り出す（本文保存・表示なし）。"""
    out = {}
    try:
        obj = json.loads(body_bytes.decode('utf-8', 'ignore'))
    except Exception:
        return out
    err = obj.get('error') if isinstance(obj, dict) else None
    if isinstance(err, dict):
        for k in ('status', 'code'):
            if k in err and isinstance(err[k], (str, int, float)):
                out['error_' + k] = err[k]
        for k in ('message', 'detail', 'details'):
            if k in err and isinstance(err[k], str):
                out['error_' + k] = sanitize(err[k])
                break
    for k in ('status', 'message'):
        if k in obj and isinstance(obj[k], (str, int)) and k not in out:
            out['error_' + k] = sanitize(str(obj[k]))
    return out


def post_once(key, payload_bytes):
    req = urllib.request.Request(API, method='POST')
    req.add_header('x-goog-api-key', key)
    req.add_header('content-type', 'application/json')
    req.add_header('content-length', str(len(payload_bytes)))
    req.data = payload_bytes
    try:
        with urllib.request.urlopen(req, timeout=180) as r:
            return json.loads(r.read().decode('utf-8')), None, r.status, {}
    except urllib.error.HTTPError as e:
        try:
            body = e.read()
        except Exception:
            body = b''
        return None, 'http status=%d code=%d' % (e.code, e.code), e.code, error_fields(body)
    except urllib.error.URLError as e:
        return None, 'urlerror(%s)' % type(getattr(e, 'reason', e)).__name__, -1, {}
    except Exception as e:
        return None, 'exception(%s)' % type(e).__name__, -1, {}


def get_models(key):
    names = []
    token = None
    for _ in range(20):
        url = MODELS_API + '?pageSize=200' + ('' if token is None else '&pageToken=' + token)
        try:
            req = urllib.request.Request(url, method='GET')
            req.add_header('x-goog-api-key', key)
            with urllib.request.urlopen(req, timeout=60) as r:
                page = json.loads(r.read().decode('utf-8'))
        except urllib.error.HTTPError as e:
            return None, 'http status=%d code=%d' % (e.code, e.code)
        except Exception as e:
            return None, 'exception(%s)' % type(e).__name__
        for m in page.get('models', []):
            n = (m.get('name') or '').replace('models/', '')
            if n:
                names.append(n)
        token = page.get('nextPageToken')
        if not token:
            break
    return names, None


def extract_text(data):
    texts = []
    for step in (data.get('steps') or []):
        if not isinstance(step, dict):
            continue
        for c in (step.get('content') or []):
            if isinstance(c, dict) and c.get('type') == 'text' and c.get('text'):
                texts.append(c['text'])
    if not texts and isinstance(data.get('output_text'), str) and data.get('output_text'):
        texts.append(data['output_text'])
    return texts


def main():
    for pth in (A2_REQ, A2_RESULT, A2_RESULT_A, A2_REVIEW, A2_REVIEW_A):
        if os.path.exists(pth):
            print('ABORTED: attempt2 output exists (no overwrite): %s' % os.path.basename(pth))
            return 2
    if not os.path.exists(CLIP):
        print('ABORTED: clip missing (reuse attempt1 clip, do not re-cut)')
        return 2
    clip_sha = sha256_file(CLIP)
    try:
        with open(A1_RESULT, 'rb') as f:
            a1 = json.loads(f.read().decode('utf-8'))
        prior_sha = ((a1.get('clip') or {}).get('sha256'))
        if prior_sha and prior_sha != clip_sha:
            print('ABORTED: clip sha differs from attempt1 record')
            return 2
        clip_meta = a1.get('clip') or {}
    except Exception:
        clip_meta = {'sha256': clip_sha, 'bytes': os.path.getsize(CLIP)}

    res = {
        'task': 'Gemini 3.8 Flash comparison analysis attempt2 (A-only bisect, then A+B if A succeeds)',
        'date': '2026-10-21',
        'status': 'in_progress',
        'requestedModel': MODEL,
        'analysisScope': '各動画の0-120秒のみ（1fps静的処理・全尺/全フレーム検査ではない）',
        'clip': {'file': CLIP_REL, 'sha256': clip_sha, 'bytes': os.path.getsize(CLIP),
                 'seconds': clip_meta.get('seconds'), 'reusedFromAttempt1': True},
        'failures': [], 'failureCount': 0,
        'unverified': [], 'leftoverTemps': [], 'userAcceptance': '本人未受入（Main/本人の判断は別）',
        'attempt1': {'status': 'error_api', 'httpStatus': 400,
                     'note': 'attempt1のclip/request.json/result.jsonは上書きせず保持'},
    }

    key, keysrc, kerr = load_key()
    res['keySource'] = keysrc
    if kerr:
        res['status'] = 'blocked_key'
        res['blockReason'] = kerr
        write_json(A2_RESULT, res)
        print('BLOCKED (key): %s' % kerr)
        return 2

    # Phase0: 対象model idの実在確認（生一覧は保存しない）
    names, merr = get_models(key)
    if merr:
        FAILURES.append('models-get: %s' % merr)
        res['status'] = 'error_models'
        res['modelsError'] = merr
        res['failureCount'] = len(FAILURES)
        res['failures'] = FAILURES
        write_json(A2_RESULT, res)
        print('MODELS ERROR: %s' % merr)
        return 3
    res['modelsCheck'] = {
        'targetPresent': MODEL in names,
        'targetCandidates': sorted([n for n in names if n.startswith('gemini-3')])[:12],
        'totalKnown': len(names),
    }
    if MODEL not in names:
        res['status'] = 'blocked_model_missing'
        res['blockReason'] = '%s not in models list (no model switch)' % MODEL
        write_json(A2_RESULT, res)
        print('BLOCKED: %s not in models list' % MODEL)
        return 3

    with open(CLIP, 'rb') as f:
        clip_b64 = base64.b64encode(f.read()).decode('ascii')

    def build(include_b):
        items = [
            {'type': 'text', 'text': '動画A=現行V10'},
            {'type': 'video', 'data': clip_b64, 'mime_type': 'video/mp4',
             'processing': {'type': 'static', 'fps': 1}},
        ]
        if include_b:
            items.append({'type': 'text', 'text': '動画B=参考の深読み地図'})
            items.append({'type': 'video', 'uri': YOUTUBE,
                          'processing': {'type': 'static', 'start_offset': 0, 'end_offset': CLIP_SECONDS, 'fps': 1}})
        items.append({'type': 'text', 'text': INSTRUCTION_AB if include_b else INSTRUCTION_A})
        return {'model': MODEL, 'store': False, 'input': items}

    # 固定manifest（attempt2・base64は保存しない）
    manifest = {
        'date': '2026-10-21', 'attempt': 2, 'api': 'POST ' + API, 'model': MODEL, 'store': False,
        'note': 'base64は送信時のみメモリ内保持。manifestはpath/sha256/bytesで参照。attempt1成果は上書きしない。',
        'clip': {'path': CLIP_REL, 'sha256': clip_sha, 'bytes': os.path.getsize(CLIP)},
        'phases': [
            {'phase': 1, 'content': '動画A=inline clipのみ（YouTube URIを切り離して原因二分）',
             'instructionFile': 'inline in script (INSTRUCTION_A)'},
            {'phase': 2, 'content': '動画A+動画B比較（本番成果物・Phase1成功時のみ）',
             'instructionFile': 'inline in script (INSTRUCTION_AB)'},
        ],
    }
    write_json(A2_REQ, manifest)
    res['requestManifest'] = {'file': 'output/gemini-video-opening-review-2026-10-21/request-attempt2.json',
                              'sha256': sha256_file(A2_REQ)}

    # Phase1: Aのみ
    p1 = json.dumps(build(False), ensure_ascii=False).encode('utf-8')
    res['phase1PayloadSha256-16'] = hashlib.sha256(p1).hexdigest()[:16]
    d1, err1, st1, fields1 = post_once(key, p1)
    res['phase1HttpStatus'] = st1
    if err1:
        FAILURES.append('phase1: %s' % err1)
        res['status'] = 'error_api_phase1'
        res['apiError'] = err1
        res['apiErrorFields'] = fields1
        res['failureCount'] = len(FAILURES)
        res['failures'] = FAILURES
        res['unverified'].append('Phase2（A+B比較）は未実施（Phase1失敗のため）')
        write_json(A2_RESULT, res)
        print('PHASE1 ERROR: %s %s' % (err1, json.dumps(fields1, ensure_ascii=False)))
        return 3

    texts1 = extract_text(d1)
    text1 = texts1[-1] if texts1 else ''
    res['phase1'] = {
        'responseId': str(d1.get('id'))[:80],
        'effectiveModel': d1.get('model') or MODEL,
        'responseStatus': d1.get('status'),
        'textChars': len(text1),
        'hasText': bool(text1),
        'usage': {k: v for k, v in (d1.get('usage') or {}).items() if isinstance(v, (int, float, str))},
    }
    if not text1:
        FAILURES.append('phase1: no text in response')
        res['status'] = 'error_no_text_phase1'
        res['failureCount'] = len(FAILURES)
        res['failures'] = FAILURES
        write_json(A2_RESULT, res)
        print('PHASE1: no text')
        return 3
    with open(A2_REVIEW_A, 'w', encoding='utf-8') as f:
        f.write('# 動画Aのみ観測（attempt2 Phase1・モデル原文）\n\n')
        f.write('- 実効モデル: %s / HTTP: %s / 応答ID: %s\n' % (
            res['phase1']['effectiveModel'], st1, res['phase1']['responseId']))
        f.write('- 入力: clip %ss（sha16 %s）＋分析指示のみ（動画B未指定）\n' % (
            clip_meta.get('seconds'), clip_sha[:16]))
        f.write('- usage: %s\n\n---\n\n' % json.dumps(res['phase1']['usage'], ensure_ascii=False))
        f.write(text1)
        f.write('\n')
    write_json(A2_RESULT_A, res)

    # Phase2: A+B比較（本番成果物）
    p2 = json.dumps(build(True), ensure_ascii=False).encode('utf-8')
    res['phase2PayloadSha256-16'] = hashlib.sha256(p2).hexdigest()[:16]
    d2, err2, st2, fields2 = post_once(key, p2)
    res['phase2HttpStatus'] = st2
    if err2:
        FAILURES.append('phase2: %s' % err2)
        res['status'] = 'error_api_phase2'
        res['apiError'] = err2
        res['apiErrorFields'] = fields2
        res['failureCount'] = len(FAILURES)
        res['failures'] = FAILURES
        res['deliverable'] = '動画Aのみ観測（review-attempt2-partA.md）。A+B比較は未取得（Phase2 HTTP失敗）'
        res['unverified'].append('A+B比較は未取得。Phase2は1回のみで再試行しない。')
        write_json(A2_RESULT, res)
        print('PHASE2 ERROR: %s %s' % (err2, json.dumps(fields2, ensure_ascii=False)))
        return 3

    texts2 = extract_text(d2)
    text2 = texts2[-1] if texts2 else ''
    res['phase2'] = {
        'responseId': str(d2.get('id'))[:80],
        'effectiveModel': d2.get('model') or MODEL,
        'responseStatus': d2.get('status'),
        'textChars': len(text2),
        'hasText': bool(text2),
        'usage': {k: v for k, v in (d2.get('usage') or {}).items() if isinstance(v, (int, float, str))},
    }
    if not text2:
        FAILURES.append('phase2: no text in response')
        res['status'] = 'error_no_text_phase2'
        res['failureCount'] = len(FAILURES)
        res['failures'] = FAILURES
        res['deliverable'] = '動画Aのみ観測（review-attempt2-partA.md）'
        write_json(A2_RESULT, res)
        print('PHASE2: no text')
        return 3

    res['status'] = 'ok'
    res['deliverable'] = 'review-attempt2.md（モデル原文）＋result-attempt2.json'
    res['audioObtained'] = 'notSeparatelyObtained（別途Transcribe/Liteは禁止範囲のため未実施。モデル本文の音声記述はモデル所見で当方未検証）'
    res['modelTextMentionsAudio'] = any(k in text2 for k in ('音声', '声', '聞き', '聴取', 'TTS'))
    res['unverified'].extend([
        '参考動画BのYouTube URIの実取得可否（本文記述のみで独立確認なし）',
        'モデル本文の確度・反例・未確認の記述はモデル申告で当方の目視/聴取検証ではない',
        '全コマ/全尺比較・factcheckは未実施（各120秒・1fps静的処理のサンプリング）',
        '本人受入（採用/修正の採否）は未実施',
    ])
    res['leftoverTemps'] = []
    res['failureCount'] = len(FAILURES)
    res['failures'] = FAILURES
    write_json(A2_RESULT, res)

    with open(A2_REVIEW, 'w', encoding='utf-8') as f:
        f.write('# Gemini補助比較分析 attempt2（V10冒頭 vs 参考の深読み地図・冒頭）\n\n')
        f.write('- 実行日: 2026-10-21\n')
        f.write('- 実効モデル: %s（要求 %s）\n' % (res['phase2']['effectiveModel'], MODEL))
        f.write('- HTTP status: %s / 応答ID: %s / responseStatus: %s\n' % (
            st2, res['phase2']['responseId'], res['phase2']['responseStatus']))
        f.write('- 処理範囲: 動画A=現行V10の0-120秒（clip %ss・1920x1080・%s）＋動画B=参考の0-120秒（%s）\n' % (
            clip_meta.get('seconds'), clip_sha[:16], YOUTUBE))
        f.write('- clip sha256: %s / bytes: %s\n' % (clip_sha, os.path.getsize(CLIP)))
        f.write('- request manifest sha256: %s\n' % res['requestManifest']['sha256'])
        f.write('- usage: %s\n' % json.dumps(res['phase2']['usage'], ensure_ascii=False))
        f.write('- 音声取得: %s\n' % res['audioObtained'])
        f.write('- 本人受入: %s\n\n' % res['userAcceptance'])
        f.write('---\n\n## モデル分析本文（Gemini 3.8 Flash・原文）\n\n')
        f.write(text2)
        f.write('\n\n---\n\n## 当方の記録（モデル本文の外）\n\n')
        f.write('- 失敗累計（今回attempt2）: %d件 / 内訳: %s\n' % (len(FAILURES), FAILURES if FAILURES else 'なし'))
        f.write('- attempt1: HTTP400（clip/request/resultは保持・上書きなし）\n')
        f.write('- サンプリング限界: 各120秒のみ・1fps静的処理・全コマ/全尺比較は未実施（factcheckではない）\n')
        f.write('- 未確認: 参考URIの実取得可否、モデル本文の検証、本人受入\n')
        f.write('- 一時物: なし（clipは証拠として保持。base64/署名URL/キーは保存していない）\n')

    print('RESULT: status=%s model=%s http=%s textChars=%d sha16=%s' % (
        res['status'], res['phase2']['effectiveModel'], st2, len(text2), clip_sha[:16]))
    return 0


if __name__ == '__main__':
    try:
        sys.exit(main())
    except Exception as e:
        try:
            if not os.path.exists(A2_RESULT):
                write_json(A2_RESULT, {'status': 'error_internal', 'errorType': type(e).__name__, 'date': '2026-10-21'})
        except Exception:
            pass
        print('INTERNAL ERROR: %s' % type(e).__name__)
        sys.exit(1)
