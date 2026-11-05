# 未コミット作業のコミット計画（2026-11-05・案）

本人「4.立てる」（2026-11-05）。手8の棚卸しで、未追跡・変更中の738件が退避・整理を止めていたため、受入済みの作業から順にコミットする。U1〜U6は2026-11-06までに実施済み（末尾「進捗」）。

## 現状（2026-11-05 PM確認）

- ブランチ master（追跡先 origin/master）。最新コミット 92bcb2a。変更中17件、未追跡737件。
- 内訳：public/audio 542件（約339MB、既存の音声370件はすでにGit管理）、src/data 49件、public/assets 47件、src/longform の版別TSX（v3 p4〜p5、v18、v19 など）、r10（3D）、scripts（v11系、manual-external-ai）、sources の記録。
- 由来の分からないもの：`# タイトル.md`（32B）、`sources/# トヨタのハイブリッドは、なぜ進化し続けたのか.md`、`0.7/`（vectorize-report.json 3B）、`tools/vectorizer/`。

## 進め方（1単位ずつ。各単位で同じ手順）

1. 単位ごとにファイルを列挙し、`git diff` で全差分を読み、だれの作業か（各記録・STATUS・failures）を確かめる。他セッションの作業や受入前の作業は含めない。
2. 必要な検証（npx tsc --noEmit、対象entryのstill 1枚など）を行う。
3. 別Reviewer（reviewer。記録は writing-reviewer）が差分を確認する。指摘の修正は再確認の結果が出てからコミットする。
4. `git add <列挙したパス>` だけでコミット（`git add -A` は使わない）。master の既存追跡ブランチへ通常 push し、`rtk proxy git status -sb` で追跡先との一致を確かめる。force-push・履歴改変はしない。

## 単位と順番（案）

| 順 | 単位 | 中身 | 受入の根拠 | 備考 |
|---|---|---|---|---|
| U1 | 3D r10 と手8 | src/longform/r10/、src/index-r10*-pilot.tsx・index-r10-car-check.tsx、package.json/lock の3D依存、scripts/manual-external-ai/、.gitignore、sources/legacy-archive-index.md・refactor-plan・commit-plan、AGENTS.md の GLM 行 | r10f 本人受入（2026-11-05）、手8 本人決定 | package.json/lock・AGENTS.md・longform-v11-record.md に他の変更が混ざっていないか差分で確認。index-r10/r10d/r10e は途中版のentryなので、残すか凍結かを判断して含める |
| U2 | 記録（sources/*.md の変更・追加） | longform-v9〜v11 record、sources.md、script-longform-toyota-v19.md など | 記録文書 | writing-reviewer。ファイルごとにだれの追記かを確認 |
| U3 | v19 章（コード・JSON・音声） | src/longform/ToyotaV19*、src/index-toyota-v19-*、src/data/longform/toyota-v19-*、public/audio/toyota-v19-* | 各章の受入記録を確認してから | 音声が大きい。受入未確認の章は含めない |
| U4 | v3 p4〜p5・v18 | 版別TSX/JSON/音声 | 受入記録の確認が要る | 受入がない版は「保全コミット（未受入）」と明記するか、延期 |
| U5 | v11 系 scripts・Root-v11・素材 | scripts/*-v11.*、src/Root-v11.tsx、public/assets 追加分 | v11 の記録 | 現役かどうかを手8棚卸しで確認済みの分類に従う |
| U6 | 由来不明の退避 | archive/legacy/unknown-origin/（`# タイトル.md`・`0.7/`） | 本人「退避する」 | 2件は由来判明で U2・U5 へ（legacy-archive-index.md U6節） |

## 本人決定（2026-11-05）

- U1から開始：可。
- 音声：これまでどおり通常のGitに入れる。
- 受入記録のない版（v3 p4〜p5、v18 など）：コミットする（コミットメッセージと本計画に「未受入の保全」と明記）。
- 由来不明：退避する（実施済み、U6）。

## 担当

- PM（Claude Code）が単位の確定・差分確認・受入判断・コミット/push を行う（Git書込みはPMの正規環境で行う、手6〜8計画）。差分の読み取り確認は reviewer / writing-reviewer。

## 進捗（2026-11-06）

- U1 bfdca24、U2 c1cf302、U3 078ab8e（未受入の保全）、U4 5443f53（未受入の保全）、U5 661c5b2（未受入の保全）、U6 は本節と同じコミット。各単位で reviewer／writing-reviewer 合格後にコミットした。U1〜U5 は push 後に追跡先との一致を確認済み、U6 も同じ手順で行う。
- 別件：68fddaa（Windows起動スクリプトを ssh ubuntu-work 経由へ修正）。
- どの単位にも入れていない未追跡（計画外、扱いは本人判断待ち）：motion-pilot01 系（初版と rev2〜6 の TSX・entry・JSON・public/assets/pilots/toyota-motion-pilot01*）、ToyotaReplanStoryboard20261102（TSX・entry、rev2 含む）、public/assets/drafts/luno-loop-v1/、旧音声フォルダ（public/audio/longform-toyota01-intro-v6・-narrator-audition-v6・-narrator-v5・longform-v8-audition・toyota-v5-narration-20261027）と対応JSON（toyota01-intro-v6-voice・toyota01-narrator-audition-v6-a/b）。
- 変更中で対象外のまま：public/assets/manifest.json、scripts/check-longform.mjs、scripts/generate-dialogue-voice.py、src/data/longform/toyota01.json、src/longform/LongformToyota01.tsx（所有の確認前）。
