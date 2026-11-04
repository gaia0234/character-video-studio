import React from 'react';
import {Sequence} from 'remotion';
import {OpeningScene} from './chapters/ch1/Scene';
import {resolveSelection, ToyotaV20Props} from './chapters/ch1/model';

export const ToyotaV20 = (props: ToyotaV20Props) => {
  const {scenes} = resolveSelection(props);
  return <>{scenes.map((scene) => <Sequence key={scene.id} from={scene.startFrame} durationInFrames={scene.durationInFrames}>
    <OpeningScene />
  </Sequence>)}</>;
};
