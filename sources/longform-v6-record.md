# ロング解説 v6 — 冒頭3キャラ掛け合い版

現在の結論：v5b（男性ナレーターNemo＋役割分離）に、本人指示（2026-10-19 05時台）の冒頭掛け合い3シーンを挿入したv6。ミーノ／カーノのセリフ音声は既存VOICEVOXキャラ声で新規生成、ナレーターはNemo男声1のまま。既存台本文・演出・シーン秒数は変更なし。分離方式（共有ファイルを一切編集しない新規ファイル構成）をv5bから継続。技術検査・レンダー・共有まで完了。音声の本採用は本人聴取待ち。

## 本人指示（2026-10-19）

1. ミーノ → ルーノ「世界はEVの時代って聞くけど、日本は遅れていないの？」
2. カーノ「そんなことはないみたいですよ。トヨタのハイブリッドは、今も人気があるみたいです。」
3. ミーノ「それじゃあ、トヨタのハイブリッドの歴史をひもといてみよう！」
4. 低く落ち着いた男性ナレーターへ切り替え「1997年12月。日本は、二つの答えを出した。」

- 「ミーノ → ルーノ」は「ミーノがルーノに問いかける」と解釈して実装（解釈が違う場合は本人指示で差し替え）。ルーノは掛け合いに登場するがセリフなし。
- ナレーターの声は現行（Nemo男声1・速度0.99）をそのまま使用。より低く落ち着いた声への変更は本人聴取後の別判断。

## 新規作成ファイル

| ファイル | 内容 |
|---|---|
| `src/data/longform/toyota01-open-v6.json` | 生成用beats（3本）。voiceSpeedは既存設定（ミーノ1.06・カーノ0.90）。「EV」は読み「イーブイ」を明示 |
| `public/audio/longform-toyota01-v6/open-1..3.wav` | ミーノ4.768s／カーノ6.272s／ミーノ4.309s（24kHz mono PCM16・非無音） |
| `output/longform-v6-review/audio/toyota01-open-v6-result.json` | 生成結果・クレジット（VOICEVOX:櫻歌ミコ、VOICEVOX:冥鳴ひまり） |
| `src/data/longform/toyota01-v6.json` | v5b複製＋冒頭3シーン挿入（会話0-1〜0-3、既存0-xは0-4〜0-10にずらし音声参照は不変）。20シーン、durationFrames=3171 |
| `src/longform/LongformToyota01V6.tsx` | V5B複製＋新ビジュアル`openingTalk`（街並みに3体並立、話者のみexplainポーズ＋金色ネームラベル、他は0.62暗転）。diff主要点のみ差分 |
| `src/Root-v6.tsx`・`src/index-v6.ts` | 専用エントリ（LongformToyota01V6のみ） |
| `scripts/check-longform-v6.mjs` | v5b検査スクリプトの複製（対象JSONのみ差し替え） |

- 会話シーンの秒数は既存ルール「audio秒＋0.9（登場0.4秒／尻0.5秒以上）」で5.7／7.2／5.3秒。
- 台本正本 `sources/script-longform-toyota-01.md` は未更新（分離方式継続。統合はCodex側停止確認後に別途承認）。

## 検証結果（2026-10-19 05時台・随時追記）

- 台本検査：`node scripts/check-longform-v6.mjs` — 20シーン / 3171フレーム / official=3171、ERROR 0 / WARN 1（1-4字幕45文字・既知）。`npm run check` exit 0。
- 音声生成：exit 0、3本とも非無音。voiceSpeed等の実値は上記result.json参照。
- レンダー：`npx remotion render src/index-v6.ts LongformToyota01V6 …` exit 0、3171/3171。`output/longform-toyota01-v6.mp4`（9.3MB相当）。
- 音量統一：2-pass loudnorm。一次（linear）ではエンコード後の実TPが-1.0 dBTPとなり-1.5未達のため、TP=-2.2でdynamic適用に変更。**最終：I=-14.2 LUFS／TP=-1.8 dBTP**（読戻し実測）。復号確認：全長105.707秒・非無音（peak -1.52 dBFS／RMS -17.51 dBFS）。
- 成果物：`output/longform-toyota01-v6-lufs14.mp4`（7,162,407 bytes・moovあり）。
- 全編コマ目視：`output/longform-v6-open-talk-sheets/`（sheet-01〜07）。冒頭3シーンは3体並立・話者金色ラベル・他0.62暗転で意図どおり。残部はv5b内容のまま。重大な見切れ・素材欠落・字幕欠脱なし。
- 共有：`\\192.168.1.115\Shared\Transfer\character-video-studio\2026-10-19-longform-v6-open-talk\longform-toyota01-v6-lufs14.mp4`。SHA-256 `223c3d01a577661a…38f21` 読戻し一致。

## 並行Codexセッションの状況（2026-10-19 05:41時点）

- 同じ冒頭掛け合い指示をCodex側も共有ファイル（`toyota01.json`・`LongformToyota01.tsx`等）で実装中の観測。`output/longform-v6-review/`（intro-1〜3.png・ナレーション比較A/B等）がCodex側の成果で混在しているため、本セッションのシートは `output/longform-v6-open-talk-sheets/` を使用。
- Codex側の「ナレーション比較」：A＝現行Nemo男声1、B＝低め・抑揚控えめ・やや低速の試作音声。**Bは未採用・本編はA維持**と記録されており、「低く落ち着いた声」の聴き比べ素材は本人聴取に利用可能。
- 本セッションはCodex側の共有ファイル・成果物に一切触れていない。


## 未確認・残作業

- 声の本採用は本人聴取待ち（掛け合いのミーノ／カーノ声を長尺で初めて試用）。
- 「低く落ち着いた男性ナレーター」への変更要求があれば、Nemo他スタイル等の候補提示を別途行う。
- 分離方式の記録統合（sources.md／台本正本）はCodex側停止確認後に別途承認。
- `public/audio/longform-toyota01-narrator-v5/`（重複・未使用）は削除候補、本人指示時のみ。
- push・公開は対象外。
