import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {ToyotaV3Opening22} from './longform/ToyotaV3Opening22';
import data from './data/longform/toyota-v3-p4-22.json';

const Root = () => <Composition id="ToyotaV3P422" component={ToyotaV3Opening22}
  width={1920} height={1080} fps={30} durationInFrames={data.frames} />;
registerRoot(Root);
