import React from 'react';
import {AbsoluteFill, Audio, Img, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {Backdrop, MarkerFilters, useStudioFont} from './ToyotaV3VisualFrame';
import {BarChart} from './ToyotaV3Chart';

const c = {ink: '#293747', paper: '#FBFCFD', white: '#FFFCF5', gold: '#D9AB56', blue: '#437B9D', green: '#327453'};
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const fade = (frame: number, from: number, to: number) => interpolate(frame, [from, to], [0, 1], clamp);

const CUES = [
  {start: 12, end: 70, text: '1993年。'},
  {start: 70, end: 221, text: 'トヨタで「21世紀の車」を考える計画が始まった。'},
  {start: 221, end: 276, text: '名前はG21。'},
  {start: 276, end: 371, text: '燃費の目標は、従来の1.5倍。'},
  {start: 371, end: 439, text: '決して低い目標ではなかった。'},
  {start: 439, end: 525, text: 'テーマに据えたのは、環境と資源。'},
  {start: 525, end: 615, text: '規模が大きすぎて取り組むメーカーが少なく、'},
  {start: 615, end: 702, text: 'いずれは誰かがやらねばならない問題だった。'},
  {start: 702, end: 795, text: '内山田氏は、後年そう振り返っている。'},
];

const ChapterHeader = () => (
  <>
    <div data-check-id="chapter-pill" style={{position: 'absolute', left: 55, top: 36, width: 304, height: 66,
      background: c.ink, color: c.white, borderRadius: 999, display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 29, fontWeight: 800, whiteSpace: 'nowrap'}}>第1章　無茶な約束</div>
    <div data-check-id="progress-bar" style={{position: 'absolute', left: 55, top: 107, width: 304, height: 10,
      display: 'flex', gap: 8}}>
      {Array.from({length: 8}, (_, i) => (
        <div key={i} data-check-id={i === 1 ? 'progress-current' : undefined}
          style={{width: 31, height: 10, borderRadius: 999, background: i === 1 ? c.gold : '#29374733'}} />
      ))}
    </div>
  </>
);

const SubtitleBand = ({text}: {text: string}) => (
  <div data-check-id="subtitle-wrap" style={{position: 'absolute', left: 95, right: 95, bottom: 32, height: 106,
    display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
    <div style={{background: '#26313FF7', color: c.white, borderRadius: 18, height: 106, padding: '0 32px',
      display: 'flex', alignItems: 'center', justifyContent: 'center', maxWidth: 1720,
      boxShadow: '0 10px 28px #1D253040'}}>
      <span style={{fontSize: 46, fontWeight: 800, lineHeight: 1.4, letterSpacing: '0.01em',
        textAlign: 'center', whiteSpace: 'nowrap'}}>{text}</span>
    </div>
  </div>
);

const Paper = ({opacity}: {opacity: number}) => (
  <div data-check-id="a-paper" style={{position: 'absolute', left: 430, top: 104, width: 930, height: 399,
    opacity, overflow: 'visible'}}>
    <svg width={930} height={409} viewBox="0 0 930 409" style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      <polygon points="74,27 838,10 929,392 0,409" fill="#29374722" />
      <polygon points="74,17 838,0 929,382 0,399" fill="#FFFCF5" stroke="#6B5A45" strokeWidth={5} strokeLinejoin="round" />
    </svg>
  </div>
);

const CutA = ({frame}: {frame: number}) => {
  const yearIn = fade(frame, 15, 33);
  const deskIn = fade(frame, 80, 98);
  const carIn = fade(frame, 110, 128);
  const g21In = fade(frame, 229, 247);
  return (
    <>
      <div data-check-id="a-desk" style={{position: 'absolute', left: 330, top: 46, width: 1146, height: 531,
        opacity: deskIn, overflow: 'hidden', borderRadius: 16, border: '3px solid #6B5A45'}}>
        <Img src={staticFile('assets/pilots/toyota-replan-20261102/workbench-bg.svg')}
          style={{position: 'absolute', left: -204, top: -387.6, width: 1632, height: 918}} />
      </div>
      <Paper opacity={deskIn} />
      <div data-check-id="a-year-card" style={{position: 'absolute', left: 54, top: 193, width: 200, height: 100,
        opacity: yearIn, borderRadius: 14, background: c.paper, border: `4px solid ${c.ink}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 54, fontWeight: 900,
        color: c.gold}}>1993</div>
      <div data-check-id="a-g21" style={{position: 'absolute', left: 54, top: 323, opacity: g21In,
        display: 'inline-block', whiteSpace: 'nowrap'}}>
        <div style={{fontSize: 20, fontWeight: 800, color: '#526574', lineHeight: '24px'}}>計画名</div>
        <div style={{fontSize: 70, fontWeight: 900, lineHeight: '77px'}}>G21</div>
      </div>
      <Img data-check-id="a-car" src={staticFile('assets/pilots/toyota-replan-20261102/concept-car.svg')}
        style={{position: 'absolute', left: 546, top: 154, width: 714, height: 286, opacity: carIn}} />
      <div data-check-id="a-note" style={{position: 'absolute', left: 562, top: 444, opacity: carIn,
        fontSize: 22, lineHeight: '32px', color: '#526574', whiteSpace: 'nowrap'}}>構想スケッチ（模式図）</div>
    </>
  );
};

const CutB = ({frame}: {frame: number}) => {
  const inn = fade(frame, 286, 304);
  return (
    <>
      <div data-check-id="b-heading" style={{position: 'absolute', left: 54, top: 42, opacity: inn,
        fontSize: 42, fontWeight: 900, lineHeight: '61px', whiteSpace: 'nowrap'}}>燃費の目標（従来を1とする）</div>
      <div data-check-id="b-sub" style={{position: 'absolute', left: 54, top: 106, opacity: inn,
        fontSize: 25, fontWeight: 700, lineHeight: '36px', color: '#526574', whiteSpace: 'nowrap'}}>
        同じ量の燃料で走れる距離を、従来=1とした比率で示す
      </div>
      <div data-check-id="b-chart" style={{position: 'absolute', left: 130, top: 150, width: 1180, height: 360, opacity: inn}}>
        <BarChart items={[{label: '従来', value: 1, display: '1'}, {label: '目標', value: 1.5, display: '1.5倍'}]} />
      </div>
      <div data-check-id="b-zero" style={{position: 'absolute', left: 180, top: 446, opacity: inn,
        fontSize: 22, lineHeight: '32px', color: '#526574', whiteSpace: 'nowrap'}}>0（共通のゼロ点）</div>
      <div data-check-id="b-note1" style={{position: 'absolute', left: 54, top: 526, opacity: inn,
        fontSize: 22, lineHeight: '32px', color: '#526574', whiteSpace: 'nowrap'}}>
        棒は共通のゼロ点からの比率（従来=1、目標=1.5）。実燃費・航続距離の測定結果ではない。
      </div>
      <div data-check-id="b-note2" style={{position: 'absolute', left: 54, top: 562, opacity: inn,
        fontSize: 22, lineHeight: '32px', color: '#526574', whiteSpace: 'nowrap'}}>
        同じ量の燃料で走れる距離。消費量1.5倍ではない
      </div>
    </>
  );
};

const CutC = ({frame}: {frame: number}) => {
  const first = fade(frame, 445, 463);
  const second = fade(frame, 491, 509);
  return (
    <>
      <div data-check-id="c-heading" style={{position: 'absolute', left: 54, top: 42, opacity: first,
        fontSize: 42, fontWeight: 900, lineHeight: '61px', whiteSpace: 'nowrap'}}>目的は、環境と資源</div>
      <div data-check-id="c-sub" style={{position: 'absolute', left: 54, top: 106, opacity: first,
        fontSize: 25, fontWeight: 700, lineHeight: '36px', color: '#526574', whiteSpace: 'nowrap'}}>
        車は燃料・資源を使い、排気は街と空気に関わる（模式図）
      </div>
      <div data-check-id="c-pill-resource" style={{position: 'absolute', left: 113, top: 152, width: 114, height: 69,
        opacity: second, borderRadius: 999, background: '#E3EDF5', border: `3px solid ${c.blue}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, fontWeight: 800,
        color: '#2F5F7D'}}>資源</div>
      <Img data-check-id="c-fuel" src={staticFile('assets/pilots/toyota-replan-20261102-rev2/fuel-resource.svg')}
        style={{position: 'absolute', left: 98, top: 227, width: 330, height: 215, opacity: second}} />
      <div data-check-id="c-fuel-caption" style={{position: 'absolute', left: 106, top: 452, opacity: second,
        fontSize: 26, fontWeight: 800, lineHeight: '38px', whiteSpace: 'nowrap'}}>燃料・材料を使う</div>

      <div data-check-id="c-arrow-in" style={{position: 'absolute', left: 438, top: 341, width: 100, height: 27, opacity: second}}>
        <svg width={100} height={27} viewBox="0 0 100 27">
          <line x1="2" y1="13.5" x2="86" y2="13.5" stroke={c.blue} strokeWidth={6} strokeDasharray="14 10" strokeLinecap="round" />
          <path d="M84 2 L98 13.5 L84 25 Z" fill={c.blue} />
        </svg>
      </div>
      <div data-check-id="c-label-in" style={{position: 'absolute', left: 468, top: 314, width: 40, height: 24,
        opacity: second, fontSize: 20, fontWeight: 800, lineHeight: '24px', textAlign: 'center', color: '#2F5F7D'}}>投入</div>

      <Img data-check-id="c-car" src={staticFile('assets/pilots/toyota-replan-20261102/concept-car.svg')}
        style={{position: 'absolute', left: 548, top: 295, width: 420, height: 168, opacity: first}} />
      <div data-check-id="c-car-caption" style={{position: 'absolute', left: 548, top: 475, opacity: first,
        fontSize: 22, lineHeight: '32px', color: '#526574', whiteSpace: 'nowrap'}}>車（構想スケッチ・模式図）</div>

      <div data-check-id="c-arrow-out" style={{position: 'absolute', left: 976, top: 311, width: 93, height: 65, opacity: second}}>
        <svg width={93} height={65} viewBox="0 0 93 65" style={{overflow: 'visible'}}>
          <line x1="2" y1="42" x2="80" y2="42" stroke="#7C93A2" strokeWidth={7} strokeLinecap="round" />
          <path d="M78 28 L92 42 L78 56 Z" fill="#7C93A2" />
          <circle cx="28" cy="20" r="10" fill="#C9D6DE" stroke="#7C93A2" strokeWidth="3" />
          <circle cx="50" cy="10" r="12" fill="#C9D6DE" stroke="#7C93A2" strokeWidth="3" />
          <circle cx="70" cy="22" r="8" fill="#C9D6DE" stroke="#7C93A2" strokeWidth="3" />
        </svg>
      </div>
      <div data-check-id="c-label-out" style={{position: 'absolute', left: 1002, top: 380, width: 40, height: 24,
        opacity: second, fontSize: 20, fontWeight: 800, lineHeight: '24px', textAlign: 'center', color: '#526574'}}>排気</div>

      <div data-check-id="c-pill-env" style={{position: 'absolute', left: 1079, top: 152, width: 114, height: 69,
        opacity: second, borderRadius: 999, background: '#DFF0EA', border: `3px solid ${c.green}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, fontWeight: 800,
        color: '#265C43'}}>環境</div>
      <Img data-check-id="c-city" src={staticFile('assets/pilots/toyota-replan-20261102-rev2/city-air.svg')}
        style={{position: 'absolute', left: 1077, top: 227, width: 290, height: 245, opacity: second}} />
      <div data-check-id="c-city-caption" style={{position: 'absolute', left: 1082, top: 482, opacity: second,
        fontSize: 26, fontWeight: 800, lineHeight: '38px', whiteSpace: 'nowrap'}}>排気が街・空気に関わる</div>

      <div data-check-id="c-note" style={{position: 'absolute', left: 54, top: 532, width: 1400, height: 62,
        opacity: second, fontSize: 22, lineHeight: 1.4, color: '#526574', textAlign: 'center'}}>
        関係の整理（模式図）。車が燃料・資源を使い、排気が街と空気に関わる向きを示す。<br />
        1993年当時の実車・会議の再現ではない。
      </div>
    </>
  );
};

export const ToyotaCh1Opening20261102 = () => {
  useStudioFont();
  const frame = useCurrentFrame();
  const cue = CUES.find((q) => frame >= q.start && frame < q.end);
  return (
    <AbsoluteFill style={{background: '#F5F0E5', color: c.ink, fontFamily: '"Studio Noto Sans JP", sans-serif'}}>
      <MarkerFilters />
      <Backdrop mode="diagram" tone="day" />
      <Sequence from={12}><Audio src={staticFile('audio/toyota-v19-chapter1-20261029/v19-ch1-01.wav')} /></Sequence>
      <ChapterHeader />
      <div data-check-id="board" style={{position: 'absolute', left: 115, top: 160, width: 1580, height: 630,
        background: c.paper, border: `4px solid ${c.ink}`, borderRadius: 26, boxShadow: '0 12px 0 #29374718',
        overflow: 'hidden'}}>
        <div style={{position: 'absolute', inset: 0, opacity: 0.3,
          backgroundImage: 'linear-gradient(#C8D3D9 1px, transparent 1px),linear-gradient(90deg,#C8D3D9 1px,transparent 1px)',
          backgroundSize: '52px 52px'}} />
        {frame < 276 && <CutA frame={frame} />}
        {frame >= 276 && frame < 439 && <CutB frame={frame} />}
        {frame >= 439 && <CutC frame={frame} />}
      </div>
      {cue && <SubtitleBand text={cue.text} />}
    </AbsoluteFill>
  );
};
