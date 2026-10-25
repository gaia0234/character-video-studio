import React from 'react';
import {AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import data from '../data/longform/toyota-v3-p1-04.json';
import {MarkerHomer} from '../elder/HomerMarkerPilot';
import {MarkerElder} from '../elder/ElderMarkerPilot';
import {Backdrop, MarkerFilters, useStudioFont} from './ToyotaV3VisualFrame';

const c = {ink: '#293747', white: '#FFFCF5', gold: '#D9AB56', blue: '#437B9D'};
const colors: Record<string, string> = {ホーマー: '#AC382F', ジャッド: '#335D87', ケント: '#327453'};
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

// 01r2のDriveIconと同じ輪郭・線・塗り。共通部品と旧sceneは変更しない。
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

export const ToyotaV3Opening04 = () => {
  useStudioFont();
  const frame = useCurrentFrame();
  const time = frame / 30;
  const line = data.lines.find(l => time >= l.start && time < l.end)
    ?? [...data.lines].reverse().find(l => time >= l.start) ?? data.lines[0];
  const cue = data.cues.find(q => time >= q.start && time < q.end);
  const target = line.phase === 'target' || line.phase === 'reaction';
  const combination = line.phase === 'combination' || line.phase === 'working';
  const twoAt = data.cues.find(q => q.lineId === data.lines[0].id && q.text.includes('2倍へ'))!.start;
  const two = interpolate(time, [twoAt, twoAt + 0.4], [0, 1], clamp);
  const recollection = data.lines[4];
  const recallAt = (text: string) => data.cues.find(q => q.lineId === recollection.id && q.text.includes(text))!.start;
  const recallPoints = [
    {text: '成功を見通せない中で', at: recallAt('当初')},
    {text: '環境・エネルギーの問題に取り組む', at: recallAt('環境')},
    {text: '開発した経験は残る', at: recallAt('開発した経験')},
  ];
  const puppet = () => line.speaker === 'ホーマー'
    ? <MarkerHomer animated width={285} height={430} motionScale={1} />
    : <MarkerElder who={line.speaker === 'ケント' ? 'kent' : 'judd'} animated width={285} height={430}
        motionScale={line.speaker === 'ジャッド' && time < line.start + 0.85 ? 0.2 : 1}
        blinkPhase={line.speaker === 'ケント' ? 157 : 83} />;

  return <AbsoluteFill style={{background: '#F5F0E5', color: c.ink, fontFamily: '"Studio Noto Sans JP", sans-serif'}}>
    <MarkerFilters /><Backdrop mode="diagram" tone="day" />
    <Sequence from={12}><Audio src={staticFile(data.audio.src)} /></Sequence>
    <div style={{position: 'absolute', top: 36, left: 55, display: 'inline-flex', flexDirection: 'column'}}>
      <div style={{background: c.ink, color: c.white, padding: '12px 28px', borderRadius: 999, fontSize: 29, fontWeight: 800}}>第1部　ハイブリッドとは？</div>
      <div style={{display: 'flex', gap: 8, marginTop: 5}}>{[1,2,3,4,5].map(p => <div key={p} style={{flex: 1, height: 10, borderRadius: 999,
        background: p === 1 ? c.gold : '#29374733'}} />)}</div>
    </div>
    <div style={{position: 'absolute', left: 115, top: 160, width: 1580, height: 630, background: '#FBFCFD',
      border: `4px solid ${c.ink}`, borderRadius: 26, boxShadow: '0 12px 0 #29374718', overflow: 'hidden'}}>
      <div style={{position: 'absolute', inset: 0, opacity: 0.3, backgroundImage: 'linear-gradient(#C8D3D9 1px, transparent 1px),linear-gradient(90deg,#C8D3D9 1px,transparent 1px)', backgroundSize: '52px 52px'}} />
      {target ? <>
        <div style={{position: 'absolute', left: 54, top: 42, fontSize: 43, fontWeight: 900}}>G21の燃費目標</div>
        {[{text: '1.5倍', x: 120, opacity: 1, color: c.blue}, {text: '2倍', x: 850, opacity: two, color: c.gold}].map(card =>
          <div key={card.text} style={{position: 'absolute', left: card.x, top: 155, width: 460, height: 245,
            display: 'grid', placeItems: 'center', background: `${card.color}16`, border: `4px solid ${card.color}`,
            borderRadius: 24, opacity: card.opacity, fontSize: 136, fontWeight: 900, color: card.color}}>{card.text}</div>)}
        <div style={{position: 'absolute', left: 650, top: 211, opacity: two, fontSize: 90, color: c.gold, fontWeight: 900}}>→</div>
        <div style={{position: 'absolute', left: 120, top: 442, width: 1190, textAlign: 'center', fontSize: 39, fontWeight: 800,
          opacity: line.phase === 'reaction' ? 1 : 0}}>同じ燃料で走れる距離を、倍にする目標</div>
        <div style={{position: 'absolute', left: 54, bottom: 28, fontSize: 23, color: '#526C78'}}>出典：トヨタ75年史「ハイブリッド車プリウスの開発」</div>
      </> : combination ? <>
        <div style={{position: 'absolute', left: 54, top: 42, fontSize: 43, fontWeight: 900}}>エンジンとモーターの組み合わせ</div>
        {[true,false].map((engine,i) => {
          const color = engine ? '#B27729' : c.blue;
          return <div key={i} style={{position: 'absolute', left: 130 + i * 720, top: 145, width: 430, height: 265,
            background: `${color}16`, border: `4px solid ${color}`, borderRadius: 20, textAlign: 'center', paddingTop: 18}}>
            <DriveIcon engine={engine} />
            <div style={{fontSize: 42, fontWeight: 900, color}}>{engine ? 'エンジン' : 'モーター'}</div>
          </div>;
        })}
        <div style={{position: 'absolute', left: 655, top: 225, fontSize: 82, fontWeight: 800, color: '#526C78'}}>＋</div>
        <div style={{position: 'absolute', left: 100, top: 465, width: 1230, fontSize: 37, fontWeight: 800, textAlign: 'center'}}>
          {line.phase === 'working' ? 'エンジンがいつ働くかまで見る' : '2つの働かせ方で、燃料の使い方を変える'}
        </div>
      </> : <>
        <div style={{position: 'absolute', left: 54, top: 42, fontSize: 43, fontWeight: 900}}>開発を率いた人</div>
        <div style={{position: 'absolute', left: 70, top: 150, width: 480, textAlign: 'center'}}>
          <div style={{fontSize: 31, fontWeight: 800, color: '#526C78'}}>初代プリウスの開発責任者</div>
          <div style={{fontSize: 84, fontWeight: 900, marginTop: 28}}>内山田竹志</div>
          <div style={{fontSize: 31, color: c.blue, marginTop: 24}}>後年の回想（要約）</div>
        </div>
        <div style={{position: 'absolute', left: 610, top: 140, height: 330, width: 4, background: '#29374722'}} />
        {recallPoints.map((point,i) => <div key={point.text} style={{position: 'absolute', left: 680, top: 153 + i * 105,
          fontSize: 37, fontWeight: 800, color: i === 1 ? c.blue : c.ink,
          opacity: interpolate(time, [point.at, point.at + 0.4], [0, 1], clamp)}}>{point.text}</div>)}
        <div style={{position: 'absolute', left: 54, bottom: 28, fontSize: 23, color: '#526C78'}}>出典：トヨタ 対談「志が未来を拓く。」</div>
      </>}
    </div>
    {line.speaker !== 'ナレ2' && <div style={{position: 'absolute', left: 1615, top: 385, width: 285, height: 430}}>{puppet()}</div>}
    {cue && <div style={{position: 'absolute', bottom: 32, left: 95, right: 95, display: 'flex', justifyContent: 'center'}}>
      <div style={{background: '#26313FF7', color: c.white, borderRadius: 18, padding: '20px 32px 22px', display: 'flex', alignItems: 'center', gap: 24,
        maxWidth: 1720, boxShadow: '0 10px 28px #1D253040'}}>
        {cue.speaker !== 'ナレ2' && <span style={{background: colors[cue.speaker], color: c.white, borderRadius: 10, fontSize: 33,
          fontWeight: 800, padding: '4px 18px', flexShrink: 0, whiteSpace: 'nowrap'}}>{cue.speaker}</span>}
        <span style={{minWidth: 0, maxWidth: 1450, fontSize: 46, fontWeight: 800, lineHeight: 1.4, letterSpacing: '0.01em', textAlign: 'center', textWrap: 'balance'}}>{cue.text}</span>
      </div>
    </div>}
  </AbsoluteFill>;
};
