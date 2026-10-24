import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {ToyotaV3Opening01} from './longform/ToyotaV3Opening01';
import data from './data/longform/toyota-v3-p1-01.json';

const Root = () => <Composition id="ToyotaV3P101" component={ToyotaV3Opening01}
  width={1920} height={1080} fps={30} durationInFrames={data.frames} />;
registerRoot(Root);
