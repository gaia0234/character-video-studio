import React from 'react';
import {AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import data from '../data/longform/toyota-v3-p1-01.json';
import {MarkerHomer} from '../elder/HomerMarkerPilot';
import {MarkerElder} from '../elder/ElderMarkerPilot';
import {ToyotaV3OpeningCar} from './ToyotaV3OpeningCar';

const colors: Record<string, string> = {ホーマー: '#AC382F', ジャッド: '#335D87', ケント: '#327453'};
const cast = [
  {who: 'ホーマー', x: 320, phase: 0},
  {who: 'ジャッド', x: 960, phase: 83},
  {who: 'ケント', x: 1600, phase: 157},
] as const;

export const ToyotaV3Opening01 = () => {
  const frame = useCurrentFrame();
  const time = frame / 30;
  const current = data.lines.find(l => time >= l.start && time < l.end);
  const cue = data.cues.find(c => time >= c.start && time < c.end);
  const electricQuestion = time >= data.lines[2].start;
  const battery = interpolate(time, [data.lines[3].start, data.lines[3].start + 0.5], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return <AbsoluteFill style={{background: '#F5F2E9', color: '#293D49', fontFamily: 'sans-serif'}}>
    <Sequence from={12}><Audio src={staticFile(data.audio.src)} /></Sequence>
    <div style={{position: 'absolute', left: 90, top: 42, fontSize: 57, fontWeight: 800}}>二つ載せて、なぜ燃料を節約できる？</div>
    <div style={{position: 'absolute', right: 92, top: 56, fontSize: 26, color: '#687C84'}}>プリウスの仕組みと歩み　01</div>

    <div style={{position: 'absolute', left: 300, top: 150, width: 1320, height: 330,
      background: '#FFFDF7', border: '3px solid #71858B', borderRadius: 22}}>
      <div style={{position: 'absolute', left: 36, top: 26, width: 280, textAlign: 'center'}}>
        <div style={{fontSize: 43, fontWeight: 800}}>エンジン</div>
        <div style={{fontSize: 31, color: '#986522', opacity: electricQuestion ? 1 : 0}}>燃料を使う</div>
      </div>
      <div style={{position: 'absolute', right: 36, top: 26, width: 280, textAlign: 'center'}}>
        <div style={{fontSize: 43, fontWeight: 800, color: '#347B9C'}}>モーター</div>
        <div style={{fontSize: 31, color: '#347B9C', opacity: electricQuestion ? 1 : 0}}>電気を使う</div>
      </div>
      <div style={{position: 'absolute', left: 272, top: 78, width: 760, height: 242}}><ToyotaV3OpeningCar /></div>
      <svg width={1320} height={330} style={{position: 'absolute', inset: 0, opacity: battery}}>
        <defs><marker id="v3-battery-arrow" markerWidth="22" markerHeight="20" refX="19" refY="10" orient="auto" markerUnits="userSpaceOnUse"><path d="M0 0L22 10L0 20Z" fill="#327453" /></marker></defs>
        <rect x={1086} y={179} width={184} height={91} rx={14} fill="#EDF5EE" stroke="#327453" strokeWidth={4} />
        <text x={1178} y={239} textAnchor="middle" fontSize={44} fontWeight={800} fill="#327453">電池</text>
        <path d="M1009 152L1075 202" stroke="#327453" strokeWidth={4} markerEnd="url(#v3-battery-arrow)" />
        <path d="M1009 300L1075 247" stroke="#327453" strokeWidth={4} markerEnd="url(#v3-battery-arrow)" />
        <text x={980} y={158} fontSize={38} textAnchor="middle" fill="#327453">？</text>
        <text x={980} y={313} fontSize={38} textAnchor="middle" fill="#327453">？</text>
      </svg>
    </div>
    <div style={{position: 'absolute', left: 480, top: 490, width: 960, height: 3, background: '#AEBBC0'}} />
    <div style={{position: 'absolute', left: 95, top: 205, width: 61, height: 165, background: '#536267', borderRadius: 20, padding: 12, display: 'flex', flexDirection: 'column', justifyContent: 'space-between'}}>
      {['#AD4940', '#B7AA80', '#92AA9C'].map((c, i) => <div key={c} style={{height: 39, width: 39, borderRadius: '50%', background: c, opacity: i ? 0.35 : 1}} />)}
    </div>
    <div style={{position: 'absolute', left: 124, top: 370, width: 6, height: 100, background: '#536267'}} />

    {cast.map(({who, x, phase}) => {
      const activity = Math.max(0, ...data.lines.filter(l => l.speaker === who).map(l =>
        Math.min(1, Math.max(0, (time - l.start + 0.2) / 0.2), Math.max(0, (l.end + 0.2 - time) / 0.2))));
      const motionScale = 0.25 + activity * 0.75;
      return <React.Fragment key={who}>
        <div style={{position: 'absolute', left: x - 135, top: 495, width: 270, height: 380}}>
          {who === 'ホーマー' ? <MarkerHomer animated width={270} height={380} motionScale={motionScale} blinkPhase={phase} />
            : <MarkerElder who={who === 'ジャッド' ? 'judd' : 'kent'} animated width={270} height={380} motionScale={motionScale} blinkPhase={phase} />}
        </div>
        <div style={{position: 'absolute', left: x - 110, top: 875, width: 220, textAlign: 'center', fontSize: 30,
          fontWeight: 700, color: colors[who], borderBottom: `4px solid ${current?.speaker === who ? colors[who] : 'transparent'}`}}>{who}</div>
      </React.Fragment>;
    })}
    <div style={{position: 'absolute', left: 330, top: 445, fontSize: 20, color: '#6A7E85'}}>外観参考：初代プリウス資料</div>
    <div style={{position: 'absolute', inset: '929px 0 0', background: '#FFFDF7', borderTop: '2px solid #C5CECB'}}>
      {cue && <>
        <div style={{position: 'absolute', left: 80, top: 35, fontSize: 30, fontWeight: 800, color: colors[cue.speaker]}}>{cue.speaker}</div>
        <div style={{position: 'absolute', left: 290, right: 90, top: 17, fontSize: 46, fontWeight: 650, lineHeight: 1.35}}>{cue.text}</div>
      </>}
    </div>
  </AbsoluteFill>;
};
