import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {ToyotaV3Opening16} from './longform/ToyotaV3Opening16';
import data from './data/longform/toyota-v3-p3-16.json';

const Root = () => <Composition id="ToyotaV3P316" component={ToyotaV3Opening16}
  width={1920} height={1080} fps={30} durationInFrames={data.frames} />;
registerRoot(Root);
