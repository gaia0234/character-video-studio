# Character Video Studio

YouTube Shorts・X向け縦型解説動画の独立プロジェクト。React / Remotion、1080×1920、30fps。キャラクターの正本は `../knowledge-anime-character-system/` で管理する。

## 動画制作の構成（2026-10-16）

- 本プロジェクトは動画制作全体を扱う。キャラ設定・原画・正式素材の管理は兄弟プロジェクトに残す。
- 本人承認済みの制作方針：既存キャラ素材、Kling 4.0の優先試作、既存VOICEVOX、Remotionを組み合わせる。台本・字幕・図解・音声・最終出力は本プロジェクトで管理する。
- 最初の動画は既存の「正方形と縦長の画面」6場面を流用する。制作条件・生成指示案・確認結果は [動画の出典と素材](sources/sources.md#初回の生成映像併用動画2026-10-16) に記録する。
- Seedance 2.5とMiniMax H3は比較候補。motion-explainerは演出の参考、ScenarioとBlenderは将来の3D制作候補で、導入済みとは扱わない。
- 調査済みツールの比較・採否・出典は [ツール調査と制作方式の判断](sources/sources.md#ツール調査と制作方式の判断2026-10-17) に集約する。料金・仕様は調査時点の情報で、実行前に利用画面と適用条件を確認する。
- 現行実装は静止画を使う編集・音声・Remotion出力。Kling MCPの登録・OAuthログインは成功。ツール経由の実接続、生成動画の取り込みは未確認・未実装。Klingへの素材送信・動画生成・課金・公開は未実施で、対象・条件・費用を提示して承認後に行う。

## Knowledge Anime 専用編集画面

`npm run editor` で起動し、Windowsのブラウザーで **http://127.0.0.1:3210** を開く。
字幕・読み上げ文・声の速さ・間・キャラの大きさと位置・場面順を変更し、保存・音声更新・MP4出力を操作できる。
保存先は `src/data/editor-project.json`。使い方と保存先は [編集室の操作ガイド](docs/editor.md) を参照。

## 起動と書き出し

Node.js 22以上を使う。WindowsではこのフォルダをWindows側にコピーしてからインストールするか、WSLのターミナルから操作する。WSLで作成したnode_modulesをWindowsのNode.jsで共有しない。

```sh
npm ci
npm run dev
npm run check
npm run still
npm run render
```

`dev` はRemotion Studio、`still` は `output/preview.png`、`render` はH.264の `output/short.mp4` を出力する。初回書き出しではChrome Headless Shellがダウンロードされる。音声を指定した場合に音声付きで書き出す。本番台本が空の間は `Shorts` を登録せず、試験用Compositionのみ表示する。

## 試験動画

キャラ素材が未完成でも、名前と配置枠を使った無音の試験動画を作れる。試験JSONは `src/data/tests/ranking-3.json`（24秒）と `collection-5.json`（36秒）。本番の `video.json` とは分けて管理し、両方とも同じ `Shorts` コンポーネントを使う。

このランキング・紹介形式の台本の保存はJSONファイルを編集して行う。StudioのInspectorでの変更は一時プレビュー用とする。

```sh
npm run check
npm run dev
npm run still:test
npm run preview:test
npm run render:test
```

- `still:test`：ランキングの代表カットを `output/test-preview.png` へ出力。
- `preview:test`：冒頭・項目名・各コメント・締めを `output/stills/` へ出力。
- `render:test`：`output/test-ranking-3.mp4` と `output/test-collection-5.mp4` を出力。
- `render:test:ranking` / `render:test:collection`：片方だけ再出力。

既存のChrome／Chromiumを使う場合は、各コマンドの末尾に `-- --browser-executable=/absolute/path/to/chrome` を付ける。環境ごとの実行ファイルのパスはソースへ固定していない。

試験用図形は `public/assets/tests/`、日本語フォントとライセンスは `public/assets/fonts/`。画像が存在しない場合や、JSONの寸法が実画像と異なる場合は、レンダリング前にエラーにする。`testMode: true` で試験注記とキャラ配置枠を表示する。本番では既定の `false` を使う。

## 編集する場所

- `src/data/video.json`：タイトル、字幕、キャラのコメント、各シーンの秒数。動画の尺は自動計算する。
- `src/components/`：冒頭、各シーン、コメント、締めの共通デザイン。
- `src/design.ts`：共通の配色と左右の余白。
- `public/assets/`：採用済みキャラ素材のコピー。版・参照元は `manifest.json` に記録する。
- `public/audio/`：収録済み音声。`video.json` の任意項目 `narration` に `audio/narration.wav` などを指定する。
- 各シーンの任意項目 `characterAsset` に `assets/luno-v1.png` などを指定すると立ち絵を表示する。
- `sources/sources.md`：内容の根拠と素材のクレジット。

`mode` は `ranking`（既定）または `collection`（順不同の紹介）。項目数は `scenes` から自動計算し、JSONの配列順で再生する。ランキングでは各項目に重複しない `rank` が必要。並列紹介は順位を指定せず、画面に `1/5` などの紹介番号を表示する。

各項目には `title`、`body`、`seconds` に加えて、次の任意項目を指定できる。

- `image: {src: "assets/example.jpg", width: 1200, height: 800}`：実画像の寸法を指定し、縦横比を保って配置する。
- `comments: [{speaker: "ルーノ", text: "コメント", startSeconds: 0, characterAsset: "assets/luno-v1.png"}]`：シーン開始からの秒数でコメントを切り替える。表示開始を昇順にし、シーンの尺内に収める。最後のコメントはシーン終了まで表示する。旧形式の `speaker` / `comment` / `characterAsset` も読み込めるが、`comments` と併用しない。
- `narration: "audio/scene-1.wav"`：その項目の開始から音声を再生する。全編の `narration` とは併用しない。音声の実測尺と `seconds` を合わせる工程は別途必要。

本番台本・正式キャラ素材・音声は未登録。`video.json` のタイトル・締めの文・シーンを入力した段階で本番Compositionを登録する。完成キャラの採用版をコピーし、manifestへ記録してから `comments[].characterAsset` に指定する。

[Remotion公式ドキュメント](https://www.remotion.dev/docs/)に沿った構成。利用時は[ライセンス条件](https://www.remotion.dev/license)を確認する。

## 制作Skill

[skills/youtube-short-generator/SKILL.md](skills/youtube-short-generator/SKILL.md) に制作手順をまとめる。元記事の保存先と移設前のSkillは同フォルダの `references/` に置く。元記事は `references/original-article.md` に保存済み。Skillはこのプロジェクト内に配置しており、グローバルなSkill登録は行っていない。

## Ubuntu移行後の起動確認（2026-10-12）

- Node24.21.0・既存依存でscripts/start-editor.mjsを一時起動し、127.0.0.1:3210のHTTP200を確認。試験プロセスは停止済み。音声生成・動画レンダリングは未確認。
- Node配置：/home/ds-work/.local/lib/node-v24.21.0、実行リンク：/home/ds-work/.local/bin。証拠：../project-hub/runtime/app-acceptance-20261012/result.json。

### Ubuntu動画出力の確認（2026-10-12）

既存Chrome Headless Shell151.0.7922.34を/home/ds-work/.local/lib/chrome-headless-shellへ配置。不足libasound.so.2を同ディレクトリへ配置し、LD_LIBRARY_PATHを当該ディレクトリとして指定した実行で確認。CLIの--browser-executableには同ディレクトリのchrome-headless-shellを指定。TestRanking3の30フレーム・無音・H.264出力はexit0、output/ubuntu-migration-smoke.mp4（131851 bytes）。全尺・音声生成は未確認。


## Ubuntu補助設定の移行（2026-10-12）

- 計画・承認：本人承認で現行補助処理の旧ホーム参照をrepo相対・現HOME・既存設定入口へ修正する。担当はHeavy（Sol max）、Mainが承認範囲とレビューを統括。
- 完成条件：構文・参照先・既存設定の不変を確認する。外部API・認証・公開・動画生成・Gooseモデル実行・ダウンロードは行わない。
- 適用状態：対象参照を適用済み。構文・ローカル参照確認済み。証拠は /tmp/settings-helper-migration-20261012/validation.json と changes.diff。
- 明示KNOWLEDGE_EDITOR_BROWSER/CUTOUT_BROWSERを優先し、未指定時は現HOMEまたはPLAYWRIGHT_BROWSERS_PATHで既存Chromiumを探索。候補なしは停止し自動取得なし。現UbuntuにPlaywright package/cacheはなく、既存Chrome Headless Shellを明示指定する。LD_LIBRARY_PATHを含む上記既存起動条件を保持し、動画/音声生成は未試験。
- 検証済み：node構文4件、既存env優先・cache探索・候補なし停止の小さな/tmp fixture。素材rootと既存Chrome Headless Shellの存在だけを確認。ブラウザ起動・画像加工・動画生成なし。

## Ubuntu編集室の開始確認（2026-10-13）

- 承認範囲：既存台本を保持し、起動条件・音声生成の依存先を確認して編集室を起動する。音声生成・動画出力は対象外。
- 確認済み：Node v24.21.0、Python 3.14.4、VOICEVOX Core・ONNX Runtime・辞書・3モデルの存在。CoreとONNX Runtimeのlddで不足依存なし。音声生成の実動作は未確認。
- 起動時は `KNOWLEDGE_EDITOR_BROWSER=/home/ds-work/.local/lib/chrome-headless-shell/chrome-headless-shell` と `LD_LIBRARY_PATH=/home/ds-work/.local/lib/chrome-headless-shell` を指定し、`npm run editor` を実行。サンドボックスの待受・接続制限は個別承認後に外側で確認し、127.0.0.1:3210のHTTP 200を確認。応答保存先：`/tmp/character-editor-start-20261013.html`。ブラウザー操作・表示は未確認。
- 台本 `src/data/editor-project.json` のSHA-256は起動前後で一致（`3630be19a30295528d8399ab923198a74663e46d93a11a7d2b4bf04ffdf50ff2`）。起動処理で `.editor/app.js` と `.editor/shared.mjs` をビルドした。台本・音声・動画の生成／変更なし。
- 現環境では `.git` が空でGitリポジトリとして認識されないため、同期確認・差分確認・ローカルcommitは未実施。Git修復は承認範囲外。Windows／WSL向け操作ガイドのUbuntu対応、音声生成と音声付き全尺出力は残作業。

## ローカルGit初期化（2026-10-13）

- 計画・承認：ローカルGit初期化、除外設定の確認、作業記録までを本人承認。既存ファイル全体の初回commit・リモート登録・pushは対象外。
- 適用・確認済み：空の `.git` に `git init` を実行し、`git status` が正常に動作。初期ブランチはGit既定の `master`、commit・ステージ済みファイル・リモート・追跡先はなし。既存ファイルは未追跡として保持。
- 既存除外設定により `node_modules/`・`output/` の生成物（`.gitkeep`を除く）・`.voicevox/`・`.editor/` は登録対象外。代表的な秘密値パターンの限定検索では一致なし。全秘密情報の不存在を保証する確認ではない。
- 初回commit前の残作業：登録対象の内容確認。`public/audio/editor/` の生成音声は現在除外されていないため、採用音声との扱いを決める。今回ファイルのステージ・commit・外部同期は行っていない。

### GitHub接続（2026-10-13）

- 本人が `gaia0234/character-video-studio` の作成完了を報告。既存SSH別名 `github-gaia` でアクセス成功し、参照がない空のリポジトリであることを確認。
- `origin` は `git@github-gaia:gaia0234/character-video-studio.git` を登録し、URLの読み戻しと `git fetch origin` の成功を確認。commit・追跡先はまだなく、公開範囲はSSHでは未確認。初回commit・pushは未実施。
- 本人指示により `public/audio/editor/` の生成音声は除外せず、Git登録対象に含める。既存 `.gitignore` の変更は不要。上記の音声の扱いに関する判断待ちは解消済み。

### 初回commit・pushの承認と確認（2026-10-13）

- 本人の「コミットPush」で、既存プロジェクト全体（生成音声を含む）の初回commitと `origin` の `master` へのpushを承認。force-pushなし。既存2案件と同じcommit名義 `gaia0234` をrepoローカルに設定する。
- commit前確認：`npm run check` 成功。登録対象69ファイルに秘密用の代表的ファイル名・秘密値パターンの一致なし。依存環境・出力動画・編集バックアップは既存除外設定により対象外。音声生成・動画出力は再実行していない。
- push後はリモートの `refs/heads/master` とローカルHEADの一致、追跡先との差分、作業ツリーを読み戻す。不一致・認証／通信失敗では停止し、成功扱いにしない。commit hashと送信結果は完了報告で示す。
