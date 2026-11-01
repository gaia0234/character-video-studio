import React from 'react';
import {AbsoluteFill, staticFile} from 'remotion';
import {MarkerHomer} from '../elder/HomerMarkerPilot';
import {MarkerElder} from '../elder/ElderMarkerPilot';
import {MarkerFilters, useStudioFont} from './ToyotaV3VisualFrame';
import {BarChart} from './ToyotaV3Chart';

const c = {ink: '#293747', paper: '#FBFCFD', white: '#FFFCF5', gold: '#D9AB56', blue: '#437B9D', green: '#327453'};
const clampText = {textWrap: 'balance'} as const;

const Badge = ({text}: {text: string}) => <div style={{position: 'absolute', top: 40, left: 56, background: c.ink, color: c.white,
  padding: '12px 26px', borderRadius: 999, fontSize: 28, fontWeight: 800}}>{text}</div>;

const Subtitle = ({text}: {text: string}) => <div style={{position: 'absolute', bottom: 40, left: 120, right: 120, display: 'flex', justifyContent: 'center'}}>
  <div style={{background: '#26313FF7', color: c.white, borderRadius: 18, padding: '18px 36px 20px', maxWidth: 1680}}>
    <div style={{fontSize: 40, fontWeight: 800, lineHeight: 1.35, textAlign: 'center', ...clampText}}>{text}</div>
  </div>
</div>;

const Note = ({text, style}: {text: string; style?: React.CSSProperties}) => <div style={{position: 'absolute', fontSize: 22, color: '#526574', ...style}}>{text}</div>;

// A: 構想車の線画を机上の紙面へ収める。車造形・キャラ・配色は変えない。
// 紙は机の上に置き、車線画は紙の内側に余白を残して配置する。代表Aは同じAを字幕付きで別Compositionにする。
export const CutA = ({sub = false}: {sub?: boolean}) => (
  <div style={{position: 'absolute', inset: 0, background: '#EFE6D6'}}>
    <img src={staticFile('assets/pilots/toyota-replan-20261102/workbench-bg.svg')} style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}} />
    <div style={{position: 'absolute', left: 140, top: 150, width: 200, height: 100, borderRadius: 14, background: c.paper,
      border: `4px solid ${c.ink}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 54, fontWeight: 900, color: c.gold}}>1993</div>
    <div style={{position: 'absolute', left: 380, top: 158}}>
      <div style={{fontSize: 20, fontWeight: 800, color: '#526574'}}>計画名</div>
      <div style={{fontSize: 70, fontWeight: 900, lineHeight: 1.1}}>G21</div>
    </div>

    {/* 机上の紙面。机の上に置かれ、車線画はこの内側に収まる。 */}
    <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}} aria-hidden>
      <polygon points="460,482 1380,462 1490,922 370,942" fill="#29374722" />
      <polygon points="460,470 1380,450 1490,910 370,930" fill="#FFFCF5" stroke="#6B5A45" strokeWidth={5} strokeLinejoin="round" />
    </svg>

    <img src={staticFile('assets/pilots/toyota-replan-20261102/concept-car.svg')}
      style={{position: 'absolute', left: 510, top: 510, width: 860, height: 344}} />
    <Note text="構想スケッチ（模式図）" style={{left: 530, top: 860}} />

    <div style={{position: 'absolute', left: 40, top: 520, width: 320, height: 480}}>
      <MarkerElder who="kent" animated width={320} height={480} motionScale={1} blinkPhase={157} />
    </div>
    <div style={{position: 'absolute', left: 1520, top: 540, width: 320, height: 480}}>
      <MarkerHomer animated width={320} height={480} motionScale={1} />
    </div>
    <Badge text="1993｜G21" />
    {sub && <Subtitle text="トヨタで「21世紀の車」を考える計画が始まった。" />}
  </div>
);

// B: 燃費（同じ量の燃料で走れる距離）の目標。燃料消費量の増加と読ませない。
export const CutB = () => (
  <div style={{position: 'absolute', inset: 0, background: '#F5F0E5'}}>
    <div style={{position: 'absolute', left: 70, top: 52, fontSize: 44, fontWeight: 900}}>燃費の目標（従来を1とする）</div>
    <div style={{position: 'absolute', left: 70, top: 112, fontSize: 25, fontWeight: 700, color: '#526574'}}>
      同じ量の燃料で走れる距離を、従来=1とした比率で示す
    </div>
    <div style={{position: 'absolute', left: 370, top: 240}}>
      <BarChart items={[{label: '従来', value: 1, display: '1'}, {label: '目標', value: 1.5, display: '1.5倍'}]} />
    </div>
    <div style={{position: 'absolute', left: 420, top: 536, fontSize: 18, fontWeight: 700, color: '#526574'}}>0（共通のゼロ点）</div>
    <Note text="棒は共通のゼロ点からの比率（従来=1、目標=1.5）。実燃費・航続距離の測定結果ではない。" style={{left: 370, top: 636}} />
    <div style={{position: 'absolute', left: 40, top: 560, width: 280, height: 420}}>
      <MarkerElder who="kent" animated width={280} height={420} motionScale={1} blinkPhase={157} />
    </div>
    <div style={{position: 'absolute', left: 1600, top: 580, width: 280, height: 420}}>
      <MarkerHomer animated width={280} height={420} motionScale={1} />
    </div>
  </div>
);

// C: 資源の投入（左→車）と、排気が街・空気へ向かう向き（車→右）を1枚で示す。
// 排出量・割合・技術効果、排出ゼロ、実在の1993年車両/会議の再現は描かない。
export const CutC = () => (
  <div style={{position: 'absolute', inset: 0, background: '#F5F0E5'}}>
    <div style={{position: 'absolute', left: 70, top: 52, fontSize: 44, fontWeight: 900}}>目的は、環境と資源</div>
    <div style={{position: 'absolute', left: 70, top: 112, fontSize: 25, fontWeight: 700, color: '#526574'}}>
      車は燃料・資源を使い、排気は街と空気に関わる（模式図）
    </div>

    <div style={{position: 'absolute', left: 120, top: 176, padding: '10px 24px', borderRadius: 999, background: '#E3EDF5',
      border: `3px solid ${c.blue}`, fontSize: 30, fontWeight: 800, color: '#2F5F7D'}}>資源</div>
    <img src={staticFile('assets/pilots/toyota-replan-20261102-rev2/fuel-resource.svg')}
      style={{position: 'absolute', left: 100, top: 250, width: 440, height: 287}} />
    <div style={{position: 'absolute', left: 110, top: 552, fontSize: 26, fontWeight: 800, color: c.ink}}>燃料・材料を使う</div>

    <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
      <line x1="556" y1="420" x2="686" y2="420" stroke={c.blue} strokeWidth={7} strokeDasharray="14 10" strokeLinecap="round" />
      <path d="M672 402 L696 420 L672 438 Z" fill={c.blue} />
      <text x="596" y="392" fontSize="20" fontWeight="800" fill="#2F5F7D" textAnchor="middle">投入</text>
    </svg>

    <img src={staticFile('assets/pilots/toyota-replan-20261102/concept-car.svg')}
      style={{position: 'absolute', left: 700, top: 340, width: 560, height: 224}} />
    <div style={{position: 'absolute', left: 700, top: 580, fontSize: 22, fontWeight: 700, color: '#526574'}}>車（構想スケッチ・模式図）</div>

    <div style={{position: 'absolute', left: 1408, top: 176, padding: '10px 24px', borderRadius: 999, background: '#DFF0EA',
      border: `3px solid ${c.green}`, fontSize: 30, fontWeight: 800, color: '#265C43'}}>環境</div>
    <img src={staticFile('assets/pilots/toyota-replan-20261102-rev2/city-air.svg')}
      style={{position: 'absolute', left: 1405, top: 250, width: 400, height: 337}} />
    <div style={{position: 'absolute', left: 1412, top: 600, fontSize: 26, fontWeight: 800, color: c.ink}}>排気が街・空気に関わる</div>

    <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
      <line x1="1268" y1="430" x2="1384" y2="430" stroke="#7C93A2" strokeWidth={7} strokeLinecap="round" />
      <path d="M1368 412 L1394 430 L1368 448 Z" fill="#7C93A2" />
      <circle cx="1292" cy="398" r="14" fill="#C9D6DE" stroke="#7C93A2" strokeWidth="3" />
      <circle cx="1322" cy="380" r="18" fill="#C9D6DE" stroke="#7C93A2" strokeWidth="3" />
      <circle cx="1352" cy="400" r="12" fill="#C9D6DE" stroke="#7C93A2" strokeWidth="3" />
      <text x="1310" y="466" fontSize="20" fontWeight="800" fill="#526574" textAnchor="middle">排気</text>
    </svg>

    <div style={{position: 'absolute', left: 40, top: 660, width: 220, height: 330}}>
      <MarkerElder who="kent" animated width={220} height={330} motionScale={1} blinkPhase={157} />
    </div>
    <div style={{position: 'absolute', left: 1660, top: 660, width: 220, height: 330}}>
      <MarkerHomer animated width={220} height={330} motionScale={1} />
    </div>

    <div style={{position: 'absolute', left: 300, right: 300, top: 900, textAlign: 'center', fontSize: 20, lineHeight: 1.55, color: '#526574'}}>
      関係の整理（模式図）。車が燃料・資源を使い、排気が街と空気に関わる向きを示す。<br />
      排出量・割合・技術効果は未確認のため表示しない。1993年当時の実車・会議の再現ではない。
    </div>
  </div>
);

const Panel = ({label, time, children, caption}: {label: string; time: string; children: React.ReactNode; caption: string[]}) => (
  <div style={{position: 'absolute', left: 0, top: 0}}>
    <div style={{position: 'absolute', left: 0, top: -44, fontSize: 28, fontWeight: 900}}>{label}</div>
    <div style={{position: 'absolute', left: 0, top: -44, right: 0, textAlign: 'right', fontSize: 22, color: '#526574', fontWeight: 700}}>{time}</div>
    <div style={{width: 600, height: 338, overflow: 'hidden', position: 'relative', border: `3px solid ${c.ink}`, borderRadius: 12, background: c.paper}}>
      <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, transform: 'scale(0.3125)', transformOrigin: '0 0'}}>{children}</div>
    </div>
    <div style={{position: 'absolute', left: 0, top: 356, width: 600}}>
      {caption.map((t, i) => <div key={i} style={{fontSize: 19, lineHeight: 1.45, color: i === 0 ? c.ink : '#526574', fontWeight: i === 0 ? 800 : 600}}>{t}</div>)}
    </div>
  </div>
);

export const RepARev3 = () => (
  <AbsoluteFill style={{background: '#EFE6D6', color: c.ink, fontFamily: '"Studio Noto Sans JP", sans-serif'}}>
    <MarkerFilters />
    <CutA sub />
  </AbsoluteFill>
);

export const ToyotaReplanStoryboard20261102Rev3 = () => {
  useStudioFont();
  return <AbsoluteFill style={{background: '#F5F0E5', color: c.ink, fontFamily: '"Studio Noto Sans JP", sans-serif'}}>
    <MarkerFilters />
    <div style={{position: 'absolute', left: 70, top: 36, fontSize: 42, fontWeight: 900}}>v19 第1章冒頭 3カット絵コンテ Rev3</div>
    <div style={{position: 'absolute', left: 70, top: 92, fontSize: 22, color: '#526574'}}>対象: v19-ch1-01（26.101秒）／A=紙面修正、B/C=Rev2是正維持／2026-11-02</div>

    <div style={{position: 'absolute', left: 60, top: 190}}>
      <Panel label="A 何を考え始めたか" time="0–7秒"
        caption={['主役: 机上の紙面に描いた構想スケッチ（模式図）', '注視点: 紙面の図→1993/G21のラベル', '変化: 年から構想へ', '台詞: 「1993年。…計画が始まった。名前はG21。」']}>
        <CutA />
      </Panel>
    </div>
    <div style={{position: 'absolute', left: 680, top: 190}}>
      <Panel label="B どれほど高い目標か" time="7–15秒"
        caption={['主役: 燃費の従来1／目標1.5', '注視点: 共通のゼロ点と尺度', '変化: 従来→目標', '台詞: 「燃費の目標は、従来の1.5倍。…」', '注記: 同じ量の燃料で走れる距離。消費量1.5倍ではない']}>
        <CutB />
      </Panel>
    </div>
    <div style={{position: 'absolute', left: 1300, top: 190}}>
      <Panel label="C 何のために続けるか" time="15–27秒"
        caption={['主役: 資源の投入と排気の向き（車中心）', '注視点: 資源→車→街・空気', '変化: 車単体から2目的へ', '台詞: 「テーマに据えたのは、環境と資源。…」', '注記: 排出量・割合・技術効果は表示しない']}>
        <CutC />
      </Panel>
    </div>

    <div style={{position: 'absolute', left: 70, right: 70, bottom: 56, fontSize: 20, lineHeight: 1.6, color: '#526574'}}>
      注記: Aの車は机上の紙面に描いた構想スケッチ（模式図）で、1993年当時の実車・会議の再現ではない。Bは燃費（同じ量の燃料で走れる距離）の目標で、燃料消費量や実燃費・航続距離の測定値ではない。Cは資源の投入と排気の向きを示す関係の整理で、排出量・割合・技術効果の未確認値は表示しない。参考GIFの画像・人物・数値は転載しない。
    </div>
  </AbsoluteFill>;
};
