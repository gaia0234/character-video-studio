import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {ToyotaV3Opening13} from './longform/ToyotaV3Opening13';
import data from './data/longform/toyota-v3-p3-13.json';

const Root = () => <Composition id="ToyotaV3P313" component={ToyotaV3Opening13}
  width={1920} height={1080} fps={30} durationInFrames={data.frames} />;
registerRoot(Root);
