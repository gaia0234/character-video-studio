import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {ToyotaV3Opening02} from './longform/ToyotaV3Opening02';
import data from './data/longform/toyota-v3-p1-02.json';

const Root = () => <Composition id="ToyotaV3P102" component={ToyotaV3Opening02}
  width={1920} height={1080} fps={30} durationInFrames={data.frames} />;
registerRoot(Root);
