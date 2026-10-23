import React from 'react';
import {AbsoluteFill, Img, staticFile, useCurrentFrame} from 'remotion';

type Who = 'judd' | 'kent';
const settings = {
  judd: {
    name: 'ジャッド', width: 290, height: 1052,
    head: 'M0 0H290V245H194L183 258L169 269L152 279L133 270L112 254L99 245H0Z',
    arm: 'M211 283H295V676H232L230 610L222 490L209 389L201 330Z',
    neck: [151, 277], shoulder: [213, 305],
    eyes: [[124, 194], [173, 192]],
    description: '首・空いた腕・まばたき ／ 杖は固定',
  },
  kent: {
    name: 'ケント', width: 380, height: 1046,
    head: 'M75 0H335V128H305V220L289 242L255 254H147L123 234L110 208V128H75Z',
    arm: 'M0 162H110V210H115V279H151L167 300L122 402L119 476H0Z',
    neck: [205, 253], shoulder: [153, 298],
    eyes: [[169, 168], [234, 168]],
    description: '首・虫眼鏡の腕・まばたき ／ 手帳は固定',
  },
} as const;

const Picture = ({who}: {who: Who}) => {
  const s = settings[who];
  return <foreignObject width={s.width} height={s.height}>
    <Img src={staticFile(`assets/characters/elder-marker-pilot/${who}.png`)}
      style={{width: s.width, height: s.height, display: 'block'}} />
  </foreignObject>;
};

const Puppet = ({who, animated}: {who: Who; animated: boolean}) => {
  const frame = useCurrentFrame();
  const s = settings[who];
  const nod = animated ? Math.sin(frame / 30 * 1.5) * 3.75 : 0;
  // Move away from the body/face. The supporting hand and prop remain fixed.
  const arm = animated ? -3.75 * (1 + Math.sin(frame / 30 * 1.1)) : 0;
  const blink = animated && ((frame >= 70 && frame <= 77) || (frame >= 197 && frame <= 204));
  return <svg viewBox={`-65 -12 ${s.width + 130} ${s.height + 30}`} width={365} height={816}>
    <defs>
      <clipPath id={`${who}-head`}><path d={s.head} /></clipPath>
      <clipPath id={`${who}-arm`}><path d={s.arm} /></clipPath>
      <clipPath id={`${who}-coat`}><path d="M211 305Q232 390 236 500L241 620L264 714L244 690L221 620L201 440Z" /></clipPath>
      <mask id={`${who}-body`} maskUnits="userSpaceOnUse" x="0" y="0" width={s.width} height={s.height}>
        <rect width={s.width} height={s.height} fill="white" />
        <path d={s.head} fill="black" /><path d={s.arm} fill="black" />
      </mask>
    </defs>
    {animated ? <>
      <g mask={`url(#${who}-body)`}><Picture who={who} /></g>
      {who === 'judd' && <g clipPath={`url(#${who}-coat)`}>
        <g transform="translate(30 0)"><Picture who={who} /></g>
      </g>}
      <g transform={`rotate(${arm} ${s.shoulder[0]} ${s.shoulder[1]})`}>
        <g clipPath={`url(#${who}-arm)`}><Picture who={who} /></g>
      </g>
      <g transform={`rotate(${nod} ${s.neck[0]} ${s.neck[1]})`}>
        <g clipPath={`url(#${who}-head)`}><Picture who={who} /></g>
        {blink && <g>{s.eyes.map(([x, y]) => <g key={x}>
          <ellipse cx={x} cy={y} rx={12} ry={12} fill="white" />
          <path d={`M${x - 7} ${y}Q${x} ${y + 4} ${x + 7} ${y}`}
            fill="none" stroke="#171715" strokeWidth="4" strokeLinecap="round" />
        </g>)}</g>}
      </g>
    </> : <Picture who={who} />}
  </svg>;
};

export const ElderMarkerPilot = ({who}: {who: Who}) => {
  const s = settings[who];
  return <AbsoluteFill style={{background: '#f3f0e8', color: '#282722', fontFamily: 'sans-serif', padding: '34px 64px'}}>
    <div style={{fontSize: 36, fontWeight: 700}}>{s.name}｜マーカーの筆跡を残す動作見本</div>
    <div style={{fontSize: 22, marginTop: 10}}>{s.description}</div>
    <div style={{display: 'flex', gap: 30, marginTop: 20, flex: 1}}>
      {[false, true].map(animated => <div key={String(animated)} style={{background: 'white', borderRadius: 16,
        width: 560, display: 'flex', alignItems: 'center', flexDirection: 'column', paddingTop: 16}}>
        <div style={{fontSize: 26, fontWeight: 700}}>{animated ? 'パーツ動作' : '原画：静止'}</div>
        <Puppet who={who} animated={animated} />
      </div>)}
    </div>
    <div style={{fontSize: 21, marginTop: 14}}>造形・質感と継ぎ目の確認用 ／ 無音10秒・本編未反映</div>
  </AbsoluteFill>;
};
