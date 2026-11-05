import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {ToyotaV3Opening30} from './longform/ToyotaV3Opening30';
import data from './data/longform/toyota-v3-p5-30.json';

const Root = () => <Composition id="ToyotaV3P530" component={ToyotaV3Opening30}
  width={1920} height={1080} fps={30} durationInFrames={data.frames} />;
registerRoot(Root);
