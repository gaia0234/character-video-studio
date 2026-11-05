import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {ToyotaMotionPilot01} from './longform/ToyotaMotionPilot01';
import data from './data/longform/toyota-motion-pilot01.json';

const Root = () => <Composition id="ToyotaMotionPilot01" component={ToyotaMotionPilot01}
  width={1920} height={1080} fps={30} durationInFrames={data.frames} />;
registerRoot(Root);
