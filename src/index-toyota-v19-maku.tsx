import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {ToyotaV19Maku} from './longform/ToyotaV19Maku';
import data from './data/longform/toyota-v19-maku.json';

const Root = () => <Composition id="ToyotaV19Maku" component={ToyotaV19Maku}
  width={1920} height={1080} fps={30} durationInFrames={data.frames} />;
registerRoot(Root);
