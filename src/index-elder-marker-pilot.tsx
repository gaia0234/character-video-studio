import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {ElderMarkerPilot} from './elder/ElderMarkerPilot';

const Root = () => <>
  <Composition id="JuddMarkerPilot" component={ElderMarkerPilot} defaultProps={{who: 'judd' as const}}
    width={1280} height={1080} fps={30} durationInFrames={300} />
  <Composition id="KentMarkerPilot" component={ElderMarkerPilot} defaultProps={{who: 'kent' as const}}
    width={1280} height={1080} fps={30} durationInFrames={300} />
</>;
registerRoot(Root);
