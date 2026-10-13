# Knowledge Anime 音声試験 v1

本採用前の候補。キャラクターの絵と設定は変更せず、音声だけを仮設定する。

| キャラクター | 音声ライブラリ（ノーマル） | Style ID | speedScale |
|---|---|---:|---:|
| ルーノ | 雨晴はう | 10 | 1.04 |
| ミーノ | 櫻歌ミコ | 43 | 1.06 |
| カーノ | 冥鳴ひまり | 14 | 0.90 |

VOICEVOX Core 0.17.0 / CPU、音声モデル 0.16.4、Open JTalk 辞書 1.11。
プロジェクト内の `.voicevox/runtime` を使用し、グローバル環境は変更しない。
モデルは公式 GitHub リリースから取得し、配布 SHA-256 と照合した。

生成: `python3 scripts/generate-dialogue-voice.py`

書き出し: `node scripts/render-character-test.mjs --voice --browser-executable=<Chromeのパス>`

- セリフ6本: `public/audio/character-dialogue-v1/beat-01.wav` ～ `beat-06.wav`
- 候補試聴: `output/character-dialogue-voice/voice-audition.wav`。ルーノ → ミーノ → カーノの順。
- 動画: `output/test-character-dialogue-voice.mp4`
- 実測・ハッシュ・仮設定: `output/character-dialogue-voice/voice-info.json`
- 各合成クエリ: 同じ出力ディレクトリの `beat-*-query.json`

24kHz / mono / PCM16。各音声の RMS を0.12目標に調整し、ピーク0.85を上限とする。
LUFS測定ではない。音声の時間伸縮は行わない。
登場0.3秒後に発話し、終了後に0.3秒以上の間を置く。情報画面にはさらに1秒を追加する。
字幕と読み上げ文を分け、「１：１」は「いち対いち」と指定する。
カーノは「画像は、いち対いち。」を独立した文にし、「縦と横が同じ長さだね。」を追加する。
カーノだけを再生成する場合は `python3 scripts/generate-dialogue-voice.py --speaker カーノ`。
動画末尾に以下のクレジットを表示する。

```text
VOICEVOX:雨晴はう
VOICEVOX:櫻歌ミコ
VOICEVOX:冥鳴ひまり
```

規約参照（2026-10-06）:

- [VOICEVOX 音声モデル規約](https://github.com/VOICEVOX/voicevox_vvm/blob/0.16.4/TERMS.txt): 同梱 `.voicevox/runtime/models/TERMS.txt` も確認。各音声のクレジット表記と個別規約の参照を指定。
- [雨晴はう](https://amehau.com/rules/amehare-hau-rule): 個人・法人、商用・非商用、別キャラクターへの音声使用の条件を確認。
- [冥鳴ひまり](https://www.meimeihimari.com/terms-of-use): クレジットと別キャラクターへの音声使用の条件を確認。
- [櫻歌ミコ](https://voicevox35miko.studio.site/rule): 同梱モデル規約のクレジット要件は確認。個別ページはブラウザーでも502となり、詳細本文は未確認。本試験を公開済み・公開条件の確認完了とは扱わない。

声の印象・キャラクターとの相性はユーザーの試聴で判断する。音声出力の技術検証と、声の本採用は区別する。
