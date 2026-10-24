import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import data from '../data/longform/toyota-v3-p1-01-r2.json';
import {MarkerHomer} from '../elder/HomerMarkerPilot';
import {MarkerElder} from '../elder/ElderMarkerPilot';
import {ToyotaV3OpeningCar} from './ToyotaV3OpeningCar';
import {Backdrop, MarkerFilters, useStudioFont} from './ToyotaV3VisualFrame';

const c = {ink: '#293747', white: '#FFFCF5', gold: '#D9AB56', blue: '#437B9D'};
const colors: Record<string, string> = {ホーマー: '#AC382F', ジャッド: '#335D87', ケント: '#327453'};
const cast = [{who: 'ジャッド', x: 360}, {who: 'ホーマー', x: 950}, {who: 'ケント', x: 1510}] as const;
const DriveIcon = ({engine}: {engine: boolean}) => <svg width={240} height={158} viewBox="0 0 220 145">
  <g stroke={c.ink} strokeWidth={5} strokeLinejoin="round" fill="#B9CBCB">
    {engine ? <>
      <path d="M34 48H147L171 69V123H31V66H16V51H34Z" />
      <path d="M51 31H139V48H51ZM169 71H199V114H171" />
      {[60,84,108,132].map(x => <path key={x} d={`M${x} 62V106`} strokeWidth={3} />)}
      <circle cx={57} cy={118} r={8} fill={c.white} />
    </> : <>
      <rect x={33} y={37} width={139} height={92} rx={24} /><ellipse cx={172} cy={83} rx={20} ry={46} />
      <path d="M193 83H215M8 83H33M62 48V116M91 48V116M120 48V116" strokeWidth={4} />
    </>}
  </g>
</svg>;

export const ToyotaV3Opening01 = () => {
  useStudioFont();
  const frame = useCurrentFrame();
  const time = frame / 30;
  const line = data.lines.find(l => time >= l.start && time < l.end) ?? [...data.lines].reverse().find(l => time >= l.start) ?? data.lines[0];
  const phase = line.phase;
  const street = ['street', 'recap', 'name'].includes(phase);
  const cue = data.cues.find(q => time >= q.start && time < q.end);
  const motor = phase === 'motor' || phase === 'together';
  const engine = phase === 'together';
  const battery = phase === 'battery';
  const heading = phase === 'street' ? 'ハイブリッドって、どんな車？'
    : phase === 'recap' ? '使い分ける。力を合わせる。' : 'だから、ハイブリッド。';
  const subtitle = phase === 'motor' ? '条件が合えば、モーターで走る'
    : phase === 'together' ? 'エンジンとモーターが力を合わせる'
    : phase === 'question' || battery ? 'モーターの電気は、どこから来る？' : 'エンジン ＋ モーター　＝　2種類の動力';
  const puppet = (who: string, height: number) => who === 'ホーマー'
    ? <MarkerHomer animated width={300} height={height} motionScale={line.speaker === who ? 1 : 0.25} />
    : <MarkerElder who={who === 'ジャッド' ? 'judd' : 'kent'} animated width={300} height={height}
        motionScale={line.speaker === who ? 1 : 0.25} blinkPhase={who === 'ジャッド' ? 83 : 157} />;
  return <AbsoluteFill style={{background: '#F5F0E5', color: c.ink, fontFamily: '"Studio Noto Sans JP", sans-serif'}}>
    <MarkerFilters /><Backdrop mode={street ? 'street' : 'diagram'} tone="day" />
    <Sequence from={12}><Audio src={staticFile(data.audio.src)} /></Sequence>
    <div style={{position: 'absolute', top: 36, left: 55, display: 'inline-flex', flexDirection: 'column'}}>
      <div style={{background: c.ink, color: c.white, padding: '12px 28px', borderRadius: 999, fontSize: 29, fontWeight: 800}}>第1部　ハイブリッドとは？</div>
      <div style={{display: 'flex', gap: 8, marginTop: 5}}>{[1,2,3,4,5].map(p => <div key={p} style={{flex: 1, height: 10, borderRadius: 999, background: p === 1 ? c.gold : '#29374733'}} />)}</div>
    </div>
    {street ? <>
      <div style={{position: 'absolute', top: 204, left: 385, width: 1150, fontSize: 62, fontWeight: 900, textAlign: 'center'}}>{heading}</div>
      {cast.map(({who,x}) => <div key={who} style={{position: 'absolute', left: x - 150, top: 376, width: 300, height: 430}}>{puppet(who,430)}</div>)}
    </> : <>
      <div style={{position: 'absolute', left: 115, top: 160, width: 1580, height: 630, background: '#FBFCFD', border: `4px solid ${c.ink}`, borderRadius: 26,
        boxShadow: '0 12px 0 #29374718', overflow: 'hidden'}}>
        <div style={{position: 'absolute', inset: 0, opacity: 0.3, backgroundImage: 'linear-gradient(#C8D3D9 1px, transparent 1px),linear-gradient(90deg,#C8D3D9 1px,transparent 1px)', backgroundSize: '52px 52px'}} />
        <div style={{position: 'absolute', left: 36, top: 23, fontSize: 43, fontWeight: 900}}>エンジンとモーター、2種類の動力</div>
        {[true,false].map((isEngine,i) => {
          const active = isEngine ? engine || phase === 'engine' : motor;
          const color = isEngine ? '#B27729' : c.blue;
          return <div key={i} style={{position: 'absolute', left: 45, top: 112 + i * 238, width: 300, textAlign: 'center',
            background: active ? `${color}18` : '#FFFFFF99', border: `4px solid ${active ? color : '#AAB8B6'}`, borderRadius: 16,
            transform: active ? `scale(${1.025 + Math.sin(frame / 12) * 0.015})` : undefined}}>
            <DriveIcon engine={isEngine} />
            <div style={{fontSize: 37, fontWeight: 800, color}}>{isEngine ? 'エンジン' : 'モーター'}</div>
          </div>;
        })}
        <div style={{position: 'absolute', left: 495, top: 190, width: 900, height: 330, opacity: battery ? 0.18 : 1}}><ToyotaV3OpeningCar moving={motor} /></div>
        {!battery && <svg width={1580} height={630} style={{position: 'absolute', inset: 0}}>
          <defs>{[['engine-force','#B27729'],['motor-force',c.blue]].map(([id,color]) => <marker key={id} id={id} markerWidth={24} markerHeight={22} refX={22} refY={11} markerUnits="userSpaceOnUse" orient="auto"><path d="M0 0L24 11L0 22Z" fill={color} /></marker>)}</defs>
          {[{d:'M360 220H462L635 407',on:engine,color:'#B27729',id:'engine-force'}, {d:'M360 446H635',on:motor,color:c.blue,id:'motor-force'}].map(f => <g key={f.id} opacity={f.on ? 1 : 0.2}>
            <path d={f.d} fill="none" stroke={f.color} strokeWidth={9} strokeLinejoin="round" markerEnd={`url(#${f.id})`} />
            {f.on && <path d={f.d} fill="none" stroke="#FFFCF5" strokeWidth={3} strokeDasharray="10 20" strokeDashoffset={-frame * 1.8} />}
          </g>)}
        </svg>}
        {battery && <svg width={1580} height={630} style={{position: 'absolute', inset: 0}}>
          <defs><marker id="battery-input" markerWidth={24} markerHeight={22} refX={22} refY={11} markerUnits="userSpaceOnUse" orient="auto"><path d="M0 0L24 11L0 22Z" fill="#327453" /></marker></defs>
          <rect x={870} y={235} width={320} height={145} rx={18} fill="#EDF5EE" stroke="#327453" strokeWidth={4} />
          <text x={1030} y={328} textAnchor="middle" fontSize={58} fontWeight={800} fill="#327453">電池</text>
          <path d="M670 205L850 274" stroke="#327453" strokeWidth={7} markerEnd="url(#battery-input)" />
          <path d="M670 423L850 343" stroke="#327453" strokeWidth={7} markerEnd="url(#battery-input)" />
          <text x={630} y={215} fontSize={45} fill="#327453">？</text><text x={630} y={440} fontSize={45} fill="#327453">？</text>
        </svg>}
        <div style={{position: 'absolute', left: 385, right: 45, top: 523, fontSize: 35, fontWeight: 800, textAlign: 'center', color: motor ? c.blue : c.ink}}>{subtitle}</div>
        <div style={{position: 'absolute', left: 385, right: 45, top: 587, fontSize: 21, color: '#526C78'}}>働き方の模式図。作動は車種・電池残量・暖機などの条件で変わります。</div>
      </div>
      <div style={{position: 'absolute', left: 1640, top: 410, width: 300, height: 390}}>{puppet(line.speaker,390)}</div>
    </>}
    {cue && <div style={{position: 'absolute', bottom: 32, left: 95, right: 95, display: 'flex', justifyContent: 'center'}}>
      <div style={{background: '#26313FF7', color: c.white, borderRadius: 18, padding: '20px 32px 22px', display: 'flex', alignItems: 'center', gap: 24,
        maxWidth: 1720, boxShadow: '0 10px 28px #1D253040'}}>
        <span style={{background: colors[cue.speaker], color: c.white, borderRadius: 10, fontSize: 33, fontWeight: 800, padding: '4px 18px', flexShrink: 0, whiteSpace: 'nowrap'}}>{cue.speaker}</span>
        <span style={{minWidth: 0, maxWidth: 1450, fontSize: 46, fontWeight: 800, lineHeight: 1.4, letterSpacing: '0.01em', textAlign: 'center', textWrap: 'balance'}}>{cue.text}</span>
      </div>
    </div>}
  </AbsoluteFill>;
};
