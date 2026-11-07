import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {OpeningRest} from './longform/v20-opening3d-rest/OpeningRest';
import timing from './longform/v20-opening3d-rest/timing.json';
// Accepted r2 composition, imported read-only: used only to render its final frame (f831) beside rest f0.
import {Opening as OpeningR2} from './longform/v20-opening3d/Opening';
import timingR2 from './longform/v20-opening3d/timing.json';

const Root = () => <>
  <Composition id="ToyotaV20OpeningRest" component={OpeningRest} width={1920} height={1080} fps={30} durationInFrames={timing.frames}/>
  <Composition id="ToyotaV20Opening3D-r2ref" component={OpeningR2} width={1920} height={1080} fps={30} durationInFrames={timingR2.frames}/>
</>;
registerRoot(Root);
