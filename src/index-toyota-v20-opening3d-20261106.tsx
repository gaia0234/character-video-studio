import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {Opening, MarkerCheck, CarCheck} from './longform/v20-opening3d/Opening';
import timing from './longform/v20-opening3d/timing.json';

const Root = () => <>
  <Composition id="ToyotaV20Opening3D" component={Opening} width={1920} height={1080} fps={30} durationInFrames={timing.frames}/>
  {(['homer', 'kent', 'judd'] as const).flatMap(who => [false, true].map(animated =>
    <Composition key={`${who}-${animated}`} id={`Marker-${who}-${animated ? 'motion' : 'front'}`} component={MarkerCheck}
      defaultProps={{who, animated}} width={800} height={900} fps={30} durationInFrames={300}/>))}
  {(['side', 'top'] as const).map(view => <Composition key={view} id={`Car-${view}`} component={CarCheck}
    defaultProps={{view}} width={1600} height={900} fps={30} durationInFrames={1}/>)}
</>;
registerRoot(Root);
