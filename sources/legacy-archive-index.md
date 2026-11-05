# 退避台帳（手8）

2026-11-05、手8段階A。本人指示は棚卸しと案のみ。移動・削除・リネーム・既存ファイル編集・依存変更・Git書込み・API・レンダは未実施。PMはClaude Code、棚卸し担当はCodex。

## 実施結果（2026-11-05 本人「1.そのように・2.添える・3.削除追記」、PM Main が直接実施）

- 実施者の理由：Codexが使用上限で往復が上回る小変更のため Main が実施（AGENTS「小変更で往復が上回る場合はMain」）。
- L01 `src/longform/ToyotaV3Opening01.tsx`：元位置のまま論理凍結（移動・編集なし）。現entryは R2 を参照。再利用しない。復元操作は不要。
- I01 Gemini解析script：`scripts/analyze-gemini-video-opening.py` → `scripts/manual-external-ai/analyze-gemini-video-opening.py`（SHA-256 fc38ee47f8807b76…、移動前後一致）。同所 README.md（再実行は都度本人許可、ROOT絶対パスのため起動は封鎖されない旨）。復元は逆向きの mv。通常コマンド・package scripts・README/AGENTS からの参照はなし（sources の過去記録の記述は履歴として残す）。
- pycache：`scripts/__pycache__/` の4件（build-longform-v11・elder-character-art・trace-elder-from-sheets・video-compare の .pyc、未追跡の生成物）を削除しフォルダも削除。`.gitignore` に `__pycache__/`・`*.py[cod]` を追加。
- 確認：npx tsc --noEmit exit 0（実施後）。

## 結論と対象外

- 退避候補は1ファイル・1単位。物理移動は未承認。まず元位置での論理的退避を推奨する。
- v19第1・2章音声、採用基準の図・参照資料・音声・成果物・証拠、共有部品は退避対象外。過去の不合格を示す資料・出力も削除しない。
- dirty・未追跡は延期。v18/v19の版別実装・JSONやV11 scriptを「旧版」という名前だけで動かさない。
- 3D依存は採用・維持。根拠：sources/longform-v11-record.md「再利用する良い手法：受入済み側面から作る共用3D車と正投影の重ね確認」2026-11-05、r10f本人受入。package/lock・3D実装は今回の退避対象外。
- 詳細：output/refactor-step8-20261105/inventory.json（各対象の分類・理由・参照元/先・Git状態・SHA）、report.md（隔離/ignore案・延期・独立レビュー）。outputはGit管理外なので、本台帳の候補情報と根拠は以下にも保持する。

## L01：V3冒頭01の初稿コード（2026-11-05 本人決定：元位置で論理凍結・物理移動なし）

| 項目 | 内容 |
|---|---|
| 元パス | `src/longform/ToyotaV3Opening01.tsx` |
| 提案先 | `archive/legacy/v3/src/longform/ToyotaV3Opening01.tsx`（元のディレクトリ構造を保持する案） |
| Git状態 | 追跡済み・clean・stagedなし。最終変更commit `ed7bc66582e0f8274ea61ea148111aa90bd12111` |
| SHA-256 | `1b2a69b47954f85c0a0dabcd7c8c87ed468fe6b2db70805082a8e8fba219eaa0` |
| サイズ | 5585 bytes |
| 理由 | 現entryはToyotaV3Opening01R2をimport。初稿01はコード/運用文書/既存outputコマンドからの直接参照を検出せず。初稿は本人未受入、その後R2へ分離。削除ではなく履歴を保持する候補 |
| 参照元 | 静的な直接参照は未検出。歴史的な対応はsources/longform-v11-record.md「01の本人再指摘」「01の失敗記録と再発防止」「01修正版r2の制作再開」（2026-10-24）、実装commit ed7bc66 |
| 参照先 | ../data/longform/toyota-v3-p1-01.json、../elder/HomerMarkerPilot、../elder/ElderMarkerPilot、./ToyotaV3OpeningCar。JSONのaudio.srcからpublic/audio/toyota-v3-p1-01/へ。これら共有部品/JSON/音声は退避しない |
| 移動の問題 | TSXの相対importがそのままでは壊れる。履歴・再現用途を失わないことをPMが確認するまで元位置で論理的退避とする。archive配下からの実行・bundle成功は未確認 |
| 採否 | PM未判定、本人による段階Bの対象指定待ち。初稿を採用済み基準とは扱わない。過去の失敗証拠としての参照・復元を維持することが条件 |

復元手順（未実行）：元パスが既に存在したら上書きせず停止する。退避ファイルのSHAが本台帳と一致することを確認し、元パスへ同じバイト列を戻す。戻した後のSHAを再照合し、元の相対import/JSON/audio参照を点検する。必要なbundle/stillは段階Bで変更した経路に限り、別途許可範囲で実施する。現在は元パスが存在し、復元操作は不要。

## I01：外部AI解析scriptの隔離案（延期・未移動）

- 元：scripts/analyze-gemini-video-opening.py（未追跡、SHA-256 fc38ee47f8807b76d83abb058d6d3c5414ae7262fc3657196833accaf5787565）。案：scripts/manual-external-ai/analyze-gemini-video-opening.py。未追跡作業を巻き込むため所有確認まで延期し、L01の退避件数に含めない。
- ROOTが絶対パスなので移動だけでは起動を封鎖できない。隔離は運用上の配置であり権限ガードではない。対象scriptは読取のみ、--helpも含め実行しない。
- 通常入口：package scripts・README・AGENTSには対象scriptを起動する直接参照なし。sources/sources.md:580,587は過去所有/停止記録、sources/refactor-plan-steps6-8-20261104.md:104は隔離計画。履歴は消さず、将来実施時に移動先への注記を加える案。
- 過去の限定試行・停止・再開後の結果不受入はsources/sources.md「Gemini補助活用・冒頭比較の実行計画」（2026-10-21、580〜596行付近）。現在scriptと成功時コードの対応未確認。README文案はoutput/refactor-step8-20261105/manual-external-ai.README.draft.md。
- 再実行にはモデル・送信素材/用途・最大呼出し回数・費用/無料枠上限を示した本人の都度明示許可が必要。他のGemini scriptは隔離対象外。

## 検証状態と次工程

今回は静的な参照・Git状態・SHAの棚卸しのみ。移動後SHA、実import/bundle/still、復元実行は未確認。段階BはPMの分類確認後、本人が指定した単位だけを扱う。削除は本人の対象指定後。退避台帳があることを退避成功と扱わない。

## U6：由来不明ファイルの退避（2026-11-05 本人「4.退避する」、PM Main 実施）

| 元パス | 退避先 | SHA-256（先頭16） | 内容・理由 | 復元 |
|---|---|---|---|---|
| `# タイトル.md`（ルート、2026-10-21作成、32B） | `archive/legacy/unknown-origin/# タイトル.md` | （移動前後一致） | 「# タイトル／あ・い・う」だけのメモ。参照元なし | 逆向きの mv |
| `0.7/vectorize-report.json`（2026-10-22、3B） | `archive/legacy/unknown-origin/0.7/vectorize-report.json` | （移動前後一致） | vectorizer実行の出力先を誤った空に近い出力と推定（参照元なし）。`0.7/` は空になり削除 | フォルダを作って逆向きの mv |

- 由来が分かったため退避しなかったもの：`sources/# トヨタのハイブリッドは、なぜ進化し続けたのか.md`（v18準拠の音声制作準備稿、本文に「本人確認済み・採用済み」→ U2 の記録としてコミット）、`tools/vectorizer/`（追跡済みの現役ツール、scripts/build-elder-svg.py から参照。未追跡は package-lock.json のみ → U5）。
