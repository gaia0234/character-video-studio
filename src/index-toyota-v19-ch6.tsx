import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {ToyotaV19Chapter6} from './longform/ToyotaV19Chapter6';
import data from './data/longform/toyota-v19-ch6.json';

const Root = () => <Composition id="ToyotaV19Chapter6" component={ToyotaV19Chapter6}
  width={1920} height={1080} fps={30} durationInFrames={data.frames} />;
registerRoot(Root);
