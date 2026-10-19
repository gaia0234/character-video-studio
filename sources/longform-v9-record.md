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

## credit修正（oc-credit-20261019、2026-10-19）

現在の結論：本人の品質比較（Codex統括・GLM/DS候補比較）で**DS横並び案を採用**（GLM縦積み案は字幕干渉懸念で未採用）。末尾シーンに「掛け合い｜VOICEVOX:櫻歌ミコ／冥鳴ひまり／雨晴はう」Label（left 740・top 790・fontSize 25）を3行追加し、既存のNemoナレーションLabel（left 150）は変更せず横並び。119秒stillを案件Codexが原寸目視で技術受入。本人の画面受入は未確認。全尺レンダー・音量統一まで完了、**共有は未実施**（本人の共有承認待ち）。

- 対象差分：`src/longform/LongformToyota01V9.tsx` 3行追加のみ（基点b50eab4でbaseline一致・適用差分はDS候補パッチと正規化照合で一致）。GLM比較側の記録は `output/opencode-quality-20261019/glm/result.json`。
- 検証：`npm run check` exit 0（TS error 0）／台本検査ERROR 0・WARN 1（既知）／レンダーexit 0（3648f・`--concurrency=2`）／loudnorm 2pass（音声の参照・配置は非変更、pass1も元V9同一値、pass2 TP=-2.2）→ **最終 I=-14.3 LUFS／TP=-2.0 dBTP・121.600秒・非無音（peak -1.56/RMS -17.76 dBFS）**。
- 成果物（共有前・ローカル）：`output/longform-toyota01-v9-credits.mp4`（SHA-256 `81052718…7c114`）、`output/longform-toyota01-v9-credits-lufs14.mp4`（SHA-256 `43d25d35…9a00a`・7,582,369 bytes・moovあり）。証拠は `output/longform-v9-credit-review/verification.json`・`closing.png`（受入済み）・`final-closing.png`（完成MP4の119秒、受入stillと同一表示）。
- 指示是正1件：静止画は `remotion render --frames` 誤り→案件Codexの指示で `remotion still --frame` へ訂正（実行前停止）。
- Codex技術受入（2026-10-19）：完成MP4由来`final-closing.png`原寸と`verification.json`を確認し、横並びcredit・字幕/カーノ/年表非干渉・実音/音量/尺/出力を受入。**本人の聴取・画面受入は未実施、共有も保留**。`closing.png`の受入もCodex技術受入であり本人受入ではない（verification.json訂正済み）。
- 共有区分：**原V9（`2026-10-19-longform-v9-faster/`）は共有済み**。今回のcredit版（`longform-toyota01-v9-credits-lufs14.mp4`）は**未共有**で、Transfer `2026-10-19-longform-v9-credits/` は承認確認後の最終工程。
- 一時物（保全対象外・削除候補）：`/tmp/opencode/v9c-audio.wav`・`/tmp/opencode/v9c-verify.wav`（音量確認用復号）、`/tmp/opencode/credit-applied.diff`・`/tmp/opencode/check-v9-credit.log`・`/tmp/opencode/render-v9-credits.log`（適用・検査・レンダーログ）、`/tmp/opencode/glm-v8-after/`（GLM比較時のafter版・パッチ検証用）。証拠として保全する物：`output/longform-v9-credit-review/` 配下（closing.png・final-closing.png・verification.json）。
- stage/commit：Main側が3ファイル（本TSX・本記録・sources.md完了節）を分離して担当のため、OpenCode側は実施しない。他のdirty変更には触れない。
- 反復は未実施：全編シート・音声生成・台本検査・型検査の再実行は不要とされ、今回追加検証なし（残りの再検証・再生成なし）。

## 未確認・残作業

- 1.04倍の読みペースは本編視聴で判断（さらに早め／戻しは速度1段階調整で対応）。
- 分離方式の記録統合はCodex側停止確認後に別途承認。
- 削除候補：`public/audio/longform-toyota01-narrator-v5/`、`public/audio/longform-v8-audition/`、`output/longform-v8-review/sheets/`（7枚の不完全物）、`/tmp/opencode/*`。本人指示時のみ。
- push・公開は対象外。
