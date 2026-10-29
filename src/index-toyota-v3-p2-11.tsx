import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {ToyotaV3Opening11} from './longform/ToyotaV3Opening11';
import data from './data/longform/toyota-v3-p2-11.json';

const Root = () => <Composition id="ToyotaV3P211" component={ToyotaV3Opening11}
  width={1920} height={1080} fps={30} durationInFrames={data.frames} />;
registerRoot(Root);
