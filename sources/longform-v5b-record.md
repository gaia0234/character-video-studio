# ロング解説 v5b — OpenCode側セッションの分離検証制作記録

現在の結論：v5（男性ナレーター＝VOICEVOX Nemo 男声1・役割分離）の内容を、Codex側セッションと同一の共有ファイルを一切編集しない形で新規ファイル複製により完成させた分離検証版。技術検査・レンダー・共有まで完了。音声の本採用は本人聴取待ち。正本 `sources/sources.md` への統合はCodex側セッション停止の確認後、別途本人承認を得て行う（本ファイルは分担記録とする）。

## 背景・分離方針（2026-10-19）

- 承認されたv5（sources.md「v5：ナレーター・説明役・登場人物の分離（承認済み／作業中）」）の残工程（レンダー・音量統一・コマ確認・共有・記録）を、OpenCode側セッションが実施。
- 当時の観測：Codex側セッションが同じWorktreeのv5作業を並行実施中（2026-10-19 04:20 task_complete・04:28以降もファイル更新あり）。本人指示「同じファイルは編集しないよう新たなファイルを作成する」に従い、共有ファイル（`toyota01.json`・`LongformToyota01.tsx`・`Root.tsx`・`sources.md`・既存scripts）は一切編集せず、複製＋専用エントリで分離。

## 新規作成ファイル

| ファイル | 内容 |
|---|---|
| `src/data/longform/toyota01-v5b.json` | 現行検証済み `toyota01.json`（Codex側2026-10-19 87.5秒/2625f版）の複製＋title/noteにv5b表記 |
| `src/longform/LongformToyota01V5B.tsx` | 現行TSXの複製（import先とコンポーネント名のみ差し替え。diff照合済み） |
| `src/Root-v5b.tsx`・`src/index-v5b.ts` | 専用エントリ。Composition「LongformToyota01V5B」のみ登録 |
| `scripts/check-longform-v5b.mjs` | `check-longform.mjs` の複製（対象JSONのみ差し替え、diff照合済み） |

- 音声は再生成せず、Codex側が生成した `public/audio/longform-toyota01-v5/*.wav` を参照（当セッションが04:05に同仕様で生成した `public/audio/longform-toyota01-narrator-v5/*.wav` は内容byte一致の重複であり未使用。削除は別途本人承認）。
- 台本文・秒数・字幕・演出に変更なし。

## 検証結果（2026-10-19 05時台・OpenCode側）

- **台本検査**：`node scripts/check-longform-v5b.mjs` — 17シーン / 2625フレーム / official=2625、ERROR 0件 / WARN 1件（1-4字幕45文字・既知の指摘と同一）。`npm run check`（tsc全体）exit 0。
- **レンダー**：`npx remotion render src/index-v5b.ts LongformToyota01V5B …` exit 0、2625/2625エンコード。`output/longform-toyota01-v5b.mp4`（7,000,563 bytes・moovあり）。
- **音量統一**：ffmpeg（Remotion同梱）2-pass loudnorm。実測 input I=-19.30 LUFS / TP=-4.41 dBTP → pass2 linear適用後 **Output I=-14.0 LUFS / TP=-1.5 dBTP**。復号確認：全長87.509秒・非無音（peak -1.20 dBFS / RMS -17.36 dBFS）。
- **成果物**：`output/longform-toyota01-v5b-lufs14.mp4`（5,186,516 bytes・moovあり）。
- **全編コマ目視**：`output/longform-v5b-review/`（sheet-01〜06）。0〜87.3秒の全コマで重大な見切れ・素材欠落・字幕欠落なし。ナレーター出典ラベル（台詞：VOICEVOX Nemo）が章1全体で表示。末尾セルは動画長を超えるシート余白であり問題なし。
- **共有**：`\\192.168.1.115\Shared\Transfer\character-video-studio\2026-10-19-longform-v5b\longform-toyota01-v5b-lufs14.mp4`（実パス `/mnt/CE14D65D14D6485B/Shared/Transfer/…`）。SHA-256 `4dc0b4e0075be01b…d48` が元ファイルと一致。

## 未確認・残作業

- **声の本採用は本人聴取待ち**（Codex側と同一条件・Nemo男声1/Style 10001/速度0.99）。発音・声質の判断は本人のみ可能。
- 正本 `sources/sources.md` への本記録の統合は、Codex側セッション停止の確認後、別途本人承認を得て行う。本ファイルは分担記録。
- 重複生成した `public/audio/longform-toyota01-narrator-v5/`（内容byte一致の未使用WAV 16本）は削除候補。削除は本人指示時のみ。
- v3品質検査由来の未承認修正提案（1-4字幕45文字の分割等）は本版でも未適用（台本文維持の方針）。
- push・公開は対象外。ローカルcommitのみ実施。
