import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {ToyotaMotionPilot01Rev6} from './longform/ToyotaMotionPilot01Rev6';
import data from './data/longform/toyota-motion-pilot01-rev6.json';

const Root = () => <Composition id="ToyotaMotionPilot01Rev6" component={ToyotaMotionPilot01Rev6}
  width={1920} height={1080} fps={30} durationInFrames={data.frames} />;
registerRoot(Root);
