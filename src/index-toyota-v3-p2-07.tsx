import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {ToyotaV3Opening07} from './longform/ToyotaV3Opening07';
import data from './data/longform/toyota-v3-p2-07.json';

const Root = () => <Composition id="ToyotaV3P207" component={ToyotaV3Opening07}
  width={1920} height={1080} fps={30} durationInFrames={data.frames} />;
registerRoot(Root);
