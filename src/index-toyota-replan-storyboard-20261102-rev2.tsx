import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {ToyotaReplanStoryboard20261102Rev2} from './longform/ToyotaReplanStoryboard20261102Rev2';

const Root = () => <Composition id="ToyotaReplanStoryboard20261102Rev2" component={ToyotaReplanStoryboard20261102Rev2}
  width={1920} height={1080} fps={30} durationInFrames={30} />;
registerRoot(Root);
