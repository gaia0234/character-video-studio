# 動画制作セッション引継ぎ — 最新 2026-10-29

## 再開時の入口と判断待ち

- 本人「session終了」で制作を停止。次回は新規セッションで本節と `sources/longform-v11-record.md` の末尾を読む。下記2026-10-27以前の引継ぎは履歴。指示された作業は短い計画報告後に必要検証まで実行する（2026-10-27改定、不要な再承認を求めない）。外部AI API・課金・公開等の個別境界と停止条件は維持。
- 最新の本人提示案は「トヨタは、本当にEVに出遅れたのか／49日間走らなかった車が、世界を変えるまで」確認用シナリオv11（表記2026-10-28）。ナレ2中心、ケント=EV支持の懐疑派、ジャッド=皮肉と観察力で問いを進める人物へ全面変更した未採用案。全文は本人のチャット提示のみで案件ファイル未保存。既存の映像V11や `toyota-conversation-v11-story.json` をこの新稿と混同しない。次回改稿・音声化する前に全文を正本として確保する必要がある。
- Mainは全文を読み、企画・物語の骨格は良いが完成稿として粗い、主観70点前後と評価。レビュー記録はV11制作記録「本人提示の全面改稿v11レビュー」。指摘：HEV約461万はHEV+MHEVの合算、323登録/3500受注は期間・対象が違う、HEV実績で現在のBEV技術全般の非劣位を証明しない、初見向け導入順、終章の反復・問答の作為を修正する提案。本文未変更、本人採用・修正実行の指示は未受領。
- 別文章Reviewer `/root/review_v11` はMainから渡した抜粋のみ確認し要修正。全文独立レビュー未実施。MainはToyota公式2025年Excelを標準ライブラリで読み、HEV 4,433,503、MHEV 177,152、BEV 199,137、電動車計4,994,894を確認。公式出典と確認範囲は制作記録参照。ユーザー確認日/実測時間と未確認を混同しない。

## 作成済み台本と音声

- Main作成の別版v4/v5/v6は `sources/script-longform-toyota-conversation-v{4-review,5-narration,6-natural}.md`。v6は会話の具体化版、文章Reviewer合格・本人未採用。標準共有 `2026-10-27-scenario-v6-natural/script-longform-toyota-conversation-v6-natural.md`、SHA `e7441cd7fa84cee73e4154bf62dc0ee8e4ade7854a0110abd6dd3e3062be7d35`。ナレーションは発話文字数約75％、時間比率ではない。
- 音声はv5の4声非連続抜粋（発話1/3/7/44）だけ。32.902秒、既存ローカルVOICEVOX model 10/15/n0/12、実速度1.0、間0.45。本人「音声はOK」でこの4声試聴を受入。全文・v6・新v11音声は未生成。本人の声受入を台本・全編の間・新稿の発音受入に広げない。
- サンプル `public/audio/toyota-v5-narration-20261027/scene-representative-4voices.wav`、証拠 `output/toyota-v5-narration-20261027/representative-validation.json`。共有 `\\192.168.1.115\Shared\Transfer\character-video-studio\2026-10-27-toyota-v5-voice-sample\toyota-v5-four-voices-sample.wav`、元/コピーSHA `498130a693c4fa7e2314b22f76e27ac063bc07960fc732ca5296256263185ea8` 一致。
- 現ツールではMain/担当/制作Reviewerともローカル音声を実聴できず、機械確認だけ実施。制作Reviewerは実聴・非連続の間を証拠不足と判定。本人の試聴結果をその後受領。外部AIへ無断送信しない。全編音声作成の旧承認はv5対象であり新v11へ無条件に転用しない。

## 保全・失敗・Git

- 動画累計100/次停止105（100停止は本人再開済み）、通信19/次停止20、今回音声生成失敗0。新v11レビューの資料取得はReviewer PDFサイズ超過/Excel非対応2件、Main追加読取でopenpyxl未導入1件後に標準ライブラリで取得成功。原因は既知、失敗回数を消さず同じ取得の反復はしない。
- OC添付MIME経路は既知の不具合あり、MP4/WAVの実知覚は未成立。定義や掲載だけで実聴成功と扱わない。旧05/06の重要な未確認は下記履歴を継承。全編動画の出力・結合は明示指示が必要。
- 2026-10-29 fetch origin成功。masterはorigin/masterにahead10/behind0、ステージなし。今回台本commit f8a086e/c84ef14/cc08d96を含む未送信10件。ほかは7b02302/d3654e6/a64dcd4/c718abb/c8212df/8368d41/47999f2。後半4件は他作業で追加されたため無断で帰属・完成を断定しない。05/06受入不足と全送信範囲の未確認のためpush保留。
- `SESSION_HANDOFF.md` と未追跡の `sources/longform-v11-record.md` は以前からの複数作業を含む混在記録。README/manifest/scripts/旧台本/映像src、多数未追跡素材・音声・派生版も保全。今回終了処理で一括stage/commit/push・削除・他セッション停止はしない。クリーンな終了は未達。
- 今回作成の検査記録 `.yomiyasu/runs/`、`/tmp/character-v*-*20261027.txt` と代表音声/入力/検証証拠は保全。削除なし。次の具体的行動は本人の指示に従い、新v11全文確保と必要修正（又は現稿採用判断）。勝手に音声/映像生成へ進めない。

- 終了引継ぎは別文章Reviewer `/root/review_v11` が記載整合を確認し合格。Git実値・新v11全文の再レビューではない。読取のpython未導入1件はsedで解消。Mainのcommit分離準備は旧見出しの日付前提が実値と不一致で1件失敗、先頭区切りによる分離へ修正した。

- 終了処理中に別処理でorigin/masterがf0f7366へ進んだ。remote実値の読み戻し後、未送信は今回の引継ぎcommit1件のみ。上記ahead10は開始時点であり、末尾時点はahead1/behind0。別処理の変更は上書きしない。

---

# 動画制作セッション引継ぎ — 最新 2026-10-29

## 再開時の入口と判断待ち

- 本人「session終了」で制作を停止。次回は新規セッションで本節と `sources/longform-v11-record.md` の末尾を読む。下記2026-10-27以前の引継ぎは履歴。指示された作業は短い計画報告後に必要検証まで実行する（2026-10-27改定、不要な再承認を求めない）。外部AI API・課金・公開等の個別境界と停止条件は維持。
- 最新の本人提示案は「トヨタは、本当にEVに出遅れたのか／49日間走らなかった車が、世界を変えるまで」確認用シナリオv11（表記2026-10-28）。ナレ2中心、ケント=EV支持の懐疑派、ジャッド=皮肉と観察力で問いを進める人物へ全面変更した未採用案。全文は本人のチャット提示のみで案件ファイル未保存。既存の映像V11や `toyota-conversation-v11-story.json` をこの新稿と混同しない。次回改稿・音声化する前に全文を正本として確保する必要がある。
- Mainは全文を読み、企画・物語の骨格は良いが完成稿として粗い、主観70点前後と評価。レビュー記録はV11制作記録「本人提示の全面改稿v11レビュー」。指摘：HEV約461万はHEV+MHEVの合算、323登録/3500受注は期間・対象が違う、HEV実績で現在のBEV技術全般の非劣位を証明しない、初見向け導入順、終章の反復・問答の作為を修正する提案。本文未変更、本人採用・修正実行の指示は未受領。
- 別文章Reviewer `/root/review_v11` はMainから渡した抜粋のみ確認し要修正。全文独立レビュー未実施。MainはToyota公式2025年Excelを標準ライブラリで読み、HEV 4,433,503、MHEV 177,152、BEV 199,137、電動車計4,994,894を確認。公式出典と確認範囲は制作記録参照。ユーザー確認日/実測時間と未確認を混同しない。

## 作成済み台本と音声

- Main作成の別版v4/v5/v6は `sources/script-longform-toyota-conversation-v{4-review,5-narration,6-natural}.md`。v6は会話の具体化版、文章Reviewer合格・本人未採用。標準共有 `2026-10-27-scenario-v6-natural/script-longform-toyota-conversation-v6-natural.md`、SHA `e7441cd7fa84cee73e4154bf62dc0ee8e4ade7854a0110abd6dd3e3062be7d35`。ナレーションは発話文字数約75％、時間比率ではない。
- 音声はv5の4声非連続抜粋（発話1/3/7/44）だけ。32.902秒、既存ローカルVOICEVOX model 10/15/n0/12、実速度1.0、間0.45。本人「音声はOK」でこの4声試聴を受入。全文・v6・新v11音声は未生成。本人の声受入を台本・全編の間・新稿の発音受入に広げない。
- サンプル `public/audio/toyota-v5-narration-20261027/scene-representative-4voices.wav`、証拠 `output/toyota-v5-narration-20261027/representative-validation.json`。共有 `\\192.168.1.115\Shared\Transfer\character-video-studio\2026-10-27-toyota-v5-voice-sample\toyota-v5-four-voices-sample.wav`、元/コピーSHA `498130a693c4fa7e2314b22f76e27ac063bc07960fc732ca5296256263185ea8` 一致。
- 現ツールではMain/担当/制作Reviewerともローカル音声を実聴できず、機械確認だけ実施。制作Reviewerは実聴・非連続の間を証拠不足と判定。本人の試聴結果をその後受領。外部AIへ無断送信しない。全編音声作成の旧承認はv5対象であり新v11へ無条件に転用しない。

## 保全・失敗・Git

- 動画累計100/次停止105（100停止は本人再開済み）、通信19/次停止20、今回音声生成失敗0。新v11レビューの資料取得はReviewer PDFサイズ超過/Excel非対応2件、Main追加読取でopenpyxl未導入1件後に標準ライブラリで取得成功。原因は既知、失敗回数を消さず同じ取得の反復はしない。
- OC添付MIME経路は既知の不具合あり、MP4/WAVの実知覚は未成立。定義や掲載だけで実聴成功と扱わない。旧05/06の重要な未確認は下記履歴を継承。全編動画の出力・結合は明示指示が必要。
- 2026-10-29 fetch origin成功。masterはorigin/masterにahead10/behind0、ステージなし。今回台本commit f8a086e/c84ef14/cc08d96を含む未送信10件。ほかは7b02302/d3654e6/a64dcd4/c718abb/c8212df/8368d41/47999f2。後半4件は他作業で追加されたため無断で帰属・完成を断定しない。05/06受入不足と全送信範囲の未確認のためpush保留。
- `SESSION_HANDOFF.md` と未追跡の `sources/longform-v11-record.md` は以前からの複数作業を含む混在記録。README/manifest/scripts/旧台本/映像src、多数未追跡素材・音声・派生版も保全。今回終了処理で一括stage/commit/push・削除・他セッション停止はしない。クリーンな終了は未達。
- 今回作成の検査記録 `.yomiyasu/runs/`、`/tmp/character-v*-*20261027.txt` と代表音声/入力/検証証拠は保全。削除なし。次の具体的行動は本人の指示に従い、新v11全文確保と必要修正（又は現稿採用判断）。勝手に音声/映像生成へ進めない。

---

# 動画制作セッション引き継ぎ — 最新 2026-10-29

## 現在の状態と再開時の判断

- 2026-10-29、本人の「session終了」で区切る。次回は新しいセッションでこの文書と [V11制作記録](sources/longform-v11-record.md) の末尾を読み、本人の指示と承認範囲を確認する。新しい制作や全編結合は自動開始しない。
- 第1部01〜06は本人受入済み・commit済み（04=57f546f、05=a64dcd4、06=d3654e6）。05/06の実音声聴取と字幕フレーズ同期、06のPM Reviewer（音声部分）は未確認のまま。
- 第2部v3-p2-07〜12（6シーン）を制作。VOICEVOX・processed JSON・`npm run check` exit 0・個別レンダー・loudnorm 2-pass・mux・共有まで完了し、本人から「いいですね」を受領。共有は `Transfer/character-video-studio/2026-10-27-toyota-v3-part2/`。各シーン単独MP4で、結合はしていない。実音声の聴取・PM Reviewerは未確認。
- 第3部v3-p3-13〜19（7シーン）を制作し、同じ工程・共有まで完了。数字シーンは17=累計100/200/300万台の棒グラフ、18=100/200/300/1,500万台の折れ線（到達点を結ぶ旨を注記）。15は2005年SUV＝ハリアー（海外名レクサスRX400h）、レクサスはGS450h/LS600hへ具体化（トヨタ75年史 item1_b を直接確認）。共有は `Transfer/character-video-studio/2026-10-27-toyota-v3-part3/`。
- 本人「いいですね。この形を動画の形とします」により、章ピル＋5区間バー／紙盤／年カード・グラフ・4点道路図／濃紺字幕帯／右側人物／VOICEVOX音声／シーン単独出力の型を標準採用。`README.md` の「トヨタ解説v3の採用フォーマット（2026-10-27 本人承認）」に記録した。
- 判断待ち（本人）：第4部（特許）の制作指示、実音声・連続再生の検査経路（OC添付MIME不具合の修正か別経路の承認）、第2部/第3部のcommit可否、push可否。

## 失敗・環境・保全

- V11制作記録の最新値は動画 **累計100、次の停止105**、通信 **累計19、次の停止20**。動画100の停止は本人の明示再開で解除済み。累計をリセットせず、次の境界到達時は試行・代替・委譲より前に停止し本人へ相談する。
- OCの添付読込はdata URIのMIMEを保持せず、MP4/WAVを `application/octet-stream` として保存する不具合が未修正。06でGo MiMoを1回実行したがMP4/WAVは未受信でunknown。追加モデル実行には対象・回数・費用枠の都度承認が必要。
- 共有物：part2（MP4 6本・stills 12枚・STATUS）、part3（MP4 7本・stills 14枚・STATUS、15/17/18はv2）。06/05の共有物も保全。ローカルには各版のresult.jsonと旧版MP4・抽出画像を保全し、削除しない。
- 他者の既存dirty/未追跡ファイルを保全する。`sources/longform-v11-record.md` は複数タスク混在の未追跡のまま。既存OCセッションや他者の処理を推測で停止・交代しない。

## Gitと終了処理

- 2026-10-27時点のfetchで `master` は `origin/master` に対し **ahead 3**（7b02302 レビュー役割記載、d3654e6 06、a64dcd4 05）、stagedなし。push要請はPMへqueue送信済み（ID 01a17c0a-35b7-7e60-87da-a8e962474f0c）だが、実行・remote一致は未確認。
- 05/06の実音声・Reviewer未確認のため自動push条件は未成立。当方ではpushしていない。
- 未commit：第2部/第3部のソース・processed JSON・音声・検討稿2件・`ToyotaV3Chart.tsx`・`README.md`（様式）・本引継ぎ・V11制作記録。部分commitの本人承認を得ていないため保全し、終了時点でclean closureではない。
- 今回の終了処理では新たなレンダー・音声生成・再生・再検証を行っていない。最終値は各 `result.json` と共有 `STATUS.txt` の実測値。

---

# 過去の引き継ぎ — 2026-10-07

## 最新の終了状態

- ユーザーの「session修了」で作業を終了。新しい実装・素材制作・生成処理を自動で開始しない。
- 現在はWindows側の独立した **Knowledge Anime Editor Server** ウィンドウで編集サーバーを起動済み。セッション終了では停止していない。Codexなしで利用できる。
- Windowsデスクトップ（OneDriveのデスクトップ）に **Knowledge Anime Editor.lnk** を作成済み。ダブルクリックで起動・ブラウザー表示。既に起動済みなら再利用する。
- 接続先は **http://127.0.0.1:3210**。Windowsから `localhost:3210` はタイムアウトしたが、IPv4の127.0.0.1で接続確認済み。WSL設定・ファイアウォールの変更はしていない。
- 使用中はサーバー用ウィンドウを開いておく。停止はそこでCtrl+C。次回はショートカットから再起動する。操作手順は [docs/editor.md](docs/editor.md)。

## 今回の実装と継続時の正本

- ユーザー承認に基づき、Remotionのブラウザー編集UIを実装した。Mainのみで作業し、別Agent・Advisorは利用していない。
- 編集できる項目：タイトル、字幕、読み上げ文、話者、話速、セリフ後の間、情報表示時間、キャラの大きさ・位置、6場面の順番。プレビュー、保存、音声更新、MP4書き出し・ダウンロードが動く。
- 編集内容の正本は **src/data/editor-project.json**。初期状態はカーノの「いち対いち」を聞き取りやすくした採用版。字幕と読み上げ文を別々に保存する。
- 音声変更後は未更新の音声をプレビューで再生せず、書き出しを止める。変更のない音声は再利用し、更新後も編集した字幕・速度・間・配置を維持する。
- 保存前バックアップは `.editor/backups/`、新規音声は `public/audio/editor/<処理ID>/`、動画と台本のスナップショットは `output/editor/jobs/<処理ID>/`。従来の試験動画・音声は保持した。
- 主な追加ファイル：`src/editor/{index.html,index.tsx,style.css}`、`src/data/{editor-project.json,editorProject.ts}`、`scripts/{start-editor.mjs,editor-server.mjs,render-editor-video.mjs,verify-editor.cjs}`、`docs/editor.md`。
- 主な変更ファイル：`src/{Root.tsx,CharacterDialogue.tsx}`、`src/data/characterDialogue.ts`、`scripts/generate-dialogue-voice.py`、`package.json`、`package-lock.json`、`.gitignore`、`README.md`。Playerとesbuildの直接依存、`editor`・`verify:editor`コマンドを追加した。
- Windows起動用追加ファイル：`scripts/start-editor-windows.ps1`、`scripts/install-editor-shortcut.ps1`。対象は **Ubuntu-26.04** と `/home/gaia2/projects/character-video-studio`。WSLの対話シェルで既存nvm環境を読み込み、独立したPowerShellウィンドウでサーバーを起動する。

## 検証済み

- `npm run check`、Node/Python構文確認に合格。Windows用PowerShellスクリプトも構文確認済み。
- 実ブラウザーで1440px・430pxの画面を確認。保存・再読み込み・並べ替え・音声更新・MP4出力・ダウンロードを試験用台本と3211ポートで通し確認した。正本の台本は試験用に書き換えていない。
- 不正な入力・パス・音声情報・別Origin・古いリビジョンの拒否、処理中の保存・二重生成の拒否、音声未更新時の出力拒否を確認した。処理中のページ再読み込みでも進捗を復帰できる。
- 出力MP4とダウンロード内容が一致。音声波形から6場面の同期、無音の間、クリッピングなしを確認した。ブラウザー試験はミュート再生と波形検査であり、主観的な聴取評価を代替したとは扱わない。
- 最終の初期台本出力：**1080×1920・30fps・674フレーム・約22.47秒、H.264/AAC**。保存先は `output/editor/jobs/384ed02c-69a9-4dc7-95b9-5ef9ba21d980/`。ダウンロード確認コピーは `output/editor/verification/knowledge-anime-initial.mp4`。
- 証拠は `output/editor/verification/` の `e2e.json`、`final-export.json`、`audio-verification.json`、デスクトップ／モバイル画像等。
- Windowsからページ本体・プロジェクトAPIへの接続を確認。ショートカットの登録先・コマンド、サーバー停止状態からの新規起動、起動済みサーバーの再利用、ブラウザー起動コマンドの正常終了を確認した。
- Windows新規起動は2回失敗し、Windows版npmの選択と別ウィンドウ起動方法を修正した。最終方法では成功。5回停止条件には達していない。

## 既存の動画・素材と未完了事項

- このセッション開始前からのキャラ会話動画・PNG切り出し素材・背景・VOICEVOX環境を使用した。今回、キャラ原画や兄弟プロジェクトを編集していない。
- 採用キャラはルーノ・ミーノ・カーノ。PNGは `public/assets/characters/test-cutouts/`、背景は `public/assets/backgrounds/study-room-v1.svg`。正式なマスターSVG・ベクター化は未完了。
- 背景の最新参考はキャラプロジェクトの `materials/ChatGPT Image 2026年9月6日 03_36_43.png`。下記の過去記録にある別の背景指定を最新指示として再適用しない。
- 既存の音声試験は `output/test-character-dialogue-voice.mp4`。Windows Downloadsの `test-character-dialogue-voice-kano-clear.mp4` は前工程でコピー済み。今回の編集UIでは書き出し後にブラウザーからダウンロードする。
- 音声の記録は `sources/character-dialogue-voice.md`。櫻歌ミコの個別詳細規約ページは取得できず未確認のまま。一般規約・クレジット確認と区別する。公開・アップロードはしていない。
- 初版UIは現在の6場面を編集するもの。場面追加・削除、ドラッグ操作、複数プロジェクト管理は実装範囲外。キャラ・テーマの拡張は次回のプランと承認後に行う。
- 生成処理の状態と最新ダウンロードリンクはサーバーのメモリーに保持する。ページ再読み込みは確認済みだが、サーバー再起動後のジョブ復帰は未実装。生成済みファイルはディスクに残る。

## 保存・同期と次回

- ファイルは正式プロジェクトに保存済み。現在 `.git/` は存在するが、`git status --short` は「not a git repository」で失敗する。Git差分・コミット・push・外部同期は実施していない。Git管理状態を修復済みとは扱わない。
- 次回はこの最新記録と `docs/editor.md` を確認し、まずショートカットで現行UIを使う。制作の続きを依頼された場合はユーザーの希望を確認し、必要な変更だけプランを報告して承認後に実行する。
- 下記は2026-10-06の終了時点の履歴であり、「未実装」「成果物なし」等は現在の状態を表していない。

---

# 過去の引き継ぎ — 2026-10-06

## 終了状態

ユーザーが「コンテキストが混ざっていますので、よくありません、動画プロジェクトも一旦締めます」と指示。動画制作セッションを終了し、実装・素材取得・レンダリングを停止した。キャラ制作も別途終了・保留済み。どちらも自動で再開しない。

次回は新しい動画専用セッションを `/home/gaia2/projects/character-video-studio` で始め、このファイルと制作Skillから状況を確認する。キャラ制作の会話履歴・作業状態をそのまま動画の仕様として取り込まない。

## このプロジェクトの目的と範囲

- RemotionでYouTube Shorts向け1080×1920・30fpsの動画を繰り返し生成する環境。
- デザイン・アニメーションとコンテンツを分離し、次回はJSON・画像・音声を差し替える。題材ごとにReactを書き換える構造にしない。
- 画像は `public/assets/`、音声は `public/audio/`、出典・素材情報は `sources/`、出力は `output/`。
- 最初のテーマは「続きが気になって止まらないアニメTOP3」。具体的な作品・順位・短評・使用音声は未確定。提案された作品候補を承認済みとして扱わない。
- キャラの造形・清書・新しい表情やパーツの制作は担当外。動画側は採用済み素材の配置・合成・演出を扱う。不足素材の制作を同時に始めない。

## 正式プロジェクトに保存済み

- `package.json` / `package-lock.json` / `tsconfig.json` とRemotionの初期雛形。
- `src/index.ts`、`Root.tsx`、`Shorts.tsx`、`components/Intro.tsx` / `RankingScene.tsx` / `CommentBox.tsx` / `Ending.tsx`。
- `src/data/video.ts`：初期の入力スキーマと尺の計算。今回の再利用要件に合わせた設計はまだ未実装。
- `src/data/video.json`：空の台本。空の場合はCompositionを登録しない。
- `public/assets/manifest.json`：素材0件。`public/audio/` と `output/` は `.gitkeep` のみ。
- `skills/youtube-short-generator/SKILL.md`：参照資料の優先、キャラと動画の担当分担、素材に合わせてSkillを育てる方針、背景・デザインの方向を反映し、形式検証済み。
- `references/original-article.md`：ユーザー提供の記事を読了。記事後半に `game-ranking-short` のSkillがある。
- `references/original-skill.md`：初期Skillの保存資料。現在の仕様ではない。
- `README.md` と `sources/sources.md`：起動・編集箇所・素材管理の説明。

初期雛形は紺・ベージュの簡素なデザイン。Skillが指定する新しい世界観と再利用構造へ作り替えた状態ではない。記事のオレンジ放射デザインを実装した事実もない。

## 制作仕様の優先と合意事項

1. ユーザーの最新指示。
2. 現在の `skills/youtube-short-generator/SKILL.md`。
3. 参考記事・過去のSkill。

記事は目的・制作フロー・Remotionの再利用設計の参考。収益化・マーケティング・感想・宣伝文句は実装要件にしない。記事後半の制作Skillを主な参考とするが、見た目はユーザーの修正を優先する。

- 背景の参考は兄弟プロジェクトの `ChatGPT Image 2026年9月6日 03_43_18.png` と `ChatGPT Image 2026年9月7日 19_10_09.png`。白〜淡いクリーム、薄い青、広い余白、本・地球儀・羅針盤・植物の控えめな装飾。オレンジ放射背景・常時回転・赤黒グラデーション・蛍光コメント枠は標準から外した。
- キャラはルーノ・ミーノ・カーノという「謎生物」。動物種や人間として設定し直さない。動画内の説明・疑問・整理の役割とキャラ制作は区別する。
- 背景参考画像の指定は、キャラの造形基準の変更や清書開始の指示ではない。
- 共通の制作手順はSkill本体、素材固有の注意は参照資料。題材だけの変更でSkill・Reactを毎回変更しない。

## 一時作業 — 正式プロジェクトに未反映

`/tmp/character-video-studio-implementation/` は環境準備用の作業コピー。正式な編集成果物や検証済み環境ではない。終了処理でコピー・昇格・同期していない。`/tmp` は消える可能性があるため、次回は存在と中身を再確認する。

- 一時側で `@remotion/bundler`、`@remotion/renderer`、`@remotion/media-utils` を4.0.533、`tsx` を4.20.6で追加インストールした。正式側には未追加。
- インストール時にesbuildのpostinstall承認についてnpmの警告が出た。実際のバンドル・レンダリングはまだ試していないので動作済みとは扱わない。
- 日本語描画の固定用にNoto Sans JPとOFLを `public/assets/fonts/` に取得した。参照元はGoogle Fontsの `ofl/notosansjp/`。正式側には未追加、フォント読み込みの実装も未実施。
- `public/assets/neverland.jpg`：`https://neverland-anime.com/1st/assets/img/top/img_main.jpg` から取得し、画像を閲覧した。
- `public/assets/attack-on-titan.jpg`：最初に小さいOGP画像を閲覧した後、`https://shingeki.tv/season1/img/index/mainvisual.jpg` に置き換えた。置き換え後の画像は未閲覧。
- 取得した作品画像は利用条件・クレジットの確認、採用判断、台本との対応付けが未完了。正式素材のmanifestに未登録。完成動画の素材として扱わない。
- STEINS;GATE公式サイトはHTTPSのホスト名証明書不一致で2回失敗。HTTPのHTML・CSS取得は成功。`images/img_top.jpg` の取得・閲覧はユーザー指示で中断され、終了時には一時assets内に保存ファイルがない。同じ取得目的の失敗履歴を次回へ引き継ぐ。

この作業コピーのSkillは古いコピーの可能性がある。正式プロジェクトの最新Skillを読み、コピーを一括で上書きして後の修正を失わないこと。

## 検証状況と未完了

- 正式プロジェクトの初期雛形は作成時に `npm run check` に合格。Skillも各更新後に形式検証済み。
- 今回の終了処理ではファイル・package・JSON・出力フォルダの状態を確認した。新たな起動・型チェック・画像表示・音声再生・レンダリングは行っていない。
- ランキング／並列紹介を共通化したJSON設計、画像寸法に基づく配置、差し替え検証は未実装。
- 新背景・静止レイアウト、アニメーション、音声の実測尺・同期、MP4レンダリングは未完了。
- 掲示板感想の調査・短評作成・実データの出典整理は未実施。読んでいない投稿や架空の集計順位を作らない。
- MP4・静止画の成果物はない。動画が完成したとは報告しない。

## 再開時の次の作業

動画制作の再開が明示された場合だけ、正式プロジェクトの最新Skill・package・srcを確認する。キャラ側は採用素材や背景資料の参照に限る。

実装順は、1. 構成確認 → 2. 入力JSON設計 → 3. 静止レイアウト → 4. アニメーション → 5. 音声 → 6. MP4レンダリング。各段階の問題を修正してから次へ進む。まずJSONの紹介形式・項目・コメント・画像・音声の持ち方を決め、3項目と5項目を同じコンポーネントで扱う設計にする。

## 保存・同期

このプロジェクト直下に `.git/` はない。コミット・push・外部同期・公開は未実施。終了処理で追加したのは本ファイル、READMEの「元記事は未提供」という古い記載のみ現在の状態へ修正した。ソースコード、Skill、正式素材、一時作業は変更していない。
