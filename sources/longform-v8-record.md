# ロング解説 v8 — ナレーター男声2採用版

現在の結論：本人聴取（2026-10-19 08時台）で「Aがいいね」の回答により、ナレーターを**VOICEVOX Nemo 男声2（style 10000）**に変更。調整は聴取比較と同一（pitchScale=-0.06／intonationScale=0.75／speedScale=0.94）。会話（ミーノ疑問・カーノ補足・ルーノ進行、並びはルーノ左／ミーノ中央／カーノ右）はv7同一構成。男声2の読みが約1.2倍長めのため全体は126.7秒。本編レンダー・共有まで完了。音声の最終本採用は本編視聴後の本人判断。

## 本人指示（2026-10-19）

- 「もっと低く、ダンディな声に」→ 男声2／男声3／男声1深めの3候補を聴取比較で共有
- 「Aがいいね」→ 男声2（A）採用。B（男声3）・C（男声1深め）は不採用

## 新規作成ファイル

| ファイル | 内容 |
|---|---|
| `src/data/longform/toyota01-v8-voice.json` | 生成用beats 19本（会話3＋男声2ナレーター16） |
| `public/audio/longform-toyota01-v8/*.wav` | 19本（24kHz mono PCM16・非無音） |
| `output/longform-v8-review/audio/toyota01-v8-result.json`・`wave-seconds.json` | 実測・クレジット（VOICEVOX:櫻歌ミコ／冥鳴ひまり／雨晴はう、VOICEVOX Nemo） |
| `src/data/longform/toyota01-v8.json` | v7構造からaudio参照・秒数を更新。20シーン／3801フレーム（126.7秒） |
| `src/longform/LongformToyota01V8.tsx` | V7複製（import先・名前のみ差し替え） |
| `src/Root-v8.tsx`・`src/index-v8.ts` | 専用エントリ |
| `scripts/check-longform-v8.mjs` | v7検査複製 |

- 前段の聴取比較の作成物・記録は `sources/longform-v7-record.md` のv8節（commit `dc6bb92`）。

## 検証結果（2026-10-19、随時追記）

- 台本検査：`node scripts/check-longform-v8.mjs` — 20シーン／3801フレーム／official=3801、ERROR 0／WARN 1（1-4字幕45文字・既知）。`npm run check` exit 0。
- 音声生成：19本 exit 0・非無音。0-7＝9.163秒 等、実秒はwave-seconds.json参照。
- レンダー：`npx remotion render src/index-v8.ts LongformToyota01V8 …` exit 0、3801/3801。
- 音量統一：2-pass loudnorm（dynamic・TP=-2.2指定）。**最終：I=-14.3 LUFS／TP=-1.7 dBTP**（読戻し実測）。復号確認：全長126.720秒・非無音（peak -1.52 dBFS／RMS -17.77 dBFS）。
- 成果物：`output/longform-toyota01-v8-lufs14.mp4`（7,732,617 bytes・moovあり）。
- コマ目視：`output/longform-v8-review/sheets2/`（全8枚・111.5〜126.5秒の末尾も含む）。1回目の生成がタイムアウトで7枚までだったためsheets2に再生成（sheets/は7枚の不完全物＝削除候補）。冒頭はv7同一構成（会話3シーン・話者強調確認済み）、末尾timelineEnd＋ナレーター出典ラベルまで正常。重大な見切れ・欠落なし。
- 共有：`\\192.168.1.115\Shared\Transfer\character-video-studio\2026-10-19-longform-v8-narrator2\longform-toyota01-v8-lufs14.mp4`。SHA-256 `a7c47304…cf724` 読戻し一致。
- ローカルcommit：本節のv8ファイル群（pushなし）。

## 未確認・残作業

- 男声2の本編での声質・読みペースは本編視聴で判断（視聴後の調整要求があれば速度・pitchを微調整）。
- 分離方式の記録統合（sources.md／台本正本）はCodex側停止確認後に別途承認。
- 削除候補：`public/audio/longform-toyota01-narrator-v5/`（重複）、`public/audio/longform-v8-audition/`（聴取用中間）、`/tmp/opencode/*`。本人指示時のみ。
- push・公開は対象外。
