import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {ToyotaV3Opening09} from './longform/ToyotaV3Opening09';
import data from './data/longform/toyota-v3-p2-09.json';

const Root = () => <Composition id="ToyotaV3P209" component={ToyotaV3Opening09}
  width={1920} height={1080} fps={30} durationInFrames={data.frames} />;
registerRoot(Root);
