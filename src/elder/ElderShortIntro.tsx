import React from 'react';
import {AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {useLocalFont} from '../components/useLocalFont';

type Accent = {key: string; name: string; role: string; line: string; file: string; color: string; ratio: number; exprFile?: string; exprAt?: number};

const CHARACTERS: Accent[] = [
  {
    key: 'homer',
    name: 'ホーマー',
    role: '称賛役',
    line: 'あの時代を、誇りをもって話したい',
    file: 'assets/characters/elder-svg/homer.svg',
    // 本人「ホーマーは表情が変、そもそも元から笑っているからね。笑わせる必要はない」→
    // 元画像の笑い顔を一貫して使用し、homer の表情差分は動画内で使わない
    color: '#C8322C',
    ratio: 627 / 1175,
  },
  {
    key: 'judd',
    name: 'ジャッド',
    role: '批判役',
    line: '大変だったことも、忘れない',
    file: 'assets/characters/elder-svg/judd.svg',
    exprFile: 'assets/characters/elder-svg/judd-sigh.svg',
    exprAt: 26,
    color: '#2B5FA8',
    ratio: 466 / 1125,
  },
  {
    key: 'kent',
    name: 'ケント',
    role: '検証役',
    line: '数字も記憶も、確かめてから',
    file: 'assets/characters/elder-svg/kent.svg',
    exprFile: 'assets/characters/elder-svg/kent-think.svg',
    exprAt: 26,
    color: '#2E7D4F',
    ratio: 541 / 1150,
  },
];

const PAPER = '#F6F1E4';
const INK = '#1B1B1B';

const enter = (frame: number, start: number, fps: number) => {
  const s = spring({frame: frame - start, fps, config: {damping: 200, mass: 0.9}});
  return s;
};

const Character: React.FC<{
  data: Accent;
  start: number;
  end: number;
  x: number;
  height: number;
  baseY: number;
  lean?: number;
  useExpr?: boolean;
}> = ({data, start, end, x, height, baseY, lean = 0, useExpr = false}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const progress = enter(frame, start, fps);
  const exit = interpolate(frame, [end, end + 14], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const opacity = Math.min(progress, exit);
  // 呼吸（上下の微動）と微細な揺れ。線画なので大きく動かさない。
  const breath = Math.sin((frame / fps) * 2.1 + x) * 5;
  const sway = Math.sin((frame / fps) * 0.85 + x * 0.01) * 6;
  const tilt = Math.sin((frame / fps) * 0.7 + x * 0.02) * 0.8 + lean;
  const slide = interpolate(progress, [0, 1], [260, 0]);
  return (
    <div
      style={{
        position: 'absolute',
        left: x - slide,
        top: baseY - height + breath,
        height,
        width: height * data.ratio,
        opacity,
        transform: `translateX(-50%) rotate(${tilt}deg) translateX(${sway}px)`,
        transformOrigin: 'bottom center',
      }}
    >
      <Img
        src={staticFile(useExpr && data.exprFile && frame >= start + (data.exprAt ?? 0) ? data.exprFile : data.file)}
        style={{height: '100%', width: '100%', objectFit: 'contain', display: 'block'}}
      />
    </div>
  );
};

const NamePlate: React.FC<{data: Accent; start: number; end: number; x: number; y: number}> = ({
  data,
  start,
  end,
  x,
  y,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const progress = enter(frame, start + 6, fps);
  const exit = interpolate(frame, [end, end + 14], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        opacity: Math.min(progress, exit),
        transform: `translateY(${(1 - progress) * 20}px)`,
        background: 'rgba(255,255,255,0.92)',
        border: `4px solid ${data.color}`,
        borderRadius: 14,
        padding: '14px 26px 18px',
        minWidth: 300,
        boxShadow: '0 6px 18px rgba(0,0,0,0.08)',
      }}
    >
      <div style={{fontSize: 52, fontWeight: 700, color: INK, letterSpacing: 2, lineHeight: 1.1}}>
        {data.name}
      </div>
      <div style={{fontSize: 26, color: data.color, fontWeight: 700, marginTop: 6, letterSpacing: 4}}>
        {data.role}
      </div>
    </div>
  );
};

const Caption: React.FC<{text: string; start: number; end: number}> = ({text, start, end}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [start, start + 8, end, end + 10], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  if (opacity <= 0) {
    return null;
  }
  return (
    <div
      style={{
        position: 'absolute',
        left: 80,
        right: 80,
        bottom: 120,
        textAlign: 'center',
        opacity,
      }}
    >
      <div
        style={{
          display: 'inline-block',
          background: 'rgba(255,255,255,0.94)',
          borderRadius: 16,
          padding: '20px 30px',
          fontSize: 40,
          fontWeight: 700,
          color: INK,
          lineHeight: 1.4,
          border: '2px solid rgba(27,27,27,0.15)',
        }}
      >
        {text}
      </div>
    </div>
  );
};

export const ElderShortIntro: React.FC = () => {
  useLocalFont();
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();

  const titleOpacity = interpolate(frame, [0, 12, 40, 56], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const closingOpacity = interpolate(
    frame,
    [durationInFrames - 200, durationInFrames - 182, durationInFrames - 14, durationInFrames],
    [0, 1, 1, 0],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );

  // 1体ずつ（各4秒）→ 3体集合（5.4秒）→ 締め
  const soloStart = [40, 160, 280];
  const soloEnd = [160, 280, 400];
  const soloX = [560, 470, 540];
  const soloHeight = [1180, 1080, 1150];
  const allStart = 380;

  return (
    <AbsoluteFill style={{background: PAPER, fontFamily: 'Studio Noto Sans JP, Noto Sans JP, sans-serif'}}>
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(circle at 50% 30%, rgba(255,255,255,0.85), rgba(255,255,255,0) 60%), repeating-linear-gradient(0deg, rgba(27,27,27,0.025) 0 2px, rgba(0,0,0,0) 2px 5px)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 34,
          border: '3px solid rgba(27,27,27,0.18)',
          borderRadius: 8,
        }}
      />

      {/* 冒頭のタイトル */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: titleOpacity,
        }}
      >
        <div style={{fontSize: 82, fontWeight: 800, letterSpacing: 8, color: INK}}>エルダーチャンネル</div>
        <div style={{display: 'flex', gap: 18, marginTop: 34}}>
          <div style={{width: 150, height: 10, background: '#C8322C', borderRadius: 5}} />
          <div style={{width: 150, height: 10, background: '#2B5FA8', borderRadius: 5}} />
          <div style={{width: 150, height: 10, background: '#2E7D4F', borderRadius: 5}} />
        </div>
        <div style={{fontSize: 34, color: '#4A4A4A', marginTop: 30, letterSpacing: 3}}>
          あの時代を、確かめて語り継ぐ
        </div>
      </div>

      {/* 1体ずつ紹介 */}
      {CHARACTERS.map((data, i) => (
        <React.Fragment key={data.key}>
          <Character
            data={data}
            start={soloStart[i]}
            end={soloEnd[i]}
            x={soloX[i]}
            height={soloHeight[i]}
            baseY={1560}
            lean={data.key === 'judd' ? 1.5 : 0}
            useExpr
          />
          <NamePlate data={data} start={soloStart[i]} end={soloEnd[i]} x={90} y={170} />
          <Caption text={data.line} start={soloStart[i] + 10} end={soloEnd[i]} />
        </React.Fragment>
      ))}

      {/* 3体集合 */}
      {CHARACTERS.map((data, i) => (
        <Character
          key={`all-${data.key}`}
          data={data}
          start={allStart + i * 8}
          end={durationInFrames}
          x={[230, 540, 845][i]}
          height={780}
          baseY={1560}
          lean={data.key === 'judd' ? 1.5 : 0}
        />
      ))}
      <div
        style={{
          position: 'absolute',
          top: 300,
          left: 0,
          right: 0,
          textAlign: 'center',
          opacity: closingOpacity,
        }}
      >
        <div style={{fontSize: 76, fontWeight: 800, letterSpacing: 6, color: INK}}>エルダーチャンネル</div>
        <div style={{fontSize: 34, color: '#4A4A4A', marginTop: 24, letterSpacing: 3}}>
          知って、確かめて、語り継ぐ
        </div>
        <div style={{display: 'flex', gap: 16, justifyContent: 'center', marginTop: 30}}>
          {['ホーマー', 'ジャッド', 'ケント'].map((name, i) => (
            <div
              key={name}
              style={{
                fontSize: 30,
                fontWeight: 700,
                color: '#FFFFFF',
                background: ['#C8322C', '#2B5FA8', '#2E7D4F'][i],
                padding: '10px 22px',
                borderRadius: 10,
                letterSpacing: 3,
              }}
            >
              {name}
            </div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};
