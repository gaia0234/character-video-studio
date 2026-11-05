import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {ToyotaV19Chapter1} from './longform/ToyotaV19Chapter1';
import data from './data/longform/toyota-v19-chapter1.json';

const Root = () => <Composition id="ToyotaV19Chapter1" component={ToyotaV19Chapter1}
  width={1920} height={1080} fps={30} durationInFrames={data.frames} />;
registerRoot(Root);
