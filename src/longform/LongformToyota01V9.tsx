import {AbsoluteFill, Audio, Img, Series, staticFile, useCurrentFrame, cancelRender, continueRender, delayRender, interpolate, Sequence} from 'remotion';
import {useEffect, useState, type CSSProperties, type ReactNode} from 'react';
import {z} from 'zod';
import toyota01Json from '../data/longform/toyota01-v9.json';

// 16:9 / 30fps。画面外ナレーター・説明役・物語の登場人物を分ける。
const FPS = 30;
const c = {ink: '#293747', paper: '#F5F0E5', white: '#FFFCF5', blue: '#437B9D', light: '#D4E7EB',
  gold: '#D9AB56', red: '#AC5144', muted: '#687885', green: '#72998C', line: '#AAB8B6'};
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ramp = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], clamp);
const sceneSchema = z.object({
  id: z.string().regex(/^[01]-\d{1,2}$/),
  chapter: z.string().min(1),
  year: z.string().min(4).max(4).nullable().optional(),
  visual: z.string().min(1),
  seconds: z.number().min(1).max(30),
  subtitle: z.string().min(1),
  character: z.enum(['luno', 'miino', 'kano']).nullable().optional(),
  guide: z.enum(['luno', 'miino', 'kano']).nullable().optional(),
  actor: z.enum(['engineer', 'akio-toyoda']).nullable().optional(),
  desaturated: z.boolean().nullable().optional(),
  recolor: z.boolean().nullable().optional(),
  tags: z.array(z.string().min(1).max(12)).nullable().optional(),
  stamps: z.array(z.string().min(1).max(12)).nullable().optional(),
  stamp: z.string().min(1).max(16).nullable().optional(),
  parts: z.array(z.string().min(1).max(12)).nullable().optional(),
  patentCount: z.number().int().min(0).max(1000000).nullable().optional(),
  patentCards: z.number().int().min(0).max(30).nullable().optional(),
  count: z.number().int().min(0).max(100000).nullable().optional(),
  audio: z.object({src: z.string().min(1), seconds: z.number().min(0.1),
    speaker: z.enum(['narrator', 'luno', 'miino', 'kano']).optional()}).nullable().optional(),
});
const parsed = z.object({
  title: z.string().min(1),
  note: z.string().optional(),
  narrator: z.object({id: z.literal('narrator'), label: z.string().min(1), credit: z.string().min(1)}).optional(),
  durationFrames: z.number().int().min(1).optional(),
  scenes: z.array(sceneSchema).min(1).max(20),
}).parse(toyota01Json);
type ToyotaScene = Readonly<z.infer<typeof sceneSchema>>;
export const toyota01Scenes = parsed.scenes;
const sceneFrames = (s: ToyotaScene) => Math.round(s.seconds * FPS);
export const toyota01DurationFrames = toyota01Scenes.reduce((sum, s) => sum + sceneFrames(s), 0);

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

// 可変矩形でスプライトを切り出す。短い登場後は足位置を固定する。
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

// 架空の無名技術者。特定人物の容姿や発言を再現しない。
const Engineer = () => <>
  <svg width={315} height={500} viewBox="0 0 340 540" style={{position: 'absolute', left: 1435, top: 320}}>
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
  <Label style={{position: 'absolute', right: 100, top: 220, fontSize: 29, background: c.blue}}>技術者（イメージ）</Label>
</>;

const StoryActor = ({actor}: {actor: ToyotaScene['actor']}) => {
  if (actor === 'engineer') return <Engineer />;
  if (actor !== 'akio-toyoda') return null;
  return <>
    <svg width={340} height={28} style={{position: 'absolute', left: 1460, top: 794}}><Shadow x={170} y={14} w={235} h={22} /></svg>
    <Img src={staticFile('assets/people/akio-toyoda-v1.png')}
      style={{position: 'absolute', left: 1430, top: 220, width: 400, height: 600, objectFit: 'contain', objectPosition: 'center bottom'}} />
    <Panel style={{position: 'absolute', right: 70, top: 116, padding: '8px 28px', lineHeight: 1.15, textAlign: 'center'}}>
      <div style={{fontSize: 37, fontWeight: 900}}>豊田章男</div>
      <div style={{fontSize: 27, marginTop: 6}}>トヨタ自動車 会長</div>
    </Panel>
  </>;
};
const guideOf = (scene: ToyotaScene) => scene.guide ?? scene.character;
const Guide = ({scene, x, height, pose}: {scene: ToyotaScene; x: number; height: number; pose?: 'neutral' | 'explain' | 'react'}) => {
  const who = guideOf(scene);
  if (!who) return null;
  return <>
    <Character who={who} x={x} height={height} pose={pose} />
    <Label style={{position: 'absolute', right: 55, top: 134, fontSize: 25, background: c.blue}}>
      解説役｜{({luno: 'ルーノ', miino: 'ミーノ', kano: 'カーノ'})[who]}
    </Label>
  </>;
};

const charName = {luno: 'ルーノ', miino: 'ミーノ', kano: 'カーノ'} as const;

// 冒頭の3キャラ掛け合い。街並みに3体並べ、話し手のみポーズとラベル色で強調する。
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

const Stamp = ({text, x, y, appear = 24}: {text: string; x: number; y: number; appear?: number}) => {
  const f = useCurrentFrame(); const t = ramp(f, appear, appear + 12);
  return <div style={{position: 'absolute', left: x, top: y, border: `7px double ${c.red}`,
    borderRadius: 14, padding: '14px 30px', color: c.red, background: '#FFFCF5ED', fontSize: 51,
    fontWeight: 900, opacity: t, transform: `rotate(-7deg) scale(${1 + (1 - t) * 0.25})`}}>{text}</div>;
};
const Timeline = ({progress}: {progress: number}) => <svg width={1080} height={170} viewBox="0 0 1080 170">
  <path d="M55 100 H1025" stroke={c.line} strokeWidth={12} strokeLinecap="round" />
  <path d={`M55 100 H${55 + progress * 970}`} stroke={c.gold} strokeWidth={12} strokeLinecap="round" />
  {[55, 1025].map((x) => <circle key={x} cx={x} cy={100} r={20} fill={c.white} stroke={c.ink} strokeWidth={5} />)}
  <text x={55} y={52} fontSize={36} fontWeight={800} fill={c.ink} textAnchor="middle">1997</text>
  <text x={1025} y={52} fontSize={36} fontWeight={800} fill={c.ink} textAnchor="middle">2026</text>
</svg>;

// 図は機能の組合せを説明する概念図。実車の内部構造・配線を表すものではない。
const PartIcon = ({kind, active = false}: {kind: number; active?: boolean}) => <svg width={220} height={145} viewBox="0 0 220 145"
  stroke={c.ink} strokeWidth={5} strokeLinejoin="round" fill={active ? '#E9BC63' : '#B9CBCB'}>
  {kind === 0 ? <>
    <path d="M34 48 H147 L171 69 V123 H31 V66 H16 V51 H34 Z" />
    <path d="M51 31 H139 V48 H51 Z M169 71 H199 V114 H171" />
    {[60, 84, 108, 132].map((x) => <path key={x} d={`M${x} 62 V106`} strokeWidth={3} />)}
    <circle cx={57} cy={118} r={8} fill={c.white} />
  </> : kind === 1 ? <>
    <rect x={33} y={37} width={139} height={92} rx={24} /><ellipse cx={172} cy={83} rx={20} ry={46} />
    <path d="M193 83 H215 M8 83 H33 M62 48 V116 M91 48 V116 M120 48 V116" strokeWidth={4} />
  </> : <>
    <rect x={22} y={39} width={177} height={89} rx={10} />
    <path d="M43 26 H70 V39 M151 26 H178 V39" />
    <path d="M61 65 V101 M43 83 H79 M145 83 H180" stroke={c.ink} strokeWidth={6} />
  </>}
</svg>;

const Mechanism = ({scene}: {scene: ToyotaScene}) => {
  const f = useCurrentFrame();
  const active = f < 64 ? 0 : f < 111 ? 1 : 2;
  return <>
    <Panel style={{left: 100, top: 175, width: 1320, height: 575, padding: '28px 35px'}}>
      <Label>エンジンとモーターを組み合わせる</Label>
      <svg width={1240} height={340} style={{position: 'absolute', top: 102, left: 36}}>
        <path d="M220 165 H604 M800 165 H1020" stroke={c.line} strokeWidth={10} />
        <path d="M220 165 H604" stroke={c.gold} strokeWidth={10} opacity={ramp(f, 46, 63)} />
        <path d="M800 165 H1020" stroke={c.gold} strokeWidth={10} opacity={ramp(f, 95, 112)} />
      </svg>
      {['エンジン', 'モーター', '電池'].map((p, i) => <div key={p} style={{position: 'absolute', top: 173,
        left: 40 + i * 420, width: 340, textAlign: 'center', borderRadius: 20,
        background: active === i ? '#F8E8BD' : c.white, border: `3px solid ${active === i ? c.gold : c.line}`,
        padding: '12px 0', opacity: ramp(f, 8 + i * 13, 20 + i * 13)}}>
        <PartIcon kind={i} active={active === i} /><div style={{fontSize: 39, fontWeight: 800}}>{p}</div>
      </div>)}
      <div style={{position: 'absolute', bottom: 30, left: 40, right: 40, fontSize: 29, color: c.muted,
        textAlign: 'center'}}>組合せを示す概念図</div>
    </Panel>
    <Guide scene={scene} x={1510} height={440} />
  </>;
};

const PatentFlow = ({scene, many}: {scene: ToyotaScene; many: boolean}) => {
  const f = useCurrentFrame();
  const t = ramp(f, 16, 58);
  return <>
    <Panel style={{left: 115, top: 174, width: 1670, height: 590}}>
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
        <div style={{fontSize: 88, fontWeight: 900, whiteSpace: 'nowrap'}}>{many ? '約' : ''}{scene.patentCount?.toLocaleString('en-US')}件</div>
        <Label style={{background: c.green, marginTop: 18, fontSize: 43}}>無償開放</Label>
        {many ? <div style={{fontSize: 31, marginTop: 26, fontWeight: 800}}>期限：2030年末</div> : null}
      </div>
      <div style={{position: 'absolute', bottom: 25, left: 45, fontSize: 29, color: c.muted}}>保有する技術を、使える技術へ</div>
    </Panel>
  </>;
};

const Visual = ({scene}: {scene: ToyotaScene}) => {
  const f = useCurrentFrame();
  switch (scene.visual) {
    case 'openingTalk': case 'answerTitle': return <>
      {scene.visual === 'openingTalk' ? <OpeningTalk scene={scene} /> : <>
        <div style={{position: 'absolute', left: 440, right: 440, top: 176, textAlign: 'center'}}>
          <Label style={{display: 'inline-block', fontSize: 38, background: c.blue}}>1997年12月</Label>
          <div style={{fontSize: 98, fontWeight: 900, marginTop: 18, letterSpacing: 6}}>二つの答え</div>
        </div>
        <div style={{position: 'absolute', left: 160, top: 380}}><Hall scale={0.83} /></div>
        <svg width={650} height={400} style={{position: 'absolute', left: 1100, top: 425}}><Factory scale={1.1} /></svg>
        <div style={{position: 'absolute', left: 385, top: 760, fontSize: 33, fontWeight: 800}}>世界の枠組み</div>
        <div style={{position: 'absolute', left: 1320, top: 760, fontSize: 33, fontWeight: 800}}>一台の車</div>
      </>}
    </>;
    case 'conference': case 'adoptStamp': return <>
      <div style={{position: 'absolute', left: 250, top: 270}}><Hall scale={1.2} /></div>
      <Panel style={{left: 1150, top: 255, width: 530, padding: '36px', textAlign: 'center'}}>
        <div style={{fontSize: 38, color: c.muted}}>京都の会議場</div>
        <div style={{fontSize: 62, fontWeight: 900, marginTop: 20}}>京都議定書</div>
        <div style={{fontSize: 34, marginTop: 20}}>温暖化に、世界の枠組みを。</div>
      </Panel>
      {scene.visual === 'adoptStamp' ? <Stamp text={scene.stamp ?? ''} x={1110} y={610} /> : null}
    </>;
    case 'carReveal': return <>
      <div style={{position: 'absolute', left: 300, top: 454,
        transform: `translateX(${(1 - ramp(f, 0, 24)) * -60}px)`}}><Car scale={1.4} /></div>
      <Label style={{position: 'absolute', left: 430, top: 300, background: c.blue}}>トヨタの答えは、一台の車。</Label>
      {scene.actor ? <StoryActor actor={scene.actor} /> : <Guide scene={scene} x={1390} height={480} />}
    </>;
    case 'skepticTags': return <>
      <div style={{position: 'absolute', left: 410, top: 480}}><Car scale={1.4} muted /></div>
      {(scene.tags ?? []).map((tag, i) => <Panel key={tag} style={{left: 380 + i * 590, top: 240,
        padding: '24px 38px', fontSize: 45, fontWeight: 800, opacity: ramp(f, 8 + i * 18, 23 + i * 18)}}>{tag}？</Panel>)}
    </>;
    case 'evArrow': return <>
      <Panel style={{left: 130, top: 230, width: 1650, height: 440}}>
        <Label style={{position: 'absolute', left: 38, top: 30, background: c.muted}}>向けられた声</Label>
        <div style={{position: 'absolute', left: 70, top: 180, fontSize: 54, fontWeight: 800}}>ハイブリッド</div>
        <svg width={670} height={150} style={{position: 'absolute', left: 560, top: 170}}>
          <path d={`M20 70 H${20 + ramp(f, 8, 38) * 570}`} stroke={c.ink} strokeWidth={12} />
          <path d="M560 39 L610 70 L560 101" fill="none" stroke={c.ink} strokeWidth={12} opacity={ramp(f, 25, 38)} />
        </svg>
        <div style={{position: 'absolute', left: 1340, top: 145, fontSize: 104, fontWeight: 900}}>EV</div>
      </Panel>
      <div style={{position: 'absolute', left: 455, top: 700, fontSize: 38, color: c.muted}}>「電気に乗り換えればいい」</div>
    </>;
    case 'reborn': return <>
      <Label style={{position: 'absolute', left: 310, top: 220, background: c.blue}}>29年を、作り直す。</Label>
      <div style={{position: 'absolute', left: 1060, top: 175, fontSize: 136, fontWeight: 900}}>2026</div>
      <Label style={{position: 'absolute', left: 1260, top: 360, background: c.gold, color: c.ink}}>第6世代</Label>
      <div style={{position: 'absolute', left: 320, top: 485}}><Car scale={1.4} /></div>
      <StoryActor actor={scene.actor} />
    </>;
    case 'timelinePreview': case 'timelineEnd': return <>
      <Panel style={{left: 110, top: 220, width: 1280, height: 500, padding: '42px'}}>
        <div style={{fontSize: 55, fontWeight: 900}}>{scene.visual === 'timelinePreview' ? '物語は、29年前へ。' : '一台の答えが、今につながる。'}</div>
        <div style={{position: 'absolute', left: 90, top: 240}}><Timeline progress={ramp(f, 8, 55)} /></div>
      </Panel>
      <Guide scene={scene} x={1505} height={440} pose={scene.visual === 'timelineEnd' ? 'react' : 'explain'} />
      {scene.visual === 'timelineEnd' ? <>
        <Label style={{position: 'absolute', right: 180, top: 200}}>つづく</Label>
        {parsed.narrator ? <Label style={{position: 'absolute', left: 150, top: 790, fontSize: 25, background: c.blue}}>
          ナレーション（画面外）｜{parsed.narrator.credit}
        </Label> : null}
        <Label style={{position: 'absolute', left: 740, top: 790, fontSize: 25, background: c.blue}}>
          掛け合い｜VOICEVOX:櫻歌ミコ／冥鳴ひまり／雨晴はう
        </Label>
      </> : null}
    </>;
    case 'chapterCard': return <Panel style={{left: 260, top: 275, width: 1400, padding: '60px', textAlign: 'center', opacity: ramp(f, 0, 12)}}>
      <div style={{fontSize: 40, color: c.blue, fontWeight: 800}}>第1章</div>
      <div style={{fontSize: 83, fontWeight: 900, marginTop: 22}}>1997年、二つの答え</div>
    </Panel>;
    case 'globeCO2': return <>
      <Panel style={{left: 180, top: 190, width: 1540, height: 560}}>
        <svg width={520} height={480} viewBox="0 0 520 480" style={{position: 'absolute', left: 85, top: 38}}>
          <circle cx={250} cy={235} r={185} fill={c.light} stroke={c.ink} strokeWidth={6} />
          <path d="M138 92 L203 76 L248 125 L227 183 L161 204 L123 162 Z M274 216 L324 191 L358 228 L327 304 L277 357 L253 300 Z" fill={c.green} stroke={c.ink} strokeWidth={3} />
          <ellipse cx={250} cy={235} rx={185} ry={72} fill="none" stroke={c.ink} strokeWidth={3} opacity={0.4} />
        </svg>
        <div style={{position: 'absolute', left: 715, top: 100, fontSize: 48, fontWeight: 800}}>世界共通の目標</div>
        <div style={{position: 'absolute', left: 710, top: 205, fontSize: 118, fontWeight: 900, color: c.blue}}>CO₂ ↓</div>
        <div style={{position: 'absolute', left: 710, top: 400, fontSize: 40}}>温室効果ガスを減らす</div>
      </Panel>
    </>;
    case 'partsLabels': return <Mechanism scene={scene} />;
    case 'worldFirstStamps': return <>
      <Label style={{position: 'absolute', top: 205, left: 570}}>1997年12月　プリウス発売</Label>
      <div style={{position: 'absolute', left: 420, top: 460}}><Car scale={1.6} /></div>
      {(scene.stamps ?? []).map((s, i) => <Stamp key={s} text={s} x={420 + i * 800} y={350} appear={24 + i * 18} />)}
    </>;
    case 'patentFly2015': return <PatentFlow scene={scene} many={false} />;
    case 'patentSwarm2019': return <PatentFlow scene={scene} many />;
    case 'freeStamp': return <>
      <Guide scene={scene} x={1490} height={490} />
      <Panel style={{left: 110, top: 225, width: 1190, height: 500, padding: '48px'}}>
        <div style={{fontSize: 56, fontWeight: 900}}>技を配り、道を開く。</div>
        <div style={{fontSize: 36, marginTop: 34, color: c.muted}}>独り占めせず、次へつなげる。</div>
      </Panel>
      <Stamp text={scene.stamp ?? ''} x={690} y={500} />
    </>;
    case 'count15m': return <>
      <Panel style={{left: 240, top: 175, width: 1440, height: 590, textAlign: 'center', padding: '35px'}}>
        <div style={{fontSize: 43, fontWeight: 800}}>ハイブリッド世界累計</div>
        <div style={{fontSize: 144, fontWeight: 900, color: c.blue, marginTop: 12}}>1,500万台超</div>
        <div style={{display: 'flex', justifyContent: 'center', gap: 14, marginTop: 12}}>
          {[0, 1, 2, 3].map((i) => <div key={i} style={{opacity: ramp(f, 8 + i * 10, 20 + i * 10)}}><Car scale={0.43} /></div>)}
        </div>
      </Panel>
    </>;
    default: return null;
  }
};

const ToyotaSceneView = ({scene}: {scene: ToyotaScene}) => {
  const f = useCurrentFrame();
  const gray = scene.desaturated ? 0.85 : scene.recolor ? 0.85 * (1 - ramp(f, 0, 40)) : 0;
  const street = ['openingTalk', 'answerTitle', 'conference', 'adoptStamp', 'carReveal', 'skepticTags', 'worldFirstStamps'].includes(scene.visual);
  const mode = scene.visual === 'reborn' || scene.visual === 'partsLabels' ? 'workshop' : street ? 'street' : 'diagram';
  return <AbsoluteFill style={{fontFamily: '"Studio Noto Sans JP", sans-serif', color: c.ink,
    filter: gray > 0 ? `grayscale(${gray})` : undefined}}>
    <Backdrop mode={mode} />
    <Visual scene={scene} />
    <Label style={{position: 'absolute', top: 36, left: 55, fontSize: 29, borderRadius: 999}}>{scene.chapter}</Label>
    {scene.year ? <Label style={{position: 'absolute', top: 36, right: 55, borderRadius: 999, background: c.blue}}>{scene.year}年</Label> : null}
    <div style={{position: 'absolute', bottom: 43, left: 95, right: 95, display: 'flex', justifyContent: 'center', opacity: ramp(f, 0, 7)}}>
      <div style={{background: '#293747F5', color: c.white, borderRadius: 16, padding: '22px 38px',
        fontSize: 43, fontWeight: 800, lineHeight: 1.4, whiteSpace: 'pre-line', textAlign: 'center', maxWidth: 1690}}>{scene.subtitle}</div>
    </div>
  </AbsoluteFill>;
};

export const LongformToyota01V9 = () => {
  useStudioFont();
  let elapsed = 0;
  const starts = toyota01Scenes.map((s) => {const start = elapsed; elapsed += sceneFrames(s); return start;});
  return <AbsoluteFill style={{background: c.paper}}>
    <Series>{toyota01Scenes.map((scene) => <Series.Sequence key={scene.id} durationInFrames={sceneFrames(scene)}>
      <ToyotaSceneView scene={scene} />
    </Series.Sequence>)}</Series>
    {toyota01Scenes.map((scene, i) => scene.audio ? <Sequence key={scene.id} from={starts[i] + 12}
      durationInFrames={sceneFrames(scene) - 12}><Audio src={staticFile(scene.audio.src)} /></Sequence> : null)}
  </AbsoluteFill>;
};
