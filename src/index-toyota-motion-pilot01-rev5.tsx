import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {ToyotaMotionPilot01Rev5} from './longform/ToyotaMotionPilot01Rev5';
import data from './data/longform/toyota-motion-pilot01-rev5.json';

const Root = () => <Composition id="ToyotaMotionPilot01Rev5" component={ToyotaMotionPilot01Rev5}
  width={1920} height={1080} fps={30} durationInFrames={data.frames} />;
registerRoot(Root);
