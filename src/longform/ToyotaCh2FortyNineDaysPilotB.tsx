import React from 'react';
import {AbsoluteFill, Audio, Easing, Img, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {useStudioFont} from './ToyotaV3VisualFrame';

const c = {ink: '#293747', paper: '#FBFCFD', white: '#FFFCF5', gold: '#D9AB56', blue: '#437B9D', green: '#327453', muted: '#526574'};
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ease = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
const fade = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], clamp);

const asset = (name: string) => staticFile(`assets/pilots/toyota-ch2-49days-20261103/${name}`);
import {PriusCar3D} from './PriusCh2Car3D';

const sideCar = asset('test-car-side-prius.svg');
const topCar = asset('test-car-top-v3.svg');
const rearCar = asset('test-car-rear34.svg');

const CUES = [
  {start: 12, end: 111, lines: ['試作車を走らせるまでに、', '49日かかった。']},
  {start: 111, end: 270, lines: ['開発に携わった小木曽聡氏が、', '後の取材で語っている。']},
  {start: 270, end: 513, lines: ['ある日、一度に解決したのではない。部品や制御を直し、', '短い距離を走れるようになり、少しずつ改善した。']},
  {start: 513, end: 672, lines: ['それでも走りはぎこちなく、', '500メートルほど進むと、また止まった。']},
  {start: 672, end: 825, lines: ['商品には、', 'ほど遠かった。']},
];

const ChapterTag = () => (
  <div data-check-id="chapter-tag" style={{position: 'absolute', top: 36, left: 55,
    background: c.ink, color: c.white, borderRadius: 999, padding: '10px 22px',
    fontSize: 26, fontWeight: 800, whiteSpace: 'nowrap'}}>第2章　49日</div>
);

const SubtitleBand = ({lines}: {lines: string[]}) => (
  <div data-check-id="subtitle-band" style={{position: 'absolute', bottom: 32, left: 95, right: 95,
    display: 'flex', justifyContent: 'center'}}>
    <div style={{background: '#26313FF7', color: c.white, borderRadius: 18, padding: '18px 36px 20px',
      maxWidth: 1720, boxShadow: '0 10px 28px #1D253040'}}>
      <div data-check-id="subtitle-text" style={{textAlign: 'center'}}>
        {lines.map((line, i) => (
          <div key={i} style={{fontSize: 46, fontWeight: 800, lineHeight: 1.4, letterSpacing: '0.01em',
            whiteSpace: 'nowrap'}}>{line}</div>
        ))}
      </div>
    </div>
  </div>
);

const Atmosphere = ({frame, warm = false}: {frame: number; warm?: boolean}) => (
  <div style={{position: 'absolute', inset: -40, pointerEvents: 'none',
    background: warm
      ? 'radial-gradient(circle at 38% 38%, #F2DFAC55 0%, transparent 58%)'
      : 'radial-gradient(circle at 62% 34%, #CFE0EA35 0%, transparent 60%)',
    transform: `translate(${Math.sin(frame * 0.032) * 24}px, ${Math.cos(frame * 0.027) * 12}px)`,
    opacity: 0.75}} />
);

type SceneProps = {frame: number; opacity: number};

const NightHallScene = ({frame, opacity}: SceneProps) => {
  const push = ease(frame, 0, 111);
  const scale = 1 + 0.035 * push;
  const tx = -10 * push;
  const ty = 8 * push;
  const dark = 1 - fade(frame, 0, 20);
  const calendarIn = fade(frame, 10, 28);
  const dayProgress = interpolate(frame, [24, 70], [0, 1], {...clamp, easing: Easing.in(Easing.cubic)});
  const day = Math.min(49, Math.max(1, Math.round(1 + 48 * dayProgress)));
  const settle = frame >= 70 ? 1 + 0.018 * Math.sin((frame - 70) / 7) : 1;
  const flip = frame >= 24 && frame <= 70 ? Math.abs(Math.sin(((frame - 24) / 46) * Math.PI * 3)) : 0;
  return (
    <div data-check-id="s1-scene" style={{position: 'absolute', inset: 0, opacity, background: '#17202E',
      transform: `translate(${tx}px, ${ty}px) scale(${scale})`, transformOrigin: '50% 55%'}}>
      <Img data-check-id="s1-bg" src={asset('night-hall.svg')} style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}} />
      <Atmosphere frame={frame} />
      <div data-check-id="s1-light" style={{position: 'absolute', inset: 0,
        background: 'radial-gradient(circle at 63% 28%, #F2DFAC66 0%, transparent 46%)', opacity: 0.8}} />
      <div style={{position: 'absolute', left: 220, top: 562, width: 620, height: 272, borderRadius: '50%',
        background: 'radial-gradient(ellipse at 50% 56%, #D8E2E855 0%, #D8E2E811 60%, transparent 76%)',
        opacity: 0.9}} />
      <div style={{position: 'absolute', left: 258, top: 590, width: 544, height: 220,
        background: 'radial-gradient(ellipse at 50% 56%, #F2DFAC66 0%, transparent 70%)', opacity: 0.9}} />
      <div data-check-id="s1-car" style={{position: 'absolute', left: 260, top: 610, width: 520, height: 208}}>
        <div style={{position: 'absolute', left: 20, top: 180, width: 480, height: 34, borderRadius: '50%',
          background: '#000000', opacity: 0.2}} />
        <Img src={sideCar} style={{position: 'absolute', inset: 0, width: '100%', height: '100%',
          transform: 'scaleX(-1)'}} />
      </div>
      <div data-check-id="subject" style={{position: 'absolute', left: 1180, top: 170, width: 500, height: 625, opacity: calendarIn}}>
        <div data-check-id="s1-calendar" style={{position: 'absolute', inset: 0}}>
          <Img src={asset('calendar.svg')} style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}} />
          <div data-check-id="s1-day-number" style={{position: 'absolute', left: 0, right: 0, top: 190,
            textAlign: 'center', fontSize: 220, lineHeight: 1, fontWeight: 900, color: c.ink,
            transform: `scale(${settle})`, transformOrigin: '50% 55%'}}>{day}</div>
          <div style={{position: 'absolute', left: 80, top: 66, width: 340, height: 500, background: '#FFFCF5',
            border: '5px solid #6B5A45', borderRadius: 6, transformOrigin: 'top center',
            transform: `scaleY(${1 - 0.92 * flip})`, opacity: frame >= 24 && frame <= 70 ? 0.96 : 0,
            boxShadow: '0 12px 0 #29374722'}} />
        </div>
      </div>
      <div style={{position: 'absolute', inset: 0, background: '#0B0F16', opacity: dark}} />
    </div>
  );
};

const NotebookScene = ({frame, opacity}: SceneProps) => {
  const push = ease(frame, 111, 270);
  const scale = 1.02 + 0.035 * push;
  const tx = 10 * push;
  const ty = -4 * push;
  const labelIn = fade(frame, 117, 137);
  const shimmer = interpolate(frame, [117, 270], [-320, 980], clamp);
  return (
    <div data-check-id="s2-scene" style={{position: 'absolute', inset: 0, opacity, background: '#2A3142',
      transform: `translate(${tx}px, ${ty}px) scale(${scale})`, transformOrigin: '50% 55%'}}>
      <Img data-check-id="s2-bg" src={asset('interview-desk.svg')} style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}} />
      <Atmosphere frame={frame} warm />
      <div data-check-id="s2-label" style={{position: 'absolute', left: 470, top: 136, width: 980,
        textAlign: 'center', opacity: labelIn}}>
        <div style={{display: 'inline-block', background: c.paper, border: `4px solid ${c.ink}`,
          borderRadius: 14, padding: '12px 26px', fontSize: 38, fontWeight: 800, color: c.ink,
          boxShadow: '0 8px 0 #29374718'}}>開発担当・小木曽聡氏の証言</div>
        <div style={{width: 110, height: 4, background: c.gold, margin: '10px auto 0', borderRadius: 2}} />
      </div>
      <div data-check-id="subject" style={{position: 'absolute', left: 560, top: 240, width: 800, height: 560}}>
        <div data-check-id="s2-notebook" style={{position: 'absolute', inset: 0}}>
          <Img src={asset('notebook.svg')} style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}} />
          <div style={{position: 'absolute', left: 40, top: 40, width: 720, height: 480,
            background: `linear-gradient(110deg, transparent 38%, #D9AB5622 48%, transparent 60%)`,
            transform: `translateX(${shimmer}px)`, opacity: 0.9}} />
        </div>
      </div>
    </div>
  );
};

const TrackScene = ({frame, opacity}: SceneProps) => {
  const push = ease(frame, 270, 513);
  const scale = 1 + 0.04 * push;
  const tx = -20 * push;
  const ty = 8 * push;
  const carX = interpolate(frame, [276, 320, 340, 380, 400, 440, 460, 500], [90, 282, 282, 666, 666, 1242, 1242, 1242], clamp);
  const wobble = Math.sin(frame * 0.85) * 1.4;
  const w1 = fade(frame, 320, 338);
  const w2 = fade(frame, 382, 400);
  const w3 = fade(frame, 442, 460);
  return (
    <div data-check-id="s3-scene" style={{position: 'absolute', inset: 0, opacity, background: '#7A8A6A',
      transform: `translate(${tx}px, ${ty}px) scale(${scale})`, transformOrigin: '50% 55%'}}>
      <div data-check-id="s3-track" style={{position: 'absolute', left: 210, top: 100, width: 1500, height: 850}}>
        <Img src={asset('test-track.svg')} style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}} />
        <div data-check-id="s3-car" style={{position: 'absolute', left: carX - 120, top: 360 + wobble,
          width: 240, height: 400, transform: 'rotate(90deg)', transformOrigin: '50% 50%'}}>
          <Img src={topCar} style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}} />
        </div>
        <div data-check-id="s3-distance-mark-1" style={{position: 'absolute', left: 252, top: 382, width: 60, height: 8,
          borderRadius: 4, background: c.gold, opacity: w1}} />
        <div data-check-id="s3-distance-mark-2" style={{position: 'absolute', left: 636, top: 382, width: 60, height: 8,
          borderRadius: 4, background: c.gold, opacity: w2}} />
        <div data-check-id="s3-distance-mark-3" style={{position: 'absolute', left: 1212, top: 382, width: 60, height: 8,
          borderRadius: 4, background: c.gold, opacity: w3}} />
        <Img data-check-id="s3-wrench-1" src={asset('wrench.svg')} style={{position: 'absolute', left: 246, top: 399,
          width: 72, height: 72, opacity: w1}} />
        <Img data-check-id="s3-wrench-2" src={asset('wrench.svg')} style={{position: 'absolute', left: 630, top: 399,
          width: 72, height: 72, opacity: w2}} />
        <Img data-check-id="s3-wrench-3" src={asset('wrench.svg')} style={{position: 'absolute', left: 1206, top: 399,
          width: 72, height: 72, opacity: w3}} />
      </div>
      <Atmosphere frame={frame} warm />
      <div data-check-id="subject" style={{position: 'absolute', left: 300, top: 230, width: 1400, height: 560}} />
    </div>
  );
};

const RoadScene = ({frame, opacity}: SceneProps) => {
  const isS5 = frame >= 672;
  const pull = ease(frame, 672, 810);
  const s4push = ease(frame, 513, 672);
  const scale = isS5 ? 1.02 - 0.20 * pull : 1.02 + 0.02 * s4push;
  const ty = isS5 ? 18 * pull : 0;
  const carX = isS5 ? 580 - 180 * pull
    : interpolate(frame, [513, 545, 560, 590, 610, 630], [300, 360, 420, 580, 580, 580], clamp);
  const signX = isS5 ? 1420 + 180 * pull : 1420;
  const moving = frame < 630;
  const shake = moving ? Math.sin(frame * 0.8) * 2.5 : 0;
  const markerIn = fade(frame, 560, 590) * (1 - fade(frame, 672, 684));
  const smoke = fade(frame, 630, 660) * (1 - fade(frame, 700, 735));
  const rise = interpolate(frame, [630, 735], [0, 70], clamp);
  const signIn = fade(frame, 690, 730);
  return (
    <div data-check-id={isS5 ? 's5-scene' : 's4-scene'} style={{position: 'absolute', inset: 0, opacity, background: '#2E3A50'}}>
      <Img data-check-id="s4-bg" src={asset('test-road.svg')} style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}} />
      <Atmosphere frame={frame} />
      <div data-check-id="subject" style={{position: 'absolute', left: 260, top: isS5 ? 320 : 330,
        width: isS5 ? 1600 : 1400, height: isS5 ? 540 : 520,
        transform: `translateY(${ty}px) scale(${scale})`, transformOrigin: '50% 55%'}}>
        <div style={{position: 'absolute', left: carX - 320, top: 120, width: 900, height: 360, borderRadius: '50%',
          background: 'radial-gradient(ellipse at 50% 55%, #F2DFAC55 0%, #D8E2E822 55%, transparent 76%)',
          opacity: 0.6}} />
        <div data-check-id="s4-car" style={{position: 'absolute', left: carX - 260, top: 120 + shake, width: 780, height: 312,
          opacity: isS5 ? 1 : 1 - fade(frame, 660, 666)}}>
          <Img src={sideCar} style={{position: 'absolute', inset: 0, width: '100%', height: '100%',
          transform: 'scaleX(-1)'}} />
        </div>
        <div data-check-id="s4-marker-500m" style={{position: 'absolute', left: 1100, top: 20, width: 130, height: 170,
          opacity: markerIn}}>
          <div style={{position: 'absolute', left: 56, top: 56, width: 16, height: 114, background: '#2F3E55',
            border: `3px solid ${c.ink}`}} />
          <div style={{position: 'absolute', left: 0, top: 0, width: 130, height: 70, borderRadius: 8,
            background: c.gold, border: `4px solid ${c.ink}`, display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 38, fontWeight: 900, color: c.ink}}>500m</div>
        </div>
        <div data-check-id="s4-smoke" style={{position: 'absolute', left: carX - 240, top: 270,
          width: 200, height: 210, opacity: smoke}}>
          <div style={{position: 'absolute', left: 20, top: 80 - rise, width: 34, height: 34, borderRadius: 999,
            background: '#C9D6DE', border: `4px solid #7C93A2`}} />
          <div style={{position: 'absolute', left: 62, top: 46 - rise, width: 46, height: 46, borderRadius: 999,
            background: '#C9D6DE', border: `4px solid #7C93A2`}} />
          <div style={{position: 'absolute', left: 120, top: 88 - rise, width: 28, height: 28, borderRadius: 999,
            background: '#C9D6DE', border: `4px solid #7C93A2`}} />
        </div>
        <Img data-check-id="s5-sign" src={asset('dealership-sign.svg')} style={{position: 'absolute', left: signX - 260, top: 210,
          width: 240, height: 196, opacity: signIn}} />
      </div>
    </div>
  );
};

const S5DealershipScene = ({frame, opacity}: SceneProps) => {
  const entry = ease(frame, 660, 720);
  const tail = ease(frame, 720, 825);
  const scale = frame <= 720 ? 1 - 0.55 * entry : 0.45 - 0.05 * tail;
  const net = scale / 0.45;
  const tx = 345.6 * (1 - net);
  const ty = 777.6 * (1 - net);
  const light = frame >= 720 ? 0.72 + 0.16 * Math.sin((frame - 720) * 0.11) : 0.8;
  return (
    <div data-check-id="s5-scene" style={{position: 'absolute', inset: 0, opacity, overflow: 'hidden',
      background: 'linear-gradient(#2E3A50 0%, #33415A 30%, #3B4A5A 35%, #4F5E4A 42%, #4F5E4A 100%)'}}>
      <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080,
        transform: `translate(${tx}px, ${ty}px) scale(${scale})`, transformOrigin: '0 0'}}>
        <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080,
          transform: 'scale(2.2222222)', transformOrigin: '0 0'}}>
          <Img data-check-id="s5-bg" src={asset('test-road-perspective.svg')}
            style={{position: 'absolute', left: -260, top: -120, width: 2440, height: 1320}} />
          <div data-check-id="subject" style={{position: 'absolute', left: 60, top: 240, width: 1820, height: 610}}>
            <div data-check-id="s5-car" style={{position: 'absolute', left: 90.6, top: 449.5, width: 415.3, height: 188.9,
              opacity: fade(frame, 669, 676), background: 'transparent'}} />
            <div data-check-id="s5-building" style={{position: 'absolute', left: 1510.5, top: 28.2, width: 180, height: 160}}>
              <Img src={asset('dealership-building.svg')} style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}} />
              <div data-check-id="s5-window-glow" style={{position: 'absolute', left: 38, top: 60, width: 104, height: 60,
                background: '#F2D68C', opacity: light, filter: 'blur(10px)'}} />
            </div>
          </div>
        </div>
      </div>
      <PriusCar3D opacity={fade(frame, 669, 676)} />
    </div>
  );
};

const MorphPage = ({frame}: {frame: number}) => {
  if (frame < 105 || frame > 117) return null;
  const m = ease(frame, 105, 117);
  const left = interpolate(m, [0, 1], [1180, 560]);
  const top = interpolate(m, [0, 1], [170, 240]);
  const width = interpolate(m, [0, 1], [500, 800]);
  const height = interpolate(m, [0, 1], [625, 560]);
  const opacity = 1 - ease(m, 0.64, 1);
  return (
    <div data-check-id="s1-s2-morph-page" style={{position: 'absolute', left, top, width, height, opacity,
      background: '#FFFCF5', border: '6px solid #6B5A45', borderRadius: 8,
      boxShadow: '0 16px 30px #00000033', transform: `rotate(${-3 * (1 - m)}deg)`}}>
      <div style={{position: 'absolute', left: 0, right: 0, top: '35%', textAlign: 'center',
        fontSize: 150, fontWeight: 900, color: c.ink, opacity: 1 - m}}>49</div>
    </div>
  );
};

const PageTurn = ({frame}: {frame: number}) => {
  if (frame < 264 || frame > 276) return null;
  const t = ease(frame, 264, 276);
  return (
    <div data-check-id="s2-s3-page-turn" style={{position: 'absolute', left: 560, top: 240, width: 800, height: 560,
      background: '#FFFCF5', border: '6px solid #6B5A45', borderRadius: 8, transformOrigin: 'left center',
      transform: `perspective(1500px) rotateY(${-88 * t}deg)`, opacity: 1 - fade(t, 0.82, 1),
      backgroundImage: 'repeating-linear-gradient(to bottom, transparent 0 44px, #C8D3D9 44px 47px)',
      boxShadow: '18px 12px 34px #00000033'}}>
      <div style={{position: 'absolute', right: 24, top: 60, width: 42, height: 120, borderRadius: 6,
        background: '#D9AB56', opacity: 0.8}} />
    </div>
  );
};

const CameraTransition = ({frame}: {frame: number}) => {
  if (frame < 507 || frame > 519) return null;
  const t = ease(frame, 507, 519);
  return <div data-check-id="s3-s4-camera-transition" style={{position: 'absolute', inset: 0,
    background: 'linear-gradient(105deg, transparent 20%, #F2DFAC55 50%, transparent 80%)',
    opacity: Math.sin(Math.PI * t) * 0.55, pointerEvents: 'none'}} />;
};

export const ToyotaCh2FortyNineDaysPilotB = () => {
  useStudioFont();
  const frame = useCurrentFrame();
  const cue = CUES.find((q) => frame >= q.start && frame < q.end);
  const s1Opacity = frame < 118 ? 1 - ease(frame, 105, 117) : 0;
  const s2Opacity = frame >= 105 && frame < 277 ? Math.min(ease(frame, 105, 117), 1 - ease(frame, 264, 276)) : 0;
  const s3Opacity = frame >= 264 && frame < 520 ? Math.min(ease(frame, 264, 276), 1 - ease(frame, 507, 519)) : 0;
  const roadOpacity = frame >= 507 ? ease(frame, 507, 519) : 0;
  const s4Fade = 1 - ease(frame, 660, 672);
  const s5Fade = fade(frame, 660, 672);
  const s3Move = ease(frame, 507, 519);
  const roadMove = ease(frame, 507, 519);
  const cueIn = cue ? fade(frame, cue.start, cue.start + 4) : 0;
  return (
    <AbsoluteFill style={{background: '#17202E', color: c.ink, fontFamily: '"Studio Noto Sans JP", sans-serif'}}>
      <div data-check-id="screen-full" style={{position: 'absolute', inset: 0, pointerEvents: 'none'}} />
      <Sequence from={12}><Audio src={staticFile('audio/toyota-v19-chapter2-20261029/v19-ch2-09.wav')} /></Sequence>
      {frame < 118 && <NightHallScene frame={frame} opacity={s1Opacity} />}
      {frame >= 105 && frame < 277 && <NotebookScene frame={frame} opacity={s2Opacity} />}
      {frame >= 264 && frame < 520 && (
        <div style={{position: 'absolute', inset: 0, opacity: s3Opacity,
          transform: `translateX(${-170 * s3Move}px) scale(${1 + 0.05 * s3Move})`}}>
          <TrackScene frame={frame} opacity={1} />
        </div>
      )}
      {frame >= 507 && frame < 672 && (
        <div style={{position: 'absolute', inset: 0, opacity: roadOpacity * s4Fade,
          transform: `translateX(${170 * (1 - roadMove)}px) scale(${1.06 - 0.06 * roadMove})`}}>
          <RoadScene frame={frame} opacity={1} />
        </div>
      )}
      {frame >= 660 && <S5DealershipScene frame={frame} opacity={s5Fade} />}
      <MorphPage frame={frame} />
      <PageTurn frame={frame} />
      <CameraTransition frame={frame} />
      <ChapterTag />
      {cue && (
        <div style={{opacity: cueIn}}><SubtitleBand lines={cue.lines} /></div>
      )}
      <div style={{position: 'absolute', inset: 0, background: '#0B0F16', opacity: fade(frame, 808, 824),
        pointerEvents: 'none'}} />
    </AbsoluteFill>
  );
};
