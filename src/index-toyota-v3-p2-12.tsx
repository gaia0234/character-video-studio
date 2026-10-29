import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {ToyotaV3Opening12} from './longform/ToyotaV3Opening12';
import data from './data/longform/toyota-v3-p2-12.json';

const Root = () => <Composition id="ToyotaV3P212" component={ToyotaV3Opening12}
  width={1920} height={1080} fps={30} durationInFrames={data.frames} />;
registerRoot(Root);
