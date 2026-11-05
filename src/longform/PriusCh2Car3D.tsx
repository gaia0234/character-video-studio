import React, {useMemo} from 'react';
import {ThreeCanvas} from '@remotion/three';
import {useCurrentFrame} from 'remotion';
import * as THREE from 'three';

// NHW10, metres: front +X, up +Y, width Z. Keep the S5 camera/motion below intact.
// Reference: ER Guide p8 Im8 / accepted Im9 (acquired 2026-10-23), and
// output/toyota-ch2-49days-pilotb-20261103/reference/prius-nhw10-ratios.json.
// Measured landmarks are reconstructed as surfaces, without tracing the photograph.
const L = 4.275;
const W = 1.695;
const H = 1.490;
const WB = 2.550;
const GROUND_TO_CENTER = 0.745;
const C = {
  body: '#E9EFF4', bodyLow: '#D5E0E9', bumper: '#C9D6DE',
  glass: '#7FA3B8', red: '#C4513F', gold: '#D9AB56',
  tire: '#293747', hub: '#C3CED5', ink: '#293747',
};
type Point = [number, number, number];
type Profile = [number, number];

const useGradientMap = () => useMemo(() => {
  const texture = new THREE.DataTexture(new Uint8Array([70, 150, 245]), 3, 1, THREE.RedFormat);
  texture.minFilter = THREE.NearestFilter;
  texture.magFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  return texture;
}, []);

const useShadowTexture = () => useMemo(() => {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 256;
  const ctx = c.getContext('2d') as CanvasRenderingContext2D;
  const g = ctx.createRadialGradient(128, 128, 24, 128, 128, 126);
  g.addColorStop(0, 'rgba(0,0,0,0.38)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
}, []);

// Constant normal displacement avoids origin-scaled outlines hiding the windows.
// 0.018m is about 1.5px per side at f790 (approximately a 3px stroke).
const Part: React.FC<{
  geometry: THREE.BufferGeometry; color: string; gradientMap: THREE.Texture;
  position?: Point; rotation?: Point; outline?: number;
}> = ({geometry, color, gradientMap, position, rotation, outline = 0.018}) => {
  const shell = useMemo(() => {
    const g = geometry.clone();
    const p = g.getAttribute('position'); const n = g.getAttribute('normal');
    for (let i = 0; i < p.count; i++) {
      p.setXYZ(i, p.getX(i) + n.getX(i) * outline,
        p.getY(i) + n.getY(i) * outline, p.getZ(i) + n.getZ(i) * outline);
    }
    return g;
  }, [geometry, outline]);
  return <group position={position} rotation={rotation}>
    <mesh geometry={geometry}><meshToonMaterial color={color} gradientMap={gradientMap} /></mesh>
    {outline > 0 && <mesh geometry={shell}><meshBasicMaterial color={C.ink} side={THREE.BackSide} /></mesh>}
  </group>;
};

const polygon = (points: Point[]) => {
  // All panels used here are convex. DoubleSide on Surface keeps both handed sides visible.
  const positions: number[] = [];
  for (let i = 1; i < points.length - 1; i++) positions.push(...points[0], ...points[i], ...points[i + 1]);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  g.computeVertexNormals();
  return g;
};

const Stroke: React.FC<{points: Point[]; color?: string; radius?: number; closed?: boolean}> =
({points, color = C.ink, radius = 0.013, closed = false}) => {
  const geometry = useMemo(() => new THREE.TubeGeometry(
    new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)), closed, 'centripetal'),
    Math.max(8, points.length * 6), radius, 5, closed,
  ), [points, radius, closed]);
  return <mesh geometry={geometry}><meshBasicMaterial color={color} /></mesh>;
};

const Surface: React.FC<{
  points: Point[]; color: string; gradientMap: THREE.Texture; edge?: boolean; lift?: boolean;
}> = ({points, color, gradientMap, edge = false, lift = false}) => {
  const geometry = useMemo(() => polygon(points), [points]);
  return <>
    <mesh geometry={geometry}><meshToonMaterial color={color} gradientMap={gradientMap} side={THREE.DoubleSide}
      polygonOffset={lift} polygonOffsetFactor={lift ? -2 : 0} polygonOffsetUnits={lift ? -2 : 0} /></mesh>
    {edge && <Stroke points={points} closed />}
  </>;
};

// Im9: wheel r/L=.071, axle positions .173/.792 L; use exact 2.550m wheelbase.
// Cabin belt at .65H, roof at H, rear deck at .70H (Im8 .707H).
// The upper side tapers to 80% of belt width; the centre of the roof is gently crowned.
const ROOF: Profile[] = [
  [0.59, 1.30], [0.43, 1.375], [0.17, 1.445], [-0.18, 1.46],
  [-0.56, 1.45], [-0.81, 1.43], [-0.98, 1.385],
];
const sideZ = (y: number) => 0.775 - (y - 0.96) * 0.30;
const sidePoint = (x: number, y: number, sign: number, offset = 0): Point =>
  [x, y, sign * (sideZ(y) + offset)];

const makeBody = () => {
  // Rounded nose, high short rear deck and actual open wheel arches.
  const b = 0.035;
  const shape = new THREE.Shape();
  shape.moveTo(-L / 2 + b + 0.10, 0.36);
  const arch = (x: number) => {
    shape.lineTo(x - 0.355, 0.30);
    shape.absarc(x, 0.30, 0.355, Math.PI, 0, true);
  };
  arch(-1.27); arch(-1.27 + WB);
  shape.lineTo(2.02, 0.30);
  shape.quadraticCurveTo(L / 2 - b, 0.34, L / 2 - b, 0.48);
  shape.lineTo(2.09, 0.68);
  shape.quadraticCurveTo(1.99, 0.80, 1.74, 0.85);
  shape.lineTo(1.10, 0.945);
  shape.lineTo(-1.54, 1.01);
  shape.lineTo(-1.98, 0.99);
  shape.quadraticCurveTo(-2.10, 0.96, -L / 2 + b, 0.83);
  // Extra points on the same rear line bound the tail-lamp band below.
  const rearX = (y: number) => -L / 2 + b + 0.10 * (0.83 - y) / 0.47;
  shape.lineTo(rearX(0.64), 0.64);
  shape.lineTo(rearX(0.62), 0.62);
  shape.lineTo(-L / 2 + b + 0.10, 0.36);
  const g = new THREE.ExtrudeGeometry(shape, {depth: W - 2 * b, bevelEnabled: true,
    bevelThickness: b, bevelSize: b, bevelSegments: 3, steps: 1, curveSegments: 16});
  g.translate(0, 0, -W / 2 + b);
  // Tail-lamp band: keep the rear corner behind the lamp chamfer (-2.15,.71)-(-2.07,.86),
  // otherwise the bevelled corner shows through the lamp as a white strip.
  // Near side (+Z) only: on the far side the corner is the silhouette and must stay.
  const p = g.getAttribute('position');
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i); const z = p.getZ(i);
    if (y < 0.635 || y > 0.975 || z <= 0.71 || p.getX(i) > -1.9) continue;
    const limit = -2.15 + (z - 0.71) * 0.08 / 0.15 + 0.008;
    if (p.getX(i) < limit) p.setX(i, limit);
  }
  return g;
};

const CarModel: React.FC<{gradientMap: THREE.Texture}> = ({gradientMap}) => {
  const shadowTex = useShadowTexture();
  const g = useMemo(() => ({
    body: makeBody(),
    tire: new THREE.CylinderGeometry(0.30, 0.30, 0.19, 32),
    hub: new THREE.CylinderGeometry(0.195, 0.195, 0.202, 24),
    cap: new THREE.CylinderGeometry(0.07, 0.07, 0.209, 18),
  }), []);
  const sideProfile: Profile[] = [[1.10, 0.96], ...ROOF, [-1.59, 1.015]];
  // Window landmarks from accepted Im9: front door / B pillar / rear door / quarter light.
  const windows: Profile[][] = [
    [[1.00, 0.989], [0.49, 1.285], [0.30, 1.367], [0.10, 1.407], [-0.13, 1.416], [-0.075, 1.008]],
    [[-0.235, 1.013], [-0.29, 1.414], [-0.56, 1.407], [-0.78, 1.389], [-0.88, 1.351], [-0.94, 1.031]],
    [[-1.005, 1.033], [-0.95, 1.308], [-1.19, 1.155], [-1.25, 1.103], [-1.18, 1.048]],
  ];
  // Rear glass: roof edge to trunk-top front, ~28deg from horizontal (Im8 25-30deg).
  // Lower edge stops at the trunk top front; the glass is slightly smaller than r9a.
  const rearLower: Point[] = [[-1.72, 1.02, 0.70], [-1.72, 1.02, -0.70]];
  const rearUpper: Point[] = [[-0.95, 1.43, 0.62], [-0.95, 1.43, -0.62]];
  return <group position={[0, -GROUND_TO_CENTER, 0]}>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]}>
      <planeGeometry args={[5.2, 2.4]} /><meshBasicMaterial map={shadowTex} transparent depthWrite={false} />
    </mesh>
    <Part geometry={g.body} color={C.body} gradientMap={gradientMap} />
    {[-1, 1].map((sign) => <React.Fragment key={sign}>
      <Surface points={sideProfile.map(([x,y]) => sidePoint(x,y,sign))} color={C.body} gradientMap={gradientMap} />
      <Stroke points={sideProfile.map(([x,y]) => sidePoint(x,y,sign))} closed />
      {windows.map((w,i) => <Surface key={i} points={w.map(([x,y]) => sidePoint(x,y,sign,0.012))}
        color={C.glass} gradientMap={gradientMap} edge />)}
      {/* Belt, panel lines and handles remain on the body, below the glazing. */}
      <Surface points={[[1.84,.78,sign*.849],[-1.94,.78,sign*.849],[-1.94,.735,sign*.849],[1.84,.735,sign*.849]]}
        color={C.gold} gradientMap={gradientMap} />
      <Stroke points={[[1.03,.94,sign*.851],[1.04,.71,sign*.851],[1.00,.38,sign*.851],[-.12,.36,sign*.851],[-.19,.71,sign*.851],[-.20,.97,sign*.851]]} radius={.007} />
      <Stroke points={[[-.12,.36,sign*.851],[-.86,.38,sign*.851],[-1.03,.68,sign*.851],[-1.28,1.00,sign*.80]]} radius={.007} />
      {[.02,-.90].map((x) => <Stroke key={x} points={[[x,.875,sign*.856],[x-.16,.875,sign*.856]]} radius={.018} />)}
      {/* Im8 tail lamp: .68H to .43H, swept around the rear corner. */}
      <Surface points={[
        [-2.15,.94,sign*.50],[-2.15,.97,sign*.71],
        [-2.15,.90,sign*.77],[-2.15,.66,sign*.77],[-2.15,.66,sign*.50],
      ]} color={C.red} gradientMap={gradientMap} />
      <Surface lift points={[
        [-2.15,.97,sign*.71],[-2.07,.97,sign*.86],[-2.07,.65,sign*.86],[-2.15,.66,sign*.71],
      ]} color={C.red} gradientMap={gradientMap} />
      <Surface lift points={[
        [-2.07,.97,sign*.86],[-1.92,.95,sign*.86],[-1.73,.77,sign*.86],
        [-1.86,.65,sign*.86],[-2.07,.65,sign*.86],
      ]} color={C.red} gradientMap={gradientMap} />
      <Stroke points={[
        [-2.16,.94,sign*.50],[-2.16,.97,sign*.71],[-2.07,.97,sign*.87],
        [-1.92,.95,sign*.87],[-1.73,.77,sign*.87],[-1.86,.65,sign*.87],
        [-2.07,.65,sign*.87],[-2.16,.66,sign*.71],[-2.16,.66,sign*.50],
      ]} closed radius={.012} />
      <Stroke points={[[-2.16,.79,sign*.52],[-2.16,.79,sign*.71],[-2.07,.79,sign*.872],[-1.84,.79,sign*.872]]} color={C.hub} radius={.019} />
    </React.Fragment>)}
    {/* Crown strips across the roof: the highest station is at the B pillar. */}
    {ROOF.slice(0,-1).map(([x,y],i) => {
      const [nx,ny] = ROOF[i+1];
      return [-1,1].map((sign) => <Surface key={`${i}-${sign}`} points={[
        sidePoint(x,y,sign),[x,y + (H-1.46),0], [nx,ny + (H-1.46),0],sidePoint(nx,ny,sign),
      ]} color={C.body} gradientMap={gradientMap} />);
    })}
    <Surface points={[sidePoint(1.10,.96,1),sidePoint(1.10,.96,-1),sidePoint(.59,1.30,-1),sidePoint(.59,1.30,1)]}
      color={C.body} gradientMap={gradientMap} />
    <Surface points={[[1.055,.989,.70],[1.055,.989,-.70],[.60,1.286,-.61],[.60,1.286,.61]]}
      color={C.glass} gradientMap={gradientMap} edge />
    <Surface points={[sidePoint(-1.59,1.015,1),sidePoint(-1.59,1.015,-1),sidePoint(-.98,1.385,-1),sidePoint(-.98,1.385,1)]}
      color={C.body} gradientMap={gradientMap} />
    <Surface points={[rearLower[0],rearLower[1],rearUpper[1],rearUpper[0]]} color={C.glass} gradientMap={gradientMap} edge />
    {/* Short trunk lid floating above the deck; the step line is its front edge. */}
    <Surface points={[[-1.72,1.06,.70],[-1.72,1.06,-.70],[-2.02,1.04,-.70],[-2.02,1.04,.70]]} color={C.body} gradientMap={gradientMap} />
    <Stroke points={[[-1.72,1.063,.70],[-1.72,1.063,-.70]]} radius={.009} />
    <Stroke points={[[-2.02,1.043,.70],[-2.02,1.043,-.70]]} radius={.009} />
    {/* The rear lower end is the body wall itself (one piece, rounded forward at the base). */}
    {/* Trunk side seams only (the cross-rear groove is removed). No separate bumper step. */}
    <Stroke points={[[-1.65,1.03,.72],[-1.98,1.045,.71],[-2.02,1.04,.70]]} radius={.009} />
    <Stroke points={[[-1.65,1.03,-.72],[-1.98,1.045,-.71],[-2.02,1.04,-.70]]} radius={.009} />
    {/* Im8 bumper divider: one thin line lying on the rear wall (no step). */}
    <Stroke points={[[-2.05,.40,.70],[-2.05,.40,-.70]]} radius={.009} />
    {/* (Bumper step removed: the rear lower end continues with the body.) */}
    {[-1.27, -1.27 + WB].flatMap((x) => [-.75,.75].map((z) =>
      <group key={`${x}-${z}`} position={[x,.30,z]}>
        <Part geometry={g.tire} color={C.tire} rotation={[Math.PI/2,0,0]} gradientMap={gradientMap} outline={.012} />
        <Part geometry={g.hub} color={C.hub} rotation={[Math.PI/2,0,0]} gradientMap={gradientMap} outline={.009} />
        <Part geometry={g.cap} color={C.bodyLow} rotation={[Math.PI/2,0,0]} gradientMap={gradientMap} outline={0} />
      </group>,
    ))}
  </group>;
};

export const PriusCar3D: React.FC<{opacity: number}> = ({opacity}) => {
  const frame = useCurrentFrame();
  const gradientMap = useGradientMap();
  const entry = Math.min(1, Math.max(0, (frame - 660) / 60));
  const tail = Math.min(1, Math.max(0, (frame - 720) / 105));
  const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const scale = frame <= 720 ? 1 - 0.55 * easeInOut(entry) : 0.45 - 0.05 * easeInOut(tail);
  const net = scale / 0.45;
  const base = 0.956;
  const z = base * net;
  return (
    <ThreeCanvas
      width={1920}
      height={1080}
      style={{position: 'absolute', inset: 0, opacity}}
      gl={{antialias: true, alpha: true, preserveDrawingBuffer: true}}
      camera={{type: 'orthographic', position: [0, 3.0, -7.2], zoom: 1, near: 0.1, far: 60}}
      orthographic
      onCreated={({camera}) => {
        const cam = camera as THREE.OrthographicCamera;
        cam.left = -9.6;
        cam.right = 9.6;
        cam.top = 5.4;
        cam.bottom = -5.4;
        cam.lookAt(0, 0.75, 0);
        cam.updateProjectionMatrix();
      }}
    >
      <ambientLight intensity={1.15} />
      <directionalLight position={[-2.5, 5, -3.5]} intensity={1.5} />
      <directionalLight position={[3, 2.5, 4]} intensity={0.5} />
      <group position={[6.03, -1.79, 0]} scale={[z, z, z]} rotation={[0, -2.44, 0]}>
        <CarModel gradientMap={gradientMap} />
      </group>
    </ThreeCanvas>
  );
};
