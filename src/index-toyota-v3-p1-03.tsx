import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {ToyotaV3Opening03} from './longform/ToyotaV3Opening03';
import data from './data/longform/toyota-v3-p1-03.json';

const Root = () => <Composition id="ToyotaV3P103" component={ToyotaV3Opening03}
  width={1920} height={1080} fps={30} durationInFrames={data.frames} />;
registerRoot(Root);
