import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {ToyotaReplanStoryboard20261102Rev3, RepARev3} from './longform/ToyotaReplanStoryboard20261102Rev3';

const Root = () => <>
  <Composition id="ToyotaReplanStoryboard20261102Rev3" component={ToyotaReplanStoryboard20261102Rev3}
    width={1920} height={1080} fps={30} durationInFrames={30} />
  <Composition id="ToyotaReplanRepA20261102Rev3" component={RepARev3}
    width={1920} height={1080} fps={30} durationInFrames={30} />
</>;
registerRoot(Root);
