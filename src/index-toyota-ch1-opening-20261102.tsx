import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {ToyotaCh1Opening20261102} from './longform/ToyotaCh1Opening20261102';

const Root = () => <Composition id="ToyotaCh1Opening20261102" component={ToyotaCh1Opening20261102}
  width={1920} height={1080} fps={30} durationInFrames={811} />;
registerRoot(Root);
