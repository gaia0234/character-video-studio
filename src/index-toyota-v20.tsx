import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {ToyotaV20} from './longform/v20/ToyotaV20';
import {resolveSelection, ToyotaV20Props} from './longform/v20/chapters/ch1/model';

const defaultProps: ToyotaV20Props = {selectedScene: 'ch1-01'};
const defaults = resolveSelection(defaultProps);
const Root = () => <Composition id="ToyotaV20" component={ToyotaV20}
  width={1920} height={1080} fps={defaults.fps} durationInFrames={defaults.durationInFrames}
  defaultProps={defaultProps}
  calculateMetadata={({props}) => ({durationInFrames: resolveSelection(props).durationInFrames, props})} />;
registerRoot(Root);
