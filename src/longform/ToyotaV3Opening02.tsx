import React from 'react';
import {AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import data from '../data/longform/toyota-v3-p1-02.json';
import {MarkerHomer} from '../elder/HomerMarkerPilot';
import {MarkerElder} from '../elder/ElderMarkerPilot';
import {ToyotaV3OpeningCar} from './ToyotaV3OpeningCar';
import {Backdrop, MarkerFilters, useStudioFont} from './ToyotaV3VisualFrame';

const c = {ink: '#293747', white: '#FFFCF5', gold: '#D9AB56', blue: '#437B9D', green: '#327453', fuel: '#A66D29'};
const speakerColors: Record<string, string> = {ホーマー: '#AC382F', ジャッド: '#335D87', ケント: '#327453'};
const cast = [{who: 'ジャッド', x: 360}, {who: 'ホーマー', x: 950}, {who: 'ケント', x: 1510}] as const;
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

// 01r2と同じ線・塗りの記号。車や人物の原画は既存部品を変更せず使用する。
const UnitIcon = ({engine = false, color}: {engine?: boolean; color: string}) => <svg width={215} height={132} viewBox="0 0 220 145">
  <g stroke={c.ink} strokeWidth={5} strokeLinejoin="round" fill={`${color}35`}>
    {engine ? <>
      <path d="M34 48H147L171 69V123H31V66H16V51H34Z" />
      <path d="M51 31H139V48H51ZM169 71H199V114H171" />
      {[60,84,108,132].map(x => <path key={x} d={`M${x} 62V106`} strokeWidth={3} />)}
      <circle cx={57} cy={118} r={8} fill={c.white} />
    </> : <>
      <rect x={33} y={37} width={139} height={92} rx={24} />
      <ellipse cx={172} cy={83} rx={20} ry={46} />
      <path d="M193 83H215M8 83H33M62 48V116M91 48V116M120 48V116" strokeWidth={4} />
    </>}
  </g>
</svg>;

export const ToyotaV3Opening02 = () => {
  useStudioFont();
  const frame = useCurrentFrame();
  const time = frame / 30;
  const line = data.lines.find(l => time >= l.start && time < l.end)
    ?? [...data.lines].reverse().find(l => time >= l.start) ?? data.lines[0];
  const cue = data.cues.find(q => time >= q.start && time < q.end);
  const phase = line.phase;
  const street = phase === 'street' || phase === 'closing';
  const fuel = phase === 'fuel';
  const regen = ['regen', 'recap', 'fuel'].includes(phase);
  const topAge = phase === 'engine' ? time - line.start : 99;
  const bottomAge = phase === 'regen' ? time - line.start : 99;
  const topStage = topAge < 1.1 ? 1 : topAge < 2.3 ? 2 : 3;
  const lowerStage = bottomAge < 1.3 ? 1 : bottomAge < 2.5 ? 2 : 3;
  const engineActive = phase === 'engine' || fuel;
  const recoveryActive = phase === 'regen' || phase === 'recap';
  const topOpacity = recoveryActive ? 0.45 : 1;
  const lowerOpacity = fuel ? 0.5 : 1;
  const puppet = (who: string, height: number) => who === 'ホーマー'
    ? <MarkerHomer animated width={300} height={height} motionScale={line.speaker === who ? 1 : 0.25} />
    : <MarkerElder who={who === 'ジャッド' ? 'judd' : 'kent'} animated width={300} height={height}
        motionScale={line.speaker === who ? 1 : 0.25} blinkPhase={who === 'ジャッド' ? 83 : 157} />;
  const progress = (age: number, start: number) => interpolate(age, [start, start + 0.55], [0, 1], clamp);

  return <AbsoluteFill style={{background: '#F5F0E5', color: c.ink, fontFamily: '"Studio Noto Sans JP", sans-serif'}}>
    <MarkerFilters /><Backdrop mode={street ? 'street' : 'diagram'} tone="day" />
    <Sequence from={12}><Audio src={staticFile(data.audio.src)} /></Sequence>
    <div style={{position: 'absolute', top: 36, left: 55, display: 'inline-flex', flexDirection: 'column'}}>
      <div style={{background: c.ink, color: c.white, padding: '12px 28px', borderRadius: 999, fontSize: 29, fontWeight: 800}}>第1部　ハイブリッドとは？</div>
      <div style={{display: 'flex', gap: 8, marginTop: 5}}>{[1,2,3,4,5].map(p => <div key={p} style={{flex: 1, height: 10, borderRadius: 999,
        background: p === 1 ? c.gold : '#29374733'}} />)}</div>
    </div>
    {street ? <>
      <div style={{position: 'absolute', top: 204, left: 385, width: 1150, fontSize: 62, fontWeight: 900, textAlign: 'center'}}>
        {phase === 'closing' ? '2つの道を、いつ使う？' : '電池の電気は、どこから？'}
      </div>
      {cast.map(({who,x}) => <div key={who} style={{position: 'absolute', left: x - 150, top: 376, width: 300, height: 430}}>{puppet(who,430)}</div>)}
    </> : <>
      <div style={{position: 'absolute', left: 115, top: 160, width: 1580, height: 630, background: '#FBFCFD',
        border: `4px solid ${c.ink}`, borderRadius: 26, boxShadow: '0 12px 0 #29374718', overflow: 'hidden'}}>
        <div style={{position: 'absolute', inset: 0, opacity: 0.3, backgroundImage: 'linear-gradient(#C8D3D9 1px, transparent 1px),linear-gradient(90deg,#C8D3D9 1px,transparent 1px)', backgroundSize: '52px 52px'}} />
        <div style={{position: 'absolute', left: 36, top: 23, fontSize: 43, fontWeight: 900}}>電池に電気が入る、2つの道</div>
        <svg width={1580} height={630} style={{position: 'absolute', inset: 0}}>
          <defs>
            <marker id="v302-engine-electricity" markerWidth={24} markerHeight={22} refX={22} refY={11} markerUnits="userSpaceOnUse" orient="auto"><path d="M0 0L24 11L0 22Z" fill={fuel ? '#AC382F' : c.fuel} /></marker>
            <marker id="v302-recovered-electricity" markerWidth={24} markerHeight={22} refX={22} refY={11} markerUnits="userSpaceOnUse" orient="auto"><path d="M0 0L24 11L0 22Z" fill={c.blue} /></marker>
          </defs>
          <g opacity={topOpacity}>
            <text x={50} y={121} fontSize={32} fontWeight={800} fill={c.fuel}>1｜エンジンの力から</text>
            {[{d:'M365 236H530',stage:2,at:1.1},{d:'M850 236H1148',stage:3,at:2.3}].map((a,i) => <g key={i} opacity={topStage >= a.stage ? 1 : 0}>
              <path d={a.d} fill="none" stroke={fuel ? '#AC382F' : c.fuel} strokeWidth={9} markerEnd="url(#v302-engine-electricity)"
                pathLength={1} strokeDasharray={1} strokeDashoffset={1-progress(topAge,a.at)} />
              {engineActive && <path d={a.d} fill="none" stroke={c.white} strokeWidth={3} strokeDasharray="10 20" strokeDashoffset={-frame * 1.8} />}
            </g>)}
          </g>
          {regen && <g opacity={lowerOpacity}>
            <text x={50} y={394} fontSize={32} fontWeight={800} fill={c.blue}>2｜減速する車の動きから</text>
            {[{d:'M410 480H530',stage:2,at:1.3},{d:'M850 480H1148',stage:3,at:2.5}].map((a,i) => <g key={i} opacity={lowerStage >= a.stage ? 1 : 0}>
              <path d={a.d} fill="none" stroke={c.blue} strokeWidth={9} markerEnd="url(#v302-recovered-electricity)"
                pathLength={1} strokeDasharray={1} strokeDashoffset={1-progress(bottomAge,a.at)} />
              {recoveryActive && <path d={a.d} fill="none" stroke={c.white} strokeWidth={3} strokeDasharray="10 20" strokeDashoffset={-frame * 1.8} />}
            </g>)}
          </g>}
        </svg>
        <div style={{position: 'absolute', left: 55, top: 145, width: 290, textAlign: 'center', opacity: topOpacity,
          background: fuel ? '#AC382F15' : `${c.fuel}12`, border: `4px solid ${fuel ? '#AC382F' : engineActive ? c.fuel : '#AAB8B6'}`, borderRadius: 16}}>
          <UnitIcon engine color={c.fuel} /><div style={{fontSize: 36, fontWeight: 800, color: c.fuel}}>エンジン</div>
        </div>
        {topStage >= 2 && <div style={{position: 'absolute', left: 550, top: 145, width: 275, textAlign: 'center', opacity: topOpacity,
          background: `${c.fuel}12`, border: `4px solid ${engineActive ? c.fuel : '#AAB8B6'}`, borderRadius: 16}}>
          <UnitIcon color={c.fuel} /><div style={{fontSize: 36, fontWeight: 800, color: c.fuel}}>発電機</div>
        </div>}
        {topStage >= 3 && <div style={{position: 'absolute', left: 1170, top: 206, width: 310, height: 322, background: '#EDF5EE',
          border: `4px solid ${c.green}`, borderRadius: 18, textAlign: 'center', padding: '20px 16px'}}>
          <svg width={180} height={120} viewBox="0 0 200 120"><g stroke={c.green} strokeWidth={5} fill="#BCD3BD">
            <rect x={15} y={25} width={170} height={88} rx={10} /><path d="M40 25V12H68V25M133 25V12H162V25" />
            <path d="M47 69H77M62 54V84M130 69H160" fill="none" />
          </g></svg>
          <div style={{fontSize: 43, fontWeight: 900, color: c.green}}>電池</div>
          <div style={{fontSize: 28, marginTop: 12, color: c.green}}>ためて、また使う</div>
        </div>}
        {fuel && <div style={{position: 'absolute', top: 88, left: 465, fontSize: 29, fontWeight: 900, color: '#AC382F'}}>発電にも燃料</div>}
        {regen ? <div style={{opacity: lowerOpacity}}>
          <div style={{position: 'absolute', left: 35, top: 400, width: 365, height: 130}}><ToyotaV3OpeningCar /></div>
          <div style={{position: 'absolute', left: 76, top: 535, fontSize: 32, fontWeight: 800, color: c.blue}}>減速する車</div>
          {lowerStage >= 2 && <div style={{position: 'absolute', left: 550, top: 390, width: 275, textAlign: 'center',
            background: `${c.blue}12`, border: `4px solid ${recoveryActive ? c.blue : '#AAB8B6'}`, borderRadius: 16}}>
            <UnitIcon color={c.blue} /><div style={{fontSize: 33, fontWeight: 800, color: c.blue}}>モーターで回収</div>
          </div>}
        </div> : <div style={{position: 'absolute', top: 420, left: 85, width: 735, fontSize: 40, fontWeight: 800, textAlign: 'center', color: '#526C78'}}>
          {phase === 'question' ? 'もう1つは、どこから？' : 'もう1つの道は？'}
        </div>}
        <div style={{position: 'absolute', left: 385, right: 45, top: 588, fontSize: 21, textAlign: 'center', color: '#526C78'}}>電気が電池に入る経路の模式図。回収できる量は走り方などの条件で変わります。</div>
      </div>
      <div style={{position: 'absolute', left: 1640, top: 410, width: 300, height: 390}}>{puppet(line.speaker,390)}</div>
    </>}
    {cue && <div style={{position: 'absolute', bottom: 32, left: 95, right: 95, display: 'flex', justifyContent: 'center'}}>
      <div style={{background: '#26313FF7', color: c.white, borderRadius: 18, padding: '20px 32px 22px', display: 'flex', alignItems: 'center', gap: 24,
        maxWidth: 1720, boxShadow: '0 10px 28px #1D253040'}}>
        <span style={{background: speakerColors[cue.speaker], color: c.white, borderRadius: 10, fontSize: 33, fontWeight: 800, padding: '4px 18px', flexShrink: 0, whiteSpace: 'nowrap'}}>{cue.speaker}</span>
        <span style={{minWidth: 0, maxWidth: 1450, fontSize: 46, fontWeight: 800, lineHeight: 1.4, letterSpacing: '0.01em', textAlign: 'center', textWrap: 'balance'}}>{cue.text}</span>
      </div>
    </div>}
  </AbsoluteFill>;
};
