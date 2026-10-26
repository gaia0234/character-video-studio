import React from 'react';
import {AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import data from '../data/longform/toyota-v3-p1-05.json';
import {MarkerHomer} from '../elder/HomerMarkerPilot';
import {MarkerElder} from '../elder/ElderMarkerPilot';
import {Backdrop, MarkerFilters, useStudioFont} from './ToyotaV3VisualFrame';
import {ToyotaV3OpeningCar} from './ToyotaV3OpeningCar';

const c = {ink: '#293747', paper: '#FBFCFD', white: '#FFFCF5', gold: '#D9AB56', blue: '#437B9D'};
const colors: Record<string, string> = {ホーマー: '#AC382F', ジャッド: '#335D87', ケント: '#327453'};
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

// 受入済みシーン03の車体をそのまま使う。輪郭・寸法は作り直さない。
const ReferenceCar = () => <div style={{width: 520, height: 230}}><ToyotaV3OpeningCar /></div>;

export const ToyotaV3Opening05 = () => {
  useStudioFont();
  const frame = useCurrentFrame();
  const time = frame / 30;
  const line = data.lines.find((l) => time >= l.start && time < l.end)
    ?? [...data.lines].reverse().find((l) => time >= l.start) ?? data.lines[0];
  const cue = data.cues.find((q) => time >= q.start && time < q.end);
  const phase = line.phase;
  const focusText = phase === 'interest' ? '車の中で電気をまかなう'
    : phase === 'question' ? '実際の道で、何が変わる？'
    : phase === 'transition' ? '車の動きと一緒に見る' : null;
  // 発売カードと各phaseの一言は、実音のline.startを基点にゆっくり出す。絶対秒は置かない。
  const releaseIn = interpolate(time, [data.lines[0].start + 0.1, data.lines[0].start + 0.7], [0, 1], clamp);
  const focusIn = interpolate(time, [line.start + 0.2, line.start + 0.8], [0, 1], clamp);
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
      <div style={{position: 'absolute', inset: 0, opacity: releaseIn}}>
        <div style={{position: 'absolute', left: 54, top: 42, fontSize: 42, fontWeight: 900}}>考えを、使える車へ</div>
        <div style={{position: 'absolute', left: 100, top: 240}}><ReferenceCar /></div>
        <div style={{position: 'absolute', left: 700, top: 150, fontSize: 88, lineHeight: 1.1, fontWeight: 900, whiteSpace: 'nowrap'}}>1997年12月</div>
        <div style={{position: 'absolute', left: 704, top: 268, fontSize: 46, fontWeight: 800}}>初代プリウス 発売</div>
        <div style={{position: 'absolute', left: 54, bottom: 28, fontSize: 22, color: '#526574'}}>出典：トヨタ75年史「ハイブリッド車プリウスの開発」</div>
      </div>
      {focusText && <div style={{position: 'absolute', left: 704, top: 384, width: 700, fontSize: 48, fontWeight: 800,
        color: c.blue, opacity: focusIn}}>{focusText}</div>}
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
