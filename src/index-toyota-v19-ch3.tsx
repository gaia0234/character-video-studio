import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {ToyotaV19Chapter3} from './longform/ToyotaV19Chapter3';
import data from './data/longform/toyota-v19-ch3.json';

const Root = () => <Composition id="ToyotaV19Chapter3" component={ToyotaV19Chapter3}
  width={1920} height={1080} fps={30} durationInFrames={data.frames} />;
registerRoot(Root);
