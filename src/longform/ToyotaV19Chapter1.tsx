import React from 'react';
import {AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import data from '../data/longform/toyota-v19-chapter1.json';
import {MarkerHomer} from '../elder/HomerMarkerPilot';
import {MarkerElder} from '../elder/ElderMarkerPilot';
import {Backdrop, MarkerFilters, useStudioFont} from './ToyotaV3VisualFrame';
import {BarChart} from './ToyotaV3Chart';

const c = {ink: '#293747', paper: '#FBFCFD', white: '#FFFCF5', gold: '#D9AB56', blue: '#437B9D'};
const colors: Record<string, string> = {ホーマー: '#AC382F', ジャッド: '#335D87', ケント: '#327453'};
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

const PHASES: {start: number; heading: string; note?: string; cards: {year: string; label: string; note?: string}[]}[] = [{"start": 0, "heading": "1993年、G21", "note": "環境と資源をテーマにした計画", "cards": [{"year": "1993", "label": "G21 開始"}, {"year": "1.5倍", "label": "燃費の目標"}]}, {"start": 2, "heading": "1.5倍から、2倍へ", "note": "従来を1とした倍数。和田明広副社長の指示で2倍へ", "cards": []}, {"start": 5, "heading": "エンジンとモーターを組み合わせる", "note": "当時、ハイブリッド車の量産は、まだなかった", "cards": [{"year": "エンジン", "label": "改良では届かない"}, {"year": "モーター", "label": "走行を担う"}, {"year": "ハイブリッド", "label": "組み合わせを選ぶ"}]}];
const CHART_ITEMS: {label: string; value: number; display: string}[] = [{"label": "当初の目標", "value": 1.5, "display": "1.5倍"}, {"label": "和田副社長の指示", "value": 2, "display": "2倍"}];
const CHART_PHASE = 1;
const Portrait = ({speaker, time}: {speaker: string; time: number}) => {
  if (speaker === 'ナレ2') return null;
  const inner = speaker === 'ホーマー'
    ? <MarkerHomer animated width={600} height={905} motionScale={1} />
    : <MarkerElder who={speaker === 'ケント' ? 'kent' : 'judd'} animated width={600} height={905} motionScale={1}
        blinkPhase={speaker === 'ケント' ? 157 : 83} />;
  return <div style={{position: 'absolute', left: 1622, top: 200, width: 172, height: 172, borderRadius: '50%', overflow: 'hidden',
    border: `3px solid ${c.ink}`, backgroundColor: c.white, boxShadow: '0 6px 0 #29374718',
    transform: `translateY(${Math.sin(time * 2) * 4}px)`}}>
    <div style={{position: 'absolute', left: -183, top: -56, width: 540, height: 815}}>{inner}</div>
  </div>;
};

export const ToyotaV19Chapter1 = () => {
  useStudioFont();
  const frame = useCurrentFrame();
  const time = frame / 30;
  const line = data.lines.find((l) => time >= l.start && time < l.end)
    ?? [...data.lines].reverse().find((l) => time >= l.start) ?? data.lines[0];
  const cue = data.cues.find((q) => time >= q.start && time < q.end);
  const speakerLine = line.speaker !== 'ナレ2' ? line
    : [...data.lines].filter((l) => l.speaker !== 'ナレ2' && l.start <= time).pop()
      ?? data.lines.find((l) => l.speaker !== 'ナレ2') ?? line;
  const boardIn = interpolate(time, [data.lines[0].start + 0.1, data.lines[0].start + 0.7], [0, 1], clamp);
  const lineIdx = data.lines.findIndex((l) => l.id === line.id);
  let pi = 0;
  for (let i = 0; i < PHASES.length; i++) if (lineIdx >= PHASES[i].start) pi = i;
  const phase = PHASES[pi];
  const chart = pi === CHART_PHASE;
  const cards = phase.cards || [];
  const cardW = cards.length === 1 ? 760 : cards.length === 2 ? 520 : 380;
  const phaseStart = data.lines[phase.start].start;
  const pin = interpolate(time, [phaseStart, phaseStart + 0.45], [0, 1], clamp);
  const cin = cue ? interpolate(time, [cue.start, cue.start + 0.18], [0, 1], clamp) : 0;
  const puppet = () => speakerLine.speaker === 'ホーマー'
    ? <MarkerHomer animated width={285} height={430} motionScale={1} />
    : <MarkerElder who={speakerLine.speaker === 'ケント' ? 'kent' : 'judd'} animated width={285} height={430}
        motionScale={speakerLine.speaker === 'ジャッド' && time < speakerLine.start + 0.85 ? 0.2 : 1}
        blinkPhase={speakerLine.speaker === 'ケント' ? 157 : 83} />;

  return <AbsoluteFill style={{background: '#F5F0E5', color: c.ink, fontFamily: '"Studio Noto Sans JP", sans-serif'}}>
    <MarkerFilters /><Backdrop mode="diagram" tone="day" />
    <Sequence from={12}><Audio src={staticFile(data.audio.src)} /></Sequence>
    <div style={{position: 'absolute', top: 36, left: 55, display: 'inline-flex', flexDirection: 'column'}}>
      <div style={{background: c.ink, color: c.white, padding: '12px 28px', borderRadius: 999, fontSize: 29, fontWeight: 800}}>第1章　無茶な約束</div>
      <div style={{display: 'flex', gap: 8, marginTop: 5}}>{[1,2,3,4,5,6,7,8].map((p) => <div key={p} style={{flex: 1, height: 10, borderRadius: 999,
        background: p === 2 ? c.gold : '#29374733'}} />)}</div>
    </div>
    <div style={{position: 'absolute', left: 115, top: 160, width: 1580, height: 630, background: c.paper,
      border: `4px solid ${c.ink}`, borderRadius: 26, boxShadow: '0 12px 0 #29374718', overflow: 'hidden'}}>
      <div style={{position: 'absolute', inset: 0, opacity: 0.3, backgroundImage: 'linear-gradient(#C8D3D9 1px, transparent 1px),linear-gradient(90deg,#C8D3D9 1px,transparent 1px)', backgroundSize: '52px 52px'}} />
      <div style={{position: 'absolute', inset: 0, opacity: boardIn}}>
        <div style={{position: 'absolute', inset: 0, opacity: pin, transform: `translateY(${(1 - pin) * 16}px) scale(${1 + Math.sin(time * 0.6) * 0.004})`}}>
          <div style={{position: 'absolute', left: 54, top: 42, fontSize: 42, fontWeight: 900}}>{phase.heading}</div>
          {chart
            ? <div style={{position: 'absolute', left: 130, top: 150}}><BarChart items={CHART_ITEMS} /></div>
            : <div style={{position: 'absolute', left: 40, right: 40, top: 240, display: 'flex', gap: 32, justifyContent: 'center', alignItems: 'stretch'}}>
                {cards.map((card, ci) => <div key={card.year} style={{width: cardW, opacity: pin, background: '#FFFFFF', border: `3px solid ${c.ink}`,
                  borderRadius: 22, padding: '26px 24px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center',
                  justifyContent: 'center', boxShadow: '0 8px 0 #29374712', transform: `translateX(${(1 - pin) * (40 + ci * 24)}px) translateY(${Math.sin(time * 1.6 + ci) * 3}px)`}}>
                  <div style={{fontSize: 58, fontWeight: 900, color: c.gold, lineHeight: 1.05, whiteSpace: 'nowrap'}}>{card.year}</div>
                  <div style={{fontSize: 38, fontWeight: 800, marginTop: 10, textAlign: 'center'}}>{card.label}</div>
                  {card.note && <div style={{fontSize: 24, color: '#526574', marginTop: 8, textAlign: 'center'}}>{card.note}</div>}
                </div>)}
              </div>}
          {phase.note && <div style={{position: 'absolute', left: 54, right: 54, bottom: 40, fontSize: 26, color: '#526574', textAlign: 'center'}}>{phase.note}</div>}
          <div style={{position: 'absolute', left: 54, bottom: 10, fontSize: 20, color: '#7A8A96'}}>出典は公式資料。数値は当時の目標値。</div>
        </div>
      </div>
    </div>
    <div style={{position: 'absolute', left: 1615, top: 385, width: 285, height: 430, transform: `translateY(${Math.sin(time * 2.2) * 6}px)`}}>{puppet()}</div>
    <Portrait speaker={speakerLine.speaker} time={time} />
    {cue && <div style={{position: 'absolute', bottom: 32, left: 95, right: 95, display: 'flex', justifyContent: 'center', opacity: cin, transform: `translateY(${(1 - cin) * 12}px)`}}>
      <div style={{background: '#26313FF7', color: c.white, borderRadius: 18, padding: '16px 32px 18px', display: 'flex', alignItems: 'center', gap: 24,
        maxWidth: 1720, boxShadow: '0 10px 28px #1D253040'}}>
        {cue.speaker !== 'ナレ2' && <span style={{background: colors[cue.speaker], color: c.white, borderRadius: 10, fontSize: 30,
          fontWeight: 800, padding: '4px 16px', flexShrink: 0, whiteSpace: 'nowrap'}}>{cue.speaker}</span>}
        <div style={{minWidth: 0, maxWidth: 1450, textAlign: 'center'}}>
          {cue.lines.map((ln, i) => <div key={`${cue.start}-${i}`} style={{fontSize: 40, fontWeight: 800, lineHeight: 1.35,
            letterSpacing: '0.01em', whiteSpace: 'nowrap'}}>{ln}</div>)}
        </div>
      </div>
    </div>}
  </AbsoluteFill>;
};
