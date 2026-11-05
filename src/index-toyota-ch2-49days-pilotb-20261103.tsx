import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {ToyotaCh2FortyNineDaysPilotB} from './longform/ToyotaCh2FortyNineDaysPilotB';

const Root = () => <Composition id="ToyotaCh2FortyNineDaysPilotB" component={ToyotaCh2FortyNineDaysPilotB}
  width={1920} height={1080} fps={30} durationInFrames={825} />;
registerRoot(Root);
