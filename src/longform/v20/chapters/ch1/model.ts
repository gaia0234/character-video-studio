import data from './data.json';
import manifest from '../../../../../public/audio/toyota-v20/ch1/manifest.json';
import {chapterTiming} from './timing';
import {formatClaim, resolveTimeline, sampleToSceneFrame, subtitleText, validateSceneContract} from '../../contracts';

export {chapterTiming};
export const chapterData = data;
export const audioManifest = manifest;
export const openingTiming = chapterTiming.scenes[0];
export const openingAudio = validateSceneContract(openingTiming, audioManifest, chapterTiming.fps, chapterData);
export const openingCues = openingAudio.cues.map((cue) => ({
  id: cue.id,
  start: sampleToSceneFrame(cue.startSample, openingAudio.sampleRate, chapterTiming.fps, openingTiming.audioOffsetFrames),
  end: sampleToSceneFrame(cue.endSample, openingAudio.sampleRate, chapterTiming.fps, openingTiming.audioOffsetFrames),
  text: subtitleText(chapterData, cue.id),
}));
export const resolveOpeningDirection = (cues = openingCues) => {
  const cueStart = (id: string) => {
    const cue = cues.find((item) => item.id === id);
    if (!cue) throw new Error(`missing cut cue: ${id}`);
    return cue.start;
  };
  return {...openingTiming.direction, cuts: {
    bFrom: cueStart(openingTiming.direction.cuts.bCueId),
    cFrom: cueStart(openingTiming.direction.cuts.cCueId),
  }};
};
export const openingDirection = resolveOpeningDirection();
export const narrationText = chapterData.narrationOrder.map((id) => subtitleText(chapterData, id)).join('');
export const claimText = (id: string, includeUnit = true) => formatClaim(chapterData, id, includeUnit);
export type ToyotaV20Props = {selectedScene: string};

// Only the one migrated scene is selectable. Unknown scenes cannot silently render ch1.
export const resolveSelection = (props: ToyotaV20Props) => {
  if (props.selectedScene !== openingTiming.id) throw new Error(`scene not migrated: ${props.selectedScene}`);
  const scenes = resolveTimeline([openingTiming]);
  const last = scenes[scenes.length - 1];
  return {scenes, durationInFrames: last.startFrame + last.durationInFrames, fps: chapterTiming.fps};
};
