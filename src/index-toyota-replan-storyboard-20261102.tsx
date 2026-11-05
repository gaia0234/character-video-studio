import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {ToyotaReplanStoryboard20261102, RepA} from './longform/ToyotaReplanStoryboard20261102';

const Root = () => <>
  <Composition id="ToyotaReplanStoryboard20261102" component={ToyotaReplanStoryboard20261102}
    width={1920} height={1080} fps={30} durationInFrames={30} />
  <Composition id="ToyotaReplanRepA20261102" component={RepA}
    width={1920} height={1080} fps={30} durationInFrames={30} />
</>;
registerRoot(Root);
