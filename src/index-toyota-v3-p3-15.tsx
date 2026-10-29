import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {ToyotaV3Opening15} from './longform/ToyotaV3Opening15';
import data from './data/longform/toyota-v3-p3-15.json';

const Root = () => <Composition id="ToyotaV3P315" component={ToyotaV3Opening15}
  width={1920} height={1080} fps={30} durationInFrames={data.frames} />;
registerRoot(Root);
