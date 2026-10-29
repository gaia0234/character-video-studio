import React from 'react';
import {AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import data from '../data/longform/toyota-v3-p3-15.json';
import {MarkerHomer} from '../elder/HomerMarkerPilot';
import {MarkerElder} from '../elder/ElderMarkerPilot';
import {Backdrop, MarkerFilters, useStudioFont} from './ToyotaV3VisualFrame';

const c = {ink: '#293747', paper: '#FBFCFD', white: '#FFFCF5', gold: '#D9AB56', blue: '#437B9D'};
const colors: Record<string, string> = {ホーマー: '#AC382F', ジャッド: '#335D87', ケント: '#327453'};
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

const HEADING = "プリウスでなければ選べない？";
const CARDS: {year: string; label: string; note?: string; big?: boolean}[] = [{"year": "2001", "label": "エスティマ", "note": "ミニバン"}, {"year": "2005", "label": "ハリアー（SUV）", "note": "海外名レクサスRX400h"}, {"year": "2006–2007", "label": "レクサス（セダン）", "note": "GS450h / LS600h"}];
const NOTE = null;
const CARD_W = 380;

export const ToyotaV3Opening15 = () => {
  useStudioFont();
  const frame = useCurrentFrame();
  const time = frame / 30;
  const line = data.lines.find((l) => time >= l.start && time < l.end)
    ?? [...data.lines].reverse().find((l) => time >= l.start) ?? data.lines[0];
  const cue = data.cues.find((q) => time >= q.start && time < q.end);
  const boardIn = interpolate(time, [data.lines[0].start + 0.1, data.lines[0].start + 0.7], [0, 1], clamp);
  const puppet = () => line.speaker === 'ホーマー'
    ? <MarkerHomer animated width={285} height={430} motionScale={1} />
    : <MarkerElder who={line.speaker === 'ケント' ? 'kent' : 'judd'} animated width={285} height={430}
        motionScale={line.speaker === 'ジャッド' && time < line.start + 0.85 ? 0.2 : 1}
        blinkPhase={line.speaker === 'ケント' ? 157 : 83} />;

  return <AbsoluteFill style={{background: '#F5F0E5', color: c.ink, fontFamily: '"Studio Noto Sans JP", sans-serif'}}>
    <MarkerFilters /><Backdrop mode="diagram" tone="day" />
    <Sequence from={12}><Audio src={staticFile(data.audio.src)} /></Sequence>
    <div style={{position: 'absolute', top: 36, left: 55, display: 'inline-flex', flexDirection: 'column'}}>
      <div style={{background: c.ink, color: c.white, padding: '12px 28px', borderRadius: 999, fontSize: 29, fontWeight: 800}}>第3部　1台から、選べる車へ</div>
      <div style={{display: 'flex', gap: 8, marginTop: 5}}>{[1,2,3,4,5].map((p) => <div key={p} style={{flex: 1, height: 10, borderRadius: 999,
        background: p === 3 ? c.gold : '#29374733'}} />)}</div>
    </div>
    <div style={{position: 'absolute', left: 115, top: 160, width: 1580, height: 630, background: c.paper,
      border: `4px solid ${c.ink}`, borderRadius: 26, boxShadow: '0 12px 0 #29374718', overflow: 'hidden'}}>
      <div style={{position: 'absolute', inset: 0, opacity: 0.3, backgroundImage: 'linear-gradient(#C8D3D9 1px, transparent 1px),linear-gradient(90deg,#C8D3D9 1px,transparent 1px)', backgroundSize: '52px 52px'}} />
      <div style={{position: 'absolute', inset: 0, opacity: boardIn}}>
        <div style={{position: 'absolute', left: 54, top: 42, fontSize: 42, fontWeight: 900}}>{HEADING}</div>
        <div style={{position: 'absolute', left: 40, right: 40, top: 240, display: 'flex', gap: 32, justifyContent: 'center', alignItems: 'stretch'}}>
          {CARDS.map((card) => <div key={card.year} style={{width: CARD_W, background: '#FFFFFF', border: `3px solid ${c.ink}`,
            borderRadius: 22, padding: '26px 24px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', boxShadow: '0 8px 0 #29374712'}}>
            <div style={{fontSize: card.big ? 104 : 58, fontWeight: 900, color: c.gold, lineHeight: 1.05, whiteSpace: 'nowrap'}}>{card.year}</div>
            <div style={{fontSize: card.big ? 44 : 38, fontWeight: 800, marginTop: 10, textAlign: 'center'}}>{card.label}</div>
            {card.note && <div style={{fontSize: 24, color: '#526574', marginTop: 8, textAlign: 'center'}}>{card.note}</div>}
          </div>)}
        </div>
        {NOTE && <div style={{position: 'absolute', left: 54, right: 54, bottom: 46, fontSize: 26, color: '#526574', textAlign: 'center'}}>{NOTE}</div>}
        <div style={{position: 'absolute', left: 54, bottom: 16, fontSize: 20, color: '#7A8A96'}}>年は資料に基づく。累計と年間は区別する。</div>
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
