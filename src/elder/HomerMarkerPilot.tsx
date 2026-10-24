import React from 'react';
import {AbsoluteFill, Img, staticFile, useCurrentFrame} from 'remotion';

// Original pixels remain unchanged. Clips define movable display parts only.
const head = 'M24 186H217V324H195V419H52V326H24Z';
// Leave white margins past the hand; keep the coat outside x=58.
// Keep the boundary inside their white gap, rather than clipping the coat.
const arm = 'M92 437L103 459L79 493L58 627V681H0V437Z';
const Picture = () => <foreignObject width={368} height={996}>
  <Img src={staticFile('assets/characters/homer-marker-pilot/homer-original.png')}
    style={{width: 368, height: 996, display: 'block'}} />
</foreignObject>;

export const MarkerHomer = ({animated, width = 340, height = 816, motionScale = 1, blinkPhase = 0}: {animated: boolean; width?: number; height?: number; motionScale?: number; blinkPhase?: number}) => {
  const frame = useCurrentFrame();
  const id = animated ? 'moving' : 'reference';
  const nod = animated ? Math.sin(frame / 30 * 1.5) * 3.75 * motionScale : 0;
  const gesture = animated ? Math.sin(frame / 30 * 1.1) * 7.5 * motionScale : 0;
  const blinkFrame = (frame + blinkPhase) % 300;
  const blink = animated && ((blinkFrame >= 70 && blinkFrame <= 77) || (blinkFrame >= 197 && blinkFrame <= 204));
  return <svg viewBox="-30 -10 428 1026" width={width} height={height}>
    <defs>
      <clipPath id={`${id}-head`}><path d={head} /></clipPath>
      <clipPath id={`${id}-arm`}><path d={arm} /></clipPath>
      <mask id={`${id}-body`} maskUnits="userSpaceOnUse" x="0" y="0" width="368" height="996">
        <rect width="368" height="996" fill="white" />
        <path d={head} fill="black" /><path d={arm} fill="black" />
      </mask>
    </defs>
    <g mask={`url(#${id}-body)`}><Picture /></g>
    <g transform={`rotate(${gesture} 92 450)`}>
      <g clipPath={`url(#${id}-arm)`}><Picture /></g>
    </g>
    <g transform={`rotate(${nod} 125 416)`}>
      <g clipPath={`url(#${id}-head)`}><Picture /></g>
      {blink && <g>
        <ellipse cx="102" cy="340" rx="9" ry="10" fill="white" />
        <ellipse cx="153" cy="332" rx="9" ry="10" fill="white" />
        <path d="M96 340Q102 344 108 340M147 332Q153 336 159 332"
          fill="none" stroke="#171715" strokeWidth="4" strokeLinecap="round" />
      </g>}
    </g>
  </svg>;
};

export const HomerMarkerPilot = () => <AbsoluteFill style={{background: '#f3f0e8', color: '#282722',
  fontFamily: 'sans-serif', padding: '34px 64px'}}>
  <div style={{fontSize: 36, fontWeight: 700}}>ホーマー｜マーカーの筆跡を残す動作見本</div>
  <div style={{fontSize: 22, marginTop: 10}}>原画の塗りむら・白い抜け・線の揺れを保持</div>
  <div style={{display: 'flex', gap: 30, marginTop: 20, flex: 1}}>
    {[false, true].map(animated => <div key={String(animated)} style={{background: 'white', borderRadius: 16,
      width: 560, display: 'flex', alignItems: 'center', flexDirection: 'column', paddingTop: 16}}>
      <div style={{fontSize: 26, fontWeight: 700}}>{animated ? 'パーツ分け：うなずき・腕・まばたき' : '原画：静止'}</div>
      <MarkerHomer animated={animated} />
    </div>)}
  </div>
  <div style={{fontSize: 21, marginTop: 14}}>造形・質感と継ぎ目の確認用 ／ 無音10秒・本編未反映</div>
</AbsoluteFill>;
