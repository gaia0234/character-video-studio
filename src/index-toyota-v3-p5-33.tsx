import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {ToyotaV3Opening33} from './longform/ToyotaV3Opening33';
import data from './data/longform/toyota-v3-p5-33.json';

const Root = () => <Composition id="ToyotaV3P533" component={ToyotaV3Opening33}
  width={1920} height={1080} fps={30} durationInFrames={data.frames} />;
registerRoot(Root);
