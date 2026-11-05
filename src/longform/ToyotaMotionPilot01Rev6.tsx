import React from 'react';
import {AbsoluteFill, Audio, Sequence, Easing, interpolate, spring, staticFile, useCurrentFrame} from 'remotion';
import data from '../data/longform/toyota-motion-pilot01-rev6.json';
import {MarkerHomer} from '../elder/HomerMarkerPilot';
import {MarkerElder} from '../elder/ElderMarkerPilot';
import {MarkerFilters, useStudioFont} from './ToyotaV3VisualFrame';

const c = {ink: '#3A2C21', paper: '#FFFDF7', white: '#FFFCF5', gold: '#D9AB56', blue: '#437B9D', wood: '#B98A5E'};
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const easeOut = (t: number, t0: number, d: number) =>
  interpolate(t, [t0, t0 + d], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
const popStyle = (v: number) => ({
  opacity: Math.min(1, v * 1.4),
  transform: `scale(${0.86 + 0.14 * v})`,
});

const TIMELINE = [
  {label: '1993 G21', current: true},
  {label: '1997 初代'},
  {label: '2003 2代目'},
  {label: '2009 3代目'},
  {label: '2025 第6世代'},
];

// カメラはショットごとに固定。境界はカット、ショット内だけ緩く動かす。
const SHOTS = [
  {from: 0.0, to: 1.5, s: 1.0, s2: 1.03, tx: 0, tx2: 0, ty: 0, ty2: 0},
  {from: 1.5, to: 12.53, s: 1.7, s2: 1.72, tx: -660, tx2: -676, ty: 8, ty2: 4},
  {from: 12.53, to: 15.47, s: 1.0, s2: 1.02, tx: 0, tx2: -20, ty: 0, ty2: -6},
  {from: 15.47, to: 18.0, s: 1.35, s2: 1.04, tx: -260, tx2: -10, ty: -150, ty2: 0},
  {from: 18.0, to: 23.19, s: 1.04, s2: 1.08, tx: -10, tx2: -40, ty: 0, ty2: -10},
  {from: 23.19, to: 26.8, s: 1.02, s2: 1.04, tx: -8, tx2: -18, ty: -6, ty2: -12},
];

const camera = (t: number) => {
  const shot = SHOTS.find((s) => t >= s.from && t < s.to) ?? SHOTS[SHOTS.length - 1];
  const k = Math.min(1, Math.max(0, (t - shot.from) / (shot.to - shot.from)));
  return {
    s: shot.s + (shot.s2 - shot.s) * k,
    tx: shot.tx + (shot.tx2 - shot.tx) * k,
    ty: shot.ty + (shot.ty2 - shot.ty) * k,
  };
};

export const ToyotaMotionPilot01Rev6 = () => {
  useStudioFont();
  const frame = useCurrentFrame();
  const time = frame / 30;
  const cue = data.cues.find((q) => time >= q.start && time < q.end);
  const cam = camera(time);
  // ナレーションの頭で小さく押す（カットの代わりのリズム）
  const beats = data.cues.map((c) => c.start);
  const accent = beats.reduce((a, t0) => (time >= t0 ? a + 0.014 * Math.exp(-(time - t0) / 0.28) : a), 0);
  const s = cam.s + accent;
  const {tx, ty} = cam;

  const q = data.cues.map((v) => v.start);
  const pBox = spring({frame: frame - Math.round(1.5 * 30), fps: 30, config: {damping: 14, stiffness: 120, mass: 0.6}});
  const pLabel = spring({frame: frame - Math.round(1.55 * 30), fps: 30, config: {damping: 15, stiffness: 120, mass: 0.6}});
  const nameLine = easeOut(time, 1.6, 0.45);
  const headWipe = easeOut(time, 1.55, 0.55);
  const pName = spring({frame: frame - Math.round(q[2] * 30), fps: 30, config: {damping: 11, stiffness: 150, mass: 0.7}});
  const pTarget = spring({frame: frame - Math.round(q[3] * 30), fps: 30, config: {damping: 14, stiffness: 120, mass: 0.6}});
  const barGrow = easeOut(time, q[3], 2.2);
  const pBarsLbl = spring({frame: frame - Math.round((q[3] + 0.25) * 30), fps: 30, config: {damping: 15, stiffness: 120, mass: 0.6}});
  const emph = interpolate(time, [q[4], q[4] + 0.25, q[4] + 0.65], [0, 1, 0], clamp);
  const emphRing = easeOut(time, q[4] + 0.05, 0.35);
  const arrowDraw = easeOut(time, q[5] - 0.1, 0.6);
  const pEnv = spring({frame: frame - Math.round((q[5] + 0.1) * 30), fps: 30, config: {damping: 13, stiffness: 130, mass: 0.6}});
  const pRes = spring({frame: frame - Math.round((q[5] + 0.6) * 30), fps: 30, config: {damping: 13, stiffness: 130, mass: 0.6}});
  const pIn = interpolate(time, [q[7] - 0.05, q[7] + 0.5], [0, 1], clamp);

  const pYear = spring({frame: frame - Math.round(0.35 * 30), fps: 30, config: {damping: 12, stiffness: 160, mass: 0.7}});
  const yearOut = interpolate(time, [1.22, 1.5], [1, 0], clamp);
  const yearScale = interpolate(time, [1.22, 1.5], [1, 0.9], clamp);

  const kentLean = interpolate(time, [15.9, 16.4, 17.1], [0, -4, 0], clamp);
  const homerNod = interpolate(time, [16.5, 16.9, 17.4], [0, 7, 0], clamp)
    + interpolate(time, [23.4, 23.8, 24.2], [0, 6, 0], clamp);

  const cin = cue ? interpolate(time, [cue.start, cue.start + 0.18], [0, 1], clamp) : 0;

  // ナレーションの進行に合わせて、注目していない要素を落とす
  const dimTo = (t0: number, v: number) => interpolate(time, [t0, t0 + 0.35], [1, v], clamp);
  const dimYear = time < 7.2 ? 1 : dimTo(7.2, 0.45);
  const dimHead = time < 7.2 ? 1 : dimTo(7.2, 0.28);
  const dimName = time < 12.53 ? 1 : dimTo(12.53, 0.55);
  const dimTarget = time < 12.53 ? 1 : dimTo(12.53, 0.4);

  return <AbsoluteFill style={{background: '#EFE6D6', color: c.ink, fontFamily: '"Studio Noto Sans JP", sans-serif'}}>
    <MarkerFilters />
    <Sequence from={12}><Audio src={staticFile(data.audio.src)} /></Sequence>

    <div style={{position: 'absolute', inset: 0, transform: `translate(${tx}px, ${ty}px) scale(${s})`, transformOrigin: '0 0'}}>
      <img src={staticFile('assets/pilots/toyota-motion-pilot01-rev6/room-bg.svg')}
        style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}} />

      <div style={{position: 'absolute', left: 420, top: 120, width: 230, height: 110, borderRadius: 14, background: c.paper,
        border: `6px solid ${c.ink}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 62, fontWeight: 900, color: c.gold, boxShadow: '0 8px 0 rgba(58,44,33,0.12)',
        opacity: Math.min(1, pBox * 1.4) * dimYear, transform: `scale(${0.86 + 0.14 * Math.min(1, pBox)})`}}>1993</div>

      <div style={{position: 'absolute', left: 720, top: 116, ...popStyle(pLabel)}}>
        <div style={{fontSize: 24, fontWeight: 800, color: '#6B5B49'}}>計画名</div>
      </div>
      <div style={{position: 'absolute', left: 720, top: 262, width: 360, height: 6, borderRadius: 3,
        background: c.ink, transform: `scaleX(${nameLine})`, transformOrigin: '0 50%'}} />
      <div style={{position: 'absolute', left: 720, top: 146, opacity: Math.min(1, pName * 1.4) * dimName, transform: `scale(${0.86 + 0.14 * Math.min(1, pName)})`}}>
        <div style={{fontSize: 92, fontWeight: 900, lineHeight: 1.05}}>G21</div>
      </div>

      <div style={{position: 'absolute', left: 420, top: 292, width: 820, height: 54, overflow: 'hidden'}}>
        <div style={{fontSize: 44, fontWeight: 800, whiteSpace: 'nowrap', color: c.ink, lineHeight: 1.22,
          opacity: headWipe * dimHead, transform: `translateX(${(1 - headWipe) * -70}px)`}}>21世紀の車を考える計画</div>
      </div>

      <div style={{position: 'absolute', left: 420, top: 370, width: 240, height: 120, borderRadius: 14, background: c.paper,
        border: `6px solid ${c.ink}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        boxShadow: `0 8px 0 rgba(58,44,33,0.12), 0 0 0 ${3 * emphRing}px ${c.gold}`,
        opacity: Math.min(1, pTarget * 1.4) * dimTarget,
        transform: `scale(${(0.86 + 0.14 * Math.min(1, pTarget)) * (1 + 0.05 * emph)})`}}>
        <div style={{fontSize: 22, fontWeight: 800, color: '#6B5B49'}}>燃費の目標</div>
        <div style={{fontSize: 58, fontWeight: 900, color: c.gold, lineHeight: 1.1}}>1.5倍</div>
      </div>

      <div style={{position: 'absolute', left: 720, top: 372, opacity: Math.min(1, pTarget * 1.4) * dimTarget, transform: `scale(${0.86 + 0.14 * Math.min(1, pTarget)})`}}>
        <div style={{display: 'flex', alignItems: 'flex-end', gap: 14}}>
          <div style={{width: 64, height: 60, boxSizing: 'border-box', background: '#B9CBD2', border: `5px solid ${c.ink}`, borderRadius: 8}} />
          <div style={{width: 64, height: 60 + 30 * barGrow, boxSizing: 'border-box', background: c.gold, border: `5px solid ${c.ink}`, borderRadius: 8}} />
        </div>
        <div style={{display: 'flex', gap: 66, fontSize: 20, fontWeight: 800, color: '#6B5B49', marginTop: 6, ...popStyle(pBarsLbl)}}>
          <span>従来</span><span>目標</span>
        </div>
      </div>

      <svg width={220} height={70} viewBox="0 0 220 70" style={{position: 'absolute', left: 890, top: 392}}>
        <path d="M8 50 H180" stroke={c.ink} strokeWidth={7} fill="none" strokeDasharray={180} strokeDashoffset={180 - 180 * arrowDraw} strokeLinecap="round" />
        <path d="M168 36 L192 50 L168 64" stroke={c.ink} strokeWidth={7} fill="none" strokeLinecap="round"
          strokeDasharray={40} strokeDashoffset={40 - 40 * arrowDraw} />
      </svg>

      <div style={{position: 'absolute', left: 1110, top: 382, padding: '10px 20px', borderRadius: 999, background: '#DFF0EA',
        border: `4px solid #327453`, fontSize: 30, fontWeight: 800, color: '#265C43', ...popStyle(pEnv)}}>環境</div>
      <div style={{position: 'absolute', left: 1290, top: 382, padding: '10px 20px', borderRadius: 999, background: '#E3EDF5',
        border: `4px solid ${c.blue}`, fontSize: 30, fontWeight: 800, color: '#2F5F7D', ...popStyle(pRes)}}>資源</div>

      <div style={{position: 'absolute', left: 580, top: 815, width: 720, height: 40, borderRadius: '50%', background: '#5B4530', opacity: 0.18, filter: 'blur(13px)'}} />
      <img src={staticFile('assets/pilots/toyota-motion-pilot01-rev6/car-side.svg')}
        style={{position: 'absolute', left: 490, top: 520, width: 900, height: 345}} />

      <div style={{position: 'absolute', left: 150, top: 880, width: 200, height: 30, borderRadius: '50%', background: '#5B4530', opacity: 0.16, filter: 'blur(9px)'}} />
      <div style={{position: 'absolute', left: 1590, top: 880, width: 200, height: 30, borderRadius: '50%', background: '#5B4530', opacity: 0.16, filter: 'blur(9px)'}} />

      <div style={{position: 'absolute', left: 140, top: 620, width: 226, height: 290,
        transform: `rotate(${kentLean}deg)`, transformOrigin: '50% 100%'}}>
        <MarkerElder who="kent" animated width={226} height={290} motionScale={1} blinkPhase={157} />
      </div>
      <div style={{position: 'absolute', left: 1580, top: 620, width: 226, height: 290, transform: `translateY(${homerNod}px)`}}>
        <MarkerHomer animated width={226} height={290} motionScale={1} />
      </div>

      <div style={{position: 'absolute', left: 44, top: 112, width: 300, height: 284, background: c.paper, border: `6px solid ${c.ink}`,
        borderRadius: 16, boxShadow: '0 0 0 3px #3A2C21, 0 12px 0 rgba(58,44,33,0.14)', opacity: pIn, transform: `translateX(${(1 - pIn) * -40}px)`}}>
        <img src={staticFile('assets/people/uchiyama-takeshi-v1.svg')}
          style={{position: 'absolute', left: 50, top: 8, width: 200, height: 200}} />
        <div style={{position: 'absolute', left: 0, right: 0, top: 224, textAlign: 'center'}}>
          <div style={{fontSize: 24, fontWeight: 900, lineHeight: 1.2, color: c.ink, whiteSpace: 'nowrap'}}>内山田竹志</div>
          <div style={{fontSize: 13, fontWeight: 700, lineHeight: 1.2, color: '#6B5B49', marginTop: 4}}>似顔絵</div>
        </div>
      </div>
    </div>

    <div style={{position: 'absolute', inset: 0, pointerEvents: 'none',
      background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 52%, rgba(58,40,20,0.18) 100%)'}} />

    <div style={{position: 'absolute', top: 8, left: 60, right: 60, display: 'flex', alignItems: 'center', gap: 24,
      padding: '6px 20px', borderRadius: 16, background: 'rgba(246,236,218,0.94)', boxShadow: '0 6px 16px rgba(58,44,33,0.12)'}}>
      <div style={{fontSize: 18, fontWeight: 800, color: '#3A2C21', whiteSpace: 'nowrap'}}>シリーズ年表</div>
      <div style={{position: 'relative', flex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', height: 66}}>
        <div style={{position: 'absolute', left: 0, right: 0, top: 14, height: 6, background: '#3A2C2144', borderRadius: 3}} />
        {TIMELINE.map((m) => (
          <div key={m.label} style={{position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1}}>
            <div style={{width: m.current ? 20 : 14, height: m.current ? 20 : 14, borderRadius: '50%',
              background: m.current ? c.gold : '#C8B79E', border: `3px solid ${m.current ? '#3A2C21' : '#8A7A65'}`, marginTop: 2, zIndex: 1}} />
            <div style={{marginTop: 8, padding: m.current ? '4px 14px' : 0, borderRadius: 999,
              background: m.current ? c.gold : 'transparent', color: m.current ? '#3A2B1E' : '#3A2C21',
              fontSize: m.current ? 23 : 20, fontWeight: m.current ? 900 : 700, whiteSpace: 'nowrap',
              boxShadow: m.current ? '0 4px 0 rgba(58,44,33,0.18)' : 'none'}}>{m.label}</div>
          </div>
        ))}
      </div>
    </div>

    <div style={{position: 'absolute', left: 545, top: 236, width: 470, height: 268,
      opacity: yearOut, transform: `scale(${yearScale})`, pointerEvents: 'none'}}>
      <div style={{width: 470, height: 268, borderRadius: 22, background: c.paper, border: `6px solid ${c.ink}`,
        boxShadow: '0 16px 0 rgba(58,44,33,0.16)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        transform: `scale(${0.9 + 0.1 * pYear})`, opacity: Math.min(1, pYear * 1.6)}}>
        <div style={{fontSize: 150, fontWeight: 900, lineHeight: 1, letterSpacing: '-0.02em'}}>1993</div>
        <div style={{width: 200, height: 8, borderRadius: 4, background: c.gold, marginTop: 14,
          transform: `scaleX(${Math.min(1, pYear)})`}} />
      </div>
    </div>

    {cue && <div style={{position: 'absolute', bottom: 40, left: 120, right: 120, display: 'flex', justifyContent: 'center', opacity: cin,
      transform: `translateY(${(1 - cin) * 12}px)`}}>
      <div style={{background: '#2E2620F2', color: c.white, borderRadius: 16, padding: '14px 34px 16px', display: 'flex', alignItems: 'center',
        gap: 24, maxWidth: 1680, boxShadow: '0 10px 28px rgba(46,38,32,0.28)'}}>
        <div style={{minWidth: 0, textAlign: 'center'}}>
          {cue.lines.map((ln, i) => <div key={`${cue.start}-${i}`} style={{fontSize: 38, fontWeight: 800, lineHeight: 1.25,
            letterSpacing: '0.01em', whiteSpace: 'nowrap'}}>{ln}</div>)}
        </div>
      </div>
    </div>}
  </AbsoluteFill>;
};
