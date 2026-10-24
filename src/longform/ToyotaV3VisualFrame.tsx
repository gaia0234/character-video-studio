import {staticFile, delayRender, continueRender, cancelRender} from 'remotion';
import {useEffect, useState} from 'react';

// Retained from the accepted V11 paper/marker street and diagram frames.
const c = {ink: '#293747', paper: '#F5F0E5', white: '#FFFCF5', blue: '#437B9D', light: '#D4E7EB',
  gold: '#D9AB56', red: '#AC5144', muted: '#4B5A67', green: '#72998C', line: '#AAB8B6'};

let fontReady: Promise<FontFace> | undefined;
export const useStudioFont = () => {
  const [handle] = useState(() => delayRender('Load local Noto Sans JP'));
  useEffect(() => {
    fontReady ??= new FontFace('Studio Noto Sans JP', `url("${staticFile('assets/fonts/NotoSansJP.ttf')}")`,
      {weight: '100 900'}).load().then((font) => {document.fonts.add(font); return font;});
    fontReady.then(() => continueRender(handle)).catch(cancelRender);
    return () => continueRender(handle);
  }, [handle]);
};


export const MarkerFilters = () => (
  <svg width={0} height={0} style={{position: 'absolute'}} aria-hidden>
    <defs>
      <filter id="mkw" x="-8%" y="-8%" width="116%" height="116%">
        <feTurbulence type="fractalNoise" baseFrequency="0.014" numOctaves="2" seed="9" result="n" />
        <feDisplacementMap in="SourceGraphic" in2="n" scale="5" xChannelSelector="R" yChannelSelector="G" />
      </filter>
      <filter id="mkgrain">
        <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
    </defs>
  </svg>
);

type Tone = 'day' | 'evening' | 'night';
const tonePalette = (tone: Tone) => tone === 'night' ? {
  sky: '#3B4560', ground: '#2F364A', wall: ['#4C5670', '#57617B', '#454E66'], win: '#2C3345',
  lit: '#F0D68C', ink: '#EDE7D8', road: '#3A4257', sun: '#F2E4B8', cloud: '#535E7A',
} : tone === 'evening' ? {
  sky: '#F4DEC2', ground: '#D8C4A6', wall: ['#EBD9BF', '#E2C9A8', '#F0E4CE'], win: '#C9D6D8',
  lit: '#F0C878', ink: c.ink, road: '#C4AE90', sun: '#EFBE6A', cloud: '#FBF1DF',
} : {
  sky: '#E8F0EC', ground: '#D5D1BF', wall: ['#EDE7D6', '#D9E2DA', '#E4DCC8'], win: '#B9D0D6',
  lit: '#EED79C', ink: c.ink, road: '#BEBBA9', sun: '#F2DFAC', cloud: '#FBF7EC',
};

// □の家＋△の屋根＋○の木。すべてマーカー線。
const BlockHouse = ({x, w, h, wall, win, lit, ink, windows = 6}: {
  x: number; w: number; h: number; wall: string; win: string; lit: string; ink: string; windows?: number;
}) => {
  const top = 790 - h;
  const cols = Math.max(2, Math.round(w / 90));
  const rows = Math.max(2, Math.round(h / 140));
  return <g>
    <path d={`M${x - 12} ${top} L${x + w / 2} ${top - w * 0.34} L${x + w + 12} ${top} Z`}
      fill={wall} stroke={ink} strokeWidth={6} />
    <rect x={x} y={top} width={w} height={h} fill={wall} stroke={ink} strokeWidth={6} />
    {Array.from({length: Math.min(windows, cols * rows)}, (_, i) => {
      const cx = x + 18 + (i % cols) * ((w - 36) / cols);
      const cy = top + 24 + Math.floor(i / cols) * ((h - 48) / rows);
      const on = (i + x) % 4 === 0;
      return <rect key={i} x={cx} y={cy} width={Math.min(46, (w - 36) / cols - 12)}
        height={Math.min(54, (h - 48) / rows - 14)} fill={on ? lit : win} stroke={ink} strokeWidth={3.5} />;
    })}
  </g>;
};

const BlockTree = ({x, scale = 1, leaf, ink}: {x: number; scale?: number; leaf: string; ink: string}) => (
  <g transform={`translate(${x} 790) scale(${scale})`}>
    <rect x={-16} y={-118} width={32} height={120} fill="#B9A98C" stroke={ink} strokeWidth={5} />
    <path d="M0 -320 L96 -150 H-96 Z" fill={leaf} stroke={ink} strokeWidth={6} />
    <path d="M0 -260 L76 -96 H-76 Z" fill={leaf} stroke={ink} strokeWidth={6} opacity={0.92} />
  </g>
);

export const Backdrop = ({mode, tone = 'day'}: {mode: 'street' | 'workshop' | 'diagram'; tone?: Tone}) => {
  const p = tonePalette(tone);
  const night = tone === 'night';
  return <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute'}}>
    <rect width={1920} height={1080} fill={p.sky} />
    <g filter="url(#mkw)">
      {mode !== 'diagram' ? <>
      <circle cx={1530} cy={186} r={74} fill={p.sun} stroke={p.ink} strokeWidth={6} />
      {night ? [[520,92],[760,150],[1096,104],[1310,236]].map(([x, y], i) => (
        <path key={i} d={`M${x} ${y - 15} L${x + 14} ${y + 12} L${x - 14} ${y + 12} Z`} fill={p.lit} stroke={p.ink} strokeWidth={3} />
      )) : null}
      {[[742, 146, 44], [852, 176, 28], [1218, 148, 36], [1700, 208, 48]].map(([x, y, r], i) => (
        <circle key={i} cx={x} cy={y} r={r} fill={p.cloud} stroke={p.ink} strokeWidth={5} />
      ))}
      </> : null}
      {mode === 'street' ? <>
        <BlockHouse x={40} w={200} h={420} wall={p.wall[0]} win={p.win} lit={p.lit} ink={p.ink} windows={8} />
        <BlockHouse x={268} w={150} h={300} wall={p.wall[1]} win={p.win} lit={p.lit} ink={p.ink} windows={6} />
        <BlockHouse x={1520} w={170} h={360} wall={p.wall[1]} win={p.win} lit={p.lit} ink={p.ink} windows={6} />
        <BlockHouse x={1712} w={190} h={440} wall={p.wall[0]} win={p.win} lit={p.lit} ink={p.ink} windows={8} />
        <BlockTree x={660} scale={0.82} leaf={night ? '#4E6A62' : '#9FBF9A'} ink={p.ink} />
        <BlockTree x={1180} scale={0.92} leaf={night ? '#4E6A62' : '#9FBF9A'} ink={p.ink} />
        <rect x={0} y={790} width={1920} height={290} fill={p.ground} />
        <path d="M0 792 H1920" stroke={p.ink} strokeWidth={7} />
        <rect x={0} y={902} width={1920} height={112} fill={p.road} />
        <path d="M0 905 H1920 M0 1012 H1920" stroke={p.ink} strokeWidth={4} />
        {Array.from({length: 12}, (_, i) => <rect key={i} x={40 + i * 162} y={948} width={86} height={12} fill={night ? '#6A7285' : '#EFE7D2'} />)}
      </> : mode === 'workshop' ? <>
        <rect x={90} y={300} width={1740} height={490} fill={p.wall[2]} stroke={p.ink} strokeWidth={7} />
        {[0, 1, 2, 3].map((i) => <path key={i} d={`M${120 + i * 430} 300 L${335 + i * 430} 200 L${550 + i * 430} 300 Z`}
          fill={p.wall[1]} stroke={p.ink} strokeWidth={7} />)}
        <rect x={1660} y={140} width={96} height={170} fill={p.wall[0]} stroke={p.ink} strokeWidth={6} />
        {Array.from({length: 10}, (_, i) => <rect key={i} x={140 + (i % 5) * 330} y={400 + Math.floor(i / 5) * 190}
          width={150} height={110} fill={i % 3 === 0 ? p.lit : p.win} stroke={p.ink} strokeWidth={4} />)}
        {[0, 1, 2].map((i) => <circle key={i} cx={420 + i * 540} cy={690} r={46} fill="none" stroke={p.ink} strokeWidth={8} />)}
        <rect x={0} y={790} width={1920} height={290} fill={p.ground} />
        <path d="M0 792 H1920" stroke={p.ink} strokeWidth={7} />
        {Array.from({length: 8}, (_, i) => <rect key={i} x={80 + i * 240} y={880} width={120} height={80} fill={p.wall[1]} stroke={p.ink} strokeWidth={5} />)}
      </> : <>
        <rect x={0} y={0} width={1920} height={1080} fill={night ? '#E9E4D6' : '#F5F0E5'} />
        <path d="M0 170 H1920 M0 780 H1920" stroke={p.ink} strokeWidth={3} opacity={0.25} />
        {Array.from({length: 20}, (_, i) => <path key={i} d={`M${i * 100} 175 V778`} stroke={p.ink} strokeWidth={2} opacity={0.12} />)}
        <circle cx={120} cy={930} r={44} fill="none" stroke={p.ink} strokeWidth={6} opacity={0.35} />
        <path d="M1800 900 L1850 980 L1750 980 Z" fill="none" stroke={p.ink} strokeWidth={6} opacity={0.35} />
        <rect x={130} y={860} width={78} height={78} fill="none" stroke={p.ink} strokeWidth={6} opacity={0.35} />
      </>}
    </g>
    <rect width={1920} height={1080} filter="url(#mkgrain)" opacity={0.05} style={{mixBlendMode: 'multiply'}} />
  </svg>;
};
