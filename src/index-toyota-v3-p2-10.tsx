import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {ToyotaV3Opening10} from './longform/ToyotaV3Opening10';
import data from './data/longform/toyota-v3-p2-10.json';

const Root = () => <Composition id="ToyotaV3P210" component={ToyotaV3Opening10}
  width={1920} height={1080} fps={30} durationInFrames={data.frames} />;
registerRoot(Root);
