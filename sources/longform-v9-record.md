# ロング解説 v9 — 男声2・少し早め版

現在の結論：本人指示「少し早く」（2026-10-19）により、ナレーター男声2（style 10000・pitch -0.06／intonation 0.75は維持）の速度を0.94→**1.04**へ再生成。会話・演出はv8不変。全体121.6秒（v8比-5.1秒。VOICEVOXの文末休止は速度で変わらないため、読み本体は約10%速くなるが全体短縮は控えめ）。

## 新規作成ファイル

| ファイル | 内容 |
|---|---|
| `src/data/longform/toyota01-v9-voice.json` | 生成用beats 19本（voiceSpeed 1.04はbeat単位指定） |
| `public/audio/longform-toyota01-v9/*.wav` | 19本（24kHz mono PCM16・非無音） |
| `output/longform-v9-review/audio/…` | 実測・wave-seconds.json |
| `src/data/longform/toyota01-v9.json` | v8構造からaudio参照・秒数更新。20シーン／3648フレーム（121.6秒） |
| `src/longform/LongformToyota01V9.tsx` | V8複製 |
| `src/Root-v9.tsx`・`src/index-v9.ts` | 専用エントリ |
| `scripts/check-longform-v9.mjs` | v8検査複製 |

## 検証結果（2026-10-19、随時追記）

- 台本検査：20シーン／3648フレーム／official=3648、ERROR 0／WARN 1（既知）。`npm run check` exit 0。
- 音声生成：19本 exit 0・非無音。
- レンダー：`npx remotion render src/index-v9.ts LongformToyota01V9 …` exit 0、3648/3648。
- 音量統一：2-pass loudnorm（dynamic・TP=-2.2指定）。**最終：I=-14.3 LUFS／TP=-2.0 dBTP**（読戻し実測）。復号確認：全長121.600秒・非無音（peak -1.56 dBFS／RMS -17.76 dBFS）。
- 成果物：`output/longform-toyota01-v9-lufs14.mp4`（7,575,084 bytes・moovあり）。
- コマ目視：`output/longform-v9-review/sheets/`（全8枚）。冒頭（会話3シーン・v8同一）から末尾timelineEnd（121.0秒）まで正常。重大な見切れ・欠落なし。
- 共有：`\\192.168.1.115\Shared\Transfer\character-video-studio\2026-10-19-longform-v9-faster\longform-toyota01-v9-lufs14.mp4`。SHA-256 `09e11823…cc8285` 読戻し一致。
- ローカルcommit：本節のv9ファイル群（pushなし）。

## 未確認・残作業

- 1.04倍の読みペースは本編視聴で判断（さらに早め／戻しは速度1段階調整で対応）。
- 分離方式の記録統合はCodex側停止確認後に別途承認。
- 削除候補：`public/audio/longform-toyota01-narrator-v5/`、`public/audio/longform-v8-audition/`、`output/longform-v8-review/sheets/`（7枚の不完全物）、`/tmp/opencode/*`。本人指示時のみ。
- push・公開は対象外。
