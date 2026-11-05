import React from 'react';
import {AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import data from '../data/longform/toyota-v19-ch3.json';
import {MarkerHomer} from '../elder/HomerMarkerPilot';
import {MarkerElder} from '../elder/ElderMarkerPilot';
import {Backdrop, MarkerFilters, useStudioFont} from './ToyotaV3VisualFrame';
import {BarChart} from './ToyotaV3Chart';

const c = {ink: '#293747', paper: '#FBFCFD', white: '#FFFCF5', gold: '#D9AB56', blue: '#437B9D'};
const colors: Record<string, string> = {ホーマー: '#AC382F', ジャッド: '#335D87', ケント: '#327453'};
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

const PHASES: {start: number; heading: string; note?: string; cards: {year: string; label: string; note?: string}[]}[] = [{"start": 0, "heading": "エンジンの得意・不得意", "note": "いつも得意な状態では走れない", "cards": [{"year": "エンジン", "label": "効率のよい状態がある"}, {"year": "車", "label": "止まる・発進・坂道"}]}, {"start": 3, "heading": "モーターが力を貸す", "note": "条件付きの例として見る", "cards": [{"year": "発進", "label": "モーター"}, {"year": "加速", "label": "エンジンを助ける"}, {"year": "減速", "label": "電気を回収"}]}, {"start": 8, "heading": "制御が難しい", "note": "数字だけでは決まらない", "cards": [{"year": "発電", "label": "燃料を使う"}, {"year": "損失", "label": "変換で出る"}, {"year": "運転", "label": "普通に運転"}]}, {"start": 12, "heading": "2倍には、まだ", "note": "会社が発売時期と目標を公表へ", "cards": [{"year": "まだ", "label": "届いていない"}, {"year": "公表", "label": "開発の途中で"}]}];
const CHART_ITEMS: {label: string; value: number; display: string}[] = [];
const CHART_PHASE = -1;
const FACE: Record<string, {vb: [number, number]; box: [number, number, number, number]; file: string}> = {
  ケント: {vb: [541, 1150], box: [143.5, 103.5, 380, 380], file: 'kent'},
  ホーマー: {vb: [627, 1175], box: [92.5, 395, 420, 420], file: 'homer'},
  ジャッド: {vb: [466, 1125], box: [7.5, 119.5, 360, 360], file: 'judd'},
};

const Portrait = ({speaker, time}: {speaker: string; time: number}) => {
  const f = FACE[speaker];
  if (!f) return null;
  const [vw, vh] = f.vb; const [x, y, w, h] = f.box;
  return <div style={{position: 'absolute', left: 1622, top: 206, width: 172, height: 172, borderRadius: '50%', overflow: 'hidden',
    border: `3px solid ${c.ink}`, backgroundColor: c.white, boxShadow: '0 6px 0 #29374718',
    transform: `translateY(${Math.sin(time * 2) * 4}px)`, backgroundImage: `url(${staticFile(`assets/characters/elder-svg/${f.file}.svg`)})`,
    backgroundSize: `${vw / w * 100}% ${vh / h * 100}%`,
    backgroundPosition: `${x / (vw - w) * 100}% ${y / (vh - h) * 100}%`, backgroundRepeat: 'no-repeat'}} />;
};

export const ToyotaV19Chapter3 = () => {
  useStudioFont();
  const frame = useCurrentFrame();
  const time = frame / 30;
  const line = data.lines.find((l) => time >= l.start && time < l.end)
    ?? [...data.lines].reverse().find((l) => time >= l.start) ?? data.lines[0];
  const cue = data.cues.find((q) => time >= q.start && time < q.end);
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
  const puppet = () => line.speaker === 'ホーマー'
    ? <MarkerHomer animated width={285} height={430} motionScale={1} />
    : <MarkerElder who={line.speaker === 'ケント' ? 'kent' : 'judd'} animated width={285} height={430}
        motionScale={line.speaker === 'ジャッド' && time < line.start + 0.85 ? 0.2 : 1}
        blinkPhase={line.speaker === 'ケント' ? 157 : 83} />;

  return <AbsoluteFill style={{background: '#F5F0E5', color: c.ink, fontFamily: '"Studio Noto Sans JP", sans-serif'}}>
    <MarkerFilters /><Backdrop mode="diagram" tone="day" />
    <Sequence from={12}><Audio src={staticFile(data.audio.src)} /></Sequence>
    <div style={{position: 'absolute', top: 36, left: 55, display: 'inline-flex', flexDirection: 'column'}}>
      <div style={{background: c.ink, color: c.white, padding: '12px 28px', borderRadius: 999, fontSize: 29, fontWeight: 800}}>第3章　エンジンの仕事を変える</div>
      <div style={{display: 'flex', gap: 8, marginTop: 5}}>{[1,2,3,4,5,6,7,8].map((p) => <div key={p} style={{flex: 1, height: 10, borderRadius: 999,
        background: p === 4 ? c.gold : '#29374733'}} />)}</div>
    </div>
    <div style={{position: 'absolute', left: 115, top: 160, width: 1580, height: 630, background: c.paper,
      border: `4px solid ${c.ink}`, borderRadius: 26, boxShadow: '0 12px 0 #29374718', overflow: 'hidden'}}>
      <div style={{position: 'absolute', inset: 0, opacity: 0.3, backgroundImage: 'linear-gradient(#C8D3D9 1px, transparent 1px),linear-gradient(90deg,#C8D3D9 1px,transparent 1px)', backgroundSize: '52px 52px'}} />
      <div style={{position: 'absolute', inset: 0, opacity: boardIn}}>
        <div style={{position: 'absolute', inset: 0, opacity: pin, transform: `translateY(${(1 - pin) * 16}px)`}}>
          <div style={{position: 'absolute', left: 54, top: 42, fontSize: 42, fontWeight: 900}}>{phase.heading}</div>
          {chart
            ? <div style={{position: 'absolute', left: 130, top: 150}}><BarChart items={CHART_ITEMS} /></div>
            : <div style={{position: 'absolute', left: 40, right: 40, top: 240, display: 'flex', gap: 32, justifyContent: 'center', alignItems: 'stretch'}}>
                {cards.map((card) => <div key={card.year} style={{width: cardW, background: '#FFFFFF', border: `3px solid ${c.ink}`,
                  borderRadius: 22, padding: '26px 24px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center',
                  justifyContent: 'center', boxShadow: '0 8px 0 #29374712'}}>
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
    <div style={{position: 'absolute', left: 1615, top: 385, width: 285, height: 430}}>{puppet()}</div>
    {line.speaker !== 'ナレ2' && <Portrait speaker={line.speaker} time={time} />}
    {cue && <div style={{position: 'absolute', bottom: 32, left: 95, right: 95, display: 'flex', justifyContent: 'center', opacity: cin}}>
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
