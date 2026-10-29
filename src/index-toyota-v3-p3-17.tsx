import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {ToyotaV3Opening17} from './longform/ToyotaV3Opening17';
import data from './data/longform/toyota-v3-p3-17.json';

const Root = () => <Composition id="ToyotaV3P317" component={ToyotaV3Opening17}
  width={1920} height={1080} fps={30} durationInFrames={data.frames} />;
registerRoot(Root);
