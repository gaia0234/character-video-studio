import React, {useEffect, useLayoutEffect, useMemo, useRef, useState} from 'react';
import {AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame, delayRender, continueRender, cancelRender} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';
import {PriusNHW10Model} from '../r10/PriusNHW10Model';
import {MarkerPlane} from '../v20-opening3d/MarkerPlane';
import timing from './timing.json';

// v20 opening, utterances 4-11. Continues the accepted r2 final screen (paper stage, ink subtitle,
// chapter pill, text planes, orthographic camera, r10f Prius). Homer/Kent are the existing PNGs (placeholder
// until r3); Judd is the existing judd.png. Rendered as Remotion stills only.
const ink = '#293747', paper = '#F5F0E5', white = '#FFFCF5', blue = '#437B9D', red = '#A63A2F';
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const smooth = (f: number, a: number, b: number) => {
  const t = interpolate(f, [a, b], [0, 1], clamp); return t * t * (3 - 2 * t);
};
const E = timing.events;
const BADGE: Record<string, string> = {ホーマー: '#AC382F', ケント: '#327453', ジャッド: '#335D87'};
const CX = 1.15; // centre of the free text stage between Judd (right edge ~-2.0) and Kent (left edge ~4.3)

const Words: React.FC<{text: string; p: [number, number, number]; width: number; size?: number;
  color?: string; opacity?: number; parts?: {text: string; color: string}[]}> = ({text, p, width, size = 65, color = ink, opacity = 1, parts}) => {
  const map = useMemo(() => {
    const canvas = document.createElement('canvas'); canvas.width = 1600; canvas.height = 220;
    const ctx = canvas.getContext('2d')!;
    ctx.font = `800 ${size}px "Studio Noto Sans JP", sans-serif`;
    ctx.textBaseline = 'middle';
    if (parts) { // one line, several colours, centred as a whole
      const widths = parts.map(q => ctx.measureText(q.text).width);
      let x = 800 - widths.reduce((a, b) => a + b, 0) / 2; ctx.textAlign = 'left';
      parts.forEach((q, i) => {ctx.fillStyle = q.color; ctx.fillText(q.text, x, 110); x += widths[i];});
    } else {ctx.fillStyle = color; ctx.textAlign = 'center'; ctx.fillText(text, 800, 110);}
    const map = new THREE.CanvasTexture(canvas); map.colorSpace = THREE.SRGBColorSpace;
    map.minFilter = THREE.LinearFilter; return map;
  }, [text, size, color, parts]);
  useEffect(() => () => map.dispose(), [map]);
  if (opacity <= 0.01) return null;
  return <mesh position={p}><planeGeometry args={[width, width * 220 / 1600]}/>
    <meshBasicMaterial map={map} transparent opacity={opacity} depthWrite={false} toneMapped={false}/></mesh>;
};

const Paper = () => {
  const map = useMemo(() => {
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 512;
    const ctx = canvas.getContext('2d')!; ctx.fillStyle = paper; ctx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 18000; i++) {
      const x = (i * 97.17) % 512, y = (i * 137.61) % 512;
      ctx.fillStyle = i % 2 ? '#BDAE9310' : '#FFFFFF18'; ctx.fillRect(x, y, .7, .7);
    }
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping; texture.repeat.set(10, 6); return texture;
  }, []);
  return <mesh position={[0, 5, -2]}><planeGeometry args={[50, 30]}/><meshBasicMaterial map={map} toneMapped={false}/></mesh>;
};

// Camera = r2 final camera held as is (same span and drift, frame 0 here = r2 frame 831). No pull-back.
export const shot = (frame: number) => {
  const x = .37, ly = 2.72;
  const span = 7.0 - .035 * Math.sin((frame + 831) / 90);
  const camera = new THREE.OrthographicCamera(-span * 16 / 9 / 2, span * 16 / 9 / 2, span / 2, -span / 2, .01, 100);
  Object.assign(camera, {manual: true});
  camera.position.set(x + .35, ly + .33, 14); camera.lookAt(x, ly, 0);
  camera.updateProjectionMatrix(); camera.updateMatrixWorld(); return camera;
};

// show(f, a, b): fades in at a, fades out at b (b optional)
const show = (f: number, a: number, b?: number) => smooth(f, a, a + 10) * (b === undefined ? 1 : 1 - smooth(f, b, b + 8));

// Layout (world x). r2 final: Homer -4.35, hybrid column -1.7, divider .45, EV column 2.05, Kent 4.35.
// For utterance 4 the columns and Kent move right by < 1.3 units (f0-8) and Judd fades in between Homer and the
// hybrid column; all three people keep the r2 height (4.55).
const JX = -2.95, HYB = -.4, DIV = 1.4, EVX = 2.75, KENT = 5.1;

const Scene = ({frame}: {frame: number}) => {
  const t = smooth(frame, 0, 8);
  const jIn = smooth(frame, 4, 11);
  const lerp = (a: number, b: number) => a + (b - a) * t;
  const homerX = lerp(-4.35, -4.5), kentX = lerp(4.35, KENT), hybX = lerp(-1.7, HYB), divX = lerp(.45, DIV), evX = lerp(2.05, EVX);
  const juddRef = useRef<THREE.Group>(null);
  useLayoutEffect(() => { // fade Judd in (MarkerPlane is read-only, so set its material opacity here)
    juddRef.current?.traverse(o => {const m = (o as THREE.Mesh).material as THREE.Material | undefined; if (m) {m.transparent = true; m.opacity = jIn;}});
  });
  // Two columns carried over from r2; hybrid dims when "電気だけで" is said, both leave at the question.
  const dim = smooth(frame, E.evEmphasis, E.evEmphasis + 12);
  const leave = smooth(frame, E.question, E.question + 14);
  const hybridA = (1 - .7 * dim) * (1 - leave), evA = 1 - leave;
  const evScale = 1 + .08 * dim;
  const m = smooth(frame, E.question, E.question + 18);           // Prius slides to the stage centre
  const small = smooth(frame, E.elapsed, E.elapsed + 18);
  const gone = smooth(frame, E.line11Start, E.line11Start + 14);   // no car in the narration about the unmoving car
  const carX = hybX + (CX - hybX) * m, carY = 1.21 - .21 * m, carS = (.6 + .3 * m - .1 * small) * (1 - gone);
  const labelA = 1 - gone;
  const rowA = show(frame, E.elapsed, E.line11Start);
  return <>
    <Paper/>
    <ambientLight intensity={1.2}/><directionalLight position={[-3, 7, 5]} intensity={2}/>
    <MarkerPlane who="homer" frame={frame} position={[homerX, .42, .15]} height={4.55}/>
    <MarkerPlane who="kent" frame={frame} position={[kentX, .42, .1]} height={4.55}/>
    {jIn > .01 && <group ref={juddRef} position={[JX, .42, .12]}><MarkerPlane who="judd" frame={frame} height={4.55}/></group>}
    <Words text="ホーマー" p={[homerX, .31, .2]} width={3.5} size={67} color="#AC382F"/>
    <Words text="ケント" p={[kentX, .31, .2]} width={3.5} size={67} color="#327453"/>
    <Words text="ジャッド" p={[JX, .31, .2]} width={3.5} size={67} color={BADGE['ジャッド']} opacity={jIn}/>
    {/* r2 final columns */}
    <Words text="ハイブリッド" p={[hybX, 4.45, .2]} width={4.5} size={115} opacity={hybridA}/>
    <Words text="エンジン＋モーター" p={[hybX, 3.8, .2]} width={4.6} size={104} opacity={hybridA}/>
    <Words text="ガソリンも使う" p={[hybX, 3.1, .23]} width={4.5} size={90} color="#99702C" opacity={hybridA}/>
    {evA > .01 && <mesh position={[divX, 2.65, .21]}><planeGeometry args={[.018, 4.2]}/>
      <meshBasicMaterial color="#D3CBB8" transparent opacity={evA * (1 - .5 * dim)}/></mesh>}
    <group position={[evX, 3.5, 0]} scale={evScale}>
      <Words text="EV" p={[0, .95, .22]} width={3.4} size={310} color={blue} opacity={evA}/>
      <Words text="電気だけで" p={[0, -.15, .22]} width={3.6} size={162} color={blue} opacity={evA}/>
      <Words text="走る車を数える" p={[0, -.85, .22]} width={3.6} size={130} color={blue} opacity={evA * (1 - .5 * dim)}/>
    </group>
    {/* Prius (r10f model, unchanged shape) */}
    {carS > .02 && <group position={[carX, carY, 0]} scale={carS}><PriusNHW10Model/></group>}
    <Words text="プリウス" p={[carX, .55, .2]} width={5} size={80} opacity={labelA}/>
    {/* utterance 6 -> 7 */}
    <Words text="プリウスが出たのは、いつ？" p={[CX, 4.3, .2]} width={8.2} size={86} opacity={show(frame, E.question, E.elapsed)}/>
    <Words text="1997年" p={[CX, 3.2, .2]} width={8} size={170} opacity={show(frame, E.year, E.elapsed)}/>
    {/* utterance 8 */}
    <Words text="1997年から29年" p={[CX, 4.6, .2]} width={7.4} size={130} opacity={rowA}
      parts={[{text: '1997年から', color: ink}, {text: '29年', color: blue}]}/>
    <Words text="モーターを使う車" p={[CX, 3.75, .2]} width={7.2} size={100} opacity={show(frame, E.motor, E.accumulate)}/>
    <Words text="今のEVにも使える？" p={[CX, 3.05, .2]} width={7.2} size={100} color={blue} opacity={show(frame, E.evUse, E.accumulate)}/>
    {/* utterance 10 (two lines, well above the car) */}
    <Words text="プリウスで何を" p={[CX, 3.6, .2]} width={7.2} size={96} opacity={show(frame, E.accumulate, E.line11Start)}/>
    <Words text="積み重ねてきたのか？" p={[CX, 2.9, .2]} width={7.2} size={96} opacity={show(frame, E.accumulate, E.line11Start)}/>
    {/* utterance 11 (narration, no car) */}
    <Words text="29年" p={[CX, 4.25, .2]} width={7} size={170} color={blue} opacity={show(frame, E.end29)}/>
    <Words text="走らない車" p={[CX, 3.2, .2]} width={8} size={170} opacity={show(frame, E.notRunning)}/>
    <Words text="走らせるまで" p={[CX, 2.2, .2]} width={7.2} size={110} opacity={show(frame, E.untilRun)}/>
    <Words text="49日" p={[CX, 1.1, .2]} width={8} size={200} color={red} opacity={show(frame, E.days49)}/>
  </>;
};

let loadedFont: Promise<FontFace> | undefined;
export const OpeningRest = () => {
  const [ready, setReady] = useState(false);
  const [handle] = useState(() => delayRender('Load adopted Noto Sans JP before canvas typography'));
  useEffect(() => {
    loadedFont ??= new FontFace('Studio Noto Sans JP', `url("${staticFile('assets/fonts/NotoSansJP.ttf')}")`, {weight: '100 900'})
      .load().then(font => {document.fonts.add(font); return font;});
    loadedFont.then(() => setReady(true)).catch(cancelRender);
  }, []);
  useEffect(() => {if (ready) continueRender(handle);}, [ready, handle]);
  const frame = useCurrentFrame();
  const cue = timing.cues.find(q => frame >= q.startFrame && frame < q.endFrame);
  if (!ready) return <AbsoluteFill style={{background: paper}}/>;
  return <AbsoluteFill style={{background: paper, color: ink, fontFamily: '"Studio Noto Sans JP", sans-serif'}}>
    <ThreeCanvas width={1920} height={1080} camera={shot(frame)} gl={{antialias: true}}>
      <Scene frame={frame}/>
    </ThreeCanvas>
    <Sequence from={timing.audio.leadFrames}><Audio src={staticFile(timing.audio.src)}/></Sequence>
    <div style={{position: 'absolute', top: 36, left: 55, background: ink, color: white,
      borderRadius: 999, padding: '10px 22px', fontSize: 26, fontWeight: 800}}>冒頭　遅れた会社</div>
    {cue && <div data-check-id="subtitle" style={{position: 'absolute', bottom: 32, left: 95, right: 95, display: 'flex', justifyContent: 'center'}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 24, background: '#26313FF7', color: white,
        borderRadius: 18, padding: '18px 32px 20px', maxWidth: 1720, boxShadow: '0 10px 28px #1D253040'}}>
        {BADGE[cue.speaker] && <span style={{fontSize: 29, padding: '4px 15px', borderRadius: 10, background: BADGE[cue.speaker], fontWeight: 800}}>{cue.speaker}</span>}
        <div style={{fontSize: 44, fontWeight: 800, lineHeight: 1.4, textAlign: 'center', whiteSpace: 'nowrap'}}>{cue.lines.map(t => <div key={t}>{t}</div>)}</div>
      </div>
    </div>}
  </AbsoluteFill>;
};
