import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {ToyotaV3Opening29} from './longform/ToyotaV3Opening29';
import data from './data/longform/toyota-v3-p5-29.json';

const Root = () => <Composition id="ToyotaV3P529" component={ToyotaV3Opening29}
  width={1920} height={1080} fps={30} durationInFrames={data.frames} />;
registerRoot(Root);
