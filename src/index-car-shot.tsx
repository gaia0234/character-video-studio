import React from 'react';
import {AbsoluteFill, Composition, registerRoot} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {CarModel} from './three/CarModel';

const CarShot = () => {
  return <AbsoluteFill style={{background: 'transparent'}}>
    <ThreeCanvas width={1600} height={560} camera={{fov: 5, position: [0, 0, 20]}}
      style={{background: 'transparent'}}>
      <ambientLight intensity={1.25} />
      <directionalLight position={[4, 6, 6]} intensity={1.15} />
      <directionalLight position={[-4, 3, 2]} intensity={0.35} />
      <group position={[-2.26, -0.75, 0]}>
        <CarModel />
      </group>
    </ThreeCanvas>
  </AbsoluteFill>;
};

const Root = () => <Composition id="CarShot" component={CarShot} width={1600} height={560} fps={30} durationInFrames={2} />;
registerRoot(Root);
