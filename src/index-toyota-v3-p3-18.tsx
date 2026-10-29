import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {ToyotaV3Opening18} from './longform/ToyotaV3Opening18';
import data from './data/longform/toyota-v3-p3-18.json';

const Root = () => <Composition id="ToyotaV3P318" component={ToyotaV3Opening18}
  width={1920} height={1080} fps={30} durationInFrames={data.frames} />;
registerRoot(Root);
