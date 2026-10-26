import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {ToyotaV3Opening06} from './longform/ToyotaV3Opening06';
import data from './data/longform/toyota-v3-p1-06.json';

const Root = () => <Composition id="ToyotaV3P106" component={ToyotaV3Opening06}
  width={1920} height={1080} fps={30} durationInFrames={data.frames} />;
registerRoot(Root);
