import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {ToyotaV3Opening08} from './longform/ToyotaV3Opening08';
import data from './data/longform/toyota-v3-p2-08.json';

const Root = () => <Composition id="ToyotaV3P208" component={ToyotaV3Opening08}
  width={1920} height={1080} fps={30} durationInFrames={data.frames} />;
registerRoot(Root);
