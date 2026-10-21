import {AbsoluteFill, Audio, Img, Series, staticFile, useCurrentFrame, cancelRender, continueRender, delayRender, interpolate, Sequence} from 'remotion';
import {useEffect, useState, type CSSProperties, type ReactNode} from 'react';
import {z} from 'zod';
import toyota01Json from '../data/longform/toyota01-v10.json';

// 初稿V10（全章60scene・音声付き）。V9の部品を受け継ぎ、字幕はcue（話者交代で切替）へ変更する。
const FPS = 30;
const c = {ink: '#293747', paper: '#F5F0E5', white: '#FFFCF5', blue: '#437B9D', light: '#D4E7EB',
  gold: '#D9AB56', red: '#AC5144', muted: '#687885', green: '#72998C', line: '#AAB8B6'};
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ramp = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], clamp);

const iconKind = z.enum(['engine', 'motor', 'battery', 'wheel', 'split', 'people', 'car', 'factory', 'plant', 'job', 'tech']);
const nodeSchema = z.object({label: z.string().min(1).max(12), t: z.string().max(10).optional(),
  x: z.number().min(0).max(1600), y: z.number().min(0).max(500), icon: iconKind});
const sceneSchema = z.object({
  id: z.string().regex(/^[0-7]-\d{1,2}$/),
  chapter: z.string().min(1),
  chapterNo: z.number().int().min(0).max(7),
  year: z.string().max(4).nullable().optional(),
  visual: z.string().min(1),
  seconds: z.number().min(1).max(60),
  plannedSeconds: z.number().min(1).max(60),
  frames: z.number().int().min(15).max(1800),
  character: z.enum(['luno', 'miino', 'kano']).nullable().optional(),
  guide: z.enum(['luno', 'miino', 'kano']).nullable().optional(),
  audio: z.object({src: z.string().min(1), seconds: z.number().min(0.1)}).nullable().optional(),
  cues: z.array(z.object({start: z.number().min(0), end: z.number().min(0),
    speaker: z.enum(['ナレ2', 'ミーノ', 'カーノ', 'ルーノ']), text: z.string().min(1).max(70)})).max(60).optional(),
  headline: z.string().max(20).optional(),
  sub: z.string().max(34).optional(),
  stamp: z.string().max(20).optional(),
  stamps: z.array(z.string().min(1).max(12)).max(4).optional(),
  title: z.string().max(14).optional(),
  cardNo: z.string().max(4).optional(),
  cardText: z.string().max(30).optional(),
  cards: z.array(z.object({title: z.string().min(1).max(14), body: z.string().min(1).max(30),
    tone: z.enum(['blue', 'gold', 'red', 'green']).optional()})).max(4).optional(),
  flow: z.object({nodes: z.array(nodeSchema).min(2).max(5),
    edges: z.array(z.object({from: z.number().int().min(0), to: z.number().int().min(0),
      label: z.string().max(12).optional()})).max(6).optional(),
    note: z.string().max(30).optional()}).optional(),
  bars: z.object({items: z.array(z.object({label: z.string().min(1).max(9), value: z.string().min(1).max(10),
    ratio: z.number().min(0).max(1)})).min(1).max(5), note: z.string().max(24).optional()}).optional(),
  stops: z.array(z.object({t: z.string().max(8), d: z.string().max(12)})).max(6).optional(),
  pins: z.array(z.object({t: z.string().max(8), d: z.string().max(8)})).max(3).optional(),
  arrow: z.boolean().optional(),
  back: z.boolean().optional(),
  finale: z.boolean().optional(),
  patentCount: z.number().int().min(0).max(100000).optional(),
});
const parsed = z.object({
  title: z.string().min(1),
  note: z.string().optional(),
  narrator: z.object({id: z.literal('narrator'), label: z.string().min(1), credit: z.string().min(1)}).optional(),
  audioSpec: z.object({fps: z.literal(30), startSeconds: z.number(), tailSeconds: z.number()}).optional(),
  credits: z.object({narration: z.string(), dialogue: z.string()}).optional(),
  durationFrames: z.number().int().min(1).optional(),
  scenes: z.array(sceneSchema).min(1).max(60),
}).parse(toyota01Json);
type ToyotaScene = Readonly<z.infer<typeof sceneSchema>>;
export const toyota01V10Scenes = parsed.scenes;
const sceneFrames = (s: ToyotaScene) => Math.round(s.seconds * FPS);
export const toyota01V10DurationFrames = toyota01V10Scenes.reduce((sum, s) => sum + sceneFrames(s), 0);

let fontReady: Promise<FontFace> | undefined;
const useStudioFont = () => {
  const [handle] = useState(() => delayRender('Load local Noto Sans JP'));
  useEffect(() => {
    fontReady ??= new FontFace('Studio Noto Sans JP', `url("${staticFile('assets/fonts/NotoSansJP.ttf')}")`,
      {weight: '100 900'}).load().then((font) => {document.fonts.add(font); return font;});
    fontReady.then(() => continueRender(handle)).catch(cancelRender);
    return () => continueRender(handle);
  }, [handle]);
};

const Shadow = ({x, y, w, h = 26}: {x: number; y: number; w: number; h?: number}) =>
  <ellipse cx={x} cy={y} rx={w / 2} ry={h / 2} fill={c.ink} opacity={0.16} />;
const Panel = ({children, style}: {children: ReactNode; style?: CSSProperties}) =>
  <div style={{position: 'absolute', background: c.white, border: `4px solid ${c.ink}`, borderRadius: 24,
    boxShadow: '0 12px 0 #29374718', ...style}}>{children}</div>;
const Label = ({children, style}: {children: ReactNode; style?: CSSProperties}) =>
  <div style={{background: c.ink, color: c.white, padding: '12px 28px', borderRadius: 14,
    fontSize: 34, fontWeight: 800, textAlign: 'center', ...style}}>{children}</div>;
const toneColor = (tone?: 'blue' | 'gold' | 'red' | 'green') =>
  tone === 'gold' ? c.gold : tone === 'red' ? c.red : tone === 'green' ? c.green : c.blue;

// 可変矩形でスプライトを切り出す（V9承認の立ち絵をそのまま使用）。
const spriteRects = {
  luno: [[0, 240, 512, 505], [512, 240, 512, 505], [1024, 240, 512, 505]],
  miino: [[0, 240, 512, 505], [512, 240, 512, 505], [1024, 240, 512, 505]],
  kano: [[0, 240, 512, 505], [512, 240, 512, 505], [1024, 240, 512, 505]],
} as const;
const Character = ({who = 'luno', pose = 'explain', x = 1360, bottom = 250, height = 460}: {
  who?: 'luno' | 'miino' | 'kano'; pose?: 'neutral' | 'explain' | 'react'; x?: number; bottom?: number; height?: number;
}) => {
  const frame = useCurrentFrame();
  const index = frame < 22 ? 0 : pose === 'explain' ? 1 : pose === 'react' ? 2 : 0;
  const rect = spriteRects[who][index];
  const width = height * 0.82;
  const cropWidth = height * rect[2] / rect[3];
  return <div style={{position: 'absolute', left: x, bottom, width, height,
    opacity: ramp(frame, 0, 12), transform: `translateY(${(1 - ramp(frame, 0, 18)) * 18}px)`}}>
    <svg width={width} height={24} style={{position: 'absolute', bottom: height * (rect[1] + rect[3] - (who === 'kano' ? 730 : 735)) / rect[3] - 12, left: 0}}>
      <Shadow x={width / 2} y={12} w={width * 0.72} h={20} />
    </svg>
    <div style={{position: 'absolute', left: (width - cropWidth) / 2, top: 0,
      width: cropWidth, height, overflow: 'hidden'}}>
      <Img src={staticFile(`assets/characters/longform-v4/${who}-poses-v1.png`)}
        style={{position: 'absolute', left: -rect[0] * height / rect[3], top: -rect[1] * height / rect[3],
          width: 1536 * height / rect[3], height: 1024 * height / rect[3], maxWidth: 'none'}} />
    </div>
  </div>;
};

// 画面外ナレーション用×説明用無名技術者。実在人物の容姿・発言を再現しない。
const Engineer = ({left = 1435, top = 320}: {left?: number; top?: number}) => <>
  <svg width={315} height={500} viewBox="0 0 340 540" style={{position: 'absolute', left, top}}>
    <Shadow x={170} y={526} w={200} h={22} />
    <g stroke={c.ink} strokeWidth={5} strokeLinejoin="round" strokeLinecap="round">
      <path d="M115 367 V502 H159 L171 402 L185 502 H228 V367 Z" fill="#5D7687" />
      <path d="M115 495 H160 V524 H101 Q91 519 101 508 Z M185 495 H228 L244 511 V524 H185 Z" fill={c.ink} />
      <path d="M113 211 Q170 191 227 211 L246 374 H96 Z" fill="#AFCCD5" />
      <path d="M112 216 L80 245 L36 228 L22 255 L83 289 Q98 293 119 273 M228 217 L255 236 L267 347 H238" fill="#AFCCD5" />
      <path d="M32 228 Q20 214 9 226 Q-1 239 22 255 M238 345 Q234 370 253 373 Q273 372 267 347" fill="#F3D9BE" />
      <path d="M149 205 L171 236 L193 205 M171 236 V370 M190 268 H225 V301 H190" fill="none" strokeWidth={3} />
      <path d="M149 176 V210 Q171 229 193 210 V176" fill="#F3D9BE" />
      <circle cx={171} cy={119} r={70} fill="#F3D9BE" />
      <path d="M103 107 Q101 40 167 42 Q226 40 240 105 L214 87 Q172 102 133 83 Z" fill={c.ink} />
      <path d="M103 79 Q111 37 166 36 Q218 38 234 72 L244 86 H99 Z" fill="#7296A8" />
      <path d="M112 81 H239" fill="none" />
      <circle cx={146} cy={121} r={5} fill={c.ink} stroke="none" />
      <circle cx={195} cy={121} r={5} fill={c.ink} stroke="none" />
      <path d="M157 153 Q172 162 187 153" fill="none" strokeWidth={3} />
    </g>
  </svg>
  <Label style={{position: 'absolute', left: left + 25, top: top + 508, fontSize: 25, background: c.blue}}>技術者（イメージ）</Label>
</>;

const guideOf = (scene: ToyotaScene) => scene.guide ?? scene.character;
const charName = {luno: 'ルーノ', miino: 'ミーノ', kano: 'カーノ'} as const;
const Guide = ({scene, x, height, pose}: {scene: ToyotaScene; x: number; height: number; pose?: 'neutral' | 'explain' | 'react'}) => {
  const who = guideOf(scene);
  if (!who) return null;
  return <>
    <Character who={who} x={x} height={height} pose={pose} />
    <Label style={{position: 'absolute', right: 55, top: 134, fontSize: 25, background: c.blue}}>
      解説役｜{charName[who]}
    </Label>
  </>;
};

// 冒頭・7-1の3キャラ掛け合い。話し手のみポーズとラベル色で強調する。
const OpeningTalk = ({scene}: {scene: ToyotaScene}) => <>
  {([{w: 'luno' as const, x: 210, h: 470}, {w: 'miino' as const, x: 760, h: 440},
      {w: 'kano' as const, x: 1360, h: 470}]).map(({w, x, h}) => {
    const active = w === scene.character;
    return <div key={w} style={{position: 'absolute', inset: 0, opacity: active ? 1 : 0.62}}>
      <Character who={w} x={x} height={h} pose={active ? 'explain' : 'neutral'} />
      <Label style={{position: 'absolute', left: x, top: 1080 - 250 - h - 62, fontSize: 27,
        background: active ? c.gold : c.muted, color: active ? c.ink : c.white}}>{charName[w]}</Label>
    </div>;
  })}
</>;

const Car = ({scale = 1, muted = false}: {scale?: number; muted?: boolean}) =>
  <svg width={640 * scale} height={270 * scale} viewBox="0 0 640 270">
    <Shadow x={322} y={244} w={580} h={30} />
    <path d="M40 159 L70 145 L145 139 L201 77 Q209 66 225 66 H380 Q395 66 410 80 L470 139 L574 154 Q601 160 604 180 L601 216 H38 Z"
      fill={muted ? '#C2C9C9' : '#E9EBDF'} stroke={c.ink} strokeWidth={5} strokeLinejoin="round" />
    <path d="M166 137 L215 83 H278 V137 Z M291 83 H378 L438 137 H291 Z"
      fill={muted ? '#A2ADB4' : '#ACD4E1'} stroke={c.ink} strokeWidth={4} strokeLinejoin="round" />
    <path d="M221 87 L180 132 M366 88 L320 132" stroke={c.white} strokeWidth={8} opacity={0.7} />
    <path d="M280 141 V210 M451 145 V210 M73 177 H576" fill="none" stroke={c.ink} strokeWidth={3} opacity={0.6} />
    <rect x={304} y={155} width={28} height={7} rx={3} fill={c.ink} />
    <rect x={223} y={155} width={28} height={7} rx={3} fill={c.ink} />
    <path d="M443 130 L462 120 L476 129 L469 141 H447 Z" fill={c.ink} />
    <rect x={553} y={164} width={36} height={17} rx={5} fill={c.gold} stroke={c.ink} strokeWidth={3} />
    <rect x={43} y={161} width={15} height={29} rx={3} fill={c.red} stroke={c.ink} strokeWidth={3} />
    <path d="M47 212 H593 M544 194 H590" stroke={c.ink} strokeWidth={6} />
    <text x={348} y={196} fontSize={17} letterSpacing={3} fill={c.blue} fontWeight={800}>HYBRID</text>
    {[153, 493].map((x) => <g key={x}>
      <circle cx={x} cy={214} r={39} fill={c.ink} />
      <circle cx={x} cy={214} r={23} fill="#AEB7BA" stroke={c.white} strokeWidth={3} />
      {[0, 60, 120].map((a) => <path key={a} d={`M${x - 19} 214 H${x + 19}`} stroke={c.ink}
        strokeWidth={3} transform={`rotate(${a} ${x} 214)`} />)}
      <circle cx={x} cy={214} r={5} fill={c.white} />
    </g>)}
  </svg>;

const Factory = ({x = 0, y = 0, scale = 1}: {x?: number; y?: number; scale?: number}) =>
  <g transform={`translate(${x} ${y}) scale(${scale})`} stroke={c.ink} strokeWidth={4} strokeLinejoin="round">
    <Shadow x={290} y={288} w={600} />
    <path d="M435 100 V15 H470 V100 M490 100 V38 H524 V100" fill="#9BAAB0" />
    <path d="M18 100 L130 52 V100 L242 52 V100 L354 52 V100 H552 V272 H18 Z" fill="#C0D2D1" />
    <path d="M18 115 H550" fill="none" />
    {Array.from({length: 8}, (_, i) => <g key={i}>
      <rect x={36 + i * 63} y={137} width={42} height={56} fill="#E3F1EF" />
      <path d={`M${57 + i * 63} 137 V193 M${36 + i * 63} 165 H${78 + i * 63}`} strokeWidth={2} />
    </g>)}
    <rect x={195} y={208} width={140} height={64} fill={c.muted} />
    <path d="M210 222 H320 M210 239 H320 M210 255 H320" stroke={c.line} strokeWidth={2} />
    <rect x={414} y={215} width={80} height={57} fill={c.white} />
  </g>;
const Hall = ({scale = 1}: {scale?: number}) => <svg width={630 * scale} height={430 * scale} viewBox="0 0 630 430">
  <Shadow x={315} y={402} w={620} />
  <path d="M45 125 L315 43 L585 125 Z" fill="#9BB4BB" stroke={c.ink} strokeWidth={5} />
  <path d="M63 141 H567 V370 H63 Z" fill="#D9D6C5" stroke={c.ink} strokeWidth={5} />
  {[87, 173, 366, 452].map((x) => <g key={x}>
    <rect x={x} y={142} width={38} height={227} fill={c.white} stroke={c.ink} strokeWidth={4} />
    <rect x={x - 9} y={133} width={56} height={18} fill={c.white} stroke={c.ink} strokeWidth={3} />
  </g>)}
  <rect x={249} y={223} width={97} height={147} fill={c.ink} />
  <path d="M297 225 V366 M257 278 H337" stroke={c.line} strokeWidth={3} />
  <path d="M31 372 H599 V386 H31 Z M13 386 H617 V402 H13 Z" fill="#A5B5B6" stroke={c.ink} strokeWidth={3} />
  {[115, 195, 425, 505].map((x, i) => <g key={x}>
    <path d={`M${x} 88 V32`} stroke={c.ink} strokeWidth={3} />
    <path d={`M${x} 33 L${x + 37} 43 L${x} 55 Z`} fill={i % 2 ? c.gold : c.blue} stroke={c.ink} strokeWidth={2} />
  </g>)}
</svg>;

const Backdrop = ({mode}: {mode: 'street' | 'workshop' | 'diagram'}) => <svg width={1920} height={1080}
  style={{position: 'absolute'}} viewBox="0 0 1920 1080">
  <rect width={1920} height={1080} fill={c.paper} />
  {mode === 'workshop' ? <>
    <rect x={85} y={120} width={1750} height={485} rx={12} fill="#C6DADB" stroke={c.ink} strokeWidth={6} />
    <g fill="#AEC7CD" opacity={0.7}><Factory x={140} y={270} scale={0.9} /><Factory x={1010} y={230} scale={1.1} /></g>
    {[350, 650, 950, 1250, 1550].map((x) => <path key={x} d={`M${x} 123 V603`} stroke={c.ink} strokeWidth={9} />)}
    <path d="M88 345 H1832" stroke={c.ink} strokeWidth={9} />
    <rect x={0} y={620} width={1920} height={145} fill="#D9D2BF" />
    <path d="M0 621 H1920 M0 764 H1920" stroke={c.ink} strokeWidth={4} />
    <g stroke={c.ink} strokeWidth={4} fill="#9CABAC">
      <rect x={64} y={695} width={170} height={38} rx={7} /><path d="M84 733 V792 M214 733 V792" />
      <rect x={1670} y={667} width={196} height={97} rx={8} /><path d="M1690 700 H1845 M1690 733 H1845" />
    </g>
  </> : mode === 'street' ? <>
    <rect width={1920} height={760} fill="#DFE8E7" />
    <circle cx={1530} cy={200} r={85} fill="#F2DFAC" />
    <g fill="#C3D1D0">{Array.from({length: 12}, (_, i) => <rect key={i} x={i * 176 - 40}
      y={360 + (i % 3) * 46} width={145} height={390} />)}</g>
    {[0, 220, 1450, 1690].map((x, i) => <g key={x} stroke={c.ink} strokeWidth={3}>
      <rect x={x} y={350 + (i % 2) * 80} width={192} height={400} fill={i % 2 ? '#C3C9BC' : '#CFD5CE'} />
      {Array.from({length: 9}, (_, n) => <rect key={n} x={x + 24 + (n % 3) * 54}
        y={380 + (i % 2) * 80 + Math.floor(n / 3) * 70} width={31} height={44} fill={n % 3 ? '#AFC3CA' : '#EDDAAC'} strokeWidth={2} />)}
      <rect x={x + 12} y={655} width={168} height={65} fill={c.muted} />
      <path d={`M${x + 4} 651 H${x + 187}`} stroke={c.white} strokeWidth={16} />
    </g>)}
    {[270, 1620].map((x) => <g key={x} stroke={c.ink} strokeWidth={8} fill={c.gold}>
      <path d={`M${x} 478 V778`} /><path d={`M${x - 20} 481 L${x - 29} 431 H${x + 29} L${x + 20} 481 Z`} />
    </g>)}
  </> : <>
    <rect width={1920} height={800} fill="#E6E9E1" />
    <path d="M0 160 H1920 M0 785 H1920" stroke="#CDD4CB" strokeWidth={4} />
    {Array.from({length: 20}, (_, i) => <path key={i} d={`M${i * 100} 170 V780`} stroke="#DCE2D8" strokeWidth={2} />)}
  </>}
  <path d="M0 790 H1920 V1080 H0 Z" fill={mode === 'street' ? '#B7B6A8' : '#CECBBB'} />
  <path d="M0 790 H1920 M0 928 H1920" stroke="#8D998F" strokeWidth={3} />
  {[0, 360, 720, 1080, 1440, 1800].map((x) => <path key={x} d={`M${960 + (x - 960) * 0.65} 790 L${x} 1080`}
    stroke="#AEB3A5" strokeWidth={3} />)}
</svg>;

const Stamp = ({text, x, y, appear = 24, size = 51}: {text: string; x: number; y: number; appear?: number; size?: number}) => {
  const f = useCurrentFrame(); const t = ramp(f, appear, appear + 12);
  return <div style={{position: 'absolute', left: x, top: y, border: `7px double ${c.red}`,
    borderRadius: 14, padding: `14px ${size / 2}px`, color: c.red, background: '#FFFCF5ED', fontSize: size,
    fontWeight: 900, opacity: t, transform: `rotate(-7deg) scale(${1 + (1 - t) * 0.25})`}}>{text}</div>;
};
const TimelineV10 = ({progress = 0, stops, back = false}: {progress?: number;
  stops?: Readonly<ToyotaScene['stops']>; back?: boolean}) => {
  const tip = back ? 1025 - progress * 970 : 55 + progress * 970;
  return <svg width={1080} height={185} viewBox="0 0 1080 185">
    <path d="M55 100 H1025" stroke={c.line} strokeWidth={12} strokeLinecap="round" />
    <path d={`M${back ? 1025 : 55} 100 H${tip}`} stroke={c.gold} strokeWidth={12} strokeLinecap="round" />
    {back ? <path d="M75 76 L55 100 L75 124" fill="none" stroke={c.gold} strokeWidth={12} /> : null}
    {[55, 1025].map((x) => <circle key={x} cx={x} cy={100} r={20} fill={c.white} stroke={c.ink} strokeWidth={5} />)}
    <text x={55} y={52} fontSize={36} fontWeight={800} fill={c.ink} textAnchor="middle">1997</text>
    <text x={1025} y={52} fontSize={36} fontWeight={800} fill={c.ink} textAnchor="middle">2025</text>
    {(stops ?? []).map((stop, i) => {
      const x = 55 + (i + 1) * 970 / ((stops?.length ?? 0) + 1);
      return <g key={stop.t + i}>
        <circle cx={x} cy={100} r={13} fill={c.white} stroke={c.ink} strokeWidth={5} />
        <text x={x} y={148} fontSize={28} fontWeight={800} fill={c.blue} textAnchor="middle">{stop.t}</text>
        <text x={x} y={176} fontSize={24} fill={c.muted} textAnchor="middle">{stop.d}</text>
      </g>;
    })}
  </svg>;
};

// 機能の組合せを示す小さな概念アイコン（実車の内部構造を表すものではない）。
const IconDraw = ({kind}: {kind: z.infer<typeof iconKind>}) => {
  if (kind === 'engine') return <svg width={130} height={86} viewBox="0 0 220 145">
    <g stroke={c.ink} strokeWidth={5} strokeLinejoin="round" fill="#B9CBCB">
      <path d="M34 48 H147 L171 69 V123 H31 V66 H16 V51 H34 Z" />
      <path d="M51 31 H139 V48 H51 Z M169 71 H199 V114 H171" />
      {[60, 84, 108, 132].map((x) => <path key={x} d={`M${x} 62 V106`} strokeWidth={3} />)}
      <circle cx={57} cy={118} r={8} fill={c.white} />
    </g>
  </svg>;
  if (kind === 'motor') return <svg width={130} height={86} viewBox="0 0 220 145">
    <g stroke={c.ink} strokeWidth={5} strokeLinejoin="round" fill="#B9CBCB">
      <rect x={33} y={37} width={139} height={92} rx={24} /><ellipse cx={172} cy={83} rx={20} ry={46} />
      <path d="M193 83 H215 M8 83 H33 M62 48 V116 M91 48 V116 M120 48 V116" strokeWidth={4} />
    </g>
  </svg>;
  if (kind === 'battery') return <svg width={130} height={86} viewBox="0 0 220 145">
    <g stroke={c.ink} strokeWidth={5} strokeLinejoin="round" fill="#B9CBCB">
      <rect x={22} y={39} width={177} height={89} rx={10} />
      <path d="M43 26 H70 V39 M151 26 H178 V39" />
      <path d="M61 65 V101 M43 83 H79 M145 83 H180" stroke={c.ink} strokeWidth={6} />
    </g>
  </svg>;
  if (kind === 'wheel') return <svg width={130} height={86} viewBox="0 0 220 145">
    <g stroke={c.ink} strokeWidth={5} fill="#B9CBCB">
      <circle cx={110} cy={72} r={54} />
      <circle cx={110} cy={72} r={30} fill={c.ink} />
      {[0, 60, 120].map((a) => <path key={a} d="M110 18 V54 M110 90 V126 M56 72 H92 M128 72 H164"
        transform={`rotate(${a} 110 72)`} fill="none" />)}
    </g>
  </svg>;
  if (kind === 'split') return <svg width={130} height={86} viewBox="0 0 220 145">
    <g stroke={c.ink} strokeWidth={5} strokeLinejoin="round" fill="#E9BC63">
      <circle cx={110} cy={72} r={34} fill="#B9CBCB" />
      <path d="M110 38 V6 M110 106 V138 M76 72 H44 M144 72 H176" fill="none" />
      <path d="M88 44 a26 26 0 0 1 44 0" fill="none" />
    </g>
  </svg>;
  if (kind === 'people') return <svg width={130} height={86} viewBox="0 0 220 145">
    <g stroke={c.ink} strokeWidth={5} fill="#B9CBCB">
      {[55, 110, 165].map((x, i) => <g key={x} opacity={i === 1 ? 1 : 0.8}>
        <circle cx={x} cy={44 + Math.abs(i - 1) * 8} r={17} fill="#F3D9BE" />
        <path d={`M${x - 22} ${104 + Math.abs(i - 1) * 10} q22 -44 44 0`} />
      </g>)}
    </g>
  </svg>;
  if (kind === 'plant') return <svg width={130} height={86} viewBox="0 0 220 145">
    <g stroke={c.ink} strokeWidth={5} strokeLinejoin="round" fill="#B9CBCB">
      <path d="M40 120 H180 M55 120 V64 H85 V120 M135 120 V40 H165 V120" />
      <path d="M70 64 V34 H98 M150 40 V14 H178" fill="none" />
      <path d="M85 90 H110 Q128 90 135 72" fill="none" />
    </g>
  </svg>;
  if (kind === 'job') return <svg width={130} height={86} viewBox="0 0 220 145">
    <g stroke={c.ink} strokeWidth={5} strokeLinejoin="round" fill="#B9CBCB">
      <rect x={46} y={44} width={128} height={82} rx={10} />
      <path d="M84 44 V26 Q84 18 92 18 H128 Q136 18 136 26 V44 M46 78 H174" />
      <path d="M96 96 H124" stroke={c.ink} strokeWidth={6} />
    </g>
  </svg>;
  if (kind === 'factory') return <svg width={130} height={86} viewBox="0 0 220 145">
    <g stroke={c.ink} strokeWidth={5} strokeLinejoin="round" fill="#C0D2D1">
      <path d="M28 40 L64 22 V40 L100 22 V40 L136 22 V40 H196 V124 H28 Z" />
      <path d="M64 84 H96 V124 H64 Z" fill={c.white} />
      {[120, 148, 172].map((x) => <path key={x} d={`M${x} 84 V104`} fill="none" />)}
    </g>
  </svg>;
  if (kind === 'car') return <svg width={130} height={86} viewBox="0 0 220 145">
    <g stroke={c.ink} strokeWidth={5} strokeLinejoin="round" fill="#B9CBCB">
      <path d="M18 104 L36 78 L74 72 L106 42 Q114 34 128 34 H160 Q172 34 182 44 L204 74 L206 96 Q206 106 196 106 H28 Z" />
      <path d="M60 70 L84 46 H122 V70 Z M134 46 H158 L178 70 H134 Z" fill={c.light} />
      <circle cx={62} cy={106} r={16} /><circle cx={158} cy={106} r={16} />
    </g>
  </svg>;
  if (kind === 'tech') return <svg width={130} height={86} viewBox="0 0 220 145">
    <g stroke={c.ink} strokeWidth={5} strokeLinejoin="round" fill="#B9CBCB">
      <circle cx={110} cy={72} r={46} fill="#E9BC63" />
      <path d="M110 26 V10 M110 134 V118 M64 72 H48 M172 72 H156 M78 40 L66 28 M144 104 L156 116" fill="none" />
      <path d="M91 72 L105 86 L133 58" fill="none" strokeWidth={6} />
    </g>
  </svg>;
  return <svg width={130} height={86} viewBox="0 0 220 145">
    <g stroke={c.ink} strokeWidth={5} strokeLinejoin="round" fill="#B9CBCB">
      <path d="M40 146 L110 30 L208 146 Z" />
    </g>
  </svg>;
};

// 章単位の流れ図。ノード箱と矢印を1つの座標系（1600x500）で描く汎用図。
const FlowDiagram = ({scene}: {scene: ToyotaScene}) => {
  const f = useCurrentFrame();
  const flow = scene.flow!;
  return <Panel style={{left: 115, top: 160, width: 1690, height: 590}}>
    {scene.headline ? <Label style={{position: 'absolute', top: 27, left: 34}}>{scene.headline}</Label> : null}
    {scene.stamp ? <Stamp text={scene.stamp} x={1200} y={200} size={40} /> : null}
    <svg width={1600} height={500} viewBox="0 0 1600 500" style={{position: 'absolute', left: 35, top: 90}}>
      {(flow.edges ?? []).map((edge, i) => {
        const from = flow.nodes[edge.from];
        const to = flow.nodes[edge.to];
        if (!from || !to || edge.from === edge.to) return null;
        const dx = to.x - from.x, dy = to.y - from.y;
        const dist = Math.hypot(dx, dy) || 1;
        const appear = 10 + i * 24;
        const tipX = from.x + (dist - 175) / dist * dx, tipY = from.y + (dist - 175) / dist * dy;
        const ang = Math.atan2(dy, dx) * 180 / Math.PI;
        const midX = (from.x + to.x) / 2, midY = (from.y + to.y) / 2;
        return <g key={i} opacity={ramp(f, appear, appear + 16)}>
          <path d={`M${from.x} ${from.y} L${tipX} ${tipY}`} stroke={c.line} strokeWidth={9} fill="none" />
          <path d={`M${from.x} ${from.y} L${tipX} ${tipY}`} stroke={c.gold} strokeWidth={9} fill="none"
            strokeDasharray={260} strokeDashoffset={(1 - ramp(f, appear + 6, appear + 52)) * 260} />
          <g transform={`translate(${tipX} ${tipY}) rotate(${ang})`}>
            <path d="M-14 -11 L10 0 L-14 11 Z" fill={c.gold} stroke={c.ink} strokeWidth={2} />
          </g>
          {edge.label ? <g>
            <rect x={midX - edge.label.length * 15 - 14} y={midY - 27} width={edge.label.length * 30 + 28}
              height={50} rx={11} fill={c.white} stroke={c.ink} strokeWidth={3} />
            <text x={midX} y={midY + 11} fontSize={30} fontWeight={800} fill={c.ink} textAnchor="middle">{edge.label}</text>
          </g> : null}
        </g>;
      })}
      {flow.nodes.map((node, i) => {
        const h = node.t ? 150 : 124;
        return <g key={node.label + i} transform={`translate(${node.x - 150} ${node.y - 62})`}
          opacity={ramp(f, 4 + i * 9, 16 + i * 9)}>
          <rect width={300} height={h} rx={16} fill="#FFFCF5" stroke={c.line} strokeWidth={4} />
          <g transform="translate(85 4)"><IconDraw kind={node.icon} /></g>
          {node.t ? <text x={150} y={104} fontSize={21} fontWeight={800} fill={c.blue} textAnchor="middle">{node.t}</text> : null}
          <text x={150} y={node.t ? 134 : 112} fontSize={29} fontWeight={800} fill={c.ink} textAnchor="middle">{node.label}</text>
        </g>;
      })}
    </svg>
    {flow.note ? <div style={{position: 'absolute', bottom: 26, left: 45, fontSize: 29, color: c.muted}}>{flow.note}</div> : null}
  </Panel>;
};

// 比較・整理をカードで示す汎用図。
const CardsRow = ({scene}: {scene: ToyotaScene}) => {
  const f = useCurrentFrame();
  const cards = scene.cards ?? [];
  const wide = cards.length >= 4;
  return <>
    {scene.headline ? <Label style={{position: 'absolute', left: 135, top: 205, background: c.blue}}>{scene.headline}</Label> : null}
    {cards.map((card, i) => {
      const w = wide ? 810 : cards.length === 2 ? 780 : (1660 - (cards.length - 1) * 40) / cards.length;
      const left = wide ? 115 + (i % 2) * 855 : 130 + i * (w + 40);
      const top = wide ? 320 + Math.floor(i / 2) * 245 : 350;
      return <Panel key={card.title} style={{left, top, width: w, padding: '26px 30px',
        border: `5px solid ${toneColor(card.tone)}`, opacity: ramp(f, 8 + i * 14, 24 + i * 14)}}>
        <div style={{fontSize: 50, fontWeight: 900, color: toneColor(card.tone)}}>{card.title}</div>
        <div style={{fontSize: 33, marginTop: 12, lineHeight: 1.35}}>{card.body}</div>
      </Panel>;
    })}
    {scene.arrow ? <svg width={190} height={70} style={{position: 'absolute', left: 900, top: 400}} opacity={ramp(f, 30, 44)}>
      <path d="M4 34 H160 M136 8 L168 34 L136 60" fill="none" stroke={c.gold} strokeWidth={12} />
    </svg> : null}
    {scene.sub ? <div style={{position: 'absolute', left: 130, top: 818, fontSize: 32, color: c.muted}}>{scene.sub}</div> : null}
  </>;
};

// 棒グラフの汎用図（推移・積み重ね）。
const BarsChart = ({scene}: {scene: ToyotaScene}) => {
  const f = useCurrentFrame();
  const bars = scene.bars!;
  return <Panel style={{left: 130, top: 195, width: 1310, height: 560, padding: '32px 38px'}}>
    {scene.headline ? <div style={{fontSize: 47, fontWeight: 900}}>{scene.headline}</div> : null}
    <div style={{position: 'absolute', left: 38, right: 38, top: 150}}>
      {bars.items.map((item, i) => <div key={item.label + i} style={{marginTop: i ? 52 : 0}}>
        <div style={{display: 'flex', justifyContent: 'space-between', fontSize: 33, fontWeight: 800}}>
          <span>{item.label}</span><span style={{color: c.blue}}>{item.value}</span>
        </div>
        <div style={{height: 34, background: c.light, borderRadius: 17, marginTop: 10}}>
          <div style={{height: 34, width: `${item.ratio * 100 * ramp(f, 14 + i * 20, 40 + i * 20)}%`,
            background: c.gold, borderRadius: 17}} />
        </div>
      </div>)}
    </div>
    {bars.note ? <div style={{position: 'absolute', bottom: 30, left: 40, fontSize: 30, color: c.muted}}>{bars.note}</div> : null}
  </Panel>;
};

// 0-7 / 0-10 / 1-10 / 7-4（finale）の時系列。
const TimelineShow = ({scene}: {scene: ToyotaScene}) => {
  const f = useCurrentFrame();
  const progress = scene.back ? ramp(f, 8, 60) * 0.99 : ramp(f, 8, 55);
  return <>
    <Panel style={{left: 110, top: 170, width: 1450, height: 430, padding: '38px 40px', textAlign: 'center'}}>
      {scene.headline ? <div style={{fontSize: 46, fontWeight: 900}}>{scene.headline}</div> : null}
      <div style={{position: 'absolute', left: 130, top: 158}}><TimelineV10 progress={progress} stops={scene.stops} back={scene.back} /></div>
      {scene.sub ? <div style={{position: 'absolute', bottom: 22, left: 45, fontSize: 30, color: c.muted}}>{scene.sub}</div> : null}
    </Panel>
    {scene.finale ? <>
      {(['luno', 'miino', 'kano'] as const).map((w, i) => <Character key={w} who={w}
        x={1300 + i * 205} height={240} bottom={220} pose={i === 1 ? 'explain' : 'neutral'} />)}
      <Label style={{position: 'absolute', left: 150, top: 625, fontSize: 25, background: c.blue}}>
        ナレーション（画面外）｜{parsed.narrator?.credit}
      </Label>
      <Label style={{position: 'absolute', left: 150, top: 680, fontSize: 25, background: c.blue}}>
        {parsed.credits?.dialogue}
      </Label>
    </> : <Guide scene={scene} x={1660} height={380} />}
  </>;
};

const PatentFlow = ({scene, many}: {scene: ToyotaScene; many: boolean}) => {
  const f = useCurrentFrame();
  const t = ramp(f, 16, 58);
  return <Panel style={{left: 115, top: 174, width: 1670, height: 590}}>
    <Label style={{position: 'absolute', top: 27, left: 34}}>{many ? '電動化の特許' : '燃料電池の特許'}</Label>
    <div style={{position: 'absolute', left: 90, top: 195, width: 310, height: 275}}>
      {[2, 1, 0].map((i) => <div key={i} style={{position: 'absolute', left: i * 17, top: i * -15,
        width: 252, height: 236, border: `4px solid ${c.ink}`, borderRadius: 12, background: c.white,
        padding: '25px 20px', textAlign: 'center'}}>
        <div style={{fontSize: 29, fontWeight: 800}}>TOYOTA</div>
        <div style={{fontSize: 37, fontWeight: 900, marginTop: 18}}>特許</div>
        <div style={{borderTop: `4px solid ${c.line}`, marginTop: 21}} />
      </div>)}
    </div>
    <svg width={600} height={210} style={{position: 'absolute', left: 410, top: 240}}>
      <path d="M0 90 H560 M530 65 L560 90 L530 115" fill="none" stroke={c.gold} strokeWidth={13} />
    </svg>
    {[0, 1, 2].map((i) => <div key={i} style={{position: 'absolute', left: 485 + t * 270 + i * 26,
      top: 253 - i * 24, width: 100, height: 128, border: `3px solid ${c.ink}`, borderRadius: 7,
      background: c.white, opacity: ramp(f, 8 + i * 9, 20 + i * 9), padding: '16px 8px', fontSize: 22,
      textAlign: 'center', fontWeight: 800}}>特許<div style={{height: 4, background: c.line, marginTop: 18}} />
    </div>)}
    <div style={{position: 'absolute', left: 1015, top: 184, width: 570, textAlign: 'center'}}>
      <div style={{fontSize: 88, fontWeight: 900, whiteSpace: 'nowrap'}}>約{scene.patentCount?.toLocaleString('en-US')}件</div>
      <Label style={{background: c.green, marginTop: 18, fontSize: 43}}>無償開放</Label>
      {many ? <div style={{fontSize: 31, marginTop: 26, fontWeight: 800}}>期限：2030年末</div> : null}
    </div>
    <div style={{position: 'absolute', bottom: 25, left: 45, fontSize: 29, color: c.muted}}>保有する技術を、使える技術へ</div>
  </Panel>;
};

const Globe = ({scale = 1}: {scale?: number}) =>
  <svg width={520 * scale} height={480 * scale} viewBox="0 0 520 480">
    <circle cx={250} cy={235} r={185} fill={c.light} stroke={c.ink} strokeWidth={6} />
    <path d="M138 92 L203 76 L248 125 L227 183 L161 204 L123 162 Z M274 216 L324 191 L358 228 L327 304 L277 357 L253 300 Z"
      fill={c.green} stroke={c.ink} strokeWidth={3} />
    <ellipse cx={250} cy={235} rx={185} ry={72} fill="none" stroke={c.ink} strokeWidth={3} opacity={0.4} />
  </svg>;

const shipIcon = ({scale = 1}: {scale?: number}) =>
  <g transform={`scale(${scale})`} stroke={c.ink} strokeWidth={5} strokeLinejoin="round">
    <Shadow x={280} y={296} w={520} h={22} />
    <path d="M60 214 L96 168 H492 L528 214 Q528 240 494 240 H94 Q60 240 60 214 Z" fill="#9BAAB0" />
    {[120, 200, 280, 360, 430].map((x) => <rect key={x} x={x} y={112} width={62} height={50}
      fill="#D9B36C" stroke={c.ink} strokeWidth={4} />)}
    <rect x={118} y={74} width={30} height={38} fill="#C0D2D1" />
    <path d="M148 76 L208 86 L148 100 Z" fill={c.blue} />
    <path d="M60 240 H560 M40 252 H580" stroke={c.ink} strokeWidth={3} opacity={0.5} fill="none" />
  </g>;

const gaugeDial = ({value, label, x, y}: {value: number; label: string; x: number; y: number}) => {
  const angle = (-120 + value * 240) * Math.PI / 180;
  return <g transform={`translate(${x} ${y})`}>
    <circle r={92} fill={c.white} stroke={c.ink} strokeWidth={6} />
    {[-120, -80, -40, 0, 40, 80, 120].map((a) => <path key={a} d="M0 -74 V-84" stroke={c.ink}
      strokeWidth={4} transform={`rotate(${a})`} />)}
    <line x1={0} y1={0} x2={Math.sin(angle) * 84} y2={-Math.cos(angle) * 84} stroke={c.gold} strokeWidth={9} strokeLinecap="round" />
    <circle r={9} fill={c.ink} />
    <text y={54} fontSize={33} fontWeight={800} textAnchor="middle" fill={c.ink}>{label}</text>
  </g>;
};

const Visual = ({scene}: {scene: ToyotaScene}) => {
  const f = useCurrentFrame();
  switch (scene.visual) {
    case 'openingTalk': return <OpeningTalk scene={scene} />;
    case 'answerTitle': return <>
      <div style={{position: 'absolute', left: 440, right: 440, top: 176, textAlign: 'center'}}>
        <Label style={{display: 'inline-block', fontSize: 38, background: c.blue}}>1997年12月</Label>
        <div style={{fontSize: 98, fontWeight: 900, marginTop: 18, letterSpacing: 6}}>二つの答え</div>
      </div>
      <div style={{position: 'absolute', left: 160, top: 380}}><Hall scale={0.83} /></div>
      <svg width={650} height={400} style={{position: 'absolute', left: 1100, top: 425}}><Factory scale={1.1} /></svg>
      <div style={{position: 'absolute', left: 385, top: 760, fontSize: 33, fontWeight: 800}}>世界の枠組み</div>
      <div style={{position: 'absolute', left: 1320, top: 760, fontSize: 33, fontWeight: 800}}>一台の車</div>
    </>;
    case 'conference': return <>
      <div style={{position: 'absolute', left: 250, top: 270}}><Hall scale={1.2} /></div>
      <Panel style={{left: 1150, top: 255, width: 530, padding: '36px', textAlign: 'center'}}>
        <div style={{fontSize: 38, color: c.muted}}>京都の会議場</div>
        <div style={{fontSize: 62, fontWeight: 900, marginTop: 20}}>京都議定書</div>
        <div style={{fontSize: 34, marginTop: 20}}>温暖化に、世界の枠組みを。</div>
      </Panel>
      {scene.stamp ? <Stamp text={scene.stamp} x={1110} y={610} size={44} /> : null}
    </>;
    case 'carReveal': return <>
      <div style={{position: 'absolute', left: 300, top: 454,
        transform: `translateX(${(1 - ramp(f, 0, 24)) * -60}px)`}}><Car scale={1.4} /></div>
      <div style={{position: 'absolute', left: 380, top: 300, display: 'flex', gap: 22, alignItems: 'center'}}>
        {scene.stamp ? <Label style={{background: c.blue}}>{scene.stamp}</Label> : null}
        {scene.title ? <Label style={{background: c.gold, color: c.ink}}>{scene.title}</Label> : null}
      </div>
      {scene.sub ? <div style={{position: 'absolute', left: 385, top: 378, fontSize: 32, color: c.muted}}>{scene.sub}</div> : null}
    </>;
    case 'worldFirstStamps': return <>
      <Label style={{position: 'absolute', top: 205, left: 570}}>1997年12月　プリウス発売</Label>
      <div style={{position: 'absolute', left: 420, top: 460}}><Car scale={1.6} /></div>
      {(scene.stamps ?? []).map((s, i) => <Stamp key={s} text={s} x={420 + i * 800} y={350} appear={24 + i * 18} />)}
    </>;
    case 'carAnnounce': return <>
      <div style={{position: 'absolute', left: 300, top: 470}}><Car scale={1.45} /></div>
      <div style={{position: 'absolute', left: 385, top: 296, display: 'flex', gap: 22, alignItems: 'center'}}>
        <Label style={{background: c.blue}}>{scene.stamp}</Label>
        <Label style={{background: c.gold, color: c.ink}}>{scene.title}</Label>
      </div>
      {scene.sub ? <div style={{position: 'absolute', left: 385, top: 372, fontSize: 34, fontWeight: 800}}>{scene.sub}</div> : null}
    </>;
    case 'driveShot': return <>
      <div style={{position: 'absolute', left: 430, top: 470}}><Car scale={1.5} /></div>
      {scene.headline ? <Label style={{position: 'absolute', left: 470, top: 300, background: c.blue}}>{scene.headline}</Label> : null}
      <Guide scene={scene} x={1450} height={430} />
    </>;
    case 'exportShip': return <>
      <div style={{position: 'absolute', left: 250, top: 560}}><Car scale={1.0} muted /></div>
      <svg width={640} height={340} style={{position: 'absolute', left: 1010, top: 300}}>{shipIcon({scale: 1})}</svg>
      {scene.headline ? <Label style={{position: 'absolute', left: 300, top: 250, background: c.gold, color: c.ink}}>{scene.headline}</Label> : null}
      {['北米', '欧州'].map((place, i) => <Panel key={place} style={{left: 1090 + i * 350, top: 240, padding: '14px 30px',
        fontSize: 37, fontWeight: 800, opacity: ramp(f, 40 + i * 20, 58 + i * 20)}}>{place}へ</Panel>)}
    </>;
    case 'chapterCard': return <Panel style={{left: 260, top: 275, width: 1400, padding: '60px', textAlign: 'center', opacity: ramp(f, 0, 12)}}>
      <div style={{fontSize: 40, color: c.blue, fontWeight: 800}}>{scene.cardNo}</div>
      <div style={{fontSize: 74, fontWeight: 900, marginTop: 22}}>{scene.cardText}</div>
    </Panel>;
    case 'globeCO2': return <Panel style={{left: 180, top: 190, width: 1540, height: 560}}>
      <div style={{position: 'absolute', left: 85, top: 38}}><Globe scale={1} /></div>
      <div style={{position: 'absolute', left: 715, top: 100, fontSize: 48, fontWeight: 800}}>世界共通の目標</div>
      <div style={{position: 'absolute', left: 710, top: 205, fontSize: 118, fontWeight: 900, color: c.blue}}>CO₂ ↓</div>
      <div style={{position: 'absolute', left: 710, top: 400, fontSize: 40}}>温室効果ガスを減らす</div>
    </Panel>;
    case 'twoTracks': return <>
      <Panel style={{left: 115, top: 165, width: 1690, height: 560, padding: '36px 40px'}}>
        {scene.headline ? <div style={{fontSize: 46, fontWeight: 900}}>{scene.headline}</div> : null}
        <svg width={1600} height={330} style={{position: 'absolute', left: 30, top: 80}}>
          <g opacity={ramp(f, 6, 20)}>
            <text x={120} y={66} fontSize={33} fontWeight={800} fill={c.ink}>京都議定書（国際の枠組み）</text>
            <path d="M96 96 H1240 M1206 78 L1236 96 L1206 114" stroke={c.blue} strokeWidth={10} fill="none" />
            <circle cx={1180} cy={96} r={13} fill={c.blue} />
            <text x={1180} y={54} fontSize={28} fontWeight={800} fill={c.blue} textAnchor="middle">1997.12 採択</text>
          </g>
          <g opacity={ramp(f, 26, 40)}>
            <text x={120} y={196} fontSize={33} fontWeight={800} fill={c.ink}>プリウス開発（会議よりも前から）</text>
            <path d="M96 226 H1520 M1486 208 L1516 226 L1486 244" stroke={c.gold} strokeWidth={10} fill="none" />
            <circle cx={1170} cy={226} r={13} fill={c.gold} stroke={c.ink} strokeWidth={3} />
            <text x={1170} y={268} fontSize={28} fontWeight={800} fill={c.ink} textAnchor="middle">1997.12 発売</text>
          </g>
        </svg>
        {scene.sub ? <div style={{position: 'absolute', bottom: 24, left: 40, fontSize: 32, color: c.muted}}>{scene.sub}</div> : null}
      </Panel>
      <Guide scene={scene} x={1520} height={420} />
    </>;
    case 'g21Meeting': return <>
      <Panel style={{left: 130, top: 190, width: 1180, height: 430, padding: '34px 40px'}}>
        <div style={{fontSize: 44, fontWeight: 900}}>G21の会議</div>
        <div style={{fontSize: 36, marginTop: 24, lineHeight: 1.4}}>G21＝21世紀にふさわしい車を考える。</div>
        <div style={{fontSize: 31, marginTop: 18, color: c.muted}}>燃費の改良は、当時はエンジンの力が中心。</div>
      </Panel>
      <Engineer />
    </>;
    case 'prototypeWorkshop': return <>
      <div style={{position: 'absolute', left: 250, top: 560}}><Car scale={1.05} muted /></div>
      <Panel style={{left: 1330, top: 240, width: 470, padding: '30px 34px', textAlign: 'center'}}>
        <div style={{fontSize: 38, fontWeight: 900}}>試作と絞り込み</div>
        <div style={{fontSize: 31, marginTop: 18, lineHeight: 1.4}}>コンセプトカーの電気をためる装置は、<br />キャパシタ構成。</div>
        <div style={{fontSize: 28, marginTop: 14, color: c.muted}}>量産の初代プリウスとは別構成</div>
      </Panel>
    </>;
    case 'gauges': return <>
      <Panel style={{left: 130, top: 195, width: 1400, height: 590, padding: '30px 40px'}}>
        {scene.headline ? <div style={{fontSize: 46, fontWeight: 900}}>{scene.headline}</div> : null}
        <svg width={520} height={330} style={{position: 'absolute', left: 80, top: 170}}>
          {gaugeDial({value: 0.55, label: '電池', x: 150, y: 140})}
        </svg>
        <svg width={520} height={330} style={{position: 'absolute', left: 630, top: 170}}>
          {gaugeDial({value: 0.3, label: 'ガソリン', x: 150, y: 140})}
        </svg>
        <div style={{position: 'absolute', right: 60, top: 250, width: 180, fontSize: 31, lineHeight: 1.5, color: c.muted}}>
          減速で回収して、また使う
        </div>
      </Panel>
      <Guide scene={scene} x={1560} height={430} />
    </>;
    case 'patentFly2015': return <PatentFlow scene={scene} many={false} />;
    case 'patentSwarm2019': return <PatentFlow scene={scene} many />;
    case 'freeStamp': return <>
      <Guide scene={scene} x={1490} height={490} />
      <Panel style={{left: 110, top: 225, width: 1190, height: 500, padding: '48px'}}>
        <div style={{fontSize: 56, fontWeight: 900}}>技を独り占めせず、道を開ける。</div>
        <div style={{fontSize: 36, marginTop: 34, color: c.muted}}>それがトヨタの選択だった。</div>
      </Panel>
      <Stamp text={scene.stamp ?? ''} x={690} y={500} />
    </>;
    case 'count15m': return <>
      <Guide scene={scene} x={1600} height={380} />
      <Panel style={{left: 240, top: 175, width: 1440, height: 590, textAlign: 'center', padding: '35px'}}>
        <div style={{fontSize: 43, fontWeight: 800}}>トヨタ・レクサスのハイブリッド累計</div>
        <div style={{fontSize: 144, fontWeight: 900, color: c.blue, marginTop: 12}}>1,500万台超</div>
        <div style={{display: 'flex', justifyContent: 'center', gap: 14, marginTop: 12}}>
          {[0, 1, 2, 3].map((i) => <div key={i} style={{opacity: ramp(f, 8 + i * 10, 20 + i * 10)}}><Car scale={0.43} /></div>)}
        </div>
        {scene.sub ? <div style={{fontSize: 31, color: c.muted, marginTop: 10}}>{scene.sub}</div> : null}
      </Panel>
    </>;
    case 'globePins': return <>
      <Panel style={{left: 130, top: 195, width: 1400, height: 590, padding: '34px 40px'}}>
        {scene.headline ? <div style={{fontSize: 46, fontWeight: 900}}>{scene.headline}</div> : null}
        <div style={{position: 'absolute', left: 60, top: 140}}><Globe scale={0.8} /></div>
        {(scene.pins ?? []).map((pin, i) => <Panel key={pin.t + i} style={{left: 640 + (i % 2) * 420,
          top: 220 + Math.floor(i / 2) * 165, padding: '18px 30px', opacity: ramp(f, 20 + i * 18, 36 + i * 18)}}>
          <span style={{fontSize: 36, fontWeight: 900}}>{pin.t}</span>
          <span style={{fontSize: 31, marginLeft: 16}}>{pin.d}年に生産</span>
        </Panel>)}
      </Panel>
      <Guide scene={scene} x={1560} height={430} />
    </>;
    case 'fcvRelease': return <>
      <Panel style={{left: 130, top: 195, width: 1390, height: 575, padding: '36px 44px', textAlign: 'center'}}>
        {scene.stamp ? <Label style={{background: c.blue}}>{scene.stamp}</Label> : null}
        <div style={{fontSize: 40, fontWeight: 800, marginTop: 26}}>燃料電池車（FCV）の特許</div>
        <div style={{fontSize: 118, fontWeight: 900, color: c.blue, marginTop: 14}}>約5,680件</div>
        <Label style={{background: c.green, marginTop: 24, fontSize: 43}}>無償で使用許諾</Label>
        <div style={{position: 'absolute', bottom: 30, left: 44, fontSize: 31, color: c.muted}}>水素を使う車。初期導入のための許諾</div>
      </Panel>
      <Guide scene={scene} x={1560} height={430} />
    </>;
    case 'patentScope': return <>
      <Panel style={{left: 130, top: 195, width: 1390, height: 575, padding: '36px 44px', textAlign: 'center'}}>
        {scene.stamp ? <Label style={{background: c.blue}}>{scene.stamp}</Label> : null}
        <div style={{fontSize: 40, fontWeight: 800, marginTop: 26}}>電動化全般の特許</div>
        <div style={{fontSize: 118, fontWeight: 900, color: c.gold, marginTop: 14}}>約23,740件</div>
        <div style={{display: 'flex', gap: 18, justifyContent: 'center', marginTop: 26}}>
          {['モーター', 'PCU', 'システム制御'].map((chip, i) => <Panel key={chip} style={{padding: '12px 26px',
            fontSize: 31, fontWeight: 800, opacity: ramp(f, 30 + i * 14, 46 + i * 14)}}>{chip}</Panel>)}
        </div>
        <div style={{position: 'absolute', bottom: 30, left: 44, fontSize: 31, color: c.muted}}>期限内：2030年末・利用には契約</div>
      </Panel>
      <Guide scene={scene} x={1560} height={430} />
    </>;
    case 'peoplePanel': return <>
      <Panel style={{left: 130, top: 195, width: 1400, height: 590, padding: '36px 44px'}}>
        {scene.headline ? <div style={{fontSize: 46, fontWeight: 900}}>{scene.headline}</div> : null}
        <div style={{display: 'flex', gap: 30, marginTop: 70}}>
          {[0, 1, 2, 3, 4].map((i) => <div key={i} style={{opacity: ramp(f, 20 + i * 14, 36 + i * 14)}}><IconDraw kind="people" /></div>)}
          <svg width={120} height={120} style={{marginTop: 10}}>
            <path d="M10 60 H96 M74 34 L104 60 L74 86" fill="none" stroke={c.gold} strokeWidth={13} opacity={ramp(f, 60, 80)} />
          </svg>
        </div>
        <div style={{fontSize: 34, marginTop: 60}}>役割を担える車を、広く。</div>
      </Panel>
      <Guide scene={scene} x={1560} height={430} />
    </>;
    case 'questionRecap': return <>
      <Panel style={{left: 460, top: 150, width: 1000, padding: '30px', textAlign: 'center'}}>
        <div style={{fontSize: 36, color: c.muted}}>冒頭の問い</div>
        <div style={{fontSize: 52, fontWeight: 900, marginTop: 14}}>「日本は、遅れていないの？」</div>
      </Panel>
      <OpeningTalk scene={scene} />
    </>;
    case 'flowDiagram': return <FlowDiagram scene={scene} />;
    case 'cardsRow': return <CardsRow scene={scene} />;
    case 'barsChart': return <BarsChart scene={scene} />;
    case 'timelineShow': return <TimelineShow scene={scene} />;
    case 'finale': return <TimelineShow scene={{...scene, finale: true}} />;
    default: return <Panel style={{left: 130, top: 230, width: 1650, height: 430, padding: '36px 40px'}}>
      <div style={{fontSize: 42, fontWeight: 800}}>{scene.headline ?? scene.chapter}</div>
    </Panel>;
  }
};

const ToyotaSceneView = ({scene}: {scene: ToyotaScene}) => {
  const street = ['openingTalk', 'answerTitle', 'conference', 'carReveal', 'worldFirstStamps',
    'carAnnounce', 'driveShot', 'exportShip', 'questionRecap', 'finale'].includes(scene.visual);
  const mode = scene.visual === 'g21Meeting' || scene.visual === 'prototypeWorkshop' ? 'workshop'
    : street ? 'street' : 'diagram';
  return <AbsoluteFill style={{fontFamily: '"Studio Noto Sans JP", sans-serif', color: c.ink}}>
    <Backdrop mode={mode} />
    <Visual scene={scene} />
    <Label style={{position: 'absolute', top: 36, left: 55, fontSize: 29, borderRadius: 999}}>{scene.chapter}</Label>
    {scene.year ? <Label style={{position: 'absolute', top: 36, right: 55, borderRadius: 999, background: c.blue}}>{scene.year}年</Label> : null}
    <SubtitleView scene={scene} />
  </AbsoluteFill>;
};

// 字幕はcue。話者交代で切替し、ナレーションはチップなし、説明キャラ・登場人物は話者名チップ付き。
const SubtitleView = ({scene}: {scene: ToyotaScene}) => {
  const f = useCurrentFrame();
  const cue = (scene.cues ?? []).find((q) => f >= Math.round(q.start * FPS) && f < Math.round(q.end * FPS));
  if (!cue) return null;
  const chip = cue.speaker !== 'ナレ2';
  return <div style={{position: 'absolute', bottom: 43, left: 95, right: 95, display: 'flex', justifyContent: 'center', opacity: ramp(f, 0, 5)}}>
    <div style={{background: '#293747F5', color: c.white, borderRadius: 16, padding: '20px 38px 22px',
      fontSize: 43, fontWeight: 800, lineHeight: 1.4, whiteSpace: 'pre-line', textAlign: 'center', maxWidth: 1690}}>
      {chip ? <span style={{background: c.gold, color: c.ink, borderRadius: 10, fontSize: 30,
        padding: '3px 16px', marginRight: 18, verticalAlign: 'baseline'}}>{cue.speaker}</span> : null}
      {cue.text}
    </div>
  </div>;
};

export const LongformToyota01V10 = () => {
  useStudioFont();
  let elapsed = 0;
  const starts = toyota01V10Scenes.map((s) => {const start = elapsed; elapsed += sceneFrames(s); return start;});
  return <AbsoluteFill style={{background: c.paper}}>
    <Series>{toyota01V10Scenes.map((scene) => <Series.Sequence key={scene.id} durationInFrames={sceneFrames(scene)}>
      <ToyotaSceneView scene={scene} />
    </Series.Sequence>)}</Series>
    {toyota01V10Scenes.map((scene, i) => scene.audio ? <Sequence key={scene.id} from={starts[i] + 12}
      durationInFrames={sceneFrames(scene) - 12}><Audio src={staticFile(scene.audio.src)} /></Sequence> : null)}
  </AbsoluteFill>;
};
