import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {ToyotaV3Opening19} from './longform/ToyotaV3Opening19';
import data from './data/longform/toyota-v3-p3-19.json';

const Root = () => <Composition id="ToyotaV3P319" component={ToyotaV3Opening19}
  width={1920} height={1080} fps={30} durationInFrames={data.frames} />;
registerRoot(Root);
