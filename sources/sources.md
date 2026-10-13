# 動画の出典と素材

本番用の `video.json` は空の台本。正式キャラ素材・ナレーションは未登録。番号付きシーンを数値ランキングに使う場合は、下記の根拠情報を記録する。

## レイアウト試験の素材

- 対象：`src/data/tests/ranking-3.json` と `collection-5.json`。内容は画像配置・コメント切替・JSON差し替えの動作確認用。
- 順位は試験用の表示順で、実在する作品・商品や人気調査の順位ではない。掲示板投稿は使用していない。
- `public/assets/tests/*.svg`：このプロジェクトで作成した寸法確認用の図形。横長1200×675、縦長675×1200、正方形900×900。キャラ原画や外部の作品画像ではない。
- `public/assets/fonts/NotoSansJP.ttf`：以前の準備工程で取得したNoto Sans JPを正式プロジェクトへコピー。参照元は [Google FontsのNoto Sans JP](https://github.com/google/fonts/tree/main/ofl/notosansjp)。SIL Open Font License 1.1を `public/assets/fonts/OFL.txt` に同梱。ファイルのSHA-256はmanifestに記録。
- 試験動画は無音。3キャラは名前と配置枠で表示し、キャラ制作プロジェクトの原画・未承認の清書案は動画へ取り込んでいない。

## キャラクター素材の管理

原画・正式設定・ベクターマスターは兄弟プロジェクト `../knowledge-anime-character-system/` を正本とする。動画には採用した版を `public/assets/` にコピーして使う。参照元を直接編集したり、変更が自動反映されるシンボリックリンクを作ったりしない。

コピー時は `public/assets/manifest.json` の `assets` に `file`（public/からの相対パス）、`character`、`sourceProject`、`sourceFile`、`version`、`sha256`、`approvalStatus` を記録する。現在のmanifestには検証画像とフォントのみを登録し、正式キャラ素材は0件。未承認の清書案を正式素材として登録しない。

## 動画ごとに記録する情報

- 動画ID、テーマ、確認日。
- 各主張・数値に対応する資料名、URL、該当箇所、資料の日付。
- ランキングを使う場合の評価基準、対象、集計期間。
- 音声・BGM・画像の提供元、利用条件、必要なクレジット。

## 制作基盤

- [RemotionのComposition](https://www.remotion.dev/docs/composition)
- [Remotionのルート登録](https://www.remotion.dev/docs/register-root)
- [MP4の書き出し](https://www.remotion.dev/docs/cli/render)
