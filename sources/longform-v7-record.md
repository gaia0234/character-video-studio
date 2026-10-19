# ロング解説 v7 — 掛け合い構成修正＋低めナレーター版

現在の結論：本人指示（2026-10-19）により「ルーノ左／ミーノ中央／カーノ右」「ミーノ=疑問定義・カーノ=補足・ルーノ=答えと進行（3行目をルーノ声へ変更）」「より低い声の男性ナレーター」へ構成・声を修正したv7。ナレーターはVOICEVOX Nemo男声1のpitchScale=-0.06／intonationScale=0.75／speedScale=0.94（Codex側が聴取比較用に生成したB設定・`output/longform-v6-review/`のplan-and-settings.jsonで語彙・範囲確認済み）を採用し全16本を再生成。本人の「サンプルから作成できるなら吹き込むよ」→「いや音声合成で作成できない?」への回答として合成での本編化を実施。収録中断はなし。

## 本人指示（2026-10-19 05時台後半）

1. ルーノを左、ミーノが中央、カーノが右
2. ミーノが疑問定義、カーノが補足、ルーノが答えと進行
   - 実装上の解釈：前回の3行目「それじゃあ、トヨタのハイブリッドの歴史をひもといてみよう！」は「進行」扱いミーノ→**ルーノ**へ変更（解釈違いなら本人指示で差し替え）
3. もっと低い声の男性ナレーター → 音声合成で対応（B設定採用）

## 新規作成ファイル

| ファイル | 内容 |
|---|---|
| `src/data/longform/toyota01-v7-voice.json` | 生成用beats 19本（会話3＋ナレーター16）。RNAレーターはpitch/intonation/speed指定 |
| `public/audio/longform-toyota01-v7/*.wav` | 19本（24kHz mono PCM16・非無音）。query実値：speedScale 0.94／pitchScale -0.06／intonationScale 0.75 確認済み |
| `output/longform-v7-review/audio/toyota01-v7-result.json` | 実測・voiceCredits（VOICEVOX:櫻歌ミコ／冥鳴ひまり／雨晴はう／Nemo） |
| `src/data/longform/toyota01-v7.json` | v6構造からaudio参照・秒数（audio+0.9ルール）・3行目役割を更新。20シーン／3147フレーム（104.9秒） |
| `src/longform/LongformToyota01V7.tsx` | V6複製＋OpeningTalk並び変更（luno 210／miino 760／kano 1360） |
| `src/Root-v7.tsx`・`src/index-v7.ts` | 専用エントリ |
| `scripts/check-longform-v7.mjs` | v6検査複製 |

- 会話1・2本目の音声パラメータ（クーノ1.06／カーノ0.90）・読み上げ文はv6と同一（本directoryに再生成）。ルーノ1本目は雨晴はう（style 10・speed1.04）。
- 既存共有ファイルはもちろん非編集。Codex側の並行v6/v7-filesystemworkへの干渉なし。

## 検証結果（2026-10-19、随時追記）

- 台本検査：`node scripts/check-longform-v7.mjs` — 20シーン／3147フレーム／official=3147、ERROR 0／WARN 1（1-4字幕45文字・既知）。`npm run check` exit 0。
- 音声生成：19本exit 0・非無音。0-7＝6.901秒 等、実秒はresult.json参照。
- レンダー：`npx remotion render src/index-v7.ts LongformToyota01V7 …` exit 0、3147/3147。
- 音量統一：2-pass loudnorm（動的・TP=-2.2指定。v6と同様、エンコ後のAACオーバーシュートを込みで目標帯へ）。**最終：I=-14.3 LUFS／TP=-1.8 dBTP**（読戻し実測）。復号確認：全長104.917秒・非無音（peak -1.61 dBFS／RMS -17.51 dBFS）。
- 成果物：`output/longform-toyota01-v7-lufs14.mp4`（7,154,949 bytes・moovあり）。
- コマ目視：`output/longform-v7-review/sheets/`（7枚）＋代表フレーム直接抽出（8.5秒＝カーノ強調・16.0秒＝ルーノ強調・金色ラベル確認）。並び・強調・字幕とも本人指示どおり。残部はv6内容のまま。重大な見切れ・欠落なし。
- 共有：`\\192.168.1.115\Shared\Transfer\character-video-studio\2026-10-19-longform-v7\longform-toyota01-v7-lufs14.mp4`。SHA-256 `4c3b6810…94d44` 読戻し一致。

## 未確認・残作業

- B設定（低め）の声質は本人聴取待ち。もう一声低い／気がとの調整はpitchScale等の追加指定で対応可能。
- 分離方式の記録統合（sources.md／台本正本）はCodex側停止確認後に別途承認。
- `public/audio/longform-toyota01-narrator-v5/`（重複）は削除候補、本人指示時のみ。
- push・公開は対象外。
