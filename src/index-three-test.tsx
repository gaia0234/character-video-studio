import React from 'react';
import {AbsoluteFill, registerRoot} from 'remotion';
import {Composition} from 'remotion';
import {ThreeCanvas} from '@remotion/three';

const Scene = () => {
  return <AbsoluteFill style={{background: '#EFE6D6'}}>
    <ThreeCanvas width={800} height={600} camera={{fov: 40, position: [0, 0.6, 4.2]}}>
      <ambientLight intensity={1.1} />
      <directionalLight position={[3, 5, 4]} intensity={1.4} />
      <mesh rotation={[0.2, 0.6, 0]}>
        <boxGeometry args={[1.6, 0.6, 0.9]} />
        <meshToonMaterial color="#cbd9de" />
      </mesh>
      <mesh position={[0, -0.65, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[6, 6]} />
        <meshBasicMaterial color="#d8bc92" />
      </mesh>
    </ThreeCanvas>
  </AbsoluteFill>;
};

const Root = () => <Composition id="ThreeTest" component={Scene} width={800} height={600} fps={30} durationInFrames={30} />;
registerRoot(Root);
