import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {ToyotaV3Opening05} from './longform/ToyotaV3Opening05';
import data from './data/longform/toyota-v3-p1-05.json';

const Root = () => <Composition id="ToyotaV3P105" component={ToyotaV3Opening05}
  width={1920} height={1080} fps={30} durationInFrames={data.frames} />;
registerRoot(Root);
