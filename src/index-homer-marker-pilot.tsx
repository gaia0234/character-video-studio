import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {HomerMarkerPilot} from './elder/HomerMarkerPilot';

const Root = () => <Composition id="HomerMarkerPilot" component={HomerMarkerPilot}
  width={1280} height={1080} fps={30} durationInFrames={300} />;
registerRoot(Root);
