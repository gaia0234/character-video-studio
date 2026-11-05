import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {ToyotaV3Opening27} from './longform/ToyotaV3Opening27';
import data from './data/longform/toyota-v3-p5-27.json';

const Root = () => <Composition id="ToyotaV3P527" component={ToyotaV3Opening27}
  width={1920} height={1080} fps={30} durationInFrames={data.frames} />;
registerRoot(Root);
