import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {ToyotaV19Chapter5} from './longform/ToyotaV19Chapter5';
import data from './data/longform/toyota-v19-ch5.json';

const Root = () => <Composition id="ToyotaV19Chapter5" component={ToyotaV19Chapter5}
  width={1920} height={1080} fps={30} durationInFrames={data.frames} />;
registerRoot(Root);
