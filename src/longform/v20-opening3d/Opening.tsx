import React, {useEffect, useMemo, useState} from 'react';
import {AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame, delayRender, continueRender, cancelRender} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';
import {PriusNHW10Model} from '../r10/PriusNHW10Model';
import {MarkerPlane, Who} from './MarkerPlane';
import timing from './timing.json';

const ink = '#293747', paper = '#F5F0E5', white = '#FFFCF5';
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const smooth = (f: number, a: number, b: number) => {
  const t = interpolate(f, [a, b], [0, 1], clamp); return t * t * (3 - 2 * t);
};

// Explanatory typography is a texture on a plane in the same Three scene.
const Words: React.FC<{text: string; p: [number, number, number]; width: number;
  size?: number; color?: string; align?: CanvasTextAlign}> = ({text, p, width, size = 65, color = ink, align = 'center'}) => {
  const map = useMemo(() => {
    const canvas = document.createElement('canvas'); canvas.width = 1600; canvas.height = 220;
    const ctx = canvas.getContext('2d')!;
    ctx.font = `800 ${size}px "Studio Noto Sans JP", sans-serif`;
    ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = 'middle';
    ctx.fillText(text, align === 'left' ? 15 : 800, 110);
    const map = new THREE.CanvasTexture(canvas); map.colorSpace = THREE.SRGBColorSpace;
    map.minFilter = THREE.LinearFilter; return map;
  }, [text, size, color, align]);
  useEffect(() => () => map.dispose(), [map]);
  return <mesh position={p}><planeGeometry args={[width, width * 220 / 1600]}/>
    <meshBasicMaterial map={map} transparent depthWrite={false} toneMapped={false}/></mesh>;
};

const Paper = () => {
  const map = useMemo(() => {
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 512;
    const ctx = canvas.getContext('2d')!; ctx.fillStyle = paper; ctx.fillRect(0, 0, 512, 512);
    // Deterministic, restrained grain; never a new scene/layout behind the camera.
    for (let i = 0; i < 18000; i++) {
      const x = (i * 97.17) % 512, y = (i * 137.61) % 512;
      ctx.fillStyle = i % 2 ? '#BDAE9310' : '#FFFFFF18'; ctx.fillRect(x, y, .7, .7);
    }
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping; texture.repeat.set(10, 6); return texture;
  }, []);
  return <mesh position={[0, 5, -2]}><planeGeometry args={[50, 30]}/><meshBasicMaterial map={map} toneMapped={false}/></mesh>;
};

export const shot = (frame: number) => {
  const b = smooth(frame, timing.lines[1].startFrame - 12, timing.lines[1].startFrame + 18);
  const c = smooth(frame, timing.lines[2].startFrame - 12, timing.lines[2].startFrame + 18);
  const x = .42 - .95 * b + .9 * c;
  const span = 6.55 + .2 * b + .25 * c - .035 * Math.sin(frame / 90);
  const camera = new THREE.OrthographicCamera(-span * 16 / 9 / 2, span * 16 / 9 / 2, span / 2, -span / 2, .01, 100);
  Object.assign(camera, {manual: true});
  camera.position.set(x + .35, 3.05, 14); camera.lookAt(x, 2.72, 0);
  camera.updateProjectionMatrix(); camera.updateMatrixWorld(); return camera;
};

const Scene = ({frame}: {frame: number}) => {
  const line = [...timing.lines].reverse().find(l => frame >= l.startFrame) ?? timing.lines[0];
  const second = line.id === 'opening3d-02', third = line.id === 'opening3d-03';
  const mention = timing.events.priusMentionFrame;
  const carReveal = smooth(frame, mention, mention + 18);
  const hybrid = frame >= timing.events.hybridFrame;
  const gasoline = frame >= timing.events.gasolineFrame;
  const ev = frame >= timing.events.evFrame;
  const separate = smooth(frame, timing.events.evFrame, timing.events.evFrame + 18);
  return <>
    <Paper/>
    <ambientLight intensity={1.2}/><directionalLight position={[-3, 7, 5]} intensity={2}/>
    {/* ThreeCanvas owns Suspense so texture loads block frame capture. */}
    <MarkerPlane who="homer" frame={frame} position={[-4.35, .42, .15]} height={4.55}/>
    <MarkerPlane who="kent" frame={frame} position={[4.35, .42, .1]} height={4.55}/>
    <Words text="ホーマー" p={[-4.35, .15, .2]} width={3.5} size={67} color="#AC382F"/>
    <Words text="ケント" p={[4.35, .15, .2]} width={3.5} size={67} color="#327453"/>
    {!second && !third && <>
      <Words text="EVの販売台数" p={[0, 3.9, .12]} width={7.5} size={112}/>
      <Words text="トヨタはEVに出遅れた" p={[0, 2.75, .12]} width={7.5} size={80}/>
      <Words text="ケントの見方" p={[0, 2.1, .12]} width={5.8} size={64} color="#526574"/>
    </>}
    {second && <>
      <Words text="EV？　ハイブリッド？" p={[0, 4.3, .12]} width={8} size={95}/>
      <Words text={frame < mention ? '次に買うなら、どちら？' : 'プリウスは、EV？'} p={[0, 3.55, .12]} width={7.7} size={76}/>
    </>}
    {frame >= mention && <group position={[-1.7 * separate, 1.03 + .18 * separate, 0]} scale={carReveal * (1 - .4 * separate)}>
      <PriusNHW10Model/>
    </group>}
    {(second || third) && frame >= mention && <Words text="プリウス" p={[-1.7 * separate, .55, .2]} width={5} size={80}/>}
    {third && <>
      {frame >= timing.events.hybridNameFrame && <Words text="ハイブリッド" p={[ev ? -1.7 : 0, 4.45, .2]} width={ev ? 4.5 : 6} size={ev ? 115 : 94}/>}
      {hybrid && <>
        <Words text={ev ? 'エンジン＋モーター' : 'エンジン ＋ モーター'} p={[ev ? -1.7 : 0, 3.8, .2]} width={ev ? 4.6 : 7} size={ev ? 104 : 86}/>
      </>}
      {gasoline && <Words text="ガソリンも使う" p={[ev ? -1.7 : 0, 3.1, .23]} width={ev ? 4.5 : 5.6} size={ev ? 90 : 73} color="#99702C"/>}
      {ev && <>
        <mesh position={[.45, 2.65, .21]}><planeGeometry args={[.018, 4.2]}/><meshBasicMaterial color="#D3CBB8"/></mesh>
        <Words text="EV" p={[2.05, 4.45, .22]} width={3.4} size={310} color="#437B9D"/>
        <Words text="電気だけで" p={[2.05, 3.35, .22]} width={3.6} size={162} color="#437B9D"/>
        <Words text="走る車を数える" p={[2.05, 2.65, .22]} width={3.6} size={130} color="#437B9D"/>
      </>}
    </>}
  </>;
};

let loadedFont: Promise<FontFace> | undefined;
export const Opening = () => {
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
    <Sequence from={12}><Audio src={staticFile(timing.audio.src)}/></Sequence>
    <div style={{position: 'absolute', top: 36, left: 55, background: ink, color: white,
      borderRadius: 999, padding: '10px 22px', fontSize: 26, fontWeight: 800}}>冒頭　遅れた会社</div>
    {cue && <div data-check-id="subtitle" style={{position: 'absolute', bottom: 32, left: 95, right: 95, display: 'flex', justifyContent: 'center'}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 24, background: '#26313FF7', color: white,
        borderRadius: 18, padding: '18px 32px 20px', maxWidth: 1720, boxShadow: '0 10px 28px #1D253040'}}>
        <span style={{fontSize: 29, padding: '4px 15px', borderRadius: 10, background: cue.speaker === 'ホーマー' ? '#AC382F' : '#327453', fontWeight: 800}}>{cue.speaker}</span>
        <div style={{fontSize: 44, fontWeight: 800, lineHeight: 1.4, textAlign: 'center', whiteSpace: 'nowrap'}}>{cue.lines.map(t => <div key={t}>{t}</div>)}</div>
      </div>
    </div>}
  </AbsoluteFill>;
};

export const MarkerCheck: React.FC<{who: Who; animated: boolean}> = ({who, animated}) => {
  const frame = useCurrentFrame();
  const camera = useMemo(() => {
    const camera = new THREE.OrthographicCamera(-2.7, 2.7, 3.0375, -3.0375, .01, 100);
    Object.assign(camera, {manual: true}); camera.position.set(0, 2.6, 14); camera.lookAt(0, 2.6, 0); return camera;
  }, []);
  return <ThreeCanvas width={800} height={900} camera={camera} gl={{antialias: true}} style={{background: paper}}>
    <MarkerPlane who={who} frame={frame} animated={animated} height={4.8}/>
  </ThreeCanvas>;
};

export const CarCheck: React.FC<{view: 'side' | 'top'}> = ({view}) => {
  const camera = useMemo(() => {
    const c = new THREE.OrthographicCamera(-3.2, 3.2, 1.8, -1.8, .01, 100);
    Object.assign(c, {manual: true});
    if (view === 'side') c.position.set(0, .745, 10);
    else {c.position.set(0, 10, 0); c.up.set(0, 0, -1);}
    c.lookAt(0, view === 'top' ? 0 : .745, 0); c.updateProjectionMatrix(); return c;
  }, [view]);
  return <ThreeCanvas width={1600} height={900} camera={camera} style={{background: '#FFFFFF'}} gl={{antialias: true}}>
    <ambientLight intensity={1.2}/><directionalLight position={[-3, 7, 5]} intensity={2}/><PriusNHW10Model/>
  </ThreeCanvas>;
};
