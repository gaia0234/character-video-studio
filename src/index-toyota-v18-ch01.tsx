import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {ToyotaV18Ch01} from './longform/ToyotaV18Ch01';
import data from './data/longform/toyota-v18-ch01.json';

const Root = () => <Composition id="ToyotaV18Ch01" component={ToyotaV18Ch01}
  width={1920} height={1080} fps={30} durationInFrames={data.frames} />;
registerRoot(Root);
