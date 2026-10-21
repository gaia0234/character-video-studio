import React from 'react';
import {Composition} from 'remotion';
import {ElderShortIntro} from './ElderShortIntro';
import {SvgCheck} from './SvgCheck';

export const ElderRoot: React.FC = () => (
  <>
    <Composition
      id="ElderShortIntro"
      component={ElderShortIntro}
      width={1080}
      height={1920}
      fps={30}
      durationInFrames={600}
    />
    <Composition
      id="ElderSvgCheck"
      component={SvgCheck}
      width={1600}
      height={1060}
      fps={30}
      durationInFrames={1}
    />
  </>
);
