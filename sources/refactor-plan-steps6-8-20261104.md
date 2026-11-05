# リファクタ手6〜8 計画（2026-11-04）

## 現在の実行承認（2026-11-04 更新）

**手6の実装・必要検証、手7のSTATUS実変更が完了・別Reviewer合格**：2026-11-04、本人承認の手7はB1-r6を除く9件を8欄へ整理し、原文/証拠/旧停止条件を保持して受入済み。B1-r6・手8・Git操作は未実施。手6証拠は `output/refactor-step6-ch1-20261104/implementation-result.json`、手7証拠は `output/refactor-step7-status-20261104/migration-result.json`。過去の停止経緯・累計は後段に保持。

- 最新（2026-11-05）：手8は開始・段階B実施済み、3D依存は採用。末尾「手8 開始」節を参照（本節の「手8・Git操作は未実施」「3D依存は未承認」は2026-11-04時点）。

- 本人承認：手6の契約・specテンプレート・受入済みch1オープニング1場面の移行。手7は対象一覧作成後、本人がB1-r6を除く9件のSTATUS実変更を追加承認した。下記の初期計画中の「計画のみ」は作成時の履歴。手8・3D依存・他場面は未承認。
- 基準：`sources/toyota-production-replan-20261102.md`「v19第1章冒頭 ch1-01 rev2（2026-11-03 本人受入）」の本人「Rev2 OK」、`src/longform/ToyotaCh1Opening20261102.tsx` と専用entry、811f/30fps、既存WAVとlead12f、既存still A f255/B f360/C f570。構想車・机・紙・資源・街の形/配置/文言・音声/尺/演出を維持する。
- 変更：新規v20コード/章data/timing、既存境界のSHA付き移管、specテンプレート、layout-checkのprops受渡しのみ。既存採用コード・音声・dirtyファイルは変更しない。外部AI・音声生成・全編出力・commit/fetch/push禁止。
- 検証：同一frameの比較still、既存A/B/C specで新entryのlayout-check exit 0、npm run check exit 0、契約境界テスト、別reviewer。実装・結果は以下に追記する。検証先 `output/refactor-step6-ch1-20261104/`。新たな動き・声の受入へ拡大しない。
- 実装担当：Codex Implementer（Sol high）。前回はOC CLIのホームへのログ書込み制約のためCodex役割を使用。今回も同じ担当を継続し二重委譲・担当交代を行わない。PM Claude/B1-r6担当の交代なし。編集所有は新規v20・必要テスト・layout-checkの限定差分のみ。Mainはテンプレート・対象一覧・本記録を所有する。

## 初期計画（作成時点の結論・範囲）

- **計画作成時点は未実装**。当初の承認は本ファイルの作成だけであり、実装等は行わなかった。後続の実行承認と現在状態は冒頭、実行履歴は末尾に記録する。
- PMはClaude Code、Codexは運用・リファクタ担当。映像・台本・3Dの採否はPMが判断する。計画作成はCodexが直接担当（設計判断が中心で、進行中OCへの追加依頼を避ける）。完成物の確認は別Reviewerへ読取専用で依頼する。
- 目的：v20から数値・演出・音声境界の正本を明確にし、章別コピーと手作業の時刻調整を減らす。既存の受入済み作品・音声・証拠を保全し、画面刷新や台本改稿へ広げない。
- 着手可能な設計は手6の契約・テンプレート、手7の対象整理、手8の参照棚卸し。**3D依存の採否・変更はB1-r6の結果とPM判断待ち**。今回の計画作成をこれらの実行許可と扱わない。

## 根拠・確認範囲

確認日：2026-11-04。ローカルの文書・コードを読取で照合。外部サイト調査・外部AI呼出し・実動作試験は行っていない。

| 正本・実物 | 確認結果と計画への反映 |
|---|---|
| Hub `docs/operations-decisions.md`「2026-11-03 運用・案件の全体レビューと是正」引継ぎ（依頼時1936行） | 手6〜8、章別data/timing、字幕境界の単一正本、v20 entry 1本。手1〜5の合格済み処理は再試験しない |
| Hub `docs/pm-psm-handoff.md`「唯一の状態ファイル」「失敗台帳」 | STATUSは8欄・各1行。履歴・提出・失敗詳細を分離し、累計と停止条件を失わない |
| 案件 `AGENTS.md`、READMEの6工程 | 2026-11-04のPM分担と作画・受入基準継承を優先。READMEの旧Codex PM表記を現在の担当と誤認しない。今回はREADMEを書き換えない |
| `sources/script-longform-toyota-v20.md` 冒頭 | 本人採用済み、音声・映像未反映。v19をv20完成物として流用しない。台詞・指定間・既存受入を維持 |
| `src/longform/ToyotaV19Chapter2.tsx`、`src/index-toyota-v19-chapter2.tsx` | 章別entry、PHASESの表示数値と演出、字幕検索等が同居。構造の調査例であり、画面の採用基準にはしない |
| `ToyotaV3VisualFrame.tsx`、`ToyotaV3Chart.tsx`、ch1 `spec.md` | 再利用候補が既にある。共有元を先に改造せず、v20側で薄く組み合わせる |
| `scripts/generate-voice-v11.py` | 行音声の実尺と連結offsetを保存する既存経路あり。ただし行のoffsetだけで文内字幕境界を確認済みとは扱えない |
| `scripts/layout-check.mjs`、package.jsonの非秘密scripts/dependencies | 既存layout-checkを利用可能。`npm run check`はtsc、`npm run still`はShorts固定。v20確認には専用entryを明示する必要がある |
| `skills/youtube-short-generator/references/scene-prompt-template.md`、ch1/ch2の `spec.md` | 場景テンプレートは存在するが、受入基準欄を備えた共通specテンプレートは今回の限定探索では特定できていない |

Git：開始時はmaster／origin/master、既存staged差分なし、多数のdirty・未追跡あり。開始時に把握した `SESSION_HANDOFF.md`、package/lock、manifest、`scripts/check-longform.mjs`、音声生成script、版記録、src/data/longform等を本作業の差分と扱わない。由来を推測しない。
PMの本人経由報告：2026-11-04 22:2x、fetch成功、masterとorigin/master一致、未送信・未取得なし。Codex自身のfetchは `.git/FETCH_HEAD` 読取専用で拒否され未確認。本人が再開を明示承認し、このsandboxではfetch禁止。PMの確認結果を利用し、迂回・再試行しない。

## 衝突回避・維持する基準

- 進行中担当：OC `ses_ea9f62caaffebkeqUSUg80ZXuv`、`output/toyota-ch2-49days-pilotb-20261103` のB1-r6。作業中の実効モデル・結果は本計画では未確認。担当交代・追加指示・処理停止を行わない。
- **編集・移動・退避禁止**：`package.json`、`package-lock.json`、`src/longform/ToyotaCh2FortyNineDaysPilotB.tsx`、`src/index-toyota-ch2-49days-pilotb-20261103.tsx`、`public/assets/pilots/toyota-ch2-49days-20261103/`。さらにB案のoutput・別名assetディレクトリ、`PriusCh2Car3D.tsx`、`src/three/` 等のr6関連物もPMの所有確認まで保全する。
- 手6は新規v20名前空間から始め、B案へ遡及適用しない。既存共通部品・音声scriptの変更が必要なら、PMが他利用先と所有を確認してから担当を1人に固定する。
- 維持：採用済みの背景・紙・マーカー質感・文字組み・人物配置・カット展開、台詞・声・指定間。基準はPMが場面ごとに確定する。最新試作を本人受入済みと推測しない。
- 初代プリウスの側面は `sources/longform-v11-record.md`「初代側面輪郭の本人受入（2026-10-23）」を継承候補として必ず照合する。静止側面の受入を全角度・3D・動作の受入へ拡大しない。

## 手6：共通部品・章データ・時刻の分離

以下の新規パスは**配置案**。実装前に重複・所有を確認する。v19/旧版はそのまま残し、初回はPMが指定した1場面だけを移す。

| 対象ファイル | 変更前 → 変更後・意図 |
|---|---|
| 新規 `src/longform/v20/common/{SceneFrame,SubtitleTrack}.tsx` | 章TSX内の重複配置・字幕処理 → 既存VisualFrame/人物素材を利用する薄い共通UI。配置・質感を変えず、車や人物の造形を共通化の名で描き直さない |
| 新規 `src/longform/v20/chapters/<chapter>/data.json` | TSX・台本等に散らばる数字 → claim IDごとのvalue、unit、基準日または対象期間、定義/対象範囲、source（URL/資料名・箇所）、checkedAtを集約。比較の母数・目標/実績・当時/現在を区別 |
| 同 `timing.ts` | 章の絶対秒・TSX内の演出定数 → 場面durationInFrames、audioOffsetFrames、場面内相対フレームのフェード・出入り等。字幕のstart/endは持たない |
| 同 `Scene.tsx`、新規 `src/longform/v20/{ToyotaV20.tsx,types.ts}` | 表示・内容・時刻の混在 → 型付き入力を受ける描画と章組立。場面開始は長さの累積、章開始も累積。TSXへ演出時刻を再直書きしない |
| 新規 `src/index-toyota-v20.tsx` | 章/試作ごとのentry増殖 → v20用entryは1本。選択章/場面をpropsで指定する同一Composition（案：ToyotaV20）。calculateMetadataで選択区間の累積尺を解決し、描画にも同じpropsを渡す。初期値は承認済み確認区間だけ。全編出力は自動登録・実行しない |
| `scripts/layout-check.mjs` のprops受渡し部分だけ | 現在selectCompositionは空props、描画はspec.inputProps → 両方へ同じspec.inputPropsを渡し、選択区間の尺と描画を一致させる。PMが所有を確認してから最小修正。既存border/overlap等の判定部は変更しない |
| 新規 `scripts/generate-voice-v20.py`、`public/audio/toyota-v20/<chapter>/` | 既存音声生成処理の行実尺/offset保存を再利用するv20専用経路。既存v11やdirtyなgenerate-dialogue-voice.pyを先に改造せず、必要最小の差分だけ移植。共有manifestは変更しない |
| 新規 `skills/youtube-short-generator/references/spec-template.md`、既存 `scene-prompt-template.md` の参照部 | 個別specの手書き → 新規タスクspecの共通ひな形と入口。既存の受入済みspecを全面変換しない |
| 実装対象タスクの `spec.md`、提出物、版記録、READMEの該当入口 | 基準・入力・担当が曖昧 → 対象場面、採用根拠、実装パス、確認状態を対応付け。今回の計画段階では変更しない |

### データと字幕の契約

1. 章dataのclaim IDを台本の根拠対応・字幕表示文・画面ラベルで共有する。表示値はdataから整形し、読み上げ表記は表示文へ逆流させない。採用台本を自動改稿せず、v20入力への転記時に数値をclaimへ対応付ける。writing-reviewerはdataと原出典の意味・期間を照合し、不明値を創作しない。
2. 音声生成成果の `public/audio/toyota-v20/<chapter>/manifest.json` を文境界の唯一の正本にする（場面ID・発話/文ID・表示文/claim参照・音声パス/SHA・sampleRate・startSample/endSample・生成条件を保持）。境界は音声原点、区間は[start,end)。フレーム変換は共通の1箇所で丸め、audioOffsetFramesを1回だけ加算する。
3. 1文ずつ合成して連結する場合はPCM実サンプル数から境界を出す。複数文1音声の場合、現在の行offsetから文境界を推定しない。既存の実測/承認済み境界を音声SHA付きで移すか、PMが認める生成時の境界取得方法を先に確定する。文分割による声・抑揚の変化は実音で判断する。文字数による等分・新規外部APIで補わない。
4. 既存音声の再利用と新規生成を区別する。台詞、読み、声設定、間、素材SHAが一致するものだけ再利用し、再生成は承認対象区間に限定する。旧境界の移管は出自を「既存境界」と残し、新規生成時の測定と偽らない。
5. timingは場面長・音声配置と演出だけを持つ。字幕境界や音声実尺を複製しない。`audioOffset + 実尺 + 指定末尾余白 <= 場面長`、境界順序、参照IDの欠落/重複、累積開始位置を検証する。字幕連動演出は文IDの正本境界を参照し、時刻のコピーを持たない。

### specテンプレートに追加する必須欄

```markdown
## 継承する受入済み基準
検索日: YYYY-MM-DD
検索範囲: sources/ の記録、public/assets/
検索語: 登場する物・人物・場所の名前 ＋ 受入／本人／いいね
対象ごと: 名前 | 受入済み素材パス・記録ファイルと節 | 採用根拠 | 維持要素
該当なし: 対象名ごとに「検索済み・なし」（未検索と区別）
Git管理外の基準: パス ＋ 再取得URLまたは記録の節
今回変更する要素:
初見の視聴者への説明順:
実資料と計測値JSON: URL/パス・取得日・要点座標/比率/角度
提出比較画像: 資料・受入済み基準・新成果を並べた1枚のパス
```

PMが欄を埋め、そのままOCへ渡してから制作する。実在物の新作画は資料を先に確保し、要点をJSONに記録してSVG/TSXへ反映する。写真の自動輪郭抽出・貼付け、ロゴ/ナンバー/商標文字は使わない。人物は公人の公式写真を参照し、外部AI生成はモデル・用途・回数・上限の都度許可を維持する。比較資料は `output/<task>/reference/` 等のGit管理外・内部用とし、動画や本人共有物へ混入させない。今回は作画を行わない。

## 手7：STATUS簡素化の残り

- 対象候補：`output/*/STATUS.md` のうちPMが現役と指定するタスク、共通specテンプレートの状態記録への参照。B案STATUSはPM所有のまま、この担当は編集しない。凍結済み旧タスクを一律更新しない。
- 変更前：8欄化済みでもownerに旧PM復帰予定が残る例（ch1）がある。他STATUSの全件監査は未実施。変更後：`owner / state / next_action / decision_needed / evidence / unconfirmed / failures / last_update` の8欄各1行、ownerは次に動く1人。
- 過剰な本文は同タスクの `submissions/NN.md`、判断は既存版記録、失敗詳細は `failures.md` へ参照を残して移す。既に8欄のものを作り直さず、旧PM表記等の必要差分だけ直す。履歴・SHA・既存失敗累計・解除条件を消さない。
- 検証：変更対象だけ原文と照合し、全8欄、参照先の存在、最新担当・次action・未確認・停止条件の保持を確認。新しいSTATUS生成/監視スクリプトは追加しない。Git管理外の記録をforce-addしない。

## 手8：台帳付き退避・隔離・依存

| 項目・対象候補 | 移行方法・判断ゲート |
|---|---|
| 旧 `src/index-toyota-v*`、版別TSX/JSON、旧build/render script | ファイル名だけで旧版と判定しない。entry→import→JSON→staticFile→音声/素材→運用コマンドの参照を確認し、現役・共有・受入基準・未追跡作業を除いた明示リストをPMへ渡す。v20最小区間の受入後、合意した単位だけ `archive/legacy/<version>/` へ退避する案 |
| 退避台帳（案：`sources/legacy-archive-index.md`） | 元/先パス、理由・採否、元commitまたは未追跡、SHA、参照元、復元手順、検証結果を記録。退避は削除しない。相対importやPythonのROOT算出が壊れる場合は参照も同時修正、または元位置保全で論理的退避に留める。旧版全再生用の大改修はしない |
| 保全対象 | v19第1・2章音声はHub明記の退避対象外。採用基準の図、参照資料・音声・成果物・証拠、共有部品は残す。dirty/未追跡は未使用の根拠にならない |
| 3D依存：package/lock、`src/three/`、3D entry/部品 | r6結果を待ち、PMが採用/見送り/保留と対象を渡す。採用なら必要依存を維持、見送りでも他利用先ゼロを確認したものだけ除去候補へ。保留なら残す。存在だけで採用・不要と判定しない。OC所有解除後にのみ依存操作を計画し、試作の追加・比較を自動実行しない |
| `scripts/analyze-gemini-video-opening.py` | 案：`scripts/manual-external-ai/analyze-gemini-video-opening.py` へ台帳付き移動し、同所READMEに過去の限定試行・既存停止記録への参照・再実行には都度許可が必要と記す。現在はROOTが絶対パスのため移動だけで起動を封鎖できない。通常コマンドの参照を外し、隔離を権限による実行禁止と説明しない。APIは呼び出さない。他Gemini scriptへ自動拡大しない |
| `scripts/__pycache__/`、`.gitignore` | 生成物の所有・利用中でないことを確認し、削除候補パスを具体的に列挙。削除は本人の対象指定後。将来の混入を避ける `__pycache__/`・`*.py[cod]` のignore案を適用対象とする。音声モデルや他cacheは触らない |

台帳を作るだけで退避成功としない。移動した対象の参照切れ・SHA一致・復元可能性を確認する。既存の未コミット変更を巻き込む場合はその対象を延期し、reset/checkout/cleanで解消しない。

## 移行順・検証・完成条件

1. **実装指示後のpreflight**：PMと対象1場面・基準・編集所有を固定し、Git確認と既存差分保全。現sandboxの.git制限は維持し、Git書込みはPMの正規環境で行う。まず新規v20の型・章data/timing・specひな形を用意する。B案/依存の所有解除を待たず進められる独立部分に限定。
2. **最小縦通し**：採用済みの1場面を新規entry経由でつなぐ。既存実音と根拠付き境界を優先し、音声の再生成は必要時だけ。数値・時刻契約の重要ロジックには境界pass／1フレーム超過fail、欠落ID等の意味のある小テストを先に作り、期待した理由の失敗を確認して実装する。汎用検査基盤は作らない。
3. **実装担当の検証**：`npm run check` を変更一式に1回（既存由来のエラーと今回分を分ける）。v20確認stillは `npx remotion still src/index-toyota-v20.tsx ToyotaV20 <対象output>/representative.png --frame=<対象frame> --props=<対象props.json>`。現行 `npm run still` はShorts固定なのでv20の証拠に使わず、package scriptsを変更しない。CLI引数・Chrome・書込先を実行前に確認する。
4. **配置・実音/動作**：`node scripts/layout-check.mjs --entry src/index-toyota-v20.tsx --composition ToyotaV20 --frame <対象frame> --spec <対象layout-spec.json> --json <対象結果.json> --screenshot <対象結果.png> --temp-dir <書込可能な一時ディレクトリ>`。既存のinputProps形式を使い、対象propsに合わせたspecを指定する前に、selectCompositionの空propsをspec.inputPropsへ揃える最小修正を行う。初期区間と尺が異なる選択区間で、解決尺・描画対象が一致し、その末尾フレームは有効、解決尺と同じframeは範囲外exit 2になることを確認する。この確認で既存border等の合格済み試験を反復しない。代表カットの見切れ・字幕干渉・比率だけ確認する。exit 0=適合、1=配置不適合、2=実行失敗を区別。動き/音声を変更した場合は対象区間MP4と実音をPMが確認し、stillで動き合格とはしない。全編出力・結合は禁止。
5. **受入後に展開**：制作者と別Reviewer、PMが `video-acceptance` を使って提出実物と基準を照合。writing-reviewerは数値/出典、production_reviewerは継承・説明順・受渡し、reviewerはコード差分を必要範囲で担当。最小区間が合格してから、PMが指定した次の区間へ同じ構造を適用する。全章への自動一括移行はしない。
6. **手7・手8**：STATUSの必要差分、非稼働旧版の台帳付き退避・解析script隔離を所有衝突のない単位で実施。3Dはr6のPM判断後。参照/依存を変えた場合だけ最終 `npm run check` と影響箇所のbundle/stillを追加し、文書だけなら再レンダーしない。rollbackは台帳から元パスへ戻す（同名の新作業があれば上書きせず停止）。

**合格済みを繰り返さない範囲**：Hubに残るlayout-checkのborder比1.0・spec欠落exit 2、既存作品の全区間・既存合格音声・共有SHAは、判定部や入力が変わらない限り再検査しない。layout-check自体の単体テスト追加は今回の目的へ混ぜない。新規v20の契約/描画・退避で実際に変わる経路は新しい確認対象。初回の合格証拠をPMが再実行せず差分と照合する。

完成条件：対象区間でdata由来の表示数値、演出だけのtiming、音声由来の字幕境界、累積開始位置、entry1本が成立し、基準と実音/動きの必要確認・別Reviewer・PM受入が揃う。手7は8欄と履歴/累計保持、手8は対象台帳・参照/復元確認・隔離記録が揃う。3D判断待ち・削除未承認が残るならその項目は未完了/保留と報告する。

## リスク・判断待ち・工数目安

| リスク/未確認 | 対応・判断者 |
|---|---|
| v20へ採用する場面/基準が未固定 | PMが初回1場面と採用根拠を指定。v19構造例を見た目の基準にしない |
| 既存音声に文境界がない/音声と字幕の版違い | PMと入力SHA・取得方法を先に確定。推定時刻で実装を埋めない |
| 単文合成で声の連続性が変わる | 1場面の実音で判断し、未受入の生成を全章へ広げない |
| 数値の基準年・期間・母数が一致しない | dataに定義を保持し、原出典へ照合。変動情報の再確認が必要なら対象をPMへ提示 |
| 共通部品抽出が画面を変える/既存版へ波及 | v20側の薄いラッパーで始め、承認済み代表画面と比較。共有元改変を先に行わない |
| r6中の依存/ファイル競合・レンダー負荷 | 編集禁止を維持。実装時はPMが所有と重い処理の時間帯を調整。勝手に担当交代しない |
| 旧版移動による相対参照・CLI入口の破損 | 利用元と復元を台帳化。不明物・現役物は残す。破壊的な一括整理をしない |

目安（未実測、待ち時間を除く）：手6の契約/テンプレート2〜3時間、最初の1場面移行・必要検証/レビュー4〜8時間、手7は対象確定後0.5〜1.5時間、手8の棚卸し/隔離/小単位退避2〜4時間。計約9〜17時間。全章移行・新音声生成・3D再制作は含めず、初回受入後に対象数から見積もる。PM/本人判断待ちを作業時間に含めない。

## 今回の作成記録・停止条件

- 2026-11-04：本人依頼により計画を新規作成。提案した配置・工数は未採用/未適用で、実装指示待ち。手6〜8の方針承認と、今回の計画限定指示を区別する。
- 前回のfetch拒否は①即停止1件。原因は起動時の.git読取専用制限、本人が再開承認しfetch禁止を明示。別経路への迂回なし。前回の `python` 不在も観測済み（環境制約、②1件として保持。以後は存在するpython3で必要な読取に成功したが、累計を下げない）。本計画作成の②は1、次の累計停止5。同目的2回で原因整理、①は1回で停止、③は全条件が揃う軽微なものだけ。B案や旧制作タスクの累計をこの計画の累計へ混ぜず、それぞれの正本を維持する。
- 今回の出力は本計画ファイルだけ。一時ファイル・clone・レンダー生成物なし。既存の__pycache__等は保全。実装試験は未実施であり、計画レビューの合格を実装・作品の合格と扱わない。
- 完了前Reviewerの結果は下記へ追記する。今回commit/pushなし。次は同一タスクの実装継続候補だが、本回の計画限定指示を超えるため着手しない。

### 完了前レビュー

2026-11-04、別reviewer（gpt-6.1-sol / high、読取専用）初回は要修正：layout-checkのComposition解決が空props、描画がspec.inputPropsで尺が不一致になる可能性。対応として、同じpropsでの尺解決・描画と選択区間の境界確認を手6の対象/検証へ追記。同Reviewerが修正差分を再確認し、計画成果物として合格。実装・試験は未実施。

## 手6・7実行結果（2026-11-04、停止時点）

- 適用済み・未受入：新規 `src/longform/v20/contracts.ts`・`contracts.test.cjs`、`chapters/ch1/{data.json,timing.ts,model.ts,Scene.tsx}`、`common/{SceneFrame,SubtitleTrack}.tsx`、`ToyotaV20.tsx`、`src/index-toyota-v20.tsx`、`public/audio/toyota-v20/ch1/manifest.json`。旧版内の数値・字幕境界・演出を分離する構成を実装。既存採用コード/音声を直接更新していない。
- `scripts/layout-check.mjs` は2行だけ変更：Composition解決へspec.inputPropsを渡し、描画へcomposition.propsを渡す。border/overlap判定部は変更していない。新規契約の型検査は合格、実描画は未確認。
- Main作成：`skills/youtube-short-generator/references/spec-template.md`、既存scene-prompt-templateへの入口追加、`sources/refactor-status-inventory-20261104.md`、本記録。STATUS10件の対象整理だけで、既存STATUSへの書込みなし。実装仕様票は `output/refactor-step6-ch1-20261104/spec.md`。
- Implementer提出証拠：`output/refactor-step6-ch1-20261104/contract-red.log`（未実装module欠落で期待した失敗）→ `contract-green.log`（exit 0）、`typecheck.log`（npm run check exit 0）。合格済みテストをMainで反復していない。
- 描画：同フォルダ `render-stills.log`、描画scriptのChrome起動exit 1。PNG未生成、比較画像パスなし、layout-check A/B/C未実施。別reviewerによる**実装**レビュー未実施（上のレビューは計画のみ）。全編render・外部AI・音声生成・Git書込みは未実施。
- 音声/尺の構造証拠：既存WAV 24,000Hz・626,432 samples、SHA `86d2c9b5c2958557e4afbc7533195ee65656de82f067544be0fdf7fbcde68c4d`、lead12f、場面811f/30fps。既存CUESを `(旧frame-12)*800` で音声原点sampleへ移管し出自を付記。新規MP4の再生・実聴や画面同一性を合格と補完しない。
- Main照合で判明した残修正：timingのcut開始276/439は字幕境界と一致するため、字幕連動の文ID参照へ変更して二重正本を避ける。担当も妥当と回答したが、①停止後のため未編集。再開後にこの差分を修正し、契約テストと必要な描画/配置・比較・実装Reviewerをまとめて完了する。
- 失敗：新規①1（Chrome sandbox権限拒否、再開未承認）。前段①1のfetchは本人再開済み・再fetch禁止を維持。②累計1/次5を維持。Mainと担当の読取rg対象名誤り各1は、実在パス確認後の正しい再実行成功・影響なしの③記録（担当分はMain確定）。権限拒否を引数・環境の軽微ミスへ下げない。回避フラグ・別経路・自動再試行なし。
- 生成物棚卸し：outputのbaseline/spec、検証用props/layout spec、描画script/bundleと各logは再開証拠として保全。既存生成物の削除なし。手8・3D依存・package/lockは実行対象外。禁止/dirtyファイルの最終SHA照合は停止により未実施（開始時baseline.jsonは保存済み）。
- 所要：Implementer報告は約12分。全体の経過時間は停止報告に記載。次は同一タスクの再開で、①停止解除は本人が判断する。PMの受入後commitを行う方針を維持し、このsandboxではcommit/fetch/pushしない。

## 明示再開後の結果（2026-11-04）

- 本人が通常権限danger-full-accessで再開を承認。共通権限でChrome起動成功。Git禁止、既存担当と編集所有を維持して同じImplementerで継続した。
- 字幕連動cutの開始時刻コピーを廃止し、timingは文ID `ch1-01-04` / `ch1-01-06` を参照。modelが音声manifest由来の境界を解決し、切替276f/439fを維持。文境界を変えた時に演出切替も追従する回帰テストを確認。
- 初回実装ReviewerのP2：必須の非cut文cueが欠落しても契約検査が通る。採用して `ChapterData.narrationOrder` を必須化し、期待文IDの重複とcue件数/順序の一致を検査。非cut05欠落・余分cue・期待ID重複の予定red→green、最終npm run check exit0。Reviewerが影響差分と証拠を再確認し**合格**。今回の契約/コード受入であり、新動画の実聴・連続再生の受入ではない。
- 描画：新entryのstill A f255/B f360/C f570、各exit0。layout-check A/B/C各exit0・issues0。propsとComposition解決が一致し811f/30fps、末尾810f有効exit0・811fは予定どおり範囲外exit2。最終修正は検証ロジックだけで描画入力が不変のため、still/layoutの合格を反復していない。
- 比較：`comparison-{A,B,C}-original-left-v20-right.png` は左が保存済み受入PNG、右が新方式。Mainが3枚を直接開き、車・机・紙・資源/街・文字・棒・字幕・配置と配色の目視同一を確認した。保存PNGとのピクセル差はA425,895/B466,220/C518,857でゼロではない。同条件で旧TSXを1回描画したBは新方式Bと完全一致（差0）、保存PNGとの差も新方式との差と同じ。Bの差は移植コードに由来しないと判断できるが、過去との描画環境差の細因、A/Cの同条件旧版描画は未確認。原因調査を広げず、本人指定の「差分ゼロ〜目視同一」の条件で受け入れた。
- 音声は既存WAVのパス/SHA・lead12f・尺811fを維持。新規音声生成・MP4出力/再生・実聴は行っていない。旧版受入済みの声/間を変えていない構造証拠と、新しい主観受入を区別する。
- 指定2ファイル `src/data/longform/toyota01.json` と `src/longform/LongformToyota01.tsx` は計画着手前からdirtyで、実装開始前baselineと現SHAがそれぞれ一致。**今回の変更ではない既存の他作業**（元の作成者未特定）として結果JSONのchangeAttributionへ両SHAを明記、編集なし。保全対象18件も18/18一致を記録。B1-r6・package/lock・他dirtyを戻していない。
- 手7：`sources/refactor-status-inventory-20261104.md` の10件一覧を作成済み。現役/凍結・次の編集はPM判断。既存STATUSを書き換えていない。手8・3D依存には着手していない。
- 共有：標準Transferの `character-video-studio/2026-11-04-ch1-refactor-step6-still-comparison/` へ比較画像3枚だけを保存し、全てコピー先読み戻しSHA一致。WindowsパスとSHAは `sharing-result.json`。資料画像・source素材・秘密値を共有していない。
- 失敗累計②4/次5を保持：前段python不在1、保存PNGの厳密比較非一致1、同型読取引数ミス3回目1、Reviewerの未提出証拠への照会1。①fetch/Chrome各1は本人再開済み、③2はそのまま。改善は実在パスの列挙と確定提出通知を待つこと。成功・再開・担当変更で累計を下げない。
- 再開から記録完了まで約8分（14:14:13〜14:22:08 UTC、停止待ち時間を除く）。一時bundle/tmp/cacheと失敗ログは再開証拠として残し、削除なし。新しい別タスクへ進まず、本タスクの技術成果をClaude PMへ渡せる状態。PM受入/後続commitは本人指定どおりこの実行の対象外。

## 手7 STATUS実変更（2026-11-04 本人承認）

- 目的・対象：`sources/refactor-status-inventory-20261104.md` の9件をHubの8項目・各1行へ整理する。B1-r6進行中の `output/toyota-ch2-49days-pilotb-20261103/STATUS.md` は明示除外。Git操作・制作/依存/手8は行わない。
- 基準・維持：元STATUS全文、既存履歴/証拠、旧失敗集計と停止値/条件を無変更で保全。過去のuser_reviewや受入未確認を現行の制作再開指示にしない。ch1の本人受入doneを維持。
- 変更・順序：各タスクに元全文のバイト同一snapshotを `submissions/NN.md` として保存 → 失敗原文を `failures.md` へ保存/参照 → STATUSを8欄化 → 元SHA・8欄・参照・旧集計保持と他ファイル保全を確認 → 別Reviewer → 本一覧/記録の適用状態を更新。
- 所有：同一Implementerが対象9フォルダのSTATUSと新規移管先/結果を所有。Mainはsources正本を所有。共有②累計4/次5を保持し、①即停止。同じ役割スレッドを再利用、B1-r6のOC担当へ追加指示なし。
- 必須検証：元本文SHA=移管先SHA、9件各8行/各キー1つ、owner1人、state enum、日時形式、参照存在、失敗抜粋原文一致、証拠/既存履歴の無変更。文書整理のためnpm・still・layout等の制作検査は行わない。
- 結果保存先：`output/refactor-step7-status-20261104/migration-result.json`。Reviewer結果回収前は未完了。

### 手7完了・受入

- 指定9件すべて8行化し、各元STATUSは `submissions/01.md` にバイト同一保存。失敗は各 `failures.md` に元行/byte/SHA付きで移管。既存295ファイルの証拠/履歴はSHA不変。原文・旧累計/停止・却下/委譲条件の削除/再分類なし。
- 局所処理exit0、8項目・参照先・原文一致・既存ファイル保全の検証が合格。別reviewerが現物/証拠を確認し合格（重要指摘なし）、Mainが形式移管として受入。制作検査の再実行なし。
- B1-r6は本人の明示除外で未変更。旧版8件の現役/凍結や過去の確認待ちの現在への適用は未確認としてPMへ残す。ch1の本人受入doneを維持し、作品の新しい採否・制作再開を行っていない。
- 適用ファイル一覧・各SHA・未対応理由は `sources/refactor-status-inventory-20261104.md` とmigration-resultを参照。Git操作・手8・外部操作・削除なし。局所処理script/台帳/log/resultは保全証拠として保持。新規失敗0、共有②4/次5を維持。
- 本リファクタタスクの今回承認範囲は完了。追加の制作/手8は未承認のため着手せず、本人が次を判断する。セッションは自己終了しない。

## 手8 開始（2026-11-05 本人「8の計画を進める」）
- 3D依存：採用（r10f 本人受入 2026-11-05）。依存は残し、3D部品は現役/基準/未参照に分類する。
- 段階A（棚卸し・台帳案・Gemini隔離案・pycache案、移動/削除なし）を Codex に委譲。証拠 output/refactor-step8-20261105/。段階B（移動）は PM 確認後に本人が単位を指定してから。削除は本人の対象指定後。
- 本人「1」（2026-11-05）：手8段階Aは Codex の回復後（23:30開始の予約、job cvs-step8a-codex-2）に実行。
- 段階A完了（2026-11-05 23:5x）：1356ファイル、退避候補1（src/longform/ToyotaV3Opening01.tsx、元位置で論理凍結を推奨）、延期738（未追跡・dirty）。独立Reviewer合格。PM確認済み。Gemini隔離・pycacheは未追跡のため案のみ。段階Bは本人の単位指定待ち。
- 段階B実施（2026-11-05、本人「そのように・添える・削除追記」）：L01論理凍結、Gemini script を scripts/manual-external-ai/ へ移動＋README、pycache4件削除＋.gitignore追記。台帳 sources/legacy-archive-index.md。tsc exit 0。
