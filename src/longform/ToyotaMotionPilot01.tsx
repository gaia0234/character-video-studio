import React from 'react';
import {AbsoluteFill, Audio, Sequence, Easing, interpolate, spring, staticFile, useCurrentFrame} from 'remotion';
import data from '../data/longform/toyota-motion-pilot01.json';
import {MarkerHomer} from '../elder/HomerMarkerPilot';
import {MarkerElder} from '../elder/ElderMarkerPilot';
import {MarkerFilters, useStudioFont} from './ToyotaV3VisualFrame';

const c = {ink: '#293747', paper: '#FBFCFD', white: '#FFFCF5', gold: '#D9AB56', blue: '#437B9D', wood: '#B98A5E'};
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

const popStyle = (v: number) => ({
  opacity: Math.min(1, v * 1.4),
  transform: `scale(${0.86 + 0.14 * v})`,
});

export const ToyotaMotionPilot01 = () => {
  useStudioFont();
  const frame = useCurrentFrame();
  const time = frame / 30;
  const cue = data.cues.find((q) => time >= q.start && time < q.end);
  const cam = interpolate(time, [0.1, 1.1], [1, 1.06], {...clamp, easing: Easing.out(Easing.cubic)});
  const pop = (start: number) => spring({frame: frame - Math.round(start * 30), fps: 30, config: {damping: 14, stiffness: 120, mass: 0.6}});
  const p1993 = pop(0.8);
  const pG21 = pop(1.6);
  const pTarget = pop(2.4);
  const pLabel1 = pop(3.1);
  const pLabel2 = pop(3.2);
  const lean = interpolate(time, [1.2, 1.6, 2.2], [0, -2.5, 0], clamp);
  const nod = interpolate(time, [1.4, 1.7, 2.0], [0, 4, 0], clamp);
  const cin = cue ? interpolate(time, [cue.start, cue.start + 0.2], [0, 1], clamp) : 0;

  return <AbsoluteFill style={{background: '#EFE6D6', color: c.ink, fontFamily: '"Studio Noto Sans JP", sans-serif'}}>
    <MarkerFilters />
    <Sequence from={12}><Audio src={staticFile(data.audio.src)} /></Sequence>

    <div style={{position: 'absolute', inset: 0, transform: `scale(${cam})`, transformOrigin: '55% 58%'}}>
      <img src={staticFile('assets/pilots/toyota-motion-pilot01/room-bg.svg')}
        style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}} />

      <div style={{position: 'absolute', left: 160, top: 500, width: 285, height: 430,
        transform: `rotate(${lean}deg)`, transformOrigin: '50% 100%'}}>
        <MarkerElder who="kent" animated width={285} height={430} motionScale={1} blinkPhase={157} />
      </div>
      <div style={{position: 'absolute', left: 520, top: 540, width: 285, height: 430, transform: `translateY(${nod}px)`}}>
        <MarkerHomer animated width={285} height={430} motionScale={1} />
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
          <div style={{width: 56, height: 52, background: '#B9CBD2', border: `3px solid ${c.ink}`, borderRadius: 6}} />
          <div style={{width: 56, height: 84, background: c.gold, border: `3px solid ${c.ink}`, borderRadius: 6}} />
        </div>
        <div style={{display: 'flex', gap: 58, fontSize: 20, fontWeight: 800, color: '#526574', marginTop: 6}}>
          <span>従来</span><span>目標</span>
        </div>
      </div>

      <div style={{position: 'absolute', left: 1560, top: 500, padding: '10px 18px', borderRadius: 999, background: '#DFF0EA',
        border: `3px solid #327453`, fontSize: 28, fontWeight: 800, color: '#265C43', ...popStyle(pLabel1)}}>環境</div>
      <div style={{position: 'absolute', left: 1688, top: 500, padding: '10px 18px', borderRadius: 999, background: '#E3EDF5',
        border: `3px solid ${c.blue}`, fontSize: 28, fontWeight: 800, color: '#2F5F7D', ...popStyle(pLabel2)}}>資源</div>

      <img src={staticFile('assets/pilots/toyota-motion-pilot01/desk-front.svg')}
        style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}} />
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
