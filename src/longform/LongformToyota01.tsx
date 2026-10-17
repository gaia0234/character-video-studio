import {AbsoluteFill, Img, Series, staticFile, useCurrentFrame} from 'remotion';
import {cancelRender, continueRender, delayRender, interpolate} from 'remotion';
import {useEffect, useState, type CSSProperties} from 'react';
import {z} from 'zod';
import {colors, speakerColors} from '../design';
import toyota01Json from '../data/longform/toyota01.json';

// 横型16:9（1920x1080）・30fps・無音・字幕主体のロング解説試作。
// 台本正本: sources/script-longform-toyota-01.md
// 演出はuseCurrentFrame/interpolate等のframe計算のみ。乱数・Date・外部画像は使わない。

const accent = speakerColors['ミーノ'];
const stampRed = '#BE3F2F';
const FPS = 30;
const clampBoth = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ramp = (frame: number, start: number, end: number) => interpolate(frame, [start, end], [0, 1], clampBoth);

// --- 台本データ（Scene schema） ---
const sceneSchema = z.object({
  id: z.string().regex(/^[01]-\d{1,2}$/),
  chapter: z.string().min(1),
  year: z.string().min(4).max(4).nullable().optional(),
  visual: z.string().min(1),
  seconds: z.number().int().min(1).max(30),
  subtitle: z.string().min(1),
  character: z.enum(['luno', 'miino', 'kano']).nullable().optional(),
  desaturated: z.boolean().nullable().optional(),
  recolor: z.boolean().nullable().optional(),
  tags: z.array(z.string().min(1).max(12)).nullable().optional(),
  stamps: z.array(z.string().min(1).max(12)).nullable().optional(),
  stamp: z.string().min(1).max(16).nullable().optional(),
  parts: z.array(z.string().min(1).max(12)).nullable().optional(),
  patentCount: z.number().int().min(0).max(1000000).nullable().optional(),
  patentCards: z.number().int().min(0).max(30).nullable().optional(),
  count: z.number().int().min(0).max(100000).nullable().optional(),
});
const longformSchema = z.object({
  title: z.string().min(1),
  note: z.string().optional(),
  scenes: z.array(sceneSchema).min(1).max(20),
});
type ToyotaScene = Readonly<z.infer<typeof sceneSchema>>;
const parsed = longformSchema.parse(toyota01Json);
export const toyota01Scenes = parsed.scenes;
export const toyota01DurationFrames = toyota01Scenes.reduce((sum, s) => sum + s.seconds, 0) * FPS;

const cutoutFiles = {
  luno: 'assets/characters/test-cutouts/luno-front-v1.png',
  miino: 'assets/characters/test-cutouts/miino-front-v1.png',
  kano: 'assets/characters/test-cutouts/kano-front-v1.png',
} as const;

// --- 共通部品 ---
let fontReady: Promise<FontFace> | undefined;
const useStudioFont = () => {
  const [handle] = useState(() => delayRender('Load local Noto Sans JP'));
  useEffect(() => {
    fontReady ??= new FontFace('Studio Noto Sans JP',
      `url("${staticFile('assets/fonts/NotoSansJP.ttf')}")`, {weight: '100 900'}).load()
      .then((font) => {document.fonts.add(font); return font;});
    fontReady.then(() => continueRender(handle)).catch(cancelRender);
    return () => continueRender(handle);
  }, [handle]);
};

const ChapterBadge = ({scene}: {scene: ToyotaScene}) => <div style={{position: 'absolute', top: 44, left: 60,
  background: colors.white, border: `2px solid ${colors.line}`, borderRadius: 999, padding: '12px 30px',
  fontSize: 30, letterSpacing: 1, color: colors.ink}}>{scene.chapter}</div>;

const YearBadge = ({year}: {year: string | null | undefined}) => !year ? null : <div
  style={{position: 'absolute', top: 44, right: 60, background: colors.ink, color: colors.white,
    borderRadius: 999, padding: '12px 30px', fontSize: 30, letterSpacing: 1}}>{year}年</div>;

const SubtitleBox = ({subtitle}: {subtitle: string}) => {
  const frame = useCurrentFrame();
  return <div style={{position: 'absolute', left: 110, right: 110, bottom: 64,
    display: 'flex', justifyContent: 'center', opacity: ramp(frame, 0, 10), pointerEvents: 'none'}}>
    <div style={{background: 'rgba(255,255,255,0.95)', border: `3px solid ${colors.line}`, borderRadius: 20,
      padding: '24px 52px', fontSize: 44, lineHeight: 1.4, whiteSpace: 'pre-line', textAlign: 'center',
      maxWidth: 1560}}>{subtitle}</div>
  </div>;
};

const Cutout = ({character, style}: {character: 'luno' | 'miino' | 'kano'; style: CSSProperties}) =>
  <Img src={staticFile(cutoutFiles[character])} style={style} />;

const Stamp = ({label, frame, appear, x = 0, y = 0, rotate = -12, fontSize = 54}: {
  label: string; frame: number; appear: number; x?: number; y?: number; rotate?: number; fontSize?: number;
}) => {
  const t = ramp(frame, appear, appear + 14);
  if (t <= 0) return null;
  const scale = interpolate(t, [0, 1], [1.7, 1]);
  return <div style={{position: 'absolute', left: '50%', top: '50%', transform:
    `translate(-50%,-50%) translate(${x}px, ${y}px) rotate(${rotate + (1 - t) * 14}deg) scale(${scale})`,
    opacity: t}}>
    <div style={{border: `7px double ${stampRed}`, color: stampRed, borderRadius: 16,
      padding: '14px 34px', fontSize, fontWeight: 700, letterSpacing: 6,
      background: 'rgba(255,249,239,0.72)'}}>{label}</div>
  </div>;
};

// --- 図形（コード描画） ---
const Car = ({scale = 1, dashed = false}: {scale?: number; dashed?: boolean}) =>
  <svg width={520 * scale} height={200 * scale} viewBox="0 0 520 200">
    {/* セダンシルエット（右向き）: 車体 + キャビン + 2輪 */}
    <path d="M40 150 L55 106 Q140 92 200 88 L232 62 Q320 52 372 88 L436 100 Q478 110 474 150 Z"
      fill={dashed ? 'none' : colors.white} stroke={colors.ink} strokeWidth={4}
      strokeDasharray={dashed ? '12 12' : undefined} strokeLinejoin="round" />
    {!dashed ? <>
      <path d="M225 66 L250 68 L250 92 L212 92 Z" fill={colors.paleBlue} stroke={colors.ink} strokeWidth={3} />
      <path d="M258 68 L320 66 L340 92 L258 92 Z" fill={colors.paleBlue} stroke={colors.ink} strokeWidth={3} />
    </> : null}
    <circle cx="130" cy="152" r="26" fill={dashed ? 'none' : colors.paper}
      stroke={colors.ink} strokeWidth={4} />
    <circle cx="392" cy="152" r="26" fill={dashed ? 'none' : colors.paper}
      stroke={colors.ink} strokeWidth={4} />
  </svg>;

const ConferenceHall = ({scale = 1, withFlags = false}: {scale?: number; withFlags?: boolean}) =>
  <svg width={420 * scale} height={310 * scale} viewBox="0 0 420 310">
    {/* フラグ（控えめ） */}
    {withFlags ? Array.from({length: 8}, (_, i) => <g key={i}>
      <rect x={44 + i * 42} y={26} width={3} height={22} fill={colors.ink} />
      <rect x={47 + i * 42} y={26} width={22} height={14} fill={i % 2 ? colors.paleBlue : colors.muted} />
    </g>) : null}
    {/* 屋根 */}
    <rect x={16} y={56} width={388} height={18} fill={colors.ink} />
    {/* 主体 */}
    <rect x={36} y={74} width={348} height={206} fill={colors.paleBlue} stroke={colors.ink} strokeWidth={4} />
    {/* 柱 */}
    {Array.from({length: 5}, (_, i) => <rect key={i} x={62 + i * 64} y={74} width={22} height={206}
      fill={colors.white} stroke={colors.ink} strokeWidth={3} />)}
    {/* 玄関 */}
    <rect x={182} y={210} width={56} height={70} fill={colors.ink} />
    {/* 基壇 */}
    <rect x={10} y={280} width={400} height={22} fill={colors.muted} />
  </svg>;

const Factory = ({scale = 1}: {scale?: number}) =>
  <svg width={420 * scale} height={310 * scale} viewBox="0 0 420 310">
    {/* 煙突 */}
    <rect x={306} y={30} width={26} height={60} fill={colors.muted} />
    <rect x={344} y={44} width={26} height={46} fill={colors.muted} />
    {/* のこぎり屋根 */}
    <path d="M20 140 L20 196 L120 196 L120 158 L200 158 L200 196 L300 196 L300 158 L380 158 L380 196 L400 196 L400 140 L300 118 L200 118 L120 118 Z"
      fill={colors.ink} />
    {/* 工場の壁 */}
    <rect x={20} y={192} width={380} height={88} fill={colors.paleBlue} stroke={colors.ink} strokeWidth={4} />
    {Array.from({length: 6}, (_, i) => <rect key={i} x={44 + i * 58} y={216} width={34} height={40}
      fill={colors.white} stroke={colors.ink} strokeWidth={3} />)}
  </svg>;

const Timeline = ({progress, dashed = false}: {progress: number; dashed?: boolean}) =>
  <svg width={960} height={150} viewBox="0 0 960 150">
    <line x1="40" y1="100" x2="920" y2="100" stroke={colors.line} strokeWidth={10}
      strokeDasharray={dashed ? '18 14' : undefined} strokeLinecap="round" />
    <line x1="40" y1="100" x2={40 + 880 * progress} y2="100" stroke={colors.gold} strokeWidth={10}
      strokeLinecap="round" />
    <circle cx="40" cy="100" r="16" fill={colors.white} stroke={colors.ink} strokeWidth={5} />
    <circle cx="920" cy="100" r={16} fill={progress >= 0.99 ? colors.gold : colors.white}
      stroke={colors.ink} strokeWidth={5} />
    <text x="40" y="52" fontSize="40" fontWeight="700" fill={colors.ink} textAnchor="middle">1997</text>
    <text x="920" y="52" fontSize="40" fontWeight="700" fill={colors.ink} textAnchor="middle">2026</text>
  </svg>;

const PatentCardBox = ({w = 380, h = 150, top = '燃料電池特許', bottom = '無償開放', fontSize = 36}: {
  w?: number; h?: number; top?: string; bottom?: string; fontSize?: number;
}) => <div style={{width: w, height: h, background: colors.white, border: `3px solid ${colors.ink}`,
  borderRadius: 12, display: 'flex', flexDirection: 'column', alignItems: 'center',
  justifyContent: 'center', gap: 8, boxShadow: '8px 8px 0 rgba(18,43,85,0.12)'}}>
  <div style={{fontSize, fontWeight: 700}}>{top}</div>
  <div style={{fontSize: fontSize - 10, color: stampRed, fontWeight: 700}}>{bottom}</div>
</div>;

// --- 各シーンの視覚 ---
const AnswerTitle = () => {
  const frame = useCurrentFrame();
  return <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
    <div style={{position: 'absolute', top: 190, fontSize: 96, fontWeight: 700, letterSpacing: 8,
      opacity: ramp(frame, 5, 22)}}>二つの答え</div>
    <div style={{position: 'absolute', left: 190, top: 440, opacity: ramp(frame, 8, 24)}}>
      <ConferenceHall scale={0.9} />
    </div>
    <div style={{position: 'absolute', right: 190, top: 440, opacity: ramp(frame, 14, 30)}}>
      <Factory scale={0.9} />
    </div>
  </AbsoluteFill>;
};

const ConferenceScene = () => <AbsoluteFill style={{alignItems: 'center'}}>
  <div style={{marginTop: 90}}><ConferenceHall scale={1.45} withFlags /></div>
</AbsoluteFill>;

const CarReveal = ({scene}: {scene: ToyotaScene}) => <AbsoluteFill style={{justifyContent: 'center'}}>
  <div style={{display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: 70}}>
    <div style={{transform: 'translateY(-60px)'}}><Car scale={1.5} /></div>
    {scene.character ? <Cutout character={scene.character}
      style={{height: 300, transform: 'translateY(-120px)'}} /> : null}
  </div>
</AbsoluteFill>;

const SkepticTags = ({scene}: {scene: ToyotaScene}) => {
  const frame = useCurrentFrame();
  const tags = scene.tags ?? [];
  const lefts = [420, 960, 700];
  return <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
    <div style={{position: 'absolute', top: 560}}><Car scale={1.0} dashed /></div>
    {tags.map((tag, i) => <div key={tag} style={{position: 'absolute', top: 300 + i * 160,
      left: lefts[i % 3], background: colors.white, border: `2px solid ${colors.muted}`, borderRadius: 999,
      padding: '16px 40px', fontSize: 40, color: colors.ink,
      transform: `rotate(${i % 2 ? 3 : -3}deg) translateY(${Math.sin((frame + i * 9) / 14) * 8}px)`,
      opacity: ramp(frame, 6 + i * 14, 20 + i * 14), whiteSpace: 'nowrap'}}>{tag}？</div>)}
    {Array.from({length: 3}, (_, i) => <div key={i} style={{position: 'absolute',
      left: 1240 + i * 90, top: 250 + i * 54, width: 64, height: 64, borderRadius: '50%',
      border: `2px solid ${colors.muted}`, color: colors.muted, fontSize: 36, fontWeight: 700,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      opacity: ramp(frame, 18 + i * 12, 30 + i * 12)}}>？</div>)}
  </AbsoluteFill>;
};

const EvArrow = () => {
  const frame = useCurrentFrame();
  const p = ramp(frame, 8, 42);
  return <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
    <div style={{position: 'absolute', top: 400, left: 240, display: 'flex', alignItems: 'center', gap: 40}}>
      <div style={{fontSize: 40, color: colors.muted, textDecoration: 'line-through'}}>ハイブリッド</div>
      <svg width={960} height={120} viewBox="0 0 960 120">
        <line x1="20" y1="64" x2={20 + 860 * p} y2="64" stroke={colors.ink} strokeWidth={10}
          strokeLinecap="round" />
        <polygon points="900,32 964,64 900,96" fill={colors.ink} opacity={p > 0.9 ? 1 : 0} />
      </svg>
      <div style={{fontSize: 72, fontWeight: 700, opacity: ramp(frame, 40, 56), whiteSpace: 'nowrap'}}>EV</div>
    </div>
  </AbsoluteFill>;
};

const Reborn = () => {
  const frame = useCurrentFrame();
  return <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
    <div style={{position: 'absolute', top: 240, background: accent, color: colors.white,
      borderRadius: 999, padding: '14px 40px', fontSize: 38, fontWeight: 700,
      transform: 'rotate(-5deg)', opacity: ramp(frame, 6, 20)}}>第6世代</div>
    <div style={{fontSize: 132, fontWeight: 700, letterSpacing: 10,
      opacity: ramp(frame, 14, 32)}}>2026</div>
  </AbsoluteFill>;
};

const TimelinePreview = ({scene}: {scene: ToyotaScene}) => {
  const frame = useCurrentFrame();
  return <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
    <div style={{position: 'absolute', top: 380}}>
      <Timeline progress={ramp(frame, 6, 48)} dashed />
    </div>
    {scene.character ? <Cutout character={scene.character}
      style={{position: 'absolute', right: 250, bottom: 270, height: 260}} /> : null}
  </AbsoluteFill>;
};

const ChapterCard = () => {
  const frame = useCurrentFrame();
  const t = ramp(frame, 2, 16);
  return <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
    <div style={{background: colors.white, border: `4px solid ${colors.ink}`, borderRadius: 24,
      padding: '60px 120px', textAlign: 'center', opacity: t,
      transform: `scale(${interpolate(t, [0, 1], [0.92, 1])})`}}>
      <div style={{fontSize: 40, color: colors.muted, letterSpacing: 8}}>第1章</div>
      <div style={{fontSize: 76, fontWeight: 700, letterSpacing: 4, marginTop: 16}}>1997年、二つの答え</div>
    </div>
  </AbsoluteFill>;
};

const AdoptStamp = ({scene}: {scene: ToyotaScene}) => {
  const frame = useCurrentFrame();
  return <AbsoluteFill style={{alignItems: 'center'}}>
    <div style={{marginTop: 100, opacity: ramp(frame, 0, 10)}}><ConferenceHall scale={1.3} /></div>
    <Stamp label={scene.stamp ?? ''} frame={frame} appear={22} x={30} y={-60} rotate={-14} />
  </AbsoluteFill>;
};

const GlobeCO2 = () => {
  const frame = useCurrentFrame();
  const arrowLen = interpolate(frame, [14, 46], [0, 210], clampBoth);
  return <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
    <svg width={360} height={360} viewBox="0 0 360 360">
      <circle cx="180" cy="180" r="150" fill={colors.paleBlue} stroke={colors.ink} strokeWidth={5} />
      <ellipse cx="180" cy="180" rx="150" ry="60" fill="none" stroke={colors.muted} strokeWidth={2} />
      <ellipse cx="180" cy="180" rx="60" ry="150" fill="none" stroke={colors.muted} strokeWidth={2} />
      <line x1="180" y1="70" x2="180" y2={80 + arrowLen} stroke={stampRed} strokeWidth={10}
        strokeLinecap="round" />
      <polygon points="158,292 180,338 202,292" fill={stampRed} opacity={ramp(frame, 40, 52)} />
    </svg>
    <div style={{position: 'absolute', left: 1250, top: 420, fontSize: 56, fontWeight: 700,
      opacity: ramp(frame, 20, 36)}}>CO2 ↓</div>
  </AbsoluteFill>;
};

const PartsLabels = ({scene}: {scene: ToyotaScene}) => {
  const frame = useCurrentFrame();
  const parts = scene.parts ?? [];
  const pos = [{left: 400, top: 340}, {left: 800, top: 300}, {left: 1220, top: 340}];
  return <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
    <div style={{position: 'absolute', top: 500}}><Car scale={1.5} dashed /></div>
    {parts.map((p, i) => <div key={p} style={{position: 'absolute', left: pos[i % pos.length].left,
      top: pos[i % pos.length].top, background: colors.white, border: `3px solid ${colors.ink}`,
      borderRadius: 14, padding: '16px 40px', fontSize: 42, fontWeight: 700,
      transform: `translateY(${Math.sin((frame + i * 10) / 12) * 7}px)`,
      opacity: ramp(frame, 8 + i * 10, 20 + i * 10), whiteSpace: 'nowrap'}}>{p}</div>)}
  </AbsoluteFill>;
};

const WorldFirstStamps = ({scene}: {scene: ToyotaScene}) => {
  const frame = useCurrentFrame();
  const stamps = scene.stamps ?? [];
  return <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
    <div style={{transform: 'translateY(-40px)'}}><Car scale={1.6} /></div>
    {stamps.map((s, i) => <Stamp key={s} label={s} frame={frame} appear={22 + i * 20}
      x={i % 2 ? 240 : -260} y={i % 2 ? -140 : 110} rotate={i % 2 ? -14 : 10} />)}
  </AbsoluteFill>;
};

const PatentFly2015 = ({scene}: {scene: ToyotaScene}) => {
  const frame = useCurrentFrame();
  const fly = ramp(frame, 5, 30);
  const x = interpolate(fly, [0, 1], [-1150, 0]);
  const n = Math.round(interpolate(ramp(frame, 32, 64), [0, 1], [0, scene.patentCount ?? 0]));
  return <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
    <div style={{transform: `translateX(${x}px) rotate(${interpolate(fly, [0, 1], [-12, 0])}deg)`}}>
      <PatentCardBox />
    </div>
    <div style={{position: 'absolute', bottom: 280, fontSize: 100, fontWeight: 700,
      whiteSpace: 'nowrap', opacity: frame >= 32 ? 1 : 0}}>
      {n.toLocaleString('en-US')}件</div>
  </AbsoluteFill>;
};

const PatentSwarm2019 = ({scene}: {scene: ToyotaScene}) => {
  const frame = useCurrentFrame();
  const cards = Array.from({length: scene.patentCards ?? 12}, (_, i) => i);
  const display = (scene.patentCount ?? 0).toLocaleString('en-US');
  return <AbsoluteFill>
    {cards.map((i) => {
      const speed = 9 + (i % 4) * 2.5;
      const x = 2160 - ((frame * speed + i * 260) % 2500);
      const y = 130 + (i % 6) * 128;
      // 「23,740件」ディスプレイ(x約1265..1780, y約360..540)の帯では文字を読めなくさせない:
      // y帯が重なる列だけ、帯の手前でフェードアウト→抜けた後フェードイン(frame決定論)。
      const nearDisplay = y + 70 > 350 && y < 560;
      const fade = Math.min(
        interpolate(x, [1700, 1800], [0, 1], clampBoth),
        interpolate(x, [950, 1070], [1, 0], clampBoth));
      return <div key={i} style={{position: 'absolute', left: x, top: y, width: 250, height: 70,
        background: colors.white, border: `2px solid ${colors.ink}`, borderRadius: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700,
        opacity: ramp(frame, i * 1.5, i * 1.5 + 8) * (nearDisplay ? fade : 1), whiteSpace: 'nowrap'}}>
        {i % 3 === 0 ? '燃料電池' : '電動化特許'}
      </div>;
    })}
    <div style={{position: 'absolute', right: 170, top: 360, background: colors.white,
      border: `4px solid ${colors.ink}`, borderRadius: 16, padding: '30px 52px', fontSize: 88,
      fontWeight: 700, boxShadow: '10px 10px 0 rgba(18,43,85,0.10)', whiteSpace: 'nowrap'}}>
      {display}件</div>
  </AbsoluteFill>;
};

const FreeStamp = ({scene}: {scene: ToyotaScene}) => {
  const frame = useCurrentFrame();
  return <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
    {scene.character ? <Cutout character={scene.character}
      style={{position: 'absolute', left: 420, bottom: 250, height: 320}} /> : null}
    <Stamp label={scene.stamp ?? ''} frame={frame} appear={20} x={280} y={-40} rotate={-10} fontSize={74} />
  </AbsoluteFill>;
};

const Count15m = ({scene}: {scene: ToyotaScene}) => {
  const frame = useCurrentFrame();
  const n = Math.round(interpolate(ramp(frame, 10, 62), [0, 1], [0, scene.count ?? 0]));
  return <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
    <div style={{position: 'absolute', top: 320, fontSize: 42, color: colors.muted}}>ハイブリッド世界累計</div>
    <div style={{fontSize: 150, fontWeight: 700, whiteSpace: 'nowrap',
      opacity: ramp(frame, 6, 18)}}>
      {n.toLocaleString('en-US')}万台</div>
    <div style={{position: 'absolute', top: 660, width: 560, height: 10, background: colors.gold,
      transformOrigin: 'left', transform: `scaleX(${ramp(frame, 10, 62)})`, borderRadius: 5}} />
  </AbsoluteFill>;
};

const TimelineEnd = ({scene}: {scene: ToyotaScene}) => {
  const frame = useCurrentFrame();
  return <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
    <div style={{position: 'absolute', top: 380}}>
      <Timeline progress={ramp(frame, 4, 40)} />
    </div>
    <div style={{position: 'absolute', right: 40, bottom: 320, fontSize: 60, fontWeight: 700,
      color: colors.muted, letterSpacing: 6, opacity: ramp(frame, 30, 46)}}>つづく</div>
    {scene.character ? <Cutout character={scene.character}
      style={{position: 'absolute', right: 250, bottom: 270, height: 270}} /> : null}
  </AbsoluteFill>;
};

const Visual = ({scene}: {scene: ToyotaScene}) => {
  switch (scene.visual) {
    case 'answerTitle': return <AnswerTitle />;
    case 'conference': return <ConferenceScene />;
    case 'carReveal': return <CarReveal scene={scene} />;
    case 'skepticTags': return <SkepticTags scene={scene} />;
    case 'evArrow': return <EvArrow />;
    case 'reborn': return <Reborn />;
    case 'timelinePreview': return <TimelinePreview scene={scene} />;
    case 'chapterCard': return <ChapterCard />;
    case 'adoptStamp': return <AdoptStamp scene={scene} />;
    case 'globeCO2': return <GlobeCO2 />;
    case 'partsLabels': return <PartsLabels scene={scene} />;
    case 'worldFirstStamps': return <WorldFirstStamps scene={scene} />;
    case 'patentFly2015': return <PatentFly2015 scene={scene} />;
    case 'patentSwarm2019': return <PatentSwarm2019 scene={scene} />;
    case 'freeStamp': return <FreeStamp scene={scene} />;
    case 'count15m': return <Count15m scene={scene} />;
    case 'timelineEnd': return <TimelineEnd scene={scene} />;
    default: return null;
  }
};

const ToyotaScene = ({scene}: {scene: ToyotaScene}) => {
  const frame = useCurrentFrame();
  // 脱色/再着色: 0-4・0-5は常時脱色、0-6は冒頭1.5秒で再着色。
  const gray = scene.desaturated ? 1 : scene.recolor
    ? interpolate(frame, [0, 45], [0.9, 0], clampBoth) : 0;
  return <AbsoluteFill style={{color: colors.ink, fontFamily: '"Studio Noto Sans JP", sans-serif',
    filter: gray > 0.01 ? `grayscale(${gray.toFixed(3)})` : undefined}}>
    <Visual scene={scene} />
    <ChapterBadge scene={scene} />
    {scene.year ? <YearBadge year={scene.year} /> : null}
    <SubtitleBox subtitle={scene.subtitle} />
  </AbsoluteFill>;
};

export const LongformToyota01 = () => {
  useStudioFont();
  return <AbsoluteFill style={{background: colors.paper}}>
    <Series>
      {toyota01Scenes.map((scene) => <Series.Sequence key={scene.id}
        durationInFrames={scene.seconds * FPS}>
        <ToyotaScene scene={scene} />
      </Series.Sequence>)}
    </Series>
  </AbsoluteFill>;
};
