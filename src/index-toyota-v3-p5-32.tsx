import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {ToyotaV3Opening32} from './longform/ToyotaV3Opening32';
import data from './data/longform/toyota-v3-p5-32.json';

const Root = () => <Composition id="ToyotaV3P532" component={ToyotaV3Opening32}
  width={1920} height={1080} fps={30} durationInFrames={data.frames} />;
registerRoot(Root);
