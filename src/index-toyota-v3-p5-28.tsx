import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {ToyotaV3Opening28} from './longform/ToyotaV3Opening28';
import data from './data/longform/toyota-v3-p5-28.json';

const Root = () => <Composition id="ToyotaV3P528" component={ToyotaV3Opening28}
  width={1920} height={1080} fps={30} durationInFrames={data.frames} />;
registerRoot(Root);
