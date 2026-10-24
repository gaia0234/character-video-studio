# Character Video Studio

<!-- hub-tool-catalog-20261023 -->
## ツール選定の入口（2026-10-23）

- 新規検索・導入を始める前に、[Hub用途別ツール索引](../project-hub/docs/internal-tools-inventory.md#tool-catalog)の[関連用途](../project-hub/docs/internal-tools-inventory.md#tools-media)だけを読む。採用/保留・利用条件・確認日・巡回目安を確認し、詳細と全履歴を複製しない。
- この案件：音源6候補・映像表現6候補・漫画候補を用途別に参照する。台詞/映像完成を優先し、停止中作業・外部AI生成・導入を自動再開しない。
- 画像解析のモデル差は[モデル担当索引](../project-hub/docs/internal-tools-inventory.md#tools-models)で確認する。掲載・キー存在は実行許可ではなく、Gemini等の他プロバイダ外部AI APIは都度モデル/用途/回数/上限の本人明示許可が必要。
- 候補の追加・採否変更は案件の既存正本とHub索引を同じ区切りで更新する。索引が読めない/情報が古い場合は未確認とし、推測で導入しない。
<!-- hub-tool-catalog-20261023 -->


YouTube Shorts・X向け縦型解説動画の独立プロジェクト。React / Remotion、1080×1920、30fps。キャラクターの正本は `../knowledge-anime-character-system/` で管理する。縦型Shortsに加えて横型16:9のロング解説も制作する。ロングの工程運用は「ロング解説の6工程」節を参照する。

## ロング解説の6工程

横型16:9のロング解説は、参考→データ→台本→画面→音声→出荷の6工程で進める。この節が6工程の運用正本で、各工程の正本・成果物・受入境界を表で一意に定める。制作状態と失敗累計の最新記録は [sources/longform-v9-record.md](sources/longform-v9-record.md)、横長／縦長の別Compositionや音声・字幕の運用は [skills/youtube-short-generator/SKILL.md](skills/youtube-short-generator/SKILL.md) に引き継ぐ。

| 工程 | 工程正本と入力 | 成果物 | 担当と受入境界 |
|---|---|---|---|
| reference | `sources/sources.md` の参考比較＋本人の録画・抽出画像 | 採用する見た目・構成 | 本人・Codexが採否判断。見た範囲と不明を区別し、参考動画のテンポ実測は未取得のまま。既存V9の実尺を参考値にしない |
| data | `sources/longform-toyota-full-facts.md`（資料ID F/G） | 台本への主張・出典の紐付け（事実・日付・単位・対象範囲） | 紐付けは担当、受入はCodex。旧v1台本の出典表は履歴で、数値の文字列一致だけでは意味・基準日を保証しない |
| story | 対象版recordで固定した台本・発話入力と根拠ID。旧全章v1は提案履歴。V11の候補と状態は下記「シナリオと映像の担当分離」参照 | 対象版の字幕JSON・voice JSON（実装時はこの組が実装の正本。sceneIDで版別対応） | シナリオ担当が作成しCodex文書受入・本人台本確認。既存にないclaimIDや対応を創作・補完しない |
| motion | 対象版のvisual JSON＋版別TSX | 画面・動きの実装 | 実装は担当。Codexが承認された変更場面と見切れ・字幕・キャラ・年表の非干渉を技術受入 |
| direct | 対象版のvoice JSON＋WAV・実尺証拠＋版別秒のAudio配置 | 同期・声・間の実装 | 実装は担当。CodexがWAV非無音・予定尺一致を技術受入。本人の聞こえ方の受入はこれと区別する |
| ship | 対象版の専用entry・Composition・版別record＋既存のrender／loudnorm／review証拠 | 版付きMP4・証拠・共有記録 | 機械処理完了→Codex技術受入→本人の画面・聴取受入→共有範囲の明示承認→標準のTransfer共有へ新規コピー＋元とのSHA-256読み戻し。公開は別承認 |

- 着手時に、対象版・各入力ファイル・編集所有・成果物と証拠の保存先をその版のrecordへ固定する。同じsceneIDでも版が異なれば別の内容として照合する。現行V9の実装パスは [V9記録](sources/longform-v9-record.md#新規作成ファイル) を参照する。
- 責任分担：Codex＝要件・構成・採否／受入。承認済みの実効モデルを確認したOpenCode担当＝明確な作業と必要検証を優先（利用枠終了等は既存の引継ぎ承認に従う）。本人＝台本・画面・聴取・共有・公開の承認。GLM/DS使用時のmax指定を維持し、この記載でモデル/担当を切り替えない。
- 未受入の成果物を自動共有する構成にしない。過去に別途承認された共有の履歴を無効化しない。
- 既存の各版JSON・音声・成果物・証拠をそのまま再利用し、正本の内容を別文書へ全文複製しない。形式・ファイル名の統一や6Agent化はしない。

<a id="scenario-production-roles"></a>
### シナリオと映像の担当分離（2026-10-23 本人承認・運用文書へ反映）

- **管理場所**：シナリオは本プロジェクトのstory工程で管理し、別プロジェクトは作らない。キャラ設定・正式原画の正本は既存の兄弟案件に残す。担当セッションは必要時に分けるが、今回の承認だけで新規セッションを起動したり既存担当を交代しない。同じ人/セッションが両工程を順に担当してもよい。
- **シナリオ担当**：指定された台本/発話入力だけを所有し、構成・台詞・根拠との対応を作成する。映像担当は指定されたJSON/TSX/音声/出力を所有する。ファイルごとの編集責任者は1人。映像化で台詞/話者を変える必要が出たらCodexへ戻し、元台本と実装を別々に改稿しない。本人からの直接承認済み変更も版記録へ対応付ける。
- **引継ぎ**：新しい台帳を増やさず、対象版recordへ「台本の版と入力パス（必要ならcommit/hash）／対象scene・区間／台本担当と映像担当の所有ファイル／Codex文書受入・本人確認の状態／対応する字幕・voice JSONと映像版／未解決差分」を短く残す。本人確認待ちの台本で試作する場合は、本人が認めた試作範囲を明記し、台本採用済みとは扱わない。
- **制作指示**：対象場面の役割と視聴者の問い、人物の口調・その時点の既知/未知、今回回収する問いと根拠IDを必要な分だけ渡す。既存設定/全台本の全文複製や、毎回3人の全文レビューは必須にしない。説明のために事実や出典を創作しない。
- **現行V11への入口**：[V11制作記録](sources/longform-v11-record.md)が後続承認・受入状態の入口。会話案は[sources/script-longform-toyota-conversation-v2.md](sources/script-longform-toyota-conversation-v2.md)、発話入力は[sources/toyota-conversation-v11-story.json](sources/toyota-conversation-v11-story.json)、実装は[src/data/longform/toyota01-v11.json](src/data/longform/toyota01-v11.json)と[voice JSON](src/data/longform/toyota01-v11-voice.json)。台本文書冒頭の旧状態だけで現在を判定せず、後続の本人承認済み話者配分と入力間の対応・未確認をrecordで照合して着手版を固定する。今回、それらの本文/話者/コードや受入状態は変更していない。
- **新しい台本の検討（2026-10-23）**：[会話シナリオv3検討版](sources/script-longform-toyota-conversation-v3.md)に全体構成と冒頭1区間を整理。本人確認待ちで、現行V11の実装用台本/音声/JSONを更新するものではない。採用する範囲と話者配分は本人判断後に対象版recordへ固定し、旧版を自動置換しない。
- **担当分離の初回適用範囲**：役割と引継ぎ方法の文書反映。上記v3検討版の作成後も、音声/映像の制作実走は未確認。動画/通信の既存停止条件、制作途中の全編出力禁止、外部AI・共有・公開の承認を維持する。共通世界観/原作を複数媒体で使う必要が具体化した場合だけ、独立プロジェクト化を再検討する。

<a id="scenario-research-workflow"></a>
### 次の動画にも使うシナリオ・概要欄の作り方（2026-10-23 本人指示）

目的は、手戻りと調査負担を減らし、根拠のある人物描写と自然なやり取りで視聴者の共感を得ること。資料数や検査回数を増やすことは目的にしない。今回の[開発者発言調査](sources/longform-toyota-full-facts.md#developer-interviews-20261023)を次回の実例として参照する。

1. **チャンネルの約束と中心の問いを決める**。視聴者が何を知りたいか、何に驚き/迷い/納得するかを先に設計する。参考動画は問いの受渡しや見せ方を学び、台詞や強い断定をコピーしない。
2. **人物の目的・迷い・判断を調べる**。既存の出典を先に確認し、必要なインタビュー/発表を探す。発言者、公開日、当時の役割、出来事の時点、本人の回想/他者の紹介/記事説明、使える範囲と未確認を既存のfactsへ記録。改稿の判断に足りる根拠を得たら、調査を広げ続けず台本へ戻る。
3. **場面と会話にする**。人物の関心・知識・相手の発言を受けた変化から、次の発言/場面が生まれる構成にする。意味のある視線/動作/間を置き、説明を順番に読むだけにしない。実名で出す開発者/経営者は関与と資料を示す。本人を参考にしたイラストは年代/肩書/写真を照合しイメージと分かる形にする。歴史上の台詞や心情を創作しない。
4. **概要欄を同時に下書きする**。視聴者への短い内容紹介、採用した主張/発言の主要出典、回想・イメージ表現の説明、実際に使った音声/素材の必要クレジットを台本の版へ対応付ける。今回の[概要欄案](sources/youtube-description-toyota-v3-draft.md)を例とし、次回は題材と実際の採用内容に合わせる。チャプター時刻は完成版から決め、未使用素材や未生成音声のクレジットを推測で載せない。
5. **対象区間の台本を一度通読して本人へ共有する**。根拠対応、人物の知識、唐突な展開、説明反復、禁止表現、冒頭の問いの回収を確認する。小説Skill記事の観点を必要な分だけ使い、毎回の多人数全文レビュー/合格済み検査の反復は必須にしない。本人確認用の台本/概要欄案は標準Transferへ保存しSHAを読み戻す。
6. **採用版を固定して映像化する**。版recordへ対象台本/発話/所有/本人確認状態/概要欄案を対応付け、確認対象の区間だけ制作する。公開前に完成映像と概要欄の内容・時刻・クレジットを照合する。新規外部AI呼出し、全編出力、公開の承認と失敗停止規則を維持する。

**01の失敗から追加した実施条件（2026-10-24）**：映像化へ入る前に、対象版recordへ採用済みの画面/参照画像・変更する要素・初見の人への説明順を固定する。音声生成前に、用語の意味と仕組みを飛ばしていないか、表示する数値が算用数字かを確認する。代表画面は既存の採用画面と並べて継承を確認し、技術検査の合格と本人による内容/見た目の受入をそれぞれ記録する。既存の通読と代表画面確認へ組み込み、新しい一律試験や多人数レビューは追加しない。実例と未修正状態は[V11制作記録](sources/longform-v11-record.md)の01再指摘/再発防止を参照。

品質の判断は「何が起き、なぜ次へ進むか追えるか」「人物の反応や苦労に実感があるか」「出典が支える内容か」。公開後に得られた視聴維持やコメントは次の改善材料に使い、今回の自己点検だけで共感や再生数の向上を実証したとは扱わない。新しい自動監視は追加しない。

### 次回の限定計画（未着手・別途承認）

- 版の音声・配置を変更する前に、その版のTSXと尺検査だけを対象に、Audioの開始offset＋音声実尺＋末尾余白を同じ定義で判定する最小修正案を計画する。現行の `scripts/check-longform-v9.mjs` はscene秒−0.5で検査し、Audio開始0.4秒を明示控除していない。現行の配置が必ずはみ出すとは断定せず、末尾余白0.5秒を維持するなら開始0.4秒の控除も条件に入る。受入は一致境界pass・+1フレーム超過fail・実WAVとJSON尺の一致・既存の合法sceneを壊さないこと。
- 描画・音声配置・尺検査ロジックの重複が次版の制作を妨げる場合に限り、共通化を計画する。対象は次版と `src/longform/LongformToyota01V9.tsx`・`scripts/check-longform-v9.mjs` の該当処理で、旧版の保存と対象版の代表画面・音声時刻・総尺の一致を受入条件にする。既存V9の固定コピーと旧版・基底v6を無断で共通実装へ付け替えず、新しい共通ファイル名・全版一本化を確定しない。A一本化／B出荷自動化／C数値出典照合／D仕様分離の実装承認とは別の単位。

## 動画制作の構成（2026-10-16）

- 本プロジェクトは動画制作全体を扱う。キャラ設定・原画・正式素材の管理は兄弟プロジェクトに残す。
- 本人承認済みの制作方針：既存キャラ素材、Kling 4.0の優先試作、既存VOICEVOX、Remotionを組み合わせる。台本・字幕・図解・音声・最終出力は本プロジェクトで管理する。
- 最初の動画は既存の「正方形と縦長の画面」6場面を流用する。制作条件・生成指示案・確認結果は [動画の出典と素材](sources/sources.md#初回の生成映像併用動画2026-10-16) に記録する。
- Seedance 2.5とMiniMax H3は比較候補。motion-explainerは演出の参考、ScenarioとBlenderは将来の3D制作候補で、導入済みとは扱わない。
- 調査済みツールの比較・採否・出典は [ツール調査と制作方式の判断](sources/sources.md#ツール調査と制作方式の判断2026-10-17) に集約する。料金・仕様は調査時点の情報で、実行前に利用画面と適用条件を確認する。
- 静止画を使う編集室とは別に、本人がKling Webで生成した初回MP4を使う非公開試作 `KlingEditorPilot` を実装済み。型確認・全尺出力・代表画面確認が完了。Kling MCPの登録・OAuthログインは成功しているが、ツール経由の実接続は未確認。公開・商用の採用は未確認。

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

### Kling映像の非公開編集試作（2026-10-17）

`KlingEditorPilot` は編集室の既存6場面・字幕・音声を流用する専用Composition。ルーノの4場面だけ `public/assets/videos/luno-loop-kling4-v1.mp4` を先頭から再生し、他2キャラは既存静止画を使う。生成映像の音声はミュートし、元フレームと透かしをcontainで保持。正方形の図解を動画の上部余白へ配置する。既存 `EditorDialogue` と編集室の保存形式は変更していない。

- 確認済み：`npm run check`、共有元と取込素材のSHA-256一致、台本ファイルの不変。
- 出力済み：1080×1920・30fps・674フレーム（約22.5秒）、AAC音声付き。代表6画面を確認。本人の再開承認後に権限昇格で出力成功。
- 共有：`\\192.168.1.115\Shared\Transfer\character-video-studio\2026-10-17-kling-remotion-pilot\kling-editor-pilot-v1.mp4`（コピー一致確認済み）。
- 証拠・条件・停止結果： [動画の出典と素材](sources/sources.md#kling生成映像のremotion編集試作2026-10-17)。連続再生・聴取と公開・商用条件の確認は未実施。

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
