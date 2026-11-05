import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {ToyotaV3Opening20} from './longform/ToyotaV3Opening20';
import data from './data/longform/toyota-v3-p4-20.json';

const Root = () => <Composition id="ToyotaV3P420" component={ToyotaV3Opening20}
  width={1920} height={1080} fps={30} durationInFrames={data.frames} />;
registerRoot(Root);
