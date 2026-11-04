# STATUS簡素化の対象一覧（2026-11-04）

**対象整理のみ実施。STATUSの変更は未承認・未実施**。PMはClaude Code。現役/凍結の最終指定と更新担当はPMが決める。B1-r6進行中のSTATUSはOC/PM所有で、今回の担当は編集しない。

2026-11-04、`output/*/STATUS.md` の実在する10ファイルについて、8欄のキー有無・行数・owner/state/last_updateを読取確認した。サブディレクトリ深部・STATUS.txt・全履歴の判断監査は対象外。下表の行数・状態は取得時点の観測で、進行中ファイルの後続更新を含まない。

基準：Hub `docs/pm-psm-handoff.md`「唯一の状態ファイル」。`owner / state / next_action / decision_needed / evidence / unconfirmed / failures / last_update` を各1行。提出は同タスクのsubmissions、判断は既存正本、失敗詳細はfailuresへ参照を残す。既存失敗累計・停止/解除条件・SHA・履歴を削らない。

各パスはプロジェクトルートからの相対パス。

| STATUS.mdの親ディレクトリ | 観測 | 承認後に必要となる差分候補 | 扱い・判断者 |
|---|---|---|---|
| `output/toyota-ch1-opening-20261102/` | 8行、8欄あり、done。ownerに「11-04以降は案件Codex PM」の旧予定が残る | 更新する必要がある場合だけ現在担当/次actionと日時を整合。履歴は既存submissionsを利用 | 受入済み・凍結候補。PMが更新要否を判断 |
| `output/toyota-ch2-49days-pilotb-20261103/` | 306行、8欄あり、owner OC、rework。提出履歴が併存 | 提出をsubmissionsへ移し、8欄は現況へ。失敗詳細と品質差戻しを正本参照で維持 | **B1-r6進行中・編集禁止**。PMが安全な区切りと担当を指定 |
| `output/toyota-motion-pilot01-20261030-rev4/` | 22行、8欄のキーなし | 現役なら現況を確定し8欄化、本文を履歴へ | 旧試作候補。現役/凍結は未確認、PM判断 |
| `output/toyota-motion-pilot01-20261030-rev5/` | 33行、8欄あり、本人/user_review | 現役なら判断待ちの現況確認と履歴分離 | 旧試作候補。過去のuser_reviewを現在の本人待ちと断定しない |
| `output/toyota-motion-pilot01-20261030-rev6/` | 69行、last_updateなし、本人/user_review | 現役なら日時の追加、現況確認、履歴分離 | 同上、PM判断 |
| `output/toyota-replan-storyboard-20261102/` | 10行、8欄のキーなし | 現役の場合のみ8欄化 | 旧絵コンテ候補、PM判断 |
| `output/toyota-replan-storyboard-20261102-rev2/` | 15行、8欄のキーなし | 現役の場合のみ8欄化 | 旧絵コンテ候補、PM判断 |
| `output/toyota-replan-storyboard-20261102-rev3/` | 38行、8欄のキーなし | 現役なら採否・未確認を確定し8欄化 | 後続ch1受入との関係をPMが判断。自動採用/棄却しない |
| `output/toyota-v18-20261029/` | 12行、8欄のキーなし | 現役の場合のみ8欄化 | 旧版候補、PM判断 |
| `output/toyota-v19-chapter1-20261029/` | 12行、8欄のキーなし | 現役の場合のみ8欄化 | 音声はv20でも保全対象。STATUSの凍結と素材の廃止を混同しない |

この一覧はSTATUSの状態を変更する決定ではない。更新の承認後も、現役だけを必要差分で扱い、凍結済みタスクを一括変換しない。手8の退避・削除・依存採否は実施しない。
