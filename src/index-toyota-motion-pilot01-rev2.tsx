import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {ToyotaMotionPilot01Rev2} from './longform/ToyotaMotionPilot01Rev2';
import data from './data/longform/toyota-motion-pilot01-rev2.json';

const Root = () => <Composition id="ToyotaMotionPilot01Rev2" component={ToyotaMotionPilot01Rev2}
  width={1920} height={1080} fps={30} durationInFrames={data.frames} />;
registerRoot(Root);
