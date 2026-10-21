"""V10台本取り込みと実尺マージ。Python標準ライブラリのみ。

使い方:
  python3 scripts/build-longform-v10.py                  # 台本60scene→音声プロジェクト(beat/字幕chunk/読替え)を生成
  python3 scripts/build-longform-v10.py --audio <result> # 生成後のbeat実尺をscene WAV/cueへマージし toyota01-v10.json を作る

固定集計値（台本第2〜3節・Codex 2026-10-20）は照合にのみ使い、再計算・再配分はしない。
"""
from __future__ import annotations

import argparse
import json
import math
import re
import sys
import wave
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCRIPT_MD = ROOT / 'sources' / 'script-longform-toyota-full-v1.md'
VOICE_JSON = ROOT / 'src' / 'data' / 'longform' / 'toyota01-v10-voice.json'
DATA_JSON = ROOT / 'src' / 'data' / 'longform' / 'toyota01-v10.json'
AUDIO_REL = 'audio/longform-toyota01-v10'

# Codex固定集計（台本第3節）: (章, 章card, 固定予定秒, 固定発話文字数, scene数)
FIXED_CHAPTER = [
    (0, '冒頭の3人', 68.2, 304, 10),
    (1, '1997年、二つの答え', 77.2, 345, 10),
    (2, 'まだ答えのなかった開発', 162.1, 723, 7),
    (3, 'エンジンとモーターが助け合う', 142.4, 628, 7),
    (4, '一台のプリウスから広がった理由', 128.1, 570, 7),
    (5, '技術を広げるという選択', 151.1, 675, 7),
    (6, 'EVの時代に残る役割', 185.0, 827, 7),
    (7, '冒頭の問いへの答え', 105.9, 464, 5),
]
TOTAL_SECONDS = 1020.0
TOTAL_CHARS = 4536
PAUSE_SECONDS = 0.3   # beat間の短い自然な間
FSTART = 0.4          # scene冒頭の開始オフセット（0.4秒＝12フレーム）
FTAIL = 0.5           # scene末尾の余白

# 承認済みVOICE設定（V9正本 toyota01-v9-voice.jsonの値を踏襲）
VOICE_SPEEDS = {'ナレ2': 1.04, 'ミーノ': 1.06, 'カーノ': 0.9, 'ルーノ': 1.04}
NARRATOR_QUERY = {'pitchScale': -0.06, 'intonationScale': 0.75}
CHAR_OF = {'ミーノ': 'miino', 'カーノ': 'kano', 'ルーノ': 'luno'}
SPEAKER_NAMES = set(VOICE_SPEEDS)
CARD_TOKEN = '（カード）'
SEMI = '：'
SPEAKER_RE = re.compile(r'^(ナレ2|ミーノ|カーノ|ルーノ)：\s*')

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
    """字幕用chunk。一度に字幕ボックスへ詰めない（30〜40字目安で切替）。"""
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
        while len(piece) > 44:
            half = len(piece) // 2
            out.append(piece[:half])
            piece = piece[half:]
        out.append(piece)
    return out


def parse_script() -> list[dict]:
    rows = []
    pattern = re.compile(r'^\|(\d)-(\d{1,2})\|')
    in_region = False  # 第5〜11節のscene表だけを対象（第12節の変更表は対象外）
    for line in SCRIPT_MD.read_text(encoding='utf-8').splitlines():
        if line.startswith('## 5.'):
            in_region = True
        elif line.startswith('## 12.'):
            in_region = False
        if not in_region or not pattern.match(line):
            continue
        cells = line.strip().strip('|').split('|')
        if len(cells) != 7:
            raise RuntimeError(f'表の列数が7ではありません: {line[:80]}...')
        row_id = cells[0].strip()
        rows.append({
            'id': row_id,
            'planned': float(cells[1]),
            'time': cells[2].strip(),
            'speaker': cells[3].strip(),
            'text': cells[4].strip(),
            'screen': cells[5].strip(),
            'evidence': [e.strip() for e in cells[6].replace('—', '').split('・') if e.strip()],
            'chapterNo': int(row_id[0]),
            'sceneNo': int(row_id.split('-')[1]),
        })
    return rows


# scene別の画面構成（台本の画面指示に沿うコードSVG。実在人物の架空発言・新事実は置かない）
FIGURES: dict[str, dict] = {
    '0-1': {'visual': 'openingTalk', 'character': 'miino'},
    '0-2': {'visual': 'openingTalk', 'character': 'kano'},
    '0-3': {'visual': 'openingTalk', 'character': 'luno'},
    '0-4': {'visual': 'answerTitle'},
    '0-5': {'visual': 'conference', 'year': '1997'},
    '0-6': {'visual': 'carReveal', 'stamp': '1997年12月', 'title': '初代プリウス',
            'sub': 'トヨタ自体が造り上げた'},
    '0-7': {'visual': 'timelineShow', 'headline': '29年の流れ',
            'stops': [{'t': '1997', 'd': '量産開始'}, {'t': '2000', 'd': '海外へ'},
                      {'t': '2015', 'd': '特許無償'}, {'t': '2019', 'd': '電動化へ'},
                      {'t': '2025', 'd': '第6世代'}]},
    '0-8': {'visual': 'cardsRow', 'headline': '電動車の3形式',
            'cards': [{'title': 'HEV', 'body': 'ガソリン補給・充電せず', 'tone': 'blue'},
                      {'title': 'PHEV', 'body': '外部からも充電可', 'tone': 'gold'},
                      {'title': 'BEV', 'body': '充電した電気のみ', 'tone': 'green'}]},
    '0-9': {'visual': 'carAnnounce', 'year': '2025', 'stamp': '2025.5.21　新型RAV4発表',
            'title': '第6世代システム', 'sub': 'PHEVに搭載'},
    '0-10': {'visual': 'timelineShow', 'headline': '1997年の画面へ', 'back': True},
    '1-1': {'visual': 'chapterCard'},
    '1-2': {'visual': 'conference', 'stamp': '1997.12.11　採択', 'year': '1997'},
    '1-3': {'visual': 'globeCO2'},
    '1-4': {'visual': 'twoTracks', 'sub': '別々の時系列'},
    '1-5': {'visual': 'worldFirstStamps', 'stamps': ['世界初', '量産']},
    '1-6': {'visual': 'patentFly2015', 'year': '2015', 'patentCount': 5680},
    '1-7': {'visual': 'patentSwarm2019', 'year': '2019', 'patentCount': 23740},
    '1-8': {'visual': 'freeStamp', 'stamp': '無償'},
    '1-9': {'visual': 'count15m', 'year': '2020'},
    '1-10': {'visual': 'timelineShow', 'headline': '1997年と現代を重ねる'},
    '2-0': {'visual': 'chapterCard'},
    '2-1': {'visual': 'g21Meeting', 'year': '1993'},
    '2-2': {'visual': 'cardsRow', 'headline': '目標の引き上げ', 'arrow': True,
            'cards': [{'title': '1.5倍', 'body': 'G21が最初に決めた目標', 'tone': 'blue'},
                      {'title': '2倍', 'body': '責任者からの指示', 'tone': 'red'}]},
    '2-3': {'visual': 'flowDiagram',
            'flow': {'nodes': [{'label': '基本コンセプト承認', 't': '1994夏', 'x': 300, 'y': 240, 'icon': 'people'},
                               {'label': '東京モーターショー', 't': '1995秋', 'x': 1220, 'y': 240, 'icon': 'car'}],
                     'edges': [{'from': 0, 'to': 1, 'label': '出展へ'}]}},
    '2-4': {'visual': 'prototypeWorkshop', 'year': '1995'},
    '2-5': {'visual': 'flowDiagram', 'year': '1996',
            'flow': {'nodes': [{'label': 'トヨタ自動車', 'x': 250, 'y': 150, 'icon': 'factory'},
                               {'label': '松下電器産業', 'x': 250, 'y': 380, 'icon': 'factory'},
                               {'label': '合弁会社', 't': '1996.12', 'x': 1150, 'y': 265, 'icon': 'battery'}],
                     'edges': [{'from': 0, 'to': 2, 'label': '合弁'}, {'from': 1, 'to': 2, 'label': '電池パック'}],
                     'note': '1997年1月　電動車両開発の新部門'}},
    '2-6': {'visual': 'flowDiagram', 'year': '1997', 'stamp': '1997年3月　THS発表',
            'flow': {'nodes': [{'label': 'エンジン', 'x': 230, 'y': 150, 'icon': 'engine'},
                               {'label': 'モーター・発電機', 'x': 230, 'y': 380, 'icon': 'motor'},
                               {'label': '動力分割装置', 'x': 760, 'y': 265, 'icon': 'split'},
                               {'label': '車輪', 'x': 1290, 'y': 265, 'icon': 'wheel'}],
                     'edges': [{'from': 0, 'to': 2}, {'from': 1, 'to': 2},
                               {'from': 2, 'to': 3, 'label': '分けて使う'}],
                     'note': '1997年12月　初代プリウス発売'}},
    '3-0': {'visual': 'chapterCard'},
    '3-1': {'visual': 'driveShot', 'headline': '低速走行：静かに発進'},
    '3-2': {'visual': 'driveShot', 'headline': '加速：エンジン＋モーター'},
    '3-3': {'visual': 'flowDiagram', 'headline': '回生',
            'flow': {'nodes': [{'label': '車輪', 't': '減速時', 'x': 300, 'y': 260, 'icon': 'wheel'},
                               {'label': 'モーター', 'x': 770, 'y': 260, 'icon': 'motor'},
                               {'label': '電池', 'x': 1230, 'y': 260, 'icon': 'battery'}],
                     'edges': [{'from': 0, 'to': 1, 'label': '回生'},
                               {'from': 1, 'to': 2, 'label': '電気で戻す'}]}},
    '3-4': {'visual': 'driveShot', 'headline': '信号待ち：再始動'},
    '3-5': {'visual': 'gauges', 'headline': '電池とガソリン'},
    '3-6': {'visual': 'flowDiagram', 'headline': '動力分割',
            'flow': {'nodes': [{'label': 'エンジン', 'x': 230, 'y': 170, 'icon': 'engine'},
                               {'label': '動力分割装置', 'x': 640, 'y': 170, 'icon': 'split'},
                               {'label': '車輪', 'x': 1150, 'y': 90, 'icon': 'wheel'},
                               {'label': 'モーター・発電機', 'x': 1150, 'y': 290, 'icon': 'motor'},
                               {'label': '電池', 'x': 640, 'y': 385, 'icon': 'battery'}],
                     'edges': [{'from': 0, 'to': 1}, {'from': 1, 'to': 2, 'label': '走る'},
                               {'from': 1, 'to': 3, 'label': '発電'},
                               {'from': 3, 'to': 4, 'label': 'ためて再利用'}]}},
    '4-0': {'visual': 'chapterCard'},
    '4-1': {'visual': 'exportShip', 'year': '2000', 'headline': '北米・欧州へ'},
    '4-2': {'visual': 'flowDiagram', 'year': '2003',
            'flow': {'nodes': [{'label': 'エンジン', 'x': 300, 'y': 260, 'icon': 'engine'},
                               {'label': 'THS II', 't': '高圧化', 'x': 770, 'y': 260, 'icon': 'split'},
                               {'label': 'モーター', 'x': 1230, 'y': 260, 'icon': 'motor'}],
                     'edges': [{'from': 0, 'to': 1}, {'from': 1, 'to': 2, 'label': '出力向上'}],
                     'note': '2003年9月　第2代プリウス'}},
    '4-3': {'visual': 'cardsRow', 'headline': '車種を広げる',
            'cards': [{'title': 'ミニバン', 'body': '2001年・エスティマ', 'tone': 'blue'},
                      {'title': 'SUV', 'body': '2005年・第一モデル', 'tone': 'gold'},
                      {'title': 'セダン', 'body': 'レクサス2006・2007', 'tone': 'green'}]},
    '4-4': {'visual': 'globePins', 'year': '2010', 'headline': '生産も海外へ',
            'pins': [{'t': '中国', 'd': '2005'}, {'t': 'アメリカ', 'd': '2006'},
                     {'t': 'イギリス', 'd': '2010'}]},
    '4-5': {'visual': 'barsChart', 'headline': '累計の伸び',
            'bars': {'items': [{'label': '2007.5', 'value': '100万台', 'ratio': 0.35},
                               {'label': '2009.9', 'value': '200万台', 'ratio': 0.65},
                               {'label': '2011.2', 'value': '300万台', 'ratio': 0.95}],
                     'note': '発売以来の累計'}},
    '4-6': {'visual': 'count15m', 'year': '2020', 'sub': 'プリウスの名前を引き継いだ車も'},
    '5-0': {'visual': 'chapterCard'},
    '5-1': {'visual': 'fcvRelease', 'year': '2015'},
    '5-2': {'visual': 'cardsRow', 'year': '2015', 'headline': '条件と期限の整理',
            'cards': [{'title': '燃料電池車の特許', 'body': '許諾は2020年頃まで', 'tone': 'blue'},
                      {'title': '水素ステーション約70件', 'body': '無期限', 'tone': 'green'}]},
    '5-3': {'visual': 'patentScope', 'year': '2019'},
    '5-4': {'visual': 'cardsRow', 'headline': '2015年と2019年を比べる',
            'cards': [{'title': '2015.1', 'body': '燃料電池車・約5,680件', 'tone': 'blue'},
                      {'title': '2019.4', 'body': '電動化全般・約23,740件', 'tone': 'gold'}]},
    '5-5': {'visual': 'flowDiagram', 'headline': '技術支援の流れ',
            'flow': {'nodes': [{'label': '他社', 'x': 300, 'y': 260, 'icon': 'people'},
                               {'label': '技術支援', 't': '契約ベース', 'x': 770, 'y': 260, 'icon': 'job'},
                               {'label': '調整・性能設定', 'x': 1230, 'y': 260, 'icon': 'job'}],
                     'edges': [{'from': 0, 'to': 1}, {'from': 1, 'to': 2, 'label': '含む'}],
                     'note': 'モーター・電池・PCUの調整'}},
    '5-6': {'visual': 'peoplePanel', 'headline': '社会への広がり'},
    '6-0': {'visual': 'chapterCard'},
    '6-1': {'visual': 'cardsRow', 'headline': '3つの形式',
            'cards': [{'title': 'HEV', 'body': '充電せず・ガソリン補給', 'tone': 'blue'},
                      {'title': 'PHEV', 'body': '外部充電可・エンジン＋モーター', 'tone': 'gold'},
                      {'title': 'BEV', 'body': 'エンジンなし・充電電気', 'tone': 'green'}]},
    '6-2': {'visual': 'cardsRow', 'headline': '充電設備と使う場面', 'sub': '時間は設備・車種・温度・残量で変わる',
            'cards': [{'title': '家・夜間', 'body': '自宅での充電環境', 'tone': 'blue'},
                      {'title': '出先', 'body': '充電設備の有無', 'tone': 'gold'}]},
    '6-3': {'visual': 'flowDiagram', 'headline': 'CO2の流れ',
            'flow': {'nodes': [{'label': '発電', 't': '電源構成', 'x': 300, 'y': 260, 'icon': 'plant'},
                               {'label': '走行時', 'x': 770, 'y': 260, 'icon': 'car'},
                               {'label': '製造〜寿命', 'x': 1230, 'y': 260, 'icon': 'factory'}],
                     'edges': [{'from': 0, 'to': 1, 'label': '条件付き'}, {'from': 1, 'to': 2}],
                     'note': '差は比べる車種・電源などの条件で変わる'}},
    '6-4': {'visual': 'cardsRow', 'headline': '地域と生活スタイル',
            'cards': [{'title': '都市', 'body': '毎日の距離が短い', 'tone': 'blue'},
                      {'title': '郊外', 'body': '車の利用が長め', 'tone': 'gold'},
                      {'title': '長距離', 'body': '週末に遠出', 'tone': 'green'},
                      {'title': '通勤', 'body': '毎日決まった道', 'tone': 'blue'}]},
    '6-5': {'visual': 'carAnnounce', 'year': '2025', 'stamp': '2025.5.21', 'title': '新型RAV4',
            'sub': 'PHEVに第6世代を初搭載'},
    '6-6': {'visual': 'flowDiagram', 'year': '2025', 'headline': 'RAV4発表の整理',
            'flow': {'nodes': [{'label': 'ハイブリッド', 't': '磨いた技術', 'x': 320, 'y': 260, 'icon': 'tech'},
                               {'label': 'PHEV', 't': '外部充電可', 'x': 1200, 'y': 260, 'icon': 'car'}],
                     'edges': [{'from': 0, 'to': 1, 'label': '引き継ぐ'}],
                     'note': '名前は同じでも中身は進化'}},
    '7-0': {'visual': 'chapterCard'},
    '7-1': {'visual': 'questionRecap', 'character': 'miino'},
    '7-2': {'visual': 'barsChart', 'headline': '技術の積み重ね',
            'bars': {'items': [{'label': 'エンジン', 'value': '改良', 'ratio': 0.3},
                               {'label': 'モーター', 'value': '小型化', 'ratio': 0.5},
                               {'label': '回生', 'value': '効率', 'ratio': 0.7},
                               {'label': '電池', 'value': '性能', 'ratio': 0.95}],
                     'note': '約30年の実験と量産'}},
    '7-3': {'visual': 'cardsRow', 'headline': '選び方の整理',
            'cards': [{'title': '地域', 'body': '住む場所の特性', 'tone': 'blue'},
                      {'title': '使い方', 'body': '走る距離・頻度', 'tone': 'gold'},
                      {'title': '電力', 'body': '電源構成の方針', 'tone': 'green'},
                      {'title': '充電環境', 'body': '設備の有無', 'tone': 'blue'}]},
    '7-4': {'visual': 'finale', 'headline': '1997年からの積み重ね',
            'stops': [{'t': '1997', 'd': '二つの答え'}, {'t': '2000', 'd': '海外へ'},
                      {'t': '2015', 'd': 'FCV特許'}, {'t': '2019', 'd': '電動化特許'},
                      {'t': '2025', 'd': '第6世代'}]},
}

CHAPTER_LABELS = {
    0: '00｜冒頭の3人',
    1: '01｜1997年、二つの答え',
    2: '02｜まだ答えのなかった開発',
    3: '03｜エンジンとモーターが助け合う',
    4: '04｜一台のプリウスから広がった理由',
    5: '05｜技術を広げるという選択',
    6: '06｜EVの時代に残る役割',
    7: '07｜冒頭の問いへの答え',
}
FIGURE_KEYS = ('headline', 'sub', 'stamp', 'title', 'stamps', 'cards', 'flow', 'bars',
               'stops', 'pins', 'arrow', 'back', 'finale', 'character', 'patentCount')


def split_beats(row: dict) -> list[dict]:
    """話者列→正文列をbeat列へ展開（話者名・『／』区切りは発話文字数に含めない）。"""
    text = row['text']
    if row['speaker'] == CARD_TOKEN:
        return [{'speaker': None, 'text': text}]
    speakers = [s.strip() for s in row['speaker'].split('→')]
    unknown = [s for s in speakers if s not in SPEAKER_NAMES]
    if unknown:
        raise RuntimeError(f"{row['id']} 未知の話者: {unknown}")
    segments = text.split('／')
    if len(segments) != len(speakers):
        raise RuntimeError(f"{row['id']} 話者数{len(speakers)}と区切り数{len(segments)}が不一致")
    beats = []
    for i, seg in enumerate(segments):
        seg = seg.strip()
        m = SPEAKER_RE.match(seg)
        if m:
            if m.group(1) != speakers[i]:
                raise RuntimeError(f"{row['id']} beat{i}の接頭辞『{m.group(1)}』が話者列『{speakers[i]}』と不一致")
            seg = seg[m.end():]
        beats.append({'speaker': speakers[i], 'text': seg})
    return beats


def plan_stage() -> None:
    rows = parse_script()
    if len(rows) != 60:
        raise RuntimeError(f'台本のscene数が60ではありません: {len(rows)}')

    beats_out: list[dict] = []
    scenes_out: list[dict] = []
    char_by_chapter = {ch: 0 for ch, *_ in FIXED_CHAPTER}
    planned_by_chapter = {ch: 0.0 for ch, *_ in FIXED_CHAPTER}
    planned_total = 0.0
    for row in rows:
        chapter_no = row['chapterNo']
        if chapter_no not in CHAPTER_LABELS:
            raise RuntimeError(f"章番号が範囲外: {row['id']}")
        planned_by_chapter[chapter_no] += row['planned']
        planned_total += row['planned']
        figures = FIGURES.get(row['id'])
        if figures is None:
            raise RuntimeError(f"scene {row['id']} の画面構成が未定義です")
        if figures['visual'] == 'chapterCard':
            if row['speaker'] != CARD_TOKEN:
                raise RuntimeError(f"{row['id']} chapterCardの話者がカードではありません: {row['speaker']}")
            m = re.match(r'^第(\d)章　(.+)$', row['text'])
            if not m or int(m.group(1)) != chapter_no:
                raise RuntimeError(f"{row['id']} カードの章番号不一致: {row['text']}")
            scenes_out.append({
                'id': row['id'], 'chapterNo': chapter_no, 'chapter': CHAPTER_LABELS[chapter_no],
                'year': None, 'visual': 'chapterCard', 'cardNo': f'第{chapter_no}章',
                'cardText': m.group(2), 'plannedSeconds': row['planned'], 'evidence': [],
                'character': None, 'guide': None, 'beatIds': [], 'cueTexts': [],
            })
            continue
        if row['speaker'] == CARD_TOKEN:
            raise RuntimeError(f"{row['id']} カード行なのにchapterCard以外のvisualです")

        beats = split_beats(row)
        scene = {
            'id': row['id'], 'chapterNo': chapter_no, 'chapter': CHAPTER_LABELS[chapter_no],
            'year': figures.get('year'), 'visual': figures['visual'],
            'plannedSeconds': row['planned'], 'evidence': row['evidence'],
        }
        for key in FIGURE_KEYS:
            if key in figures:
                scene[key] = figures[key]
        scene['character'] = figures.get('character')
        guides = [CHAR_OF[b['speaker']] for b in beats if b['speaker'] != 'ナレ2']
        scene['guide'] = guides[0] if guides else None
        beat_ids, cue_texts = [], []
        for b in beats:
            bid = f"{row['id']}-b{len(beat_ids) + 1}"
            beat = {
                'id': bid, 'sceneId': row['id'], 'speaker': b['speaker'],
                'text': b['text'], 'spokenText': to_reading(b['text']),
                'voiceSpeed': VOICE_SPEEDS[b['speaker']],
                'pauseSeconds': PAUSE_SECONDS, 'holdSeconds': 0,
            }
            if b['speaker'] == 'ナレ2':
                beat.update(NARRATOR_QUERY)
            beats_out.append(beat)
            beat_ids.append(bid)
            cue_texts.append(chunk_text(b['text']))
            char_by_chapter[chapter_no] += len(b['text'])
        scene['beatIds'] = beat_ids
        scene['cueTexts'] = cue_texts
        scenes_out.append(scene)

    diffs = []
    for ch, _title, sec, chars, cnt in FIXED_CHAPTER:
        if abs(planned_by_chapter[ch] - sec) > 0.051:
            diffs.append(f"章{ch} 予定秒固定{sec}≠表取り込み{planned_by_chapter[ch]:.1f}")
        if char_by_chapter[ch] != chars:
            diffs.append(f"章{ch} 固定文字数{chars}≠取り込み{char_by_chapter[ch]}")
        n = sum(1 for s in scenes_out if s['chapterNo'] == ch)
        if n != cnt:
            diffs.append(f"章{ch} scene数固定{cnt}≠{n}")
    if abs(planned_total - TOTAL_SECONDS) > 0.051:
        diffs.append(f"総尺固定{TOTAL_SECONDS}≠{planned_total:.1f}")
    total_chars = sum(char_by_chapter.values())
    if total_chars != TOTAL_CHARS:
        diffs.append(f"総文字数固定{TOTAL_CHARS}≠{total_chars}")
    if diffs:
        raise RuntimeError('固定集計との不一致: ' + '; '.join(diffs))

    voice = {
        'note': '本人「一度作ってから修正します」（2026-10-20）。完成版台本v1の全章60sceneを初稿V10用に取り込み。'
                '字幕（text）は算用数字の原文、spokenTextはVOICEVOX読替えのみ。beat間の間0.3s・字幕は30〜40字目安で切替。'
                'ナレ2＝男声2 速度1.04/pitch-0.06/intonation0.75、ミーノ1.06、カーノ0.9、ルーノ1.04（V9承認値を踏襲）。',
        'spec': {'fps': 30, 'startSeconds': FSTART, 'tailSeconds': FTAIL, 'beatPauseSeconds': PAUSE_SECONDS},
        'characters': {
            'ナレ2': {'name': '男声2', 'style': 10000, 'model': 'n0', 'credit': 'VOICEVOX Nemo',
                      'licenseReference': 'https://voicevox.hiroshiba.jp/nemo/term/'},
            'ミーノ': {'name': '櫻歌ミコ', 'style': 43, 'model': '11'},
            'カーノ': {'name': '冥鳴ひまり', 'style': 14, 'model': '1'},
            'ルーノ': {'name': '雨晴はう', 'style': 10, 'model': '0'},
        },
        'beats': beats_out,
        'scenes': scenes_out,
    }
    VOICE_JSON.parent.mkdir(parents=True, exist_ok=True)
    VOICE_JSON.write_text(json.dumps(voice, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f"plan: beats={len(beats_out)} scenes={len(scenes_out)} 発話文字合計={total_chars}（固定{TOTAL_CHARS}と一致）")
    print(f"plan: 予定秒合計={planned_total:.1f}s（固定{TOTAL_SECONDS}と一致）。画面指示の絵はFIGURES＝{len(FIGURES)}件")


def wav_frames(path: Path) -> int:
    with wave.open(str(path), 'rb') as w:
        return w.getnframes()


def merge_stage(result_path: Path) -> None:
    """生成後のbeat実尺をscene WAV・cueへマージし、toyota01-v10.jsonを書く。"""
    loaded = json.loads(VOICE_JSON.read_text(encoding='utf-8'))
    result = json.loads(result_path.read_text(encoding='utf-8'))
    updated = {b['id']: b for b in result.get('beats', [])}
    beats = []
    for b in loaded['beats']:
        u = updated.get(b['id'])
        if not u or 'audio' not in u:
            raise RuntimeError(f"beat {b['id']} の実尺がありません（先にgenerate-voice-v10.pyを実行）")
        b['audio'] = u['audio']
        beats.append(b)
    loaded['beats'] = beats
    audio_dir = ROOT / 'public' / AUDIO_REL
    data_scenes = []
    total_frames = 0
    planned_by_ch = {str(ch): 0.0 for ch, *_ in FIXED_CHAPTER}
    for scene in loaded['scenes']:
        sid = scene['id']
        planned_by_ch[sid[0]] += scene['plannedSeconds']
        scene_beats = [b for b in beats if b['sceneId'] == sid]
        if not scene_beats:  # 章カード: 音声なし
            frame = int(round(scene['plannedSeconds'] * 30))
            data_scenes.append({
                'id': sid, 'chapterNo': scene['chapterNo'], 'chapter': scene['chapter'],
                'year': None, 'visual': 'chapterCard', 'cardNo': scene['cardNo'],
                'cardText': scene['cardText'], 'plannedSeconds': scene['plannedSeconds'],
                'seconds': scene['plannedSeconds'], 'frames': frame, 'evidence': [],
                'audio': None, 'beats': [], 'cues': [],
            })
            total_frames += frame
            continue
        offset = 0
        beat_meta = []
        cues = []
        for i, b in enumerate(scene_beats):
            n = wav_frames(audio_dir / f"{b['id']}.wav")
            if abs(n / 24000 - b['audio']['seconds']) > 0.003:
                raise RuntimeError(f"beat {b['id']} 実WAV {n / 24000:.3f}s とJSON {b['audio']['seconds']:.3f}s が不一致")
            start = offset / 24000
            beat_meta.append({'id': b['id'], 'speaker': b['speaker'], 'text': b['text'],
                              'startSecond': round(start, 3), 'seconds': round(n / 24000, 3)})
            texts = scene['cueTexts'][i]
            spoken_len = sum(len(t) for t in texts)
            chunk_frames = n / 24000
            acc = 0
            for t in texts:
                frac0 = acc / spoken_len
                acc += len(t)
                frac1 = acc / spoken_len
                cues.append({'start': round(FSTART + start + chunk_frames * frac0, 3),
                             'end': round(FSTART + start + chunk_frames * frac1, 3),
                             'speaker': b['speaker'], 'text': t})
            gap = round(24000 * b['pauseSeconds']) if i < len(scene_beats) - 1 else 0
            offset += n + gap
        scene_frames = wav_frames(audio_dir / f'scene-{sid}.wav')
        wav_dur = scene_frames / 24000
        if abs(wav_dur - offset / 24000) > 0.01:
            raise RuntimeError(f"scene {sid} の合成規則 {offset / 24000:.3f}s と実WAV {wav_dur:.3f}s が不一致")
        computed = wav_dur + FSTART + FTAIL
        seconds = max(scene['plannedSeconds'], computed)
        frames = math.ceil(seconds * 30 - 1e-9)
        seconds = frames / 30
        if cues:
            cues[-1]['end'] = seconds
        entry = {
            'id': sid, 'chapterNo': scene['chapterNo'], 'chapter': scene['chapter'],
            'year': scene.get('year'), 'visual': scene['visual'],
            'character': scene.get('character'), 'guide': scene.get('guide'),
            'plannedSeconds': scene['plannedSeconds'], 'seconds': seconds, 'frames': frames,
            'evidence': scene.get('evidence', []),
            'audio': {'src': f'{AUDIO_REL}/scene-{sid}.wav', 'seconds': round(wav_dur, 3)},
            'beats': beat_meta, 'cues': cues,
        }
        for key in FIGURE_KEYS + ('cardNo', 'cardText', 'variant'):
            if key in scene and key not in ('character',):
                entry[key] = scene[key]
        data_scenes.append(entry)
        total_frames += frames

    chapter_actual = {str(ch): sum(s['seconds'] for s in data_scenes if s['id'][0] == str(ch))
                      for ch, *_ in FIXED_CHAPTER}
    data = {
        'title': 'トヨタロング解説 初稿v10（全章60scene・音声付き）',
        'note': '本人「一度作ってから修正します」で完成版台本v1に沿い一括制作した初稿。'
                '各sceneの秒＝max(台本予定秒, scene音声実尺+開始0.4s+末尾0.5s)をフレーム切上げした実値。'
                '字幕文は算用数字の原文、VOICEVOX読替え表記はvoice JSON。声はV9承認設定（Nemo男声2／櫻歌ミコ／冥鳴ひまり／雨晴はう）。',
        'narrator': {'id': 'narrator', 'label': '男性ナレーター（画面外）', 'credit': 'VOICEVOX Nemo'},
        'audioSpec': {'fps': 30, 'startSeconds': FSTART, 'tailSeconds': FTAIL},
        'credits': {'narration': 'VOICEVOX Nemo',
                    'dialogue': 'VOICEVOX:櫻歌ミコ／冥鳴ひまり／雨晴はう',
                    'licenseReference': 'https://voicevox.hiroshiba.jp/nemo/term/'},
        'durationFrames': total_frames,
        'totalSeconds': round(total_frames / 30, 3),
        'plannedChapterSeconds': planned_by_ch,
        'chapterSeconds': chapter_actual,
        'scenes': data_scenes,
    }
    DATA_JSON.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    # 音声実尺を反映したbeat記録をvoice JSONへ書き戻す（チェッカーが実WAVとの一致を確認する）
    VOICE_JSON.write_text(json.dumps(loaded, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    seconds_total = total_frames / 30
    print(f"merge: scenes={len(data_scenes)} frames={total_frames} 総尺={seconds_total:.1f}s（{seconds_total / 60:.2f}分）")
    if not (900 <= seconds_total <= 1200):
        print('警告: 総尺が15〜20分の窓外です。速度変更で合わせず、Codexへ報告すること', file=sys.stderr)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--audio', type=Path,
                        help='generate-voice-v10.pyの--result JSONを渡すと実尺マージを行う')
    args = parser.parse_args()
    if args.audio:
        merge_stage(args.audio)
    else:
        plan_stage()


if __name__ == '__main__':
    main()
