import React, {useMemo} from 'react';
import * as THREE from 'three';

const INK = '#2E2620';
const BODY = '#CBD9DE';
const GLASS = '#A9C6D4';
const TIRE = '#2A2420';
const RIM = '#D6D0C3';
const HEAD = '#F6E9C4';
const TAIL = '#C9793F';

const L = 4.52;          // 全長
const W = 1.695;         // 全幅
const ROOF = 1.38;
const BELT = 0.98;
const BOTTOM = 0.22;
const WB_REAR = 0.9;     // 後輪中心
const WB_FRONT = 3.48;   // 前輪中心（ホイールベース 2.58）
const TIRE_R = 0.29;
const ARCH_R = 0.37;
const SIDE = W / 2 + 0.045;

const CarBody = () => {
  const makeShape = () => {
    const s = new THREE.Shape();
    s.moveTo(0.06, BOTTOM);
    s.lineTo(0.04, 0.8);
    s.quadraticCurveTo(0.04, BELT, 0.2, BELT);
    s.lineTo(1.05, BELT);
    s.lineTo(1.55, ROOF - 0.02);
    s.lineTo(2.75, ROOF);
    s.lineTo(3.2, BELT);
    s.lineTo(4.3, BELT);
    s.quadraticCurveTo(4.46, BELT, 4.47, 0.8);
    s.lineTo(4.47, BOTTOM);
    s.lineTo(WB_FRONT + ARCH_R, BOTTOM);
    s.absarc(WB_FRONT, BOTTOM, ARCH_R, 0, Math.PI, false);
    s.lineTo(WB_REAR + ARCH_R, BOTTOM);
    s.absarc(WB_REAR, BOTTOM, ARCH_R, 0, Math.PI, false);
    s.lineTo(0.06, BOTTOM);
    return s;
  };

  const geo = useMemo(() => new THREE.ExtrudeGeometry(makeShape(), {
    depth: W, bevelEnabled: true, bevelSize: 0.035, bevelThickness: 0.035, bevelSegments: 3, curveSegments: 24,
  }).translate(0, 0, -W / 2), []);

  const outline = useMemo(() => new THREE.ExtrudeGeometry(makeShape(), {
    depth: W + 0.03, bevelEnabled: true, bevelSize: 0.055, bevelThickness: 0.055, bevelSegments: 3, curveSegments: 24,
  }).translate(0, 0, -(W + 0.03) / 2), []);

  return <group>
    <mesh geometry={geo}>
      <meshToonMaterial color={BODY} />
    </mesh>
    <mesh geometry={outline}>
      <meshBasicMaterial color={INK} side={THREE.BackSide} />
    </mesh>
  </group>;
};

const Glass = () => {
  const geo = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(1.12, BELT + 0.01);
    s.lineTo(1.58, ROOF - 0.06);
    s.lineTo(2.72, ROOF - 0.04);
    s.lineTo(3.12, BELT + 0.01);
    s.closePath();
    return new THREE.ShapeGeometry(s);
  }, []);
  const frame = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(1.059, 0.98);
    s.lineTo(1.547, 1.33);
    s.lineTo(2.755, 1.35);
    s.lineTo(3.179, 0.98);
    s.closePath();
    return new THREE.ShapeGeometry(s);
  }, []);
  return <group>
    {[SIDE - 0.004, -SIDE + 0.004].map((z, i) => <mesh key={z} geometry={frame} position={[0, 0, z]} rotation={[0, i === 1 ? Math.PI : 0, 0]}>
      <meshBasicMaterial color={INK} side={THREE.DoubleSide} />
    </mesh>)}
    <mesh geometry={geo} position={[0, 0, SIDE]}>
      <meshBasicMaterial color={GLASS} side={THREE.DoubleSide} />
    </mesh>
    <mesh geometry={geo} position={[0, 0, -SIDE]} rotation={[0, Math.PI, 0]}>
      <meshBasicMaterial color={GLASS} side={THREE.DoubleSide} />
    </mesh>
  </group>;
};

const Wheel = ({x, z}: {x: number; z: number}) => <group position={[x, TIRE_R, z]} rotation={[Math.PI / 2, 0, 0]}>
  <mesh>
    <cylinderGeometry args={[TIRE_R, TIRE_R, 0.22, 40]} />
    <meshToonMaterial color={TIRE} />
  </mesh>
  <mesh position={[0, 0.112, 0]}>
    <cylinderGeometry args={[0.185, 0.185, 0.012, 28]} />
    <meshBasicMaterial color={RIM} />
  </mesh>
  <mesh position={[0, 0.12, 0]}>
    <cylinderGeometry args={[0.055, 0.055, 0.012, 20]} />
    <meshBasicMaterial color={INK} />
  </mesh>
  {[0, 1, 2, 3, 4].map((k) => <mesh key={k} position={[0, 0.121, 0]} rotation={[0, 0, (k * Math.PI * 2) / 5]}>
    <boxGeometry args={[0.26, 0.035, 0.01]} />
    <meshBasicMaterial color="#9A9080" />
  </mesh>)}
</group>;

const Seam = ({x}: {x: number}) => <group>
  <mesh position={[x, 0.58, SIDE]}>
    <boxGeometry args={[0.012, 0.66, 0.004]} />
    <meshBasicMaterial color={INK} />
  </mesh>
  <mesh position={[x, 0.58, -SIDE]}>
    <boxGeometry args={[0.012, 0.66, 0.004]} />
    <meshBasicMaterial color={INK} />
  </mesh>
</group>;

const Handle = ({x}: {x: number}) => <group>
  {[SIDE + 0.01, -SIDE - 0.01].map((z) => <mesh key={z} position={[x, 0.86, z]}>
    <boxGeometry args={[0.17, 0.035, 0.02]} />
    <meshBasicMaterial color={INK} />
  </mesh>)}
</group>;

const Lamp = ({x, color}: {x: number; color: string}) => <group>
  {[SIDE + 0.005, -SIDE - 0.005].map((z) => <mesh key={z} position={[x, 0.72, z]}>
    <boxGeometry args={[0.18, 0.12, 0.02]} />
    <meshBasicMaterial color={color} />
  </mesh>)}
</group>;

const Pillar = ({x}: {x: number}) => <group>
  {[SIDE + 0.002, -SIDE - 0.002].map((z) => <mesh key={z} position={[x, 1.16, z]}>
    <boxGeometry args={[0.07, 0.4, 0.008]} />
    <meshBasicMaterial color={BODY} />
  </mesh>)}
</group>;

export const CarModel: React.FC = () => {
  return <group>
    <CarBody />
    <Glass />
    <Wheel x={WB_REAR} z={W / 2 - 0.11} />
    <Wheel x={WB_REAR} z={-W / 2 + 0.11} />
    <Wheel x={WB_FRONT} z={W / 2 - 0.11} />
    <Wheel x={WB_FRONT} z={-W / 2 + 0.11} />
    <Pillar x={2.12} />
    {[SIDE, -SIDE].map((z) => <group key={z}>
      <mesh position={[2.2, 0.985, z]}>
        <boxGeometry args={[3.86, 0.032, 0.006]} />
        <meshBasicMaterial color={INK} />
      </mesh>
      {[{x: 0.36, w: 0.3}, {x: 2.19, w: 1.8}, {x: 4.06, w: 0.24}].map((seg) => <mesh key={seg.x} position={[seg.x, 0.27, z]}>
        <boxGeometry args={[seg.w, 0.028, 0.006]} />
        <meshBasicMaterial color={INK} />
      </mesh>)}
      <mesh position={[0.9, BOTTOM, z]}>
        <ringGeometry args={[0.355, 0.385, 32, 1, 0, Math.PI]} />
        <meshBasicMaterial color={INK} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[3.48, BOTTOM, z]}>
        <ringGeometry args={[0.355, 0.385, 32, 1, 0, Math.PI]} />
        <meshBasicMaterial color={INK} side={THREE.DoubleSide} />
      </mesh>
    </group>)}
    <Seam x={1.6} />
    <Seam x={2.32} />
    <Handle x={1.75} />
    <Handle x={2.45} />
    <Lamp x={0.16} color={TAIL} />
    <Lamp x={4.37} color={HEAD} />
  </group>;
};
