import React from 'react';
import {AbsoluteFill, Audio, Sequence, Easing, interpolate, spring, staticFile, useCurrentFrame} from 'remotion';
import data from '../data/longform/toyota-motion-pilot01-rev4.json';
import {MarkerHomer} from '../elder/HomerMarkerPilot';
import {MarkerElder} from '../elder/ElderMarkerPilot';
import {MarkerFilters, useStudioFont} from './ToyotaV3VisualFrame';

const c = {ink: '#293747', paper: '#FBFCFD', white: '#FFFCF5', gold: '#D9AB56', blue: '#437B9D', wood: '#B98A5E'};
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const easeOut = (t: number, t0: number, d: number) =>
  interpolate(t, [t0, t0 + d], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
const popStyle = (v: number) => ({
  opacity: Math.min(1, v * 1.4),
  transform: `scale(${0.86 + 0.14 * v})`,
});

export const ToyotaMotionPilot01Rev4 = () => {
  useStudioFont();
  const frame = useCurrentFrame();
  const time = frame / 30;
  const cue = data.cues.find((q) => time >= q.start && time < q.end);
  const shot = time < 8 ? 1 : time < 15 ? 2 : time < 23 ? 3 : 4;

  let s = 1, tx = 0, ty = 0;
  if (shot === 1) {
    s = 1 + 0.04 * easeOut(time, 0.1, 0.9);
  } else if (shot === 2) {
    s = 1.7 + 0.03 * easeOut(time, 8, 1.2);
    tx = -1450; ty = -60;
  } else if (shot === 3) {
    s = 1.55;
    tx = -1350 - 30 * easeOut(time, 15, 1.5);
    ty = -200;
  } else {
    s = 1 + 0.015 * easeOut(time, 23, 1.0);
  }

  const draw = easeOut(time, 8.3, 1.2);
  const bp = interpolate(time, [15.2, 16.0], [420, 0], clamp);
  const clock = interpolate(time, [0, 26.5], [0, 14], clamp);
  const kentLean = interpolate(time, [1.2, 1.8, 2.6], [0, -3, 0], clamp);
  const homerNod = interpolate(time, [1.4, 1.8, 2.2], [0, 6, 0], clamp)
    + interpolate(time, [23.4, 23.8, 24.2], [0, 6, 0], clamp);
  const pop = (t0: number) => spring({frame: frame - Math.round(t0 * 30), fps: 30, config: {damping: 14, stiffness: 120, mass: 0.6}});
  const p1993 = pop(0.8), pG21 = pop(1.6), pTarget = pop(2.4), pEnv = pop(3.1), pRes = pop(3.2);
  const cin = cue ? interpolate(time, [cue.start, cue.start + 0.2], [0, 1], clamp) : 0;
  const pIn = interpolate(time, [23.3, 23.9], [0, 1], clamp);

  return <AbsoluteFill style={{background: '#EFE6D6', color: c.ink, fontFamily: '"Studio Noto Sans JP", sans-serif'}}>
    <MarkerFilters />
    <Sequence from={12}><Audio src={staticFile(data.audio.src)} /></Sequence>

    <div style={{position: 'absolute', inset: 0, transform: `translate(${tx}px, ${ty}px) scale(${s})`, transformOrigin: '0 0'}}>
      <img src={staticFile('assets/pilots/toyota-motion-pilot01-rev3/room-bg.svg')}
        style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}} />

      <div style={{position: 'absolute', left: 186, top: 176, width: 0, height: 0, transform: `rotate(${clock}deg)`}}>
        <div style={{position: 'absolute', left: -2, top: -34, width: 4, height: 34, background: c.ink, borderRadius: 2}} />
      </div>

      <div style={{position: 'absolute', left: 1090, top: 176, width: 210, height: 104, borderRadius: 14, background: c.paper,
        border: `4px solid ${c.ink}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 58, fontWeight: 900, color: c.gold, boxShadow: '0 8px 0 #29374718', ...popStyle(p1993)}}>1993</div>

      <div style={{position: 'absolute', left: 1350, top: 180, ...popStyle(pG21)}}>
        <div style={{fontSize: 22, fontWeight: 800, color: '#526574'}}>計画名</div>
        <div style={{fontSize: 76, fontWeight: 900, lineHeight: 1.1}}>G21</div>
      </div>

      <div style={{position: 'absolute', left: 1090, top: 356, width: 210, height: 116, borderRadius: 14, background: c.paper,
        border: `4px solid ${c.ink}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 8px 0 #29374718', ...popStyle(pTarget)}}>
        <div style={{fontSize: 20, fontWeight: 800, color: '#526574'}}>燃費の目標</div>
        <div style={{fontSize: 54, fontWeight: 900, color: c.gold, lineHeight: 1.1}}>1.5倍</div>
      </div>

      <div style={{position: 'absolute', left: 1350, top: 360, ...popStyle(pTarget)}}>
        <div style={{display: 'flex', alignItems: 'flex-end', gap: 14}}>
          <div style={{width: 56, height: 52, boxSizing: 'border-box', background: '#B9CBD2', border: `3px solid ${c.ink}`, borderRadius: 6}} />
          <div style={{width: 56, height: 52 + 26 * draw, boxSizing: 'border-box', background: c.gold, border: `3px solid ${c.ink}`, borderRadius: 6}} />
        </div>
        <div style={{display: 'flex', gap: 58, fontSize: 20, fontWeight: 800, color: '#526574', marginTop: 6}}>
          <span>従来</span><span>目標</span>
        </div>
      </div>

      <svg width={240} height={70} viewBox="0 0 240 70" style={{position: 'absolute', left: 1350, top: 470}}>
        <path d="M10 50 H200" stroke={c.ink} strokeWidth={5} fill="none" strokeDasharray={200} strokeDashoffset={200 - 200 * draw} strokeLinecap="round" />
        <path d="M188 36 L210 50 L188 64" stroke={c.ink} strokeWidth={5} fill="none" strokeLinecap="round"
          strokeDasharray={40} strokeDashoffset={40 - 40 * draw} />
      </svg>

      <div style={{position: 'absolute', left: 1560, top: 500, padding: '10px 18px', borderRadius: 999, background: '#DFF0EA',
        border: `3px solid #327453`, fontSize: 28, fontWeight: 800, color: '#265C43', ...popStyle(pEnv)}}>環境</div>
      <div style={{position: 'absolute', left: 1688, top: 500, padding: '10px 18px', borderRadius: 999, background: '#E3EDF5',
        border: `3px solid ${c.blue}`, fontSize: 28, fontWeight: 800, color: '#2F5F7D', ...popStyle(pRes)}}>資源</div>

      <img src={staticFile('assets/pilots/toyota-motion-pilot01-rev3/blueprint.svg')}
        style={{position: 'absolute', left: 980, top: 620, width: 420, height: 260, transform: `translateY(${bp}px) rotate(-2deg)`}} />

      <div style={{position: 'absolute', left: 120, top: 430, width: 320, height: 480,
        transform: `rotate(${kentLean}deg)`, transformOrigin: '50% 100%'}}>
        <MarkerElder who="kent" animated width={320} height={480} motionScale={1} blinkPhase={157} />
      </div>
      <div style={{position: 'absolute', left: 470, top: 460, width: 320, height: 480, transform: `translateY(${homerNod}px)`}}>
        <MarkerHomer animated width={320} height={480} motionScale={1} />
      </div>

      <img src={staticFile('assets/pilots/toyota-motion-pilot01-rev3/props-mid.svg')}
        style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}} />

      <img src={staticFile('assets/pilots/toyota-motion-pilot01-rev3/desk-front.svg')}
        style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}} />

      <div style={{position: 'absolute', left: 72, top: 118, width: 300, height: 284, background: c.paper, border: `4px solid ${c.ink}`,
        borderRadius: 16, boxShadow: '0 10px 0 #29374718', opacity: pIn, transform: `translateX(${(1 - pIn) * -40}px)`}}>
        <img src={staticFile('assets/people/uchiyama-takeshi-v1.svg')}
          style={{position: 'absolute', left: 40, top: 8, width: 220, height: 220}} />
        <div style={{position: 'absolute', left: 0, right: 0, bottom: 8, textAlign: 'center'}}>
          <div style={{fontSize: 24, fontWeight: 900, color: c.ink}}>内山田竹志</div>
          <div style={{fontSize: 13, fontWeight: 700, color: '#526574'}}>似顔絵</div>
        </div>
      </div>
    </div>

    <div style={{position: 'absolute', top: 40, left: 56, background: c.ink, color: c.white, padding: '12px 26px',
      borderRadius: 999, fontSize: 28, fontWeight: 800}}>1993｜G21</div>
    <div style={{position: 'absolute', top: 40, right: 56, background: c.paper, color: c.ink, border: `4px solid ${c.ink}`,
      padding: '10px 26px', borderRadius: 14, fontSize: 34, fontWeight: 900}}>1993</div>

    {cue && <div style={{position: 'absolute', bottom: 40, left: 120, right: 120, display: 'flex', justifyContent: 'center', opacity: cin,
      transform: `translateY(${(1 - cin) * 12}px)`}}>
      <div style={{background: '#26313FF7', color: c.white, borderRadius: 18, padding: '18px 36px 20px', display: 'flex', alignItems: 'center',
        gap: 24, maxWidth: 1680, boxShadow: '0 10px 28px #1D253040'}}>
        <div style={{minWidth: 0, textAlign: 'center'}}>
          {cue.lines.map((ln, i) => <div key={`${cue.start}-${i}`} style={{fontSize: 42, fontWeight: 800, lineHeight: 1.35,
            letterSpacing: '0.01em', whiteSpace: 'nowrap'}}>{ln}</div>)}
        </div>
      </div>
    </div>}
  </AbsoluteFill>;
};
