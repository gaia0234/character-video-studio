import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {ToyotaV19Chapter2} from './longform/ToyotaV19Chapter2';
import data from './data/longform/toyota-v19-chapter2.json';

const Root = () => <Composition id="ToyotaV19Chapter2" component={ToyotaV19Chapter2}
  width={1920} height={1080} fps={30} durationInFrames={data.frames} />;
registerRoot(Root);
