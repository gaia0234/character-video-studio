"""V11固定台本（sources/toyota-conversation-v11-story.json）→ V11専用データ。標準ライブラリのみ。

  # 1) プロジェクト生成（読み替え表記・声設定・visual流用・想定秒）
  python3 scripts/build-longform-v11.py --story sources/toyota-conversation-v11-story.json \
      --v10 src/data/longform/toyota01-v10.json --out src/data/longform/toyota01-v11.json

  # 2) 実音マージ（実WAVからscene尺・cue・part境界を確定）
  python3 scripts/build-longform-v11.py --merge --voice src/data/longform/toyota01-v11-voice.json \
      --out src/data/longform/toyota01-v11.json --voice-out src/data/longform/toyota01-v11-voice.json

尺は台本の予定値ではなく実音で決める（開始0.4s＋発話実尺＋末尾0.5sをフレーム切上げ）。
無音水増し・速度帳尻合わせは行わない。目安（各部180〜300秒・全体1080〜1260秒）は比較報告のみ。
"""
from __future__ import annotations

import argparse
import copy
import json
import math
import re
import wave
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
STORY = ROOT / 'sources' / 'toyota-conversation-v11-story.json'
V10_JSON = ROOT / 'src' / 'data' / 'longform' / 'toyota01-v10.json'
DATA_JSON = ROOT / 'src' / 'data' / 'longform' / 'toyota01-v11.json'
VOICE_JSON = ROOT / 'src' / 'data' / 'longform' / 'toyota01-v11-voice.json'
AUDIO_REL = 'audio/longform-toyota01-v11'
AUDIO_DIR = ROOT / 'public' / AUDIO_REL

FPS = 30
FSTART = 0.4
FTAIL = 0.5
DEFAULT_PAUSE = 0.35
CHARS_PER_SECOND = 4.8      # 想定尺の見積りにのみ使う（尺の根拠にはしない）
MAX_CUE_CHARS = 44

# 話者ごとの声（V11承認値）
VOICE_SPEEDS = {'ホーマー': 1.0, 'ジャッド': 1.0, 'ケント': 1.0, 'ナレ2': 1.04}
NARRATOR_QUERY = {'pitchScale': -0.06, 'intonationScale': 0.75}
SPEAKER_NAMES = set(VOICE_SPEEDS)

# 読み上げのみの読替え（字幕は算用数字の原文のまま）
YEAR_END = '2030年末'
YEAR_END_TOKEN = '\x01'
TOKEN_REPL = [
    ('PHEV', 'ピーエイチイーブイ'), ('BEV', 'ビーイーブイ'), ('HEV', 'エイチイーブイ'),
    ('THS II', 'ティーエイチエス・ツー'), ('THS', 'ティーエイチエス'),
    ('G21', 'ジートゥエンティワン'), ('RAV4', 'ラブフォー'), ('CO2', '二酸化炭素'),
    ('EV', 'イーブイ'),
]
NUM_REPL = [('5,680件', '5千680件'), ('23,740件', '2万3千740件'), ('1,500万台', '1千5百万台')]
DATE_RE = re.compile(r'(?<!\d)(\d{4})年(?:([1-9]|1[0-2])月)?(?:([1-9]|1[0-9]|2[0-9]|3[01])日)?')
DIGIT_KANJI = str.maketrans('0123456789', '〇一二三四五六七八九')

# V10のvisualを流用するが、3人のキャラと章タイトルはV11 版に置き換える
ELDER_KINDS = {'openingTalk': 'elderTalk', 'questionRecap': 'elderRecap', 'finale': 'elderFinale'}
CARD_KINDS = {'chapterCard'}


def numeral(n: int) -> str:
    ones = ['〇', '一', '二', '三', '四', '五', '六', '七', '八', '九']
    if n <= 10:
        return ['〇', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'][n]
    if n < 20:
        return '十' + ones[n - 10]
    tens, unit = divmod(n, 10)
    return ('十' if tens == 1 else ones[tens] + '十') + ('' if unit == 0 else ones[unit])


def to_reading(text: str) -> str:
    s = text.replace(YEAR_END, YEAR_END_TOKEN)
    for old, new in NUM_REPL:
        s = s.replace(old, new)

    def year_repl(m: re.Match) -> str:
        out = m.group(1).translate(DIGIT_KANJI) + '年'
        if m.group(2):
            out += numeral(int(m.group(2))) + '月'
        if m.group(3):
            out += numeral(int(m.group(3))) + '日'
        return out

    s = DATE_RE.sub(year_repl, s)
    for old, new in TOKEN_REPL:
        s = s.replace(old, new)
    return s.replace(YEAR_END_TOKEN, YEAR_END)


def chunk_text(text: str) -> list[str]:
    """字幕用chunk。1cueに詰める長さは44字まで。"""
    chunks: list[str] = []
    cur = ''
    for ch in text:
        cur += ch
        if ch in '。！？':
            chunks.append(cur)
            cur = ''
        elif ch == '、' and len(cur) >= 30:
            chunks.append(cur)
            cur = ''
    if cur:
        if len(cur) <= 12 and chunks:
            chunks[-1] += cur
        else:
            chunks.append(cur)
    out: list[str] = []
    for piece in chunks:
        while len(piece) > MAX_CUE_CHARS:
            half = len(piece) // 2
            out.append(piece[:half])
            piece = piece[half:]
        out.append(piece)
    return out


def wav_frames(path: Path) -> int:
    with wave.open(str(path), 'rb') as wav:
        return wav.getnframes()


def visual_of(v10_scene: dict) -> dict:
    """V10 sceneのvisual（文字列 or dict）をV11用に複製。古い見出し類は持ち越さない。"""
    visual = copy.deepcopy(v10_scene.get('visual'))
    kind = visual if isinstance(visual, str) else (visual or {}).get('kind')
    if kind in ELDER_KINDS:
        visual = ELDER_KINDS[kind]
    return kind, visual



def is_question(text: str) -> bool:
    return ('？' in text) or ('ですか' in text) or ('ですかね' in text) or ('かな' in text)


def assign_speakers(lines: list[dict], scene_index: int = 0, keep_original: bool = False) -> list[str]:
    """台本の文言は変えず、話者だけ再配分する（2026-10-21本人指示: ナレ2を中心・3体は控えめに）。

    各sceneでナレ2が2〜3行を担い、3体は疑問1行と確認/反応1行だけを残す。差替えは
    output/longform-v11-review/speaker-remap.json に出力し、監査可能にする。
    """
    if keep_original:
        # 章変り（各部の先頭scene）は台本の3人の掛け合いをそのまま使う
        return [l['speaker'] for l in lines]
    elders = [i for i, l in enumerate(lines) if l['speaker'] != 'ナレ2']
    keep: set[int] = set()
    questions = [i for i in elders if is_question(lines[i]['text'])]
    if questions:
        keep.add(questions[0])
    # ケント/ホーマーはscene交互で1行ずつ残す（3体が均可読 stupidity 残しつつナレ2を中心にする）
    for offset, speaker in enumerate(('ケント', 'ホーマー')):
        cand = [i for i in elders if lines[i]['speaker'] == speaker and i not in keep]
        if cand and len(keep) < 2 and (scene_index + offset) % 2 == 0:
            keep.add(cand[0])
    plan = []
    for i, line in enumerate(lines):
        if line['speaker'] == 'ナレ2':
            plan.append('ナレ2')
        elif i in keep:
            plan.append(line['speaker'])
        else:
            plan.append('ナレ2')
    if not any(p != 'ナレ2' for p in plan):
        cand = list(elders)
        if cand:
            j = min(cand, key=lambda i: len(lines[i]['text']))
            plan[j] = lines[j]['speaker']
    return plan


def build_project(story: dict, v10: dict) -> dict:
    v10_by_id = {s['id']: s for s in v10['scenes']}
    parts = story['parts']
    scenes = []
    remap = []
    # 各部の先頭scene（＝章変り）は台本のまま残し、他sceneでナレ2中心へ再配分する
    opening_ids = set()
    for part in parts:
        for sc in story['scenes']:
            if sc['part'] == part['id']:
                opening_ids.add(sc['id'])
                break
    for sc in story['scenes']:
        sid = sc['id']
        v10_scene = v10_by_id.get(sc['v10Id'])
        if v10_scene is None:
            raise RuntimeError(f'{sid}: v10Id {sc["v10Id"]} が V10 JSON にありません')
        kind, visual = visual_of(v10_scene)
        lines = []
        planned = FSTART + FTAIL
        for index, line in enumerate(sc['lines'], start=1):
            speaker = line['speaker']
            if speaker not in SPEAKER_NAMES:
                raise RuntimeError(f'{sid}: 未知の話者 {speaker}')
            text = line['text']
            pause = float(line.get('pauseAfter', DEFAULT_PAUSE))
            speed = VOICE_SPEEDS[speaker]
            spoken = to_reading(text)
            entry = {
                'id': f'{sid}-l{index}',
                'speaker': speaker,
                'text': text,
                'spokenText': spoken,
                'pauseAfter': pause,
                'voiceSpeed': speed,
            }
            if speaker == 'ナレ2':
                entry.update(NARRATOR_QUERY)
            lines.append(entry)
            planned += len(spoken) / CHARS_PER_SECOND * speed + pause
        # 話者再配分（文言は不変・ナレ2中心）。差替え表を監査可能な形で残す。
        plan = assign_speakers(lines, len(scenes), keep_original=(sid in opening_ids))
        for entry, speaker in zip(lines, plan):
            if speaker != entry['speaker']:
                remap.append({'sceneId': sid, 'lineId': entry['id'], 'from': entry['speaker'],
                              'to': speaker, 'text': entry['text']})
            entry['speaker'] = speaker
        part_title = next(p['title'] for p in parts if p['id'] == sc['part'])
        scene = copy.deepcopy(v10_scene)
        scene.update({
            'id': sid,
            'part': sc['part'],
            'sceneTitle': sc['title'],
            'chapter': f'第{sc["part"]}部　{part_title}',
            'chapterNo': sc['part'],
            'v10Id': sc['v10Id'],
            'facts': list(sc.get('facts', [])),
            'evidence': list(sc.get('facts', [])),
            'character': None,
            'guide': None,
            'visual': visual,
            'kind': kind,
            'plannedSeconds': round(planned, 3),
            'seconds': round(planned, 3),
            'frames': int(math.ceil(planned * 30 - 1e-9)),
            'cues': [],
            'lines': lines,
            'audio': None,
        })
        if kind in CARD_KINDS:
            part = next(p for p in parts if p['id'] == sc['part'])
            scene['cardNo'] = f'第{sc["part"]}部'
            scene['cardText'] = part['title']
        scenes.append(scene)
    remap_path = ROOT / 'output/longform-v11-review/speaker-remap.json'
    remap_path.parent.mkdir(parents=True, exist_ok=True)
    counts = {}
    for scene in scenes:
        for line in scene['lines']:
            counts[line['speaker']] = counts.get(line['speaker'], 0) + 1
    remap_path.write_text(json.dumps({
        'date': '2026-10-21',
        'policy': '2026-10-21/22本人指示: 冒頭と章変り（各部の先頭scene=s01/s08/s15/s22/s29）は3人の掛け合いを台本のまま残し、'
                  'それ以外はナレ2を中心・3体は疑問と確認/反応だけに残す',
        'chapterOpenings': sorted(opening_ids),
        'note': '台本JSON（Codex所有）の文言は変更していない。V11側データで話者だけ再配分した。',
        'counts': counts, 'moved': len(remap), 'changes': remap,
    }, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    return {
        'version': 'v11',
        'title': story.get('title'),
        'date': story.get('date'),
        'sourceStory': 'sources/toyota-conversation-v11-story.json',
        'sourceRegister': story.get('sourceRegister'),
        'voiceRoute': story.get('voiceRoute'),
        'targetPartSeconds': story.get('targetPartSeconds'),
        'targetTotalSeconds': story.get('targetTotalSeconds'),
        'audioSpec': {'fps': FPS, 'startSeconds': FSTART, 'tailSeconds': FTAIL,
                      'linePauseDefault': DEFAULT_PAUSE},
        'voiceCredits': ['VOICEVOX:玄野武宏', 'VOICEVOX:青山龍星', 'VOICEVOX:雀松朱司', 'VOICEVOX Nemo'],
        'parts': [{'id': p['id'], 'title': p['title'],
                   'sceneIds': [s['id'] for s in scenes if s['part'] == p['id']]}
                  for p in parts],
        'scenes': scenes,
    }


def merge_audio(project: dict, voice: dict) -> dict:
    audio_dir = ROOT / 'public'
    voice_lines = {}
    for scene in voice['scenes']:
        for line in scene['lines']:
            voice_lines[line['id']] = line
    total_frames = 0
    out_scenes = []
    parts_frames = {p['id']: 0 for p in project['parts']}
    part_seconds = {p['id']: 0.0 for p in project['parts']}
    for scene in project['scenes']:
        sid = scene['id']
        scene_lines = []
        cues = []
        offset = 0
        lines = scene['lines']
        for index, line in enumerate(lines):
            vline = voice_lines.get(line['id'])
            if vline is None or 'audio' not in vline:
                raise RuntimeError(f'{line["id"]}: 音声情報が見つかりません（--merge は generate-voice-v11.py の後に実行）')
            wav = audio_dir / vline['audio']['src']
            frames = wav_frames(wav)
            seconds = frames / 24000
            if abs(seconds - vline['audio']['seconds']) > 0.003:
                raise RuntimeError(f'{line["id"]}: 実WAV {seconds:.3f}s とJSON {vline["audio"]["seconds"]:.3f}s が不一致')
            start = offset / 24000
            texts = chunk_text(line['text'])
            total_chars = sum(len(t) for t in texts)
            acc = 0
            for text in texts:
                frac0 = acc / total_chars
                acc += len(text)
                frac1 = acc / total_chars
                cues.append({'start': round(FSTART + start + seconds * frac0, 3),
                             'end': round(FSTART + start + seconds * frac1, 3),
                             'speaker': line['speaker'], 'text': text, 'lineId': line['id']})
            scene_lines.append({**line, 'audio': vline['audio'], 'startSecond': round(start, 3),
                                 'endSecond': round(start + seconds, 3)})
            offset += frames
            if index < len(lines) - 1:
                offset += round(24000 * line['pauseAfter'])
        scene_wav = audio_dir / AUDIO_REL / f'scene-{sid}.wav'
        scene_frames = wav_frames(scene_wav)
        wav_seconds = scene_frames / 24000
        if abs(wav_seconds - offset / 24000) > 0.01:
            raise RuntimeError(f'{sid}: 合成規則 {offset / 24000:.3f}s と実WAV {wav_seconds:.3f}s が不一致')
        seconds = wav_seconds + FSTART + FTAIL
        frames = math.ceil(seconds * 30 - 1e-9)
        seconds = frames / 30
        if cues:
            cues[-1]['end'] = seconds
        # V10由来の図解データ（cards/flow/bars/stops/pins/headline/year等）はproject側のsceneをそのまま引き継ぐ
        entry = copy.deepcopy(scene)
        entry.update({
            'id': sid, 'part': scene['part'], 'sceneTitle': scene.get('sceneTitle'), 'v10Id': scene['v10Id'],
            'facts': scene.get('facts', []), 'kind': scene.get('kind'), 'visual': scene['visual'],
            'plannedSeconds': scene['plannedSeconds'],
            'seconds': seconds, 'frames': frames,
            'startFrame': total_frames, 'endFrame': total_frames + frames - 1,
            'startSeconds': total_frames / 30, 'endSeconds': (total_frames + frames) / 30,
            'audio': {'src': f'{AUDIO_REL}/scene-{sid}.wav', 'seconds': round(wav_seconds, 3)},
            'lines': scene_lines, 'cues': cues,
        })
        out_scenes.append(entry)
        parts_frames[scene['part']] += frames
        part_seconds[scene['part']] += seconds
        total_frames += frames
    parts = []
    cursor = 0
    for part in project['parts']:
        frames = parts_frames[part['id']]
        parts.append({**part, 'startFrame': cursor, 'endFrame': cursor + frames - 1,
                      'frames': frames, 'seconds': round(part_seconds[part['id']], 3)})
        cursor += frames
    data = {k: v for k, v in project.items() if k not in ('scenes', 'parts')}
    data['parts'] = parts
    data['scenes'] = out_scenes
    data['durationFrames'] = total_frames
    data['totalSeconds'] = round(total_frames / 30, 3)
    data['note'] = ('固定台本 sources/toyota-conversation-v11-story.json を一字一句そのまま発話化。'
                    '各sceneの秒＝実音（開始0.4s＋発話実尺＋末尾0.5s）をフレーム切上げした実値。'
                    '字幕は算用数字の原文、読替えはvoice JSON。')
    return data


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--story', type=Path, default=STORY)
    parser.add_argument('--v10', type=Path, default=V10_JSON)
    parser.add_argument('--voice', type=Path, default=VOICE_JSON)
    parser.add_argument('--out', type=Path, default=DATA_JSON)
    parser.add_argument('--voice-out', type=Path, default=VOICE_JSON)
    parser.add_argument('--merge', action='store_true')
    args = parser.parse_args()

    if args.merge:
        # 既存データを読まず、台本＋話者ポリシーから再生成してから音声を差し込む
        # （旧実装は既存データを基点にしたため、話者再配分がデータへ反映されなかった）
        story = json.loads(args.story.read_text(encoding='utf-8'))
        v10 = json.loads(args.v10.read_text(encoding='utf-8'))
        project = build_project(story, v10)
        voice = json.loads(args.voice.read_text(encoding='utf-8'))
        data = merge_audio(project, voice)
        # 話者と生成音声の不一致はここで止める（レンダー後に気付く無駄を防ぐ）
        bad = []
        for scene in data['scenes']:
            for line in scene['lines']:
                gf = (line.get('audio') or {}).get('generatedFor')
                try:
                    key = json.loads(gf)[0] if isinstance(gf, str) else (gf[0] if isinstance(gf, list) else gf)
                except Exception:
                    key = None
                if key != line['speaker']:
                    bad.append(f"{line['id']}:{line['speaker']}≠{key}")
        if bad:
            print(f"中止: 話者と生成音声が不一致 {len(bad)}件（音声の再生成が必要）: " + ', '.join(bad[:3]))
            return 4
        args.out.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        voice.setdefault('scenes', [])
        for scene in data['scenes']:
            for line in scene['lines']:
                for vscene in voice['scenes']:
                    if vscene['id'] == scene['id']:
                        for vline in vscene['lines']:
                            if vline['id'] == line['id']:
                                vline['audio'] = line['audio']
                                vline['startSecond'] = line['startSecond']
                                vline['endSecond'] = line['endSecond']
        args.voice_out.write_text(json.dumps(voice, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        counts = {}
        for scene in data['scenes']:
            for line in scene['lines']:
                counts[line['speaker']] = counts.get(line['speaker'], 0) + 1
        print(f'merge: scenes={len(data["scenes"])} frames={data["durationFrames"]} '
              f'seconds={data["totalSeconds"]} ({(data["totalSeconds"] / 60):.2f}分) 話者={counts}')
        for part in data['parts']:
            print(f'  part{part["id"]}: {part["frames"]}f {part["seconds"]}s '
                  f'({part["seconds"] / 60:.2f}分) scenes={len(part["sceneIds"])}')
        return 0

    story = json.loads(args.story.read_text(encoding='utf-8'))
    v10 = json.loads(args.v10.read_text(encoding='utf-8'))
    project = build_project(story, v10)
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(project, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    chars = sum(len(l['text']) for s in project['scenes'] for l in s['lines'])
    planned = sum(s['plannedSeconds'] for s in project['scenes'])
    print(f'project: scenes={len(project["scenes"])} lines='
          f'{sum(len(s["lines"]) for s in project["scenes"])} chars={chars} '
          f'plannedSeconds={planned:.1f}')
    for part in project['parts']:
        scenes = [s for s in project['scenes'] if s['part'] == part['id']]
        part_planned = sum(s['plannedSeconds'] for s in scenes)
        print(f'  part{part["id"]}: scenes={len(scenes)} planned={part_planned:.1f}s')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
