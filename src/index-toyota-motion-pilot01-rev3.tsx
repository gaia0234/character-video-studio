import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {ToyotaMotionPilot01Rev3} from './longform/ToyotaMotionPilot01Rev3';
import data from './data/longform/toyota-motion-pilot01-rev3.json';

const Root = () => <Composition id="ToyotaMotionPilot01Rev3" component={ToyotaMotionPilot01Rev3}
  width={1920} height={1080} fps={30} durationInFrames={data.frames} />;
registerRoot(Root);
