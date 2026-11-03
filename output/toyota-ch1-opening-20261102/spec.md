# v19-ch1-01 第1章冒頭 仕様票（2026-11-02 確定。production-reviewer 事前確認の指摘を反映）

作成：planner（Opus xhigh）案 → PM（Claude代行）が決定事項を反映。根拠の詳細は案の参照ファイル（末尾）を参照。

## 決定事項
- A 章ピル「第1章　無茶な約束」＋8区間バー、2番目をgold（PM）。
- B 人物は出さない（本人。v3 p1-05と同じ扱い）。person要素・personを含む重なり検査は使わない。
- C カットAは紙盤の内側に机の切り抜き窓、年カードとG21は紙の左（本人）。Rev3のバッジ「1993｜G21」は外す。
- D Bに補足注記 b-note2「同じ量の燃料で走れる距離。消費量1.5倍ではない」を出す（PM）。
- E Bの棒は伸ばさない。共有の ToyotaV3Chart.tsx（BarChart）は改変しない（PM）。
- F cue 7 は無音 19.90–20.35 で2つに分け、字幕帯は1行（PM）。

## 共通
- 1920×1080・30fps・811フレーム（27.033秒）。画面の秒 = WAVの秒 + 0.4（v3型 lead 0.4、`<Sequence from={12}>`）。音声 public/audio/toyota-v19-chapter1-20261029/v19-ch1-01.wav（26.101秒）。元のWAVは加工せず、出力時は p1-05 と同じ処理（2パスloudnorm I=-14/TP=-2.5、AAC 192k/48kHz/2ch。output/toyota-v3-p1-05-20261026/loudnorm-commands.json）。
- 時刻は表のフレーム値を正とする（秒は参考）。
- v3型の固定要素：Backdrop diagram/day、MarkerFilters、useStudioFont（ToyotaV3VisualFrame.tsx）、章ピル・紙盤と方眼・字幕帯（ToyotaV3Opening05.tsx L39–46・L58–64）。字幕46px・800、帯 #26313FF7・角丸18。ナレ2なので話者chipなし。
- 入りは不透明度だけ：`interpolate(time,[t0+0.1,t0+0.7],[0,1])`（t0＝実音の句の開始）。transformは使わない。出はカット切替で消えるだけ。
- 矩形は枠線込みの外寸（border-box）。紙盤内側の原点(119,164)、内寸1572×622。
- 共通要素（data-check-id）：chapter-pill [55,36,約304,66]、progress-bar [55,107,約304,10]、progress-current [94,107,31,10]、board [115,160,1580,630]、subtitle-wrap [95,942,1730,106]。

### 字幕cue（画面の秒／フレーム）
| # | 文 | cue |
|---|---|---|
|1|1993年。|0.400(f12)–2.333(f70)|
|2|トヨタで「21世紀の車」を考える計画が始まった。|2.333(f70)–7.367(f221)|
|3|名前はG21。|7.367(f221)–9.200(f276)|
|4|燃費の目標は、従来の1.5倍。|9.200(f276)–12.367(f371)|
|5|決して低い目標ではなかった。|12.367(f371)–14.633(f439)|
|6|テーマに据えたのは、環境と資源。|14.633(f439)–17.500(f525)|
|7a|規模が大きすぎて取り組むメーカーが少なく、|17.500(f525)–20.500(f615)|
|7b|いずれは誰かがやらねばならない問題だった。|20.500(f615)–23.400(f702)|
|8|内山田氏は、後年そう振り返っている。|23.400(f702)–26.501(f795)|
切替点はWAVの秒でaudio-reportの無音区間に入る（例 f276→8.80、f439→14.233）。

## カットA「何を考え始めたか」f0–275
- 主役：机の上の紙面の構想スケッチ（模式図）。1993は年、G21は計画名、車は実車ではない模式図。
| id | 矩形 | 内容 |
|---|---|---|
|a-year-card|[173,357,200,100]|Rev3 L27–28 の1993カードと同寸・同書式|
|a-g21|[173,487,約135,106]|「計画名」20px＋「G21」70px|
|a-desk|[449,210,1146,531]|机の切り抜き窓（overflow hidden、角丸16・枠3px #6B5A45）。workbench-bg.svg を0.85倍、元(240,456)を窓の左上に合わせ、元SVGの y≥456 だけ見せる|
|a-paper|bbox [549,268,930,399]|Rev3の台形を0.83倍、頂点(623,285)(1387,268)(1478,650)(549,667)、影+10px|
|a-car|[665,318,714,286]|concept-car.svg、紙の内側に上34px・右20px以上の余白|
|a-note|約[681,608,242,32]|「構想スケッチ（模式図）」22px、紙の内側|
- 動き：年カード f15–33／机の窓＋紙 f80–98／車＋注記 f110–128／G21 f229–247。f276で消える。
- 素材：public/assets/pilots/toyota-replan-20261102/workbench-bg.svg、concept-car.svg。紙はインラインpolygon。
- 変えない：車の線画・造形、紙の台形・影・色、1993/G21の内容と書式、注記の文言、配色。
- Rev3からの変更：紙は机に対して約60px下（Rev3の紙上端y450は切り出し開始y456より上で欠けるため）。机の帯（y≈468–539）が紙の中ほどを横切る見え方を代表静止画で確認する。

## カットB「どれほど高い目標か」f276–438
- 主役：燃費の比較棒。燃費＝同じ量の燃料で走れる距離（大きいほど良い）。従来=1の比率で1:1.5、共通ゼロ点（基線y=604）。km/L・実燃費・航続距離ではない。燃料消費量1.5倍の意味にしない。
| id | 矩形 | 内容 |
|---|---|---|
|b-heading|[173,206,約569,61]|「燃費の目標（従来を1とする）」42px・900|
|b-sub|[173,270,約628,36]|「同じ量の燃料で走れる距離を、従来=1とした比率で示す」25px|
|b-chart|[249,314,1180,360]|BarChart（改変しない、既定寸法、v3 scene17と同じ置き方）|
|b-bar-old|[654,457.33,150,146.67]|灰「1」「従来」|
|b-bar-target|[874,384,150,220]|gold「1.5倍」「目標」|
|b-zero|約[299,610,185,32]|「0（共通のゼロ点）」22px|
|b-note1|[173,690,914,32]（初回実測で固定）|「棒は共通のゼロ点からの比率（従来=1、目標=1.5）。実燃費・航続距離の測定結果ではない。」22px|
|b-note2|[173,726,493,32]（初回実測で固定）|「同じ量の燃料で走れる距離。消費量1.5倍ではない」22px|
- 動き：全要素 f286–304 で入る。棒は伸ばさない。f439で消える。
- 変えない：見出し・副題・注記の文言、BarChartは改変しない（値・灰/金の色・ラベル）、共通ゼロ点。

## カットC「何のために続けるか」f439–810
- 主役：車を中心にした2方向。資源→車（投入）、車→街・空気（排気）。環境と資源の2目的。数値・グラフなし、排出ゼロ表現なし、煙は向きだけ。
| id | 矩形 | 内容 |
|---|---|---|
|c-heading|[173,206,約378,61]|「目的は、環境と資源」42px・900|
|c-sub|[173,270,約675,36]|「車は燃料・資源を使い、排気は街と空気に関わる（模式図）」25px|
|c-pill-resource|[232,316,114,69]|「資源」30px|
|c-fuel|[217,391,330,215]|fuel-resource.svg|
|c-fuel-caption|約[225,616,208,38]|「燃料・材料を使う」26px|
|c-arrow-in|約[557,505,100,27]|青の破線矢印 左→右、上に「投入」20px（c-label-in）|
|c-car|[667,459,420,168]|concept-car.svg|
|c-car-caption|約[667,639,286,32]|「車（構想スケッチ・模式図）」22px|
|c-arrow-out|約[1095,475,93,65]|灰の矢印＋煙3つ 左→右、下に「排気」20px（c-label-out）|
|c-pill-env|[1198,316,114,69]|「環境」30px|
|c-city|[1196,391,290,245]|city-air.svg|
|c-city-caption|約[1201,646,286,38]|「排気が街・空気に関わる」26px|
|c-label-in|[587,478,40,24]|「投入」20px（矢印の上、間隔3px）|
|c-label-out|[1121,544,40,24]|「排気」20px（矢印の下、間隔4px）|
|c-note|[173,696,1400,62]|2行・中央揃え22px・行高1.4。1行目は Rev3 L124 の注記、2行目は L125 のうち読者向けの「1993年当時の実車・会議の再現ではない。」だけ。L125 前半の制作メモ（「…未確認のため表示しない。」）は出さない（PM決定、本人共有時に確認事項として示す）|
- 動き：見出し・副題・車・車キャプション f445–463／資源側・環境側・両矢印・c-note f491–509。出はなし（16.95秒以降は静止。テンポは本人確認）。
- 素材：concept-car.svg（toyota-replan-20261102/）、fuel-resource.svg・city-air.svg（toyota-replan-20261102-rev2/）。
- 変えない：Rev3 CutC の文言・配色（資源ピル＝青、環境ピル＝緑、Rev3 L85–86・L101–102）・素材、投入＝青い破線、排気＝灰＋煙3つ。

## layout-check
- 検査フレーム：A f255、B f360、C f570。共通5要素（personなし）を各JSONの先頭に入れる。
- **全要素・全重なり組・全比率を screen 空間で測る**：elements は `"space":"screen"`、overlaps の各組にも `"space":"screen"`、ratios は `"box":"screen"` を必ず書く（layout空間ではSVG要素がNaNになり判定が素通りするため。layout-check.mjs L179–189・L309）。
- expect には必ず tolerance を書く（矩形は2px、紙・矢印は4px、board 1px）。結果JSONの rect・重なりの値に null/NaN が1つでもあれば不合格とする。
- 棒の外接矩形に stroke（3px）が入る場合は、初回の実測で確かめて expect を実測値に直す（BarChartは改変しない）。
- b-chart は内側の svg 要素を測る（ラッパーdivはinline SVGの下余白で高さが変わる）。棒は `[data-check-id="b-chart"] svg rect` の index 0/1。比率：高さ 1.5（許容0.012）、幅 1.0（許容0.01）。
- 文字要素（expectなし）の合格条件：盤の内側 x119–1691・y164–786 に収まる、a-note は紙の内側、表の約値との差が6px以内。初回実測値はPMがspecに固定する。
- 重なり検査の組（id: a × b）。
  - A：progress-bar×board、board×subtitle-wrap、a-year-card×a-g21、a-year-card×a-desk、a-g21×a-desk、a-car×a-note。
  - B：b-heading×b-sub、b-sub×b-chart、b-zero×b-bar-old、b-chart×b-note1、b-note1×b-note2。
  - C：c-sub×c-pill-resource、c-sub×c-pill-env、c-pill-resource×c-fuel、c-pill-env×c-city、c-fuel×c-arrow-in、c-arrow-in×c-car、c-car×c-arrow-out、c-arrow-out×c-city、c-label-in×c-arrow-in、c-label-out×c-arrow-out、c-fuel×c-fuel-caption、c-car×c-car-caption、c-city×c-city-caption、c-fuel-caption×c-note、c-car-caption×c-note、c-city-caption×c-note。
- 使う前に、SVG・screen の経路でも既知の不良で非0になることを1回確かめる（例：Bの棒の比率を一時的に1:1.6にした仕様JSONで非0になる）。
- カット切替の前後は、f274–277 と f437–440 を1フレームごとに書き出した一覧画像（`--interval 0.034`）で、前のカットの要素が残っていないことを確認する（PMが実見。MiMoを使う場合は残り回数から数える）。

## 継承と変更の記録（README L86）
v3型・Rev3からの変更：章ピルを第N部・5区間→「第1章　無茶な約束」・8区間、人物なし、Aは紙盤内の机の窓（年・G21は紙の左、紙は約60px下）、Bに b-note2、cue 7 を2分割、Cの注記は読者向けだけ。本人へ共有するときにこの一覧を示す。

## 未確認
文字幅（章ピル約304等）は推定。SVG rect の矩形に stroke が入るか。WAVのloudnorm有無。実聴・テンポは本人。

## 参照
plan.md、audio-report.json、output/toyota-v19-chapter1-20261029/voice/v19-ch1-01-query.json、Rev3 storyboard.md/result.json/3up/representative-A.png、src/longform/ToyotaReplanStoryboard20261102Rev3.tsx、README.md L74–86、ToyotaV3Opening05.tsx・Opening17.tsx・ToyotaV3Chart.tsx・ToyotaV3VisualFrame.tsx、output/toyota-v3-p1-05-20261026/final-release.png、scripts/layout-check.mjs、sources/script-longform-toyota-v19.md L33。
