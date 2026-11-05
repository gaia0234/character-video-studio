import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {ToyotaV3Opening31} from './longform/ToyotaV3Opening31';
import data from './data/longform/toyota-v3-p5-31.json';

const Root = () => <Composition id="ToyotaV3P531" component={ToyotaV3Opening31}
  width={1920} height={1080} fps={30} durationInFrames={data.frames} />;
registerRoot(Root);
