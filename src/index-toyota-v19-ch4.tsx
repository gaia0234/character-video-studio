import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {ToyotaV19Chapter4} from './longform/ToyotaV19Chapter4';
import data from './data/longform/toyota-v19-ch4.json';

const Root = () => <Composition id="ToyotaV19Chapter4" component={ToyotaV19Chapter4}
  width={1920} height={1080} fps={30} durationInFrames={data.frames} />;
registerRoot(Root);
