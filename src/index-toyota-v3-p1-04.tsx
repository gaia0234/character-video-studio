import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {ToyotaV3Opening04} from './longform/ToyotaV3Opening04';
import data from './data/longform/toyota-v3-p1-04.json';

const Root = () => <Composition id="ToyotaV3P104" component={ToyotaV3Opening04}
  width={1920} height={1080} fps={30} durationInFrames={data.frames} />;
registerRoot(Root);
