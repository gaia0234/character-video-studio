import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {ToyotaV3Opening14} from './longform/ToyotaV3Opening14';
import data from './data/longform/toyota-v3-p3-14.json';

const Root = () => <Composition id="ToyotaV3P314" component={ToyotaV3Opening14}
  width={1920} height={1080} fps={30} durationInFrames={data.frames} />;
registerRoot(Root);
