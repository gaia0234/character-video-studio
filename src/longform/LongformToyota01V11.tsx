import {AbsoluteFill, Audio, Img, Series, staticFile, useCurrentFrame, cancelRender, continueRender, delayRender, interpolate, Sequence} from 'remotion';
import {useEffect, useState, type CSSProperties, type ReactNode} from 'react';
import {z} from 'zod';
import toyota01Json from '../data/longform/toyota01-v11.json';
import {ToyotaTHSCutaway} from './ToyotaTHSCutaway';
import {ToyotaHybridDriving} from './ToyotaHybridDriving';
import {ToyotaPriusRegeneration} from './ToyotaPriusRegeneration';

// V11（5区間・35scene・自然会話版）。V10の部品を受け継ぎ、キャラは大人紳士3体へ差し替える。
const FPS = 30;
const c = {ink: '#293747', paper: '#F5F0E5', white: '#FFFCF5', blue: '#437B9D', light: '#D4E7EB',
  gold: '#D9AB56', red: '#AC5144', muted: '#4B5A67', green: '#72998C', line: '#AAB8B6'};
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ramp = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], clamp);

const iconKind = z.enum(['engine', 'motor', 'battery', 'wheel', 'split', 'people', 'car', 'factory', 'plant', 'job', 'tech']);
const nodeSchema = z.object({label: z.string().min(1).max(12), t: z.string().max(10).optional(),
  x: z.number().min(0).max(1600), y: z.number().min(0).max(500), icon: iconKind});
const sceneSchema = z.object({
  id: z.string().regex(/^s\d{2}$/),
  chapter: z.string().min(1),
  chapterNo: z.number().int().min(0).max(7),
  year: z.string().max(4).nullable().optional(),
  visual: z.string().min(1),
  part: z.number().int().min(1).max(5).optional(),
  sceneTitle: z.string().max(40).optional(),
  v10Id: z.string().max(6).optional(),
  facts: z.array(z.string().max(6)).max(8).optional(),
  seconds: z.number().min(1).max(60),
  plannedSeconds: z.number().min(1).max(60),
  frames: z.number().int().min(15).max(1800),
  character: z.enum(['luno', 'miino', 'kano']).nullable().optional(),
  guide: z.enum(['luno', 'miino', 'kano']).nullable().optional(),
  audio: z.object({src: z.string().min(1), seconds: z.number().min(0.1)}).nullable().optional(),
  cues: z.array(z.object({start: z.number().min(0), end: z.number().min(0),
    speaker: z.enum(['ナレ2', 'ホーマー', 'ジャッド', 'ケント']), text: z.string().min(1).max(70)})).max(60).optional(),
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
const sceneData = z.object({
  title: z.string().min(1),
  note: z.string().optional(),
  narrator: z.object({id: z.literal('narrator'), label: z.string().min(1), credit: z.string().min(1)}).optional(),
  audioSpec: z.object({fps: z.literal(30), startSeconds: z.number(), tailSeconds: z.number()}).optional(),
  credits: z.object({narration: z.string(), dialogue: z.string()}).optional(),
  durationFrames: z.number().int().min(1).optional(),
  scenes: z.array(sceneSchema).min(1).max(60),
});
const parsedResult = sceneData.safeParse(toyota01Json);
if (!parsedResult.success) {
  throw new Error('V11SCHEMA ' + JSON.stringify(parsedResult.error.issues.slice(0, 8)));
}
const parsed = parsedResult.data;
type ToyotaScene = Readonly<z.infer<typeof sceneSchema>>;
export const toyota01V11Scenes = parsed.scenes;
const sceneFrames = (s: ToyotaScene) => Math.round(s.seconds * FPS);
// ナレーションで時間が進むように、部内のscene順で 昼→昼→夕→夜 を巡らせる。
const sceneTone = (scene: ToyotaScene): Tone => {
  const inPart = toyota01V11Scenes.filter((s) => s.part === scene.part).findIndex((s) => s.id === scene.id);
  const cycle: Tone[] = ['day', 'day', 'evening', 'night'];
  return cycle[Math.floor(Math.max(0, inPart) / 2) % cycle.length];
};
export const toyota01V11DurationFrames = toyota01V11Scenes.reduce((sum, s) => sum + sceneFrames(s), 0);

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

// 大人紳士3体（ホーマー/ジャッド/ケント）。立ち絵は参照3面図の前面ビューを再切出ししたもの。
const elderFile = {ホーマー: 'homer', ジャッド: 'judd', ケント: 'kent'} as const;
const elderColor = {ホーマー: '#C8322C', ジャッド: '#2B5FA8', ケント: '#2E7D4F'} as const;
const elderRatio = {ホーマー: 368 / 996, ジャッド: 290 / 1052, ケント: 380 / 1046} as const;
const elderSideRatio = {ホーマー: 281 / 996, ジャッド: 369 / 1062, ケント: 294 / 1038} as const;
const elderPos = {ジャッド: 300, ホーマー: 860, ケント: 1420} as const;
type ElderWho = keyof typeof elderFile;
// 前面＝発話中、側面＝聞き役。側面は左向きの原画なので、話し手が右なら反転する。
const Elder = ({who, x, height, bottom = 150, dim = false, speaking = false,
  pose = 'front', flip = false}: {
  who: ElderWho; x: number; height: number; bottom?: number; dim?: boolean; speaking?: boolean;
  pose?: 'front' | 'side'; flip?: boolean;
}) => {
  const f = useCurrentFrame();
  const side = pose === 'side';
  const width = height * (side ? elderSideRatio[who] : elderRatio[who]);
  const centerShift = (height * elderRatio[who] - width) / 2;
  // 字幕帯（y>=850）より上に、靴・杖・傘を含む全身を収める。
  const safeBottom = Math.max(bottom, 280);
  const bob = Math.sin(f / 16) * 3 + (speaking ? Math.sin(f / 7) * 4 : 0);
  const tilt = speaking ? Math.sin(f / 12) * 1.5 : 0;
  return <>
    <Img src={staticFile(`assets/characters/elder-v11/${elderFile[who]}${side ? '-side' : ''}.png`)}
      style={{position: 'absolute', left: x + centerShift, bottom: safeBottom + bob, width, height,
        transform: `rotate(${tilt}deg) scaleX(${flip ? -1 : 1})`, transformOrigin: '50% 96%',
        opacity: (dim ? 0.45 : 1) * ramp(f, 0, 12)}} />
  </>;
};
const elderPoseFor = (who: ElderWho, cur?: string) => {
  if (cur === who) return {pose: 'front' as const, flip: false};
  const speakerX = cur && cur !== 'ナレ2' ? elderPos[cur as ElderWho] : 960;
  return {pose: 'side' as const, flip: elderPos[who] < speakerX};
};
const ElderCast = ({cur, height, bottom}: {cur?: string; height: number; bottom: number}) => (
  <>{(['ジャッド', 'ホーマー', 'ケント'] as const).map((w) => {
    const p = elderPoseFor(w, cur);
    return <Elder key={w} who={w} x={elderPos[w]} height={height} bottom={bottom}
      speaking={cur === w} pose={p.pose} flip={p.flip} />;
  })}</>
);
const ElderRow = ({scene, bottom = 150, height = 380}: {scene: ToyotaScene; bottom?: number; height?: number}) => {
  const f = useCurrentFrame();
  const cue = (scene.cues ?? []).find((q) => f >= Math.round(q.start * FPS) && f < Math.round(q.end * FPS));
  const who = cue && cue.speaker !== 'ナレ2' ? (cue.speaker as ElderWho) : null;
  if (!who) return null;
  return <Elder who={who} x={1740} height={height} bottom={bottom} speaking />;
};
const guideOf = (scene: ToyotaScene) => scene.guide ?? scene.character;
const charName = {luno: 'ルーノ', miino: 'ミーノ', kano: 'カーノ'} as const;
const Guide = ({scene, x, height, pose}: {scene: ToyotaScene; x: number; height: number; pose?: 'neutral' | 'explain' | 'react'}) => {
  const who = guideOf(scene);
  if (!who) return null;
  return <>
    <Character who={who} x={x} height={height} bottom={280} pose={pose} />
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

// 大人紳士の剪影は题材に合わせてプリウス（2-boxハッチバック）とRAV4で分ける。
const Car = ({scale = 1, muted = false, variant = 'prius'}: {scale?: number; muted?: boolean; variant?: 'prius' | 'rav4'}) => {
  const body = muted ? '#C2C9C9' : '#E9EBDF';
  const glass = muted ? '#A2ADB4' : '#ACD4E1';
  const badge = variant === 'rav4' ? 'RAV4' : 'PRIUS';
  const wheelR = variant === 'rav4' ? 38 : 32;
  const wheelY = variant === 'rav4' ? 210 : 214;
  const wheelXs = variant === 'rav4' ? [146, 470] : [150, 466];
  return (
  <svg width={640 * scale} height={270 * scale} viewBox="0 0 640 270">
    <Shadow x={322} y={244} w={580} h={30} />
    {variant === 'rav4' ? (
      <g>
        <path d="M38 180 L44 144 L94 136 L182 128 L240 74 Q248 66 260 66 H448 Q462 66 470 76 L516 122 L566 136 Q598 144 600 166 L598 188 Z"
          fill={body} stroke={c.ink} strokeWidth={5} strokeLinejoin="round" />
        <path d="M252 58 H450" stroke={c.ink} strokeWidth={5} strokeLinecap="round" />
        <path d="M196 124 L250 80 H332 V124 Z M344 80 H444 L496 124 H344 Z"
          fill={glass} stroke={c.ink} strokeWidth={4} strokeLinejoin="round" />
        <path d="M262 84 L222 122 M392 84 L344 122" stroke={c.white} strokeWidth={8} opacity={0.7} />
        <path d="M336 126 V184 M506 128 V184 M84 158 H566" fill="none" stroke={c.ink} strokeWidth={3} opacity={0.6} />
        <rect x={306} y={136} width={28} height={7} rx={3} fill={c.ink} />
        <rect x={452} y={136} width={28} height={7} rx={3} fill={c.ink} />
        <path d="M50 146 L96 138 L92 158 L52 160 Z" fill={c.gold} stroke={c.ink} strokeWidth={3} />
        <path d="M560 138 L588 146 L586 176 L558 172 Z" fill={c.red} stroke={c.ink} strokeWidth={3} />
        <path d="M48 200 H592 M540 182 H590" stroke={c.ink} strokeWidth={6} />
        <text x={330} y={178} fontSize={17} letterSpacing={3} fill={c.blue} fontWeight={800}>{badge}</text>
      </g>
    ) : (
      <g>
        <path d="M40 190 L46 162 L88 150 L176 140 L240 94 Q248 86 260 86 H414 Q430 86 438 96 L502 144 L556 154 Q588 160 590 180 L588 196 Z"
          fill={body} stroke={c.ink} strokeWidth={5} strokeLinejoin="round" />
        <path d="M418 84 L468 78 L474 90 L424 96 Z" fill={body} stroke={c.ink} strokeWidth={4} strokeLinejoin="round" />
        <path d="M190 136 L248 98 H322 V136 Z M334 98 H416 L470 136 H334 Z"
          fill={glass} stroke={c.ink} strokeWidth={4} strokeLinejoin="round" />
        <path d="M478 108 L508 140 L478 140 Z" fill={glass} stroke={c.ink} strokeWidth={4} strokeLinejoin="round" />
        <path d="M256 102 L216 134 M376 102 L332 134" stroke={c.white} strokeWidth={8} opacity={0.7} />
        <path d="M326 140 V202 M480 142 V202 M76 172 H556" fill="none" stroke={c.ink} strokeWidth={3} opacity={0.6} />
        <rect x={300} y={150} width={28} height={7} rx={3} fill={c.ink} />
        <rect x={440} y={150} width={28} height={7} rx={3} fill={c.ink} />
        <path d="M56 152 L94 146 L90 166 L58 168 Z" fill={c.gold} stroke={c.ink} strokeWidth={3} />
        <path d="M556 150 L580 158 L578 186 L552 184 Z" fill={c.red} stroke={c.ink} strokeWidth={3} />
        <path d="M50 208 H590 M540 190 H588" stroke={c.ink} strokeWidth={6} />
        <text x={330} y={192} fontSize={17} letterSpacing={3} fill={c.blue} fontWeight={800}>{badge}</text>
      </g>
    )}
    {wheelXs.map((x) => <g key={x}>
      <circle cx={x} cy={wheelY} r={wheelR} fill={c.ink} />
      <circle cx={x} cy={wheelY} r={wheelR - 16} fill="#AEB7BA" stroke={c.white} strokeWidth={3} />
      {[0, 60, 120].map((a) => <path key={a} d={`M${x - (wheelR - 16)} ${wheelY} H${x + (wheelR - 16)}`} stroke={c.ink}
        strokeWidth={3} transform={`rotate(${a} ${x} ${wheelY})`} />)}
      <circle cx={x} cy={wheelY} r={5} fill={c.white} />
    </g>)}
  </svg>
  );
};

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

// 積み木（○△□）をマーカー線で描いた背景。紙の質感と手描きの揺れを重ねる。
const MarkerFilters = () => (
  <svg width={0} height={0} style={{position: 'absolute'}} aria-hidden>
    <defs>
      <filter id="mkw" x="-8%" y="-8%" width="116%" height="116%">
        <feTurbulence type="fractalNoise" baseFrequency="0.014" numOctaves="2" seed="9" result="n" />
        <feDisplacementMap in="SourceGraphic" in2="n" scale="5" xChannelSelector="R" yChannelSelector="G" />
      </filter>
      <filter id="mkgrain">
        <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
    </defs>
  </svg>
);

type Tone = 'day' | 'evening' | 'night';
const tonePalette = (tone: Tone) => tone === 'night' ? {
  sky: '#3B4560', ground: '#2F364A', wall: ['#4C5670', '#57617B', '#454E66'], win: '#2C3345',
  lit: '#F0D68C', ink: '#EDE7D8', road: '#3A4257', sun: '#F2E4B8', cloud: '#535E7A',
} : tone === 'evening' ? {
  sky: '#F4DEC2', ground: '#D8C4A6', wall: ['#EBD9BF', '#E2C9A8', '#F0E4CE'], win: '#C9D6D8',
  lit: '#F0C878', ink: c.ink, road: '#C4AE90', sun: '#EFBE6A', cloud: '#FBF1DF',
} : {
  sky: '#E8F0EC', ground: '#D5D1BF', wall: ['#EDE7D6', '#D9E2DA', '#E4DCC8'], win: '#B9D0D6',
  lit: '#EED79C', ink: c.ink, road: '#BEBBA9', sun: '#F2DFAC', cloud: '#FBF7EC',
};

// □の家＋△の屋根＋○の木。すべてマーカー線。
const BlockHouse = ({x, w, h, wall, win, lit, ink, windows = 6}: {
  x: number; w: number; h: number; wall: string; win: string; lit: string; ink: string; windows?: number;
}) => {
  const top = 790 - h;
  const cols = Math.max(2, Math.round(w / 90));
  const rows = Math.max(2, Math.round(h / 140));
  return <g>
    <path d={`M${x - 12} ${top} L${x + w / 2} ${top - w * 0.34} L${x + w + 12} ${top} Z`}
      fill={wall} stroke={ink} strokeWidth={6} />
    <rect x={x} y={top} width={w} height={h} fill={wall} stroke={ink} strokeWidth={6} />
    {Array.from({length: Math.min(windows, cols * rows)}, (_, i) => {
      const cx = x + 18 + (i % cols) * ((w - 36) / cols);
      const cy = top + 24 + Math.floor(i / cols) * ((h - 48) / rows);
      const on = (i + x) % 4 === 0;
      return <rect key={i} x={cx} y={cy} width={Math.min(46, (w - 36) / cols - 12)}
        height={Math.min(54, (h - 48) / rows - 14)} fill={on ? lit : win} stroke={ink} strokeWidth={3.5} />;
    })}
  </g>;
};

const BlockTree = ({x, scale = 1, leaf, ink}: {x: number; scale?: number; leaf: string; ink: string}) => (
  <g transform={`translate(${x} 790) scale(${scale})`}>
    <rect x={-16} y={-118} width={32} height={120} fill="#B9A98C" stroke={ink} strokeWidth={5} />
    <path d="M0 -320 L96 -150 H-96 Z" fill={leaf} stroke={ink} strokeWidth={6} />
    <path d="M0 -260 L76 -96 H-76 Z" fill={leaf} stroke={ink} strokeWidth={6} opacity={0.92} />
  </g>
);

const Backdrop = ({mode, tone = 'day'}: {mode: 'street' | 'workshop' | 'diagram'; tone?: Tone}) => {
  const p = tonePalette(tone);
  const night = tone === 'night';
  return <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute'}}>
    <rect width={1920} height={1080} fill={p.sky} />
    <g filter="url(#mkw)">
      {mode !== 'diagram' ? <>
      <circle cx={1530} cy={186} r={74} fill={p.sun} stroke={p.ink} strokeWidth={6} />
      {night ? [[520,92],[760,150],[1096,104],[1310,236]].map(([x, y], i) => (
        <path key={i} d={`M${x} ${y - 15} L${x + 14} ${y + 12} L${x - 14} ${y + 12} Z`} fill={p.lit} stroke={p.ink} strokeWidth={3} />
      )) : null}
      {[[742, 146, 44], [852, 176, 28], [1218, 148, 36], [1700, 208, 48]].map(([x, y, r], i) => (
        <circle key={i} cx={x} cy={y} r={r} fill={p.cloud} stroke={p.ink} strokeWidth={5} />
      ))}
      </> : null}
      {mode === 'street' ? <>
        <BlockHouse x={40} w={200} h={420} wall={p.wall[0]} win={p.win} lit={p.lit} ink={p.ink} windows={8} />
        <BlockHouse x={268} w={150} h={300} wall={p.wall[1]} win={p.win} lit={p.lit} ink={p.ink} windows={6} />
        <BlockHouse x={1520} w={170} h={360} wall={p.wall[1]} win={p.win} lit={p.lit} ink={p.ink} windows={6} />
        <BlockHouse x={1712} w={190} h={440} wall={p.wall[0]} win={p.win} lit={p.lit} ink={p.ink} windows={8} />
        <BlockTree x={660} scale={0.82} leaf={night ? '#4E6A62' : '#9FBF9A'} ink={p.ink} />
        <BlockTree x={1180} scale={0.92} leaf={night ? '#4E6A62' : '#9FBF9A'} ink={p.ink} />
        <rect x={0} y={790} width={1920} height={290} fill={p.ground} />
        <path d="M0 792 H1920" stroke={p.ink} strokeWidth={7} />
        <rect x={0} y={902} width={1920} height={112} fill={p.road} />
        <path d="M0 905 H1920 M0 1012 H1920" stroke={p.ink} strokeWidth={4} />
        {Array.from({length: 12}, (_, i) => <rect key={i} x={40 + i * 162} y={948} width={86} height={12} fill={night ? '#6A7285' : '#EFE7D2'} />)}
      </> : mode === 'workshop' ? <>
        <rect x={90} y={300} width={1740} height={490} fill={p.wall[2]} stroke={p.ink} strokeWidth={7} />
        {[0, 1, 2, 3].map((i) => <path key={i} d={`M${120 + i * 430} 300 L${335 + i * 430} 200 L${550 + i * 430} 300 Z`}
          fill={p.wall[1]} stroke={p.ink} strokeWidth={7} />)}
        <rect x={1660} y={140} width={96} height={170} fill={p.wall[0]} stroke={p.ink} strokeWidth={6} />
        {Array.from({length: 10}, (_, i) => <rect key={i} x={140 + (i % 5) * 330} y={400 + Math.floor(i / 5) * 190}
          width={150} height={110} fill={i % 3 === 0 ? p.lit : p.win} stroke={p.ink} strokeWidth={4} />)}
        {[0, 1, 2].map((i) => <circle key={i} cx={420 + i * 540} cy={690} r={46} fill="none" stroke={p.ink} strokeWidth={8} />)}
        <rect x={0} y={790} width={1920} height={290} fill={p.ground} />
        <path d="M0 792 H1920" stroke={p.ink} strokeWidth={7} />
        {Array.from({length: 8}, (_, i) => <rect key={i} x={80 + i * 240} y={880} width={120} height={80} fill={p.wall[1]} stroke={p.ink} strokeWidth={5} />)}
      </> : <>
        <rect x={0} y={0} width={1920} height={1080} fill={night ? '#E9E4D6' : '#F5F0E5'} />
        <path d="M0 170 H1920 M0 780 H1920" stroke={p.ink} strokeWidth={3} opacity={0.25} />
        {Array.from({length: 20}, (_, i) => <path key={i} d={`M${i * 100} 175 V778`} stroke={p.ink} strokeWidth={2} opacity={0.12} />)}
        <circle cx={120} cy={930} r={44} fill="none" stroke={p.ink} strokeWidth={6} opacity={0.35} />
        <path d="M1800 900 L1850 980 L1750 980 Z" fill="none" stroke={p.ink} strokeWidth={6} opacity={0.35} />
        <rect x={130} y={860} width={78} height={78} fill="none" stroke={p.ink} strokeWidth={6} opacity={0.35} />
      </>}
    </g>
    <rect width={1920} height={1080} filter="url(#mkgrain)" opacity={0.05} style={{mixBlendMode: 'multiply'}} />
  </svg>;
};

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
// --- 技術カット図（実物感） -------------------------------------------------
const INK2 = '#2D3540';
const TechDefs = () => <defs>
  <linearGradient id="tMetal" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stopColor="#F2F5F8" /><stop offset="1" stopColor="#C6D0DA" />
  </linearGradient>
  <linearGradient id="tMetalDark" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stopColor="#CBD5DF" /><stop offset="1" stopColor="#9DABB9" />
  </linearGradient>
  <linearGradient id="tStudio" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stopColor="#F8FAFC" /><stop offset="0.68" stopColor="#E8EDF3" /><stop offset="1" stopColor="#D3DAE3" />
  </linearGradient>
  <linearGradient id="tCell" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stopColor="#F2C078" /><stop offset="1" stopColor="#C98433" />
  </linearGradient>
  <radialGradient id="tSun" cx="0.4" cy="0.35" r="0.7">
    <stop offset="0" stopColor="#F0C078" /><stop offset="1" stopColor="#C98634" />
  </radialGradient>
  <radialGradient id="tGlow" cx="0.5" cy="0.32" r="0.8">
    <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.9" /><stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
  </radialGradient>
</defs>;

// 部品は 200×150（中心 100,78）。金属の陰影・断面・落ち影で実物感を出す。
const PartArt = ({kind}: {kind: z.infer<typeof iconKind>}) => {
  if (kind === 'engine') return <g>
    <rect x="28" y="12" width="144" height="24" rx="7" fill="url(#tMetalDark)" stroke={INK2} strokeWidth="2.5" />
    <path d="M40 21 H160" stroke="#8C99A6" strokeWidth="2.5" />
    {[0, 1, 2, 3, 4].map((i) => <circle key={i} cx={40 + i * 30} cy={26} r="2.4" fill={INK2} opacity="0.5" />)}
    <rect x="24" y="36" width="152" height="68" rx="8" fill="url(#tMetal)" stroke={INK2} strokeWidth="2.5" />
    {[0, 1, 2, 3].map((i) => {
      const x = 36 + i * 34;
      return <g key={i}>
        <rect x={x} y="42" width="24" height="54" rx="4" fill="#6E7A87" stroke={INK2} strokeWidth="2" />
        <rect x={x + 3} y="50" width="18" height="23" rx="2.5" fill="url(#tCell)" stroke="#8A5A20" strokeWidth="1.4" />
        <path d={`M${x + 12} 73 V94`} stroke="#C8D2DC" strokeWidth="3.5" />
      </g>;
    })}
    <rect x="24" y="94" width="152" height="18" rx="7" fill="#A9B5C2" stroke={INK2} strokeWidth="2.5" />
    <circle cx="100" cy="104" r="12" fill="#C6D0DA" stroke={INK2} strokeWidth="2.5" />
    <circle cx="100" cy="104" r="4.5" fill={INK2} />
    <rect x="8" y="98" width="18" height="12" rx="3" fill="#8E9AA7" stroke={INK2} strokeWidth="2" />
  </g>;
  if (kind === 'split') return <g>
    <circle cx="100" cy="78" r="60" fill="url(#tMetalDark)" stroke={INK2} strokeWidth="2.5" />
    {Array.from({length: 44}).map((_, i) => {
      const a = (i * 360 / 44) * Math.PI / 180;
      return <path key={i} d={`M${100 + 47 * Math.cos(a)} ${78 + 47 * Math.sin(a)} L${100 + 56 * Math.cos(a)} ${78 + 56 * Math.sin(a)}`}
        stroke="#8A97A5" strokeWidth="3" strokeLinecap="round" />;
    })}
    <circle cx="100" cy="78" r="46" fill="#EDF1F5" stroke={INK2} strokeWidth="2" />
    {[90, 210, 330].map((deg) => {
      const a = (deg * Math.PI) / 180, px = 100 + 30 * Math.cos(a), py = 78 + 30 * Math.sin(a);
      return <g key={deg}>
        <circle cx={px} cy={py} r="15" fill="#C3CED9" stroke={INK2} strokeWidth="2" />
        {Array.from({length: 12}).map((_, k) => {
          const b = (k * 30) * Math.PI / 180;
          return <path key={k} d={`M${px + 13 * Math.cos(b)} ${py + 13 * Math.sin(b)} L${px + 15 * Math.cos(b)} ${py + 15 * Math.sin(b)}`}
            stroke="#8A97A5" strokeWidth="1.8" />;
        })}
        <circle cx={px} cy={py} r="3.4" fill={INK2} />
      </g>;
    })}
    <circle cx="100" cy="78" r="20" fill="url(#tSun)" stroke="#8A5A20" strokeWidth="2.5" />
    <circle cx="100" cy="78" r="7" fill={INK2} />
    <path d="M100 78 L100 26" stroke={INK2} strokeWidth="3" opacity="0.3" strokeLinecap="round" />
  </g>;
  if (kind === 'motor') return <g>
    <rect x="16" y="40" width="152" height="74" rx="18" fill="url(#tMetal)" stroke={INK2} strokeWidth="2.5" />
    <rect x="30" y="48" width="18" height="58" rx="6" fill="#9FAAB6" opacity="0.55" />
    <ellipse cx="174" cy="77" rx="14" ry="37" fill="url(#tMetalDark)" stroke={INK2} strokeWidth="2.5" />
    <rect x="52" y="24" width="34" height="17" rx="3" fill="#C9D3DD" stroke={INK2} strokeWidth="2" />
    <circle cx="92" cy="77" r="41" fill="#DDE4EB" stroke={INK2} strokeWidth="2" />
    {[37, 32, 27].map((r) => <circle key={r} cx="92" cy="77" r={r} fill="none" stroke="#B4C0CC" strokeWidth="1.2" />)}
    {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
      const a = (deg * Math.PI) / 180, px = 92 + 30 * Math.cos(a), py = 77 + 30 * Math.sin(a);
      return <rect key={deg} x={px - 4.5} y={py - 7} width="9" height="14" rx="2" transform={`rotate(${deg} ${px} ${py})`}
        fill="#C08B5C" stroke="#7A4B22" strokeWidth="1.2" />;
    })}
    <circle cx="92" cy="77" r="17" fill="url(#tMetalDark)" stroke={INK2} strokeWidth="2" />
    <circle cx="92" cy="77" r="5" fill={INK2} />
    <rect x="92" y="73" width="92" height="9" rx="4.5" fill="#96A3B0" stroke={INK2} strokeWidth="1.5" />
  </g>;
  if (kind === 'battery') return <g>
    <rect x="20" y="32" width="160" height="88" rx="9" fill="#3F4956" stroke={INK2} strokeWidth="2.5" />
    <rect x="24" y="34" width="152" height="12" rx="5" fill="#5A6675" />
    {[0, 1, 2].map((r) => [0, 1, 2, 3].map((cc) => {
      const cx = 44 + cc * 38, cy = 62 + r * 23;
      return <g key={`${r}-${cc}`}>
        <rect x={cx - 13} y={cy - 8.5} width="26" height="17" rx="8" fill="url(#tCell)" stroke="#8A5A20" strokeWidth="1.3" />
        <rect x={cx - 6} y={cy - 5.5} width="12" height="11" rx="5" fill="#F6D49A" opacity="0.5" />
      </g>;
    }))}
    <rect x="180" y="50" width="11" height="16" rx="3" fill="#C9D3DD" stroke={INK2} strokeWidth="2" />
    <rect x="180" y="86" width="11" height="16" rx="3" fill="#C9D3DD" stroke={INK2} strokeWidth="2" />
  </g>;
  if (kind === 'wheel') return <g>
    <circle cx="100" cy="78" r="55" fill="#333A44" stroke={INK2} strokeWidth="2.5" />
    <circle cx="100" cy="78" r="40" fill="url(#tMetalDark)" stroke={INK2} strokeWidth="2.5" />
    <circle cx="100" cy="78" r="26" fill="#DDE4EB" stroke={INK2} strokeWidth="2" />
    <circle cx="100" cy="78" r="8" fill={INK2} />
    {[0, 72, 144, 216, 288].map((deg) => {
      const a = (deg * Math.PI) / 180;
      return <circle key={deg} cx={100 + 17 * Math.cos(a)} cy={78 + 17 * Math.sin(a)} r="3.5" fill={INK2} />;
    })}
    <rect x="126" y="52" width="16" height="26" rx="4" fill="#E0A24B" stroke="#8A5A20" strokeWidth="2" />
  </g>;
  return <g transform="translate(2.5 13.5) scale(1.5)"><IconDraw kind={kind} /></g>;
};
const PartShadow = () => <ellipse cx="100" cy="140" rx="60" ry="8" fill={INK2} opacity="0.16" />;

type FlowRect = {x: number; y: number; w: number; h: number};
const flowCardSize = (label: string, t?: string | null) => ({w: Math.max(116, label.length * 31 + 36), h: t ? 78 : 52});
const rectsHit = (a: FlowRect, b: FlowRect) => a.x < b.x + b.w + 8 && b.x < a.x + a.w + 8 && a.y < b.y + b.h + 8 && b.y < a.y + a.h + 8;
const rectExit = (r: FlowRect, tx: number, ty: number) => {
  const cx = r.x + r.w / 2, cy = r.y + r.h / 2;
  const dx = tx - cx, dy = ty - cy;
  const k = Math.min(dx === 0 ? Infinity : (r.w / 2) / Math.abs(dx), dy === 0 ? Infinity : (r.h / 2) / Math.abs(dy));
  return {x: cx + dx * k, y: cy + dy * k};
};
// 注釈カードは部品・他のカード・右側の立ち絵に重ねない位置を選ぶ（データ固定なので結果は決定的）。
const FLOW_KEEPOUT: FlowRect = {x: 1236, y: 232, w: 158, h: 268};
const flowCardLayout = (flow: NonNullable<ToyotaScene['flow']>): FlowRect[] => {
  const parts: FlowRect[] = flow.nodes.map((n) => ({x: n.x - 120, y: n.y - 80, w: 240, h: 160}));
  const placed: FlowRect[] = [];
  const hit = (a: FlowRect, b: FlowRect) => Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x))
    * Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
  return flow.nodes.map((n, i) => {
    const {w, h} = flowCardSize(n.label, n.t);
    const cands: FlowRect[] = [
      {x: n.x - w / 2, y: n.y + 104}, {x: n.x - w / 2, y: n.y - 104 - h},
      {x: n.x + 136, y: n.y - h / 2}, {x: n.x - 136 - w, y: n.y - h / 2},
      {x: n.x - w / 2 - 74, y: n.y + 104}, {x: n.x - w / 2 + 74, y: n.y + 104},
      {x: n.x + 136, y: n.y - h / 2 - 56}, {x: n.x - 136 - w, y: n.y - h / 2 - 56},
    ].map((r) => ({...r, w, h}));
    const score = (r: FlowRect) => {
      let sc = 0;
      parts.forEach((p, j) => { if (j !== i) sc += hit(r, p) * 4; });
      placed.forEach((p) => { sc += hit(r, p) * 4; });
      sc += hit(r, FLOW_KEEPOUT) * 3;
      const out = Math.max(0, 8 - r.x) + Math.max(0, r.x + r.w - 1592)
        + Math.max(0, 8 - r.y) + Math.max(0, r.y + r.h - 486);
      return sc + out * out * 60;
    };
    const best = cands.reduce((a, b) => (score(b) < score(a) ? b : a));
    placed.push(best);
    return best;
  });
};

const FlowDiagram = ({scene}: {scene: ToyotaScene}) => {
  const f = useCurrentFrame();
  const flow = scene.flow!;
  const layout = flowCardLayout(flow);
  return <div style={{position: 'absolute', left: 115, top: 160, width: 1690, height: 590,
    background: '#FFFFFF', border: `4px solid ${c.ink}`, borderRadius: 26, overflow: 'hidden',
    boxShadow: '0 12px 0 #29374718'}}>
    {scene.headline ? <Label style={{position: 'absolute', top: 22, left: 30, fontSize: 38, zIndex: 3}}>{scene.headline}</Label> : null}
    {scene.stamp ? <div style={{position: 'absolute', top: 26, right: 34, zIndex: 3, fontSize: 34, fontWeight: 900,
      color: c.ink, background: '#FFF3CF', border: `3px solid ${c.ink}`, borderRadius: 12, padding: '6px 18px',
      transform: 'rotate(-2deg)'}}>{scene.stamp}</div> : null}
    <svg width={1690} height={590} viewBox="0 0 1690 590" style={{position: 'absolute', inset: 0}}>
      <TechDefs />
      <rect width={1690} height={590} fill="url(#tStudio)" />
      <g opacity="0.35">
        {Array.from({length: 33}).map((_, i) => <path key={`v${i}`} d={`M${i * 52} 0 V590`} stroke="#AEBAC7" strokeWidth="1" opacity="0.35" />)}
        {Array.from({length: 12}).map((_, i) => <path key={`h${i}`} d={`M0 ${i * 52} H1690`} stroke="#AEBAC7" strokeWidth="1" opacity="0.35" />)}
      </g>
      <ellipse cx="845" cy="498" rx="700" ry="54" fill="#8FA0B2" opacity="0.18" />
      <rect width={1690} height={590} fill="url(#tGlow)" />
      <path d="M0 500 H1690" stroke="#C3CCD6" strokeWidth="2" />
      <g transform="translate(45 45)">
        {(flow.edges ?? []).map((edge, i) => {
          const from = flow.nodes[edge.from];
          const to = flow.nodes[edge.to];
          if (!from || !to || edge.from === edge.to) return null;
          const dx = to.x - from.x, dy = to.y - from.y;
          const dist = Math.hypot(dx, dy) || 1;
          const appear = 10 + i * 22;
          const ux = dx / dist, uy = dy / dist;
          const hw = 108, hh = 80;
          const edgeOf = Math.min(hw / Math.max(0.0001, Math.abs(ux)), hh / Math.max(0.0001, Math.abs(uy)));
          const sx = from.x + ux * (edgeOf + 6), sy = from.y + uy * (edgeOf + 6);
          const tipX = to.x - ux * (edgeOf + 10), tipY = to.y - uy * (edgeOf + 10);
          const ang = Math.atan2(dy, dx) * 180 / Math.PI;
          const midX = (sx + tipX) / 2, midY = (sy + tipY) / 2;
          const len = Math.hypot(tipX - sx, tipY - sy);
          return <g key={i} opacity={ramp(f, appear, appear + 16)}>
            <path d={`M${sx} ${sy} L${tipX} ${tipY}`} stroke="#B7C1CC" strokeWidth={9} strokeLinecap="round" fill="none" />
            <path d={`M${sx} ${sy} L${tipX} ${tipY}`} stroke={c.gold} strokeWidth={9} strokeLinecap="round" fill="none"
              strokeDasharray={len} strokeDashoffset={(1 - ramp(f, appear + 6, appear + 48)) * len} />
            <g transform={`translate(${tipX} ${tipY}) rotate(${ang})`}>
              <path d="M-15 -11 L11 0 L-15 11 Z" fill={c.gold} stroke={INK2} strokeWidth="2" />
            </g>
            {edge.label ? (() => {
              const lw = flowCardSize(edge.label).w;
              const lx = Math.min(Math.max(midX, lw / 2 + 12), 1588 - lw / 2);
              return <g>
                <rect x={lx - lw / 2} y={midY - 25} width={lw} height={46} rx={9} fill="#FFFFFF" stroke="#8E9BA8" strokeWidth="2.5" />
                <text x={lx} y={midY + 10} fontSize={29} fontWeight={800} fill={c.ink} textAnchor="middle">{edge.label}</text>
              </g>;
            })() : null}
          </g>;
        })}
        {flow.nodes.map((node, i) => {
          const card = layout[i];
          const part: FlowRect = {x: node.x - 82, y: node.y - 60, w: 164, h: 120};
          const a = rectExit(part, card.x + card.w / 2, card.y + card.h / 2);
          const b = rectExit(card, node.x, node.y);
          const move = Math.min(1, 10 / Math.max(1, Math.hypot(b.x - a.x, b.y - a.y)));
          return <g key={node.label + 'lnk' + i} opacity={ramp(f, 18 + i * 8, 30 + i * 8)}>
            <path d={`M${a.x + (b.x - a.x) * move} ${a.y + (b.y - a.y) * move} L${b.x} ${b.y}`}
              stroke="#8E9BA8" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <circle cx={a.x} cy={a.y} r={4} fill="#8E9BA8" />
          </g>;
        })}
        {flow.nodes.map((node, i) => {
          const appear = 4 + i * 8;
          return <g key={node.label + i} transform={`translate(${node.x - 100} ${node.y - 78})`}
            opacity={ramp(f, appear, appear + 14)}>
            <g transform="translate(-20 -15.6) scale(1.2)">
              <PartShadow />
              <PartArt kind={node.icon} />
            </g>
          </g>;
        })}
      </g>
    </svg>
    {flow.nodes.map((node, i) => {
      const card = layout[i];
      return <div key={node.label + 'lbl' + i} style={{position: 'absolute',
        left: 45 + card.x, top: 45 + card.y, width: card.w, textAlign: 'center',
        background: '#FFFFFF', border: '2.5px solid #8E9BA8', borderRadius: 10,
        padding: '8px 0 10px', boxShadow: '0 5px 12px #2D35401C',
        opacity: ramp(f, 8 + i * 8, 20 + i * 8)}}>
        {node.t ? <div style={{fontSize: 23, fontWeight: 800, color: c.blue, lineHeight: 1.1}}>{node.t}</div> : null}
        <div style={{fontSize: 32, fontWeight: 800, color: c.ink, lineHeight: 1.15}}>{node.label}</div>
      </div>;
    })}
    {flow.note ? <div style={{position: 'absolute', bottom: 20, left: 40, fontSize: 31, fontWeight: 700, color: c.muted}}>{flow.note}</div> : null}
  </div>;
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
        <div style={{fontSize: 34, marginTop: 12, lineHeight: 1.42}}>{card.body}</div>
      </Panel>;
    })}
    {scene.arrow ? <svg width={30} height={64} style={{position: 'absolute',
      left: wide ? 115 + 810 + 8 : 130 + (cards.length === 2 ? 780 : (1660 - (cards.length - 1) * 40) / cards.length) + 8,
      top: 430}} opacity={ramp(f, 30, 44)}>
      <path d="M6 12 L24 32 L6 52" fill="none" stroke={c.gold} strokeWidth={11} strokeLinecap="round" strokeLinejoin="round" />
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
  const cur = (scene.cues ?? []).find((q) => f >= Math.round(q.start * FPS) && f < Math.round(q.end * FPS))?.speaker;
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
        transform: `translateX(${(1 - ramp(f, 0, 24)) * -60}px)`}}><Car scale={1.4} variant="prius" /></div>
      <div style={{position: 'absolute', left: 380, top: 300, display: 'flex', gap: 22, alignItems: 'center'}}>
        {scene.stamp ? <Label style={{background: c.blue}}>{scene.stamp}</Label> : null}
        {scene.title ? <Label style={{background: c.gold, color: c.ink}}>{scene.title}</Label> : null}
      </div>
      {scene.sub ? <div style={{position: 'absolute', left: 385, top: 378, fontSize: 32, color: c.muted}}>{scene.sub}</div> : null}
    </>;
    case 'worldFirstStamps': return <>
      <Label style={{position: 'absolute', top: 205, left: 570}}>1997年12月　プリウス発売</Label>
      <div style={{position: 'absolute', left: 420, top: 460}}><Car scale={1.6} variant="prius" /></div>
      {(scene.stamps ?? []).map((s, i) => <Stamp key={s} text={s} x={420 + i * 800} y={350} appear={24 + i * 18} />)}
    </>;
    case 'carAnnounce': return <>
      <div style={{position: 'absolute', left: 300, top: 470}}><Car scale={1.45} variant="rav4" /></div>
      <div style={{position: 'absolute', left: 385, top: 296, display: 'flex', gap: 22, alignItems: 'center'}}>
        <Label style={{background: c.blue}}>{scene.stamp}</Label>
        <Label style={{background: c.gold, color: c.ink}}>{scene.title}</Label>
      </div>
      {scene.sub ? <div style={{position: 'absolute', left: 385, top: 372, fontSize: 34, fontWeight: 800}}>{scene.sub}</div> : null}
    </>;
    case 'driveShot': return ['s09', 's10', 's13'].includes(scene.id)
      ? <ToyotaHybridDriving phase={scene.id === 's09' ? 'launch' : scene.id === 's10' ? 'accelerate' : 'stop'} />
      : <>
      <div style={{position: 'absolute', left: 430, top: 470}}><Car scale={1.5} variant="prius" /></div>
      {scene.headline ? <Label style={{position: 'absolute', left: 470, top: 300, background: c.blue}}>{scene.headline}</Label> : null}
      <Guide scene={scene} x={1450} height={430} />
    </>;
    case 'exportShip': return <>
      <div style={{position: 'absolute', left: 250, top: 560}}><Car scale={1.0} muted variant="prius" /></div>
      <svg width={640} height={340} style={{position: 'absolute', left: 1010, top: 300}}>{shipIcon({scale: 1})}</svg>
      {scene.headline ? <Label style={{position: 'absolute', left: 300, top: 250, background: c.gold, color: c.ink}}>{scene.headline}</Label> : null}
      {['北米', '欧州'].map((place, i) => <Panel key={place} style={{left: 1090 + i * 350, top: 240, padding: '14px 30px',
        fontSize: 37, fontWeight: 800, opacity: ramp(f, 40 + i * 20, 58 + i * 20)}}>{place}へ</Panel>)}
    </>;
    case 'elderTalk': return <>
      <div style={{position: 'absolute', left: 120, top: 188, fontSize: 42, fontWeight: 900, color: c.ink, opacity: 0.78}}>冒頭の問い</div>
      <ElderCast cur={cur} height={430} bottom={210} />
    </>;
    case 'elderRecap': return <>
      <ElderCast cur={cur} height={400} bottom={190} />
    </>;
    case 'elderFinale': return <>
      <div style={{position: 'absolute', left: 150, top: 120, right: 150, textAlign: 'center'}}>
        <div style={{fontSize: 46, fontWeight: 900}}>1997年の、一台の答え</div>
        <div style={{fontSize: 30, color: c.muted, marginTop: 10}}>次に車を見るときは、何で走るのか／エネルギーをどこから入れるのか／比べている条件は何か</div>
      </div>
      <Elder who="ホーマー" x={300} height={350} bottom={196} pose="side" flip />
      <Elder who="ジャッド" x={860} height={350} bottom={196} />
      <Elder who="ケント" x={1420} height={350} bottom={196} pose="side" />
      <Panel style={{left: 360, top: 300, width: 1200, padding: '18px 30px', textAlign: 'center'}}>
        <div style={{fontSize: 24, color: c.muted}}>音声</div>
        <div style={{fontSize: 26, fontWeight: 800, marginTop: 6}}>VOICEVOX:玄野武宏／VOICEVOX:青山龍星／VOICEVOX:雀松朱司／VOICEVOX Nemo</div>
      </Panel>
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
          {[0, 1, 2, 3].map((i) => <div key={i} style={{opacity: ramp(f, 8 + i * 10, 20 + i * 10)}}><Car scale={0.43} variant="prius" /></div>)}
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
    case 'flowDiagram': return scene.id === 's06' || scene.id === 's14'
      ? <ToyotaTHSCutaway stamp={scene.stamp} />
      : scene.id === 's11'
      ? <ToyotaPriusRegeneration />
      : scene.id === 's12'
      ? <ToyotaHybridDriving phase="regenerate-limit" />
      : <FlowDiagram scene={scene} />;
    case 'cardsRow': return <CardsRow scene={scene} />;
    case 'barsChart': return <BarsChart scene={scene} />;
    case 'timelineShow': return <TimelineShow scene={scene} />;
    case 'finale': return <TimelineShow scene={{...scene, finale: true}} />;
    default: return <Panel style={{left: 130, top: 230, width: 1650, height: 430, padding: '36px 40px'}}>
      <div style={{fontSize: 42, fontWeight: 800}}>{scene.headline ?? scene.chapter}</div>
    </Panel>;
  }
};

const ToyotaSceneView = ({scene, tone = 'day'}: {scene: ToyotaScene; tone?: Tone}) => {
  const street = ['openingTalk', 'answerTitle', 'conference', 'carReveal', 'worldFirstStamps',
    'carAnnounce', 'driveShot', 'exportShip', 'questionRecap', 'finale', 'elderTalk', 'elderRecap',
    'elderFinale'].includes(scene.visual);
  const mode = scene.visual === 'g21Meeting' || scene.visual === 'prototypeWorkshop' ? 'workshop'
    : street ? 'street' : 'diagram';
  return <AbsoluteFill style={{fontFamily: '"Studio Noto Sans JP", sans-serif', color: c.ink}}>
    <Backdrop mode={mode} tone={tone} />
    <Visual scene={scene} />
    {/* ピルと進捗バーを1つの容器に置き、バー幅をピル幅と厳密に一致させる */}
    <div style={{position: 'absolute', top: 36, left: 55, display: 'inline-flex', flexDirection: 'column'}}>
      <Label style={{fontSize: 29, borderRadius: 999}}>{scene.chapter}</Label>
      <div style={{display: 'flex', gap: 8, marginTop: 5}}>
        {[1, 2, 3, 4, 5].map((p) => <div key={p} style={{flex: 1, height: 10, borderRadius: 999,
          background: p === scene.part ? c.gold : '#29374733'}} />)}
      </div>
    </div>
    {['elderTalk', 'elderRecap', 'elderFinale'].includes(scene.visual) ? null : <ElderRow scene={scene} />}
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
  return <div style={{position: 'absolute', bottom: 32, left: 95, right: 95, display: 'flex', justifyContent: 'center', opacity: ramp(f, 0, 5)}}>
    <div style={{background: '#26313FF7', color: c.white, borderRadius: 18, padding: '20px 32px 22px',
      display: 'flex', alignItems: 'center', gap: 24, maxWidth: 1720,
      boxShadow: '0 10px 28px #1D253040'}}>
      {chip ? <span style={{background: elderColor[cue.speaker as ElderWho] ?? c.gold, color: c.white,
        borderRadius: 10, fontSize: 33, fontWeight: 800, padding: '4px 18px', flexShrink: 0,
        lineHeight: 1.25, whiteSpace: 'nowrap'}}>{cue.speaker}</span> : null}
      <span style={{minWidth: 0, maxWidth: 1450, fontSize: 46, fontWeight: 800, lineHeight: 1.4,
        letterSpacing: '0.01em', whiteSpace: 'pre-line', textAlign: 'center', textWrap: 'balance',
        lineBreak: 'strict'}}>{cue.text}</span>
    </div>
  </div>;
};

export const LongformToyota01V11 = () => {
  useStudioFont();
  let elapsed = 0;
  const starts = toyota01V11Scenes.map((s) => {const start = elapsed; elapsed += sceneFrames(s); return start;});
  return <AbsoluteFill style={{background: c.paper}}>
    <MarkerFilters />
    <Series>{toyota01V11Scenes.map((scene) => <Series.Sequence key={scene.id} durationInFrames={sceneFrames(scene)}>
      <ToyotaSceneView scene={scene} tone={sceneTone(scene)} />
    </Series.Sequence>)}</Series>
    {toyota01V11Scenes.map((scene, i) => scene.audio ? <Sequence key={scene.id} from={starts[i] + 12}
      durationInFrames={sceneFrames(scene) - 12}><Audio src={staticFile(scene.audio.src)} /></Sequence> : null)}
  </AbsoluteFill>;
};
