import React from 'react';
import {AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import data from '../data/longform/toyota-v3-p1-03.json';
import {MarkerElder} from '../elder/ElderMarkerPilot';
import {Backdrop, MarkerFilters, useStudioFont} from './ToyotaV3VisualFrame';
import {ToyotaV3OpeningCar} from './ToyotaV3OpeningCar';

const c = {ink: '#293747', paper: '#FBFCFD', white: '#FFFCF5', gold: '#D9AB56', blue: '#437B9D'};
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

const ReferenceCar = () => <div style={{width: 470, textAlign: 'center'}}>
  <div style={{width: 470, height: 245}}><ToyotaV3OpeningCar /></div>
  <div style={{fontSize: 25, lineHeight: 1.45, color: '#526C78'}}>
    <div>後に発売された初代プリウスの</div>
    <div>外観参考図</div>
  </div>
</div>;

export const ToyotaV3Opening03 = () => {
  useStudioFont();
  const frame = useCurrentFrame();
  const time = frame / 30;
  const line = data.lines.find((l) => time >= l.start && time < l.end)
    ?? [...data.lines].reverse().find((l) => time >= l.start) ?? data.lines[0];
  const cue = data.cues.find((q) => time >= q.start && time < q.end);
  const narration = line.phase === 'narration';
  const reveal = interpolate(frame, [286, 304], [0, 1], clamp);

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
      {!narration ? <>
        <div style={{position: 'absolute', left: 54, top: 42, fontSize: 42, fontWeight: 900}}>どれだけ燃費を変える？</div>
        <div style={{position: 'absolute', left: 120, top: 166}}><ReferenceCar /></div>
        <div style={{position: 'absolute', left: 660, top: 205, width: 650, height: 150, display: 'grid', placeItems: 'center',
          background: '#D9AB561A', border: `4px solid ${c.gold}`, borderRadius: 24, fontSize: 48, fontWeight: 900, textAlign: 'center'}}>
          エンジンとモーター
        </div>
        <div style={{position: 'absolute', left: 720, top: 395, fontSize: 34, fontWeight: 700, color: '#526C78'}}>働き方まで考える</div>
      </> : <div style={{position: 'absolute', inset: 0, opacity: reveal}}>
        <div style={{position: 'absolute', left: 70, top: 85, width: 420, height: 400, display: 'grid', placeItems: 'center'}}><ReferenceCar /></div>
        <div style={{position: 'absolute', left: 545, top: 105, height: 370, width: 4, background: '#29374722'}} />
        <div style={{position: 'absolute', left: 650, top: 120, fontSize: 156, lineHeight: 1.1, fontWeight: 900, color: c.gold}}>1993年</div>
        <div style={{position: 'absolute', left: 675, top: 325, padding: '12px 26px', background: '#293747', color: c.white,
          borderRadius: 14, fontSize: 43, fontWeight: 900}}>G21</div>
        <div style={{position: 'absolute', left: 675, top: 415, fontSize: 37, fontWeight: 800}}>21世紀にふさわしい車を考える</div>
        <div style={{position: 'absolute', left: 675, top: 474, fontSize: 31, color: '#526C78'}}>取り組みの出発点</div>
      </div>}
    </div>
    {!narration && <div style={{position: 'absolute', left: 1600, top: 385, width: 285, height: 430}}>
      <MarkerElder who="judd" animated width={285} height={430} motionScale={1} blinkPhase={83} />
    </div>}
    {cue && <div style={{position: 'absolute', bottom: 32, left: 95, right: 95, display: 'flex', justifyContent: 'center'}}>
      <div style={{background: '#26313FF7', color: c.white, borderRadius: 18, padding: '20px 32px 22px', display: 'flex', alignItems: 'center', gap: 24,
        maxWidth: 1720, boxShadow: '0 10px 28px #1D253040'}}>
        {cue.speaker !== 'ナレ2' && <span style={{background: '#335D87', color: c.white, borderRadius: 10, fontSize: 33, fontWeight: 800, padding: '4px 18px', flexShrink: 0, whiteSpace: 'nowrap'}}>{cue.speaker}</span>}
        <span style={{minWidth: 0, maxWidth: 1450, fontSize: 46, fontWeight: 800, lineHeight: 1.4, letterSpacing: '0.01em', textAlign: 'center', textWrap: 'balance'}}>{cue.text}</span>
      </div>
    </div>}
  </AbsoluteFill>;
};
