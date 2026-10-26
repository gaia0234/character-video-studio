import React from 'react';
import {AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import data from '../data/longform/toyota-v3-p1-06.json';
import {MarkerHomer} from '../elder/HomerMarkerPilot';
import {MarkerElder} from '../elder/ElderMarkerPilot';
import {Backdrop, MarkerFilters, useStudioFont} from './ToyotaV3VisualFrame';
import {ToyotaV3OpeningCar} from './ToyotaV3OpeningCar';

const c = {ink: '#293747', paper: '#FBFCFD', white: '#FFFCF5', gold: '#D9AB56', blue: '#437B9D'};
const colors: Record<string, string> = {ホーマー: '#AC382F', ジャッド: '#335D87', ケント: '#327453'};
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

// 発進→加速→減速→停止の4点。次区間で追う問いを固定するための模式図。
const nodeX = [310, 670, 1030, 1390];
const phases = ['depart', 'accelerate', 'decelerate', 'stop'];
const phaseLabels = ['発進', '加速', '減速', '停止'];

export const ToyotaV3Opening06 = () => {
  useStudioFont();
  const frame = useCurrentFrame();
  const time = frame / 30;
  const line = data.lines.find((l) => time >= l.start && time < l.end)
    ?? [...data.lines].reverse().find((l) => time >= l.start) ?? data.lines[0];
  const cue = data.cues.find((q) => time >= q.start && time < q.end);
  const phaseIndex = Math.max(0, phases.indexOf(line.phase));
  const active = line.phase === 'handoff' ? 0 : phaseIndex;
  // 実音のline.startを基点に車を進める。絶対秒は置かない。
  const carX = interpolate(time,
    [data.lines[0].start, data.lines[1].start, data.lines[2].start, data.lines[3].start],
    nodeX, clamp);
  const inAt = (start: number) => interpolate(time, [start + 0.1, start + 0.7], [0, 1], clamp);
  const boardIn = inAt(data.lines[0].start);
  const handoffIn = inAt(line.start);
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
      <div style={{display: 'flex', gap: 8, marginTop: 5}}>{[1,2,3,4,5].map((p) => <div key={p} style={{flex: 1, height: 10, borderRadius: 999,
        background: p === 1 ? c.gold : '#29374733'}} />)}</div>
    </div>
    <div style={{position: 'absolute', left: 115, top: 160, width: 1580, height: 630, background: c.paper,
      border: `4px solid ${c.ink}`, borderRadius: 26, boxShadow: '0 12px 0 #29374718', overflow: 'hidden'}}>
      <div style={{position: 'absolute', inset: 0, opacity: 0.3, backgroundImage: 'linear-gradient(#C8D3D9 1px, transparent 1px),linear-gradient(90deg,#C8D3D9 1px,transparent 1px)', backgroundSize: '52px 52px'}} />
      <div style={{position: 'absolute', inset: 0, opacity: boardIn}}>
        <div style={{position: 'absolute', left: 54, top: 42, fontSize: 42, fontWeight: 900}}>同じ道を、仕組みから見る</div>
        {/* 道路を最背景。車は道路より前面、位置丸・ラベルは車より前面に置く。 */}
        <svg width={1580} height={630} viewBox="0 0 1580 630" style={{position: 'absolute', inset: 0}}>
          <path d="M120 430 H1560" stroke="#C3CFD6" strokeWidth={22} strokeLinecap="round" />
          <path d="M120 430 H1560" stroke={c.paper} strokeWidth={3} strokeDasharray="26 22" />
        </svg>
        <div style={{position: 'absolute', left: carX - 170, top: 311, width: 340, height: 152}}>
          {/* 進行方向（左→右）に合わせて車体を反転する。図の形・細部は変えない。 */}
          <div style={{width: '100%', height: '100%', transform: 'scaleX(-1)'}}>
            <ToyotaV3OpeningCar moving={false} />
          </div>
        </div>
        <svg width={1580} height={630} viewBox="0 0 1580 630" style={{position: 'absolute', inset: 0}}>
          {nodeX.map((x, i) => <g key={x}>
            <circle cx={x} cy={430} r={active === i ? 26 : 20}
              fill={active === i ? c.gold : '#E7EDF0'} stroke={c.ink} strokeWidth={4} />
            <text x={x} y={500} textAnchor="middle" fontSize={34} fontWeight={800}
              fill={active === i ? c.ink : '#7A8A96'}>{phaseLabels[i]}</text>
          </g>)}
        </svg>
        {line.phase === 'handoff' && <div style={{position: 'absolute', left: nodeX[0] - 110, top: 330, width: 220,
          textAlign: 'center', fontSize: 30, fontWeight: 800, color: c.gold, opacity: handoffIn}}>次は、ここから</div>}
        <div style={{position: 'absolute', left: 54, bottom: 28, fontSize: 22, color: '#526574'}}>模式図：走行場面の一例</div>
      </div>
    </div>
    <div style={{position: 'absolute', left: 1615, top: 385, width: 285, height: 430}}>{puppet()}</div>
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
