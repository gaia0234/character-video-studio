#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""エルダーチャンネルのキャラSVGから表情差分を生成する（純Python標準ライブラリのみ）。

基準SVGの #mouth（口）と #brows（眉）を差し替えて表情版を作る。キャラ形状・配色は不変。
usage: python3 build-elder-expressions.py
出力: public/assets/characters/elder-svg/{homer,judd,kent}-{expression}.svg
"""
import json
import re
from pathlib import Path

D = Path('/home/ds-work/projects/character-video-studio/public/assets/characters/elder-svg')

# 表情定義（mouth: 口の要素／brows: 眉のパス）
EXPRESSIONS = {
    'homer': {
        'happy': {
            'mouth': '<path d="M112 156 Q136 178 160 156" fill="none" stroke-width="4.5"/>',
            'brows': '<path d="M114 128 L132 123" /><path d="M140 123 L158 128" />',
        },
        'cheer': {
            'mouth': '<ellipse cx="136" cy="164" rx="13" ry="10" fill="#111111" stroke="none"/>',
            'brows': '<path d="M112 124 L132 116" /><path d="M140 116 L160 124" />',
        },
    },
    'judd': {
        'sigh': {
            'mouth': '<ellipse cx="140" cy="188" rx="11" ry="6" fill="#111111" stroke="none"/>',
            'brows': '<path d="M116 140 L134 132" /><path d="M146 132 L164 140" />',
        },
        'stern': {
            'mouth': '<path d="M120 188 L160 186" fill="none" stroke-width="4.5"/>',
            'brows': '<path d="M116 136 L134 143" /><path d="M146 143 L164 136" />',
        },
    },
    'kent': {
        'nod': {
            'mouth': '<path d="M124 176 L148 176" fill="none" stroke-width="4.5"/>',
            'brows': '<path d="M112 132 L132 130" /><path d="M140 130 L160 132" />',
        },
        'think': {
            'mouth': '<ellipse cx="136" cy="176" rx="7" ry="6" fill="#111111" stroke="none"/>',
            'brows': '<path d="M110 126 L132 118" /><path d="M142 130 L162 132" />',
        },
    },
}


def build(base_name, expression, spec):
    src = (D / base_name).read_text(encoding='utf-8')
    out = re.sub(r'<g id="mouth">.*?</g>', '<g id="mouth">%s</g>' % spec['mouth'], src, count=1, flags=re.S)
    out = re.sub(r'<g id="brows"[^>]*>.*?</g>',
                 '<g id="brows" fill="none" stroke="#111111" stroke-width="3.5" stroke-linecap="round">%s</g>' % spec['brows'],
                 out, count=1, flags=re.S)
    key = base_name.replace('.svg', '')
    out = re.sub(r'<title>.*?</title>', '<title>%s（%s）</title>' % (key, expression), out, count=1, flags=re.S)
    path = D / ('%s-%s.svg' % (key, expression))
    path.write_text(out, encoding='utf-8')
    return path


def main():
    made = []
    for key, exprs in EXPRESSIONS.items():
        for name, spec in exprs.items():
            p = build('%s.svg' % key, name, spec)
            made.append(str(p))
            print('%s: %d bytes' % (p.name, p.stat().st_size))
    (D / 'expressions.json').write_text(json.dumps(
        {k: sorted(v.keys()) for k, v in EXPRESSIONS.items()}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
