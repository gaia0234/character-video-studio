import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {ToyotaV3Opening25} from './longform/ToyotaV3Opening25';
import data from './data/longform/toyota-v3-p4-25.json';

const Root = () => <Composition id="ToyotaV3P425" component={ToyotaV3Opening25}
  width={1920} height={1080} fps={30} durationInFrames={data.frames} />;
registerRoot(Root);
