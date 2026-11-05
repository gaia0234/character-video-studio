import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {ToyotaV3Opening21} from './longform/ToyotaV3Opening21';
import data from './data/longform/toyota-v3-p4-21.json';

const Root = () => <Composition id="ToyotaV3P421" component={ToyotaV3Opening21}
  width={1920} height={1080} fps={30} durationInFrames={data.frames} />;
registerRoot(Root);
