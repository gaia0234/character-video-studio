import React from 'react';
import {Composition} from 'remotion';
import {ElderShortIntro} from './ElderShortIntro';

export const ElderRoot: React.FC = () => (
  <Composition
    id="ElderShortIntro"
    component={ElderShortIntro}
    width={1080}
    height={1920}
    fps={30}
    durationInFrames={600}
  />
);
