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

export const CutA = ({sub = false}: {sub?: boolean}) => (
  <div style={{position: 'absolute', inset: 0, background: '#EFE6D6'}}>
    <img src={staticFile('assets/pilots/toyota-replan-20261102/workbench-bg.svg')} style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}} />
    <div style={{position: 'absolute', left: 140, top: 150, width: 200, height: 100, borderRadius: 14, background: c.paper,
      border: `4px solid ${c.ink}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 54, fontWeight: 900, color: c.gold}}>1993</div>
    <div style={{position: 'absolute', left: 380, top: 158}}>
      <div style={{fontSize: 20, fontWeight: 800, color: '#526574'}}>計画名</div>
      <div style={{fontSize: 70, fontWeight: 900, lineHeight: 1.1}}>G21</div>
    </div>
    <img src={staticFile('assets/pilots/toyota-replan-20261102/concept-car.svg')}
      style={{position: 'absolute', left: 470, top: 460, width: 900, height: 360}} />
    <Note text="構想スケッチ（模式図）" style={{left: 480, top: 782}} />
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

export const CutB = () => (
  <div style={{position: 'absolute', inset: 0, background: '#F5F0E5'}}>
    <div style={{position: 'absolute', left: 70, top: 60, fontSize: 44, fontWeight: 900}}>燃料消費の目標（従来を1とする）</div>
    <div style={{position: 'absolute', left: 370, top: 230}}>
      <BarChart items={[{label: '従来', value: 1, display: '1'}, {label: '目標', value: 1.5, display: '1.5倍'}]} />
    </div>
    <Note text="共通尺度・ゼロ点あり（従来=1）。航続距離や実燃費の測定結果ではない。" style={{left: 370, top: 640}} />
    <div style={{position: 'absolute', left: 40, top: 520, width: 280, height: 420}}>
      <MarkerElder who="kent" animated width={280} height={420} motionScale={1} blinkPhase={157} />
    </div>
    <div style={{position: 'absolute', left: 1580, top: 540, width: 280, height: 420}}>
      <MarkerHomer animated width={280} height={420} motionScale={1} />
    </div>
      </div>
);

export const CutC = () => (
  <div style={{position: 'absolute', inset: 0, background: '#F5F0E5'}}>
    <div style={{position: 'absolute', left: 70, top: 60, fontSize: 44, fontWeight: 900}}>車と、燃料・資源の関係</div>
    <img src={staticFile('assets/pilots/toyota-replan-20261102/concept-car.svg')}
      style={{position: 'absolute', left: 560, top: 330, width: 800, height: 320}} />
    <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
      <line x1="330" y1="470" x2="620" y2="470" stroke={c.blue} strokeWidth={6} strokeDasharray="14 10" />
      <line x1="1580" y1="470" x2="1290" y2="470" stroke={c.green} strokeWidth={6} strokeDasharray="14 10" />
    </svg>
    <div style={{position: 'absolute', left: 170, top: 420, padding: '10px 22px', borderRadius: 999, background: '#E3EDF5',
      border: `3px solid ${c.blue}`, fontSize: 30, fontWeight: 800, color: '#2F5F7D'}}>燃料</div>
    <div style={{position: 'absolute', left: 1600, top: 420, padding: '10px 22px', borderRadius: 999, background: '#DFF0EA',
      border: `3px solid ${c.green}`, fontSize: 30, fontWeight: 800, color: '#265C43'}}>資源</div>
    <Note text="関係の整理（模式図）。排出量・割合・技術効果は未確認のため表示しない。" style={{left: 70, top: 720}} />
    <div style={{position: 'absolute', left: 60, top: 560, width: 280, height: 420}}>
      <MarkerElder who="kent" animated width={280} height={420} motionScale={1} blinkPhase={157} />
    </div>
    <div style={{position: 'absolute', left: 1560, top: 560, width: 280, height: 420}}>
      <MarkerHomer animated width={280} height={420} motionScale={1} />
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

export const RepA = () => (
  <AbsoluteFill style={{background: '#EFE6D6', color: c.ink, fontFamily: '"Studio Noto Sans JP", sans-serif'}}>
    <MarkerFilters />
    <CutA sub />
  </AbsoluteFill>
);

export const ToyotaReplanStoryboard20261102 = () => {
  return <AbsoluteFill style={{background: '#F5F0E5', color: c.ink, fontFamily: '"Studio Noto Sans JP", sans-serif'}}>
    <MarkerFilters />
    <div style={{position: 'absolute', left: 70, top: 36, fontSize: 42, fontWeight: 900}}>v19 第1章冒頭 3カット絵コンテ</div>
    <div style={{position: 'absolute', left: 70, top: 92, fontSize: 22, color: '#526574'}}>対象: v19-ch1-01（26.101秒）／2026-11-02／A/B/Cは別の主役・場面（同一ボードの寄り引きにしない）</div>

    <div style={{position: 'absolute', left: 60, top: 190}}>
      <Panel label="A 何を考え始めたか" time="0–7秒"
        caption={['主役: 机上の構想スケッチ（模式図）', '注視点: 図面→1993/G21のラベル', '変化: 年から構想へ', '台詞: 「1993年。…計画が始まった。名前はG21。」']}>
        <CutA />
      </Panel>
    </div>
    <div style={{position: 'absolute', left: 680, top: 190}}>
      <Panel label="B どれほど高い目標か" time="7–15秒"
        caption={['主役: 従来1と目標1.5の比較', '注視点: ゼロ点と共通尺度', '変化: 従来→目標', '台詞: 「燃費の目標は、従来の1.5倍。…」']}>
        <CutB />
      </Panel>
    </div>
    <div style={{position: 'absolute', left: 1300, top: 190}}>
      <Panel label="C 何のために続けるか" time="15–27秒"
        caption={['主役: 車と燃料・資源の関係図', '注視点: 車へ向かう2本の線', '変化: 目的（環境・資源）へ', '台詞: 「テーマに据えたのは、環境と資源。…」']}>
        <CutC />
      </Panel>
    </div>

    <div style={{position: 'absolute', left: 70, right: 70, bottom: 60, fontSize: 20, lineHeight: 1.6, color: '#526574'}}>
      注記: Aの車は1993年当時の実車・会議の再現ではなく、構想を表す模式スケッチ。Bは燃料消費の目標で、実燃費や航続距離の測定値ではない。Cは関係の整理で、排出量・割合・技術効果の未確認値は表示しない。参考GIFの画像・人物・数値は転載しない。
    </div>
  </AbsoluteFill>;
};
