import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {ToyotaMotionPilot01Rev4} from './longform/ToyotaMotionPilot01Rev4';
import data from './data/longform/toyota-motion-pilot01-rev4.json';

const Root = () => <Composition id="ToyotaMotionPilot01Rev4" component={ToyotaMotionPilot01Rev4}
  width={1920} height={1080} fps={30} durationInFrames={data.frames} />;
registerRoot(Root);
