import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {ToyotaV3Opening26} from './longform/ToyotaV3Opening26';
import data from './data/longform/toyota-v3-p4-26.json';

const Root = () => <Composition id="ToyotaV3P426" component={ToyotaV3Opening26}
  width={1920} height={1080} fps={30} durationInFrames={data.frames} />;
registerRoot(Root);
