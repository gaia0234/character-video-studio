import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {ToyotaV3Opening24} from './longform/ToyotaV3Opening24';
import data from './data/longform/toyota-v3-p4-24.json';

const Root = () => <Composition id="ToyotaV3P424" component={ToyotaV3Opening24}
  width={1920} height={1080} fps={30} durationInFrames={data.frames} />;
registerRoot(Root);
