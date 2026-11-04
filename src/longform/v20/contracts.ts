export type NumericClaim = {
  value: number;
  unit: string;
  referenceDate?: string;
  period?: string;
  definition: string;
  source: {record: string; location: string; url?: string};
  checkedAt: string;
  verification: string;
};
export type ChapterData = {
  claims: Record<string, NumericClaim>;
  subtitles: Record<string, {template: string; claimIds: string[]}>;
  narrationOrder: string[];
};
export type AudioManifest = {
  clips: {
    id: string; sceneId: string; path: string; sha256: string;
    sampleRate: number; sampleCount: number;
    cues: {id: string; startSample: number; endSample: number}[];
  }[];
};
export type SceneTiming = {
  id: string; durationInFrames: number; audioId: string;
  audioOffsetFrames: number; tailPaddingFrames: number;
};

export const resolveTimeline = <T extends {id: string; durationInFrames: number}>(scenes: readonly T[]) => {
  const ids = new Set<string>();
  let startFrame = 0;
  return scenes.map((scene) => {
    if (ids.has(scene.id)) throw new Error(`duplicate scene: ${scene.id}`);
    if (!Number.isInteger(scene.durationInFrames) || scene.durationInFrames <= 0) throw new Error('duration must be a positive integer');
    ids.add(scene.id);
    const resolved = {...scene, startFrame};
    startFrame += scene.durationInFrames;
    return resolved;
  });
};

// Audio origin is samples. Rounding and scene lead are applied only here.
export const sampleToSceneFrame = (sample: number, sampleRate: number, fps: number, audioOffsetFrames: number) =>
  Math.round(sample / sampleRate * fps) + audioOffsetFrames;

export const formatClaim = (data: ChapterData, id: string, includeUnit = true) => {
  const claim = data.claims[id];
  if (!claim) throw new Error(`missing claim: ${id}`);
  if (!Number.isFinite(claim.value) || !claim.unit || !claim.definition || !(claim.referenceDate || claim.period) ||
    !claim.source.record || !claim.source.location || !claim.checkedAt || !claim.verification) {
    throw new Error(`claim ${id} requires value/unit/date/source/definition/verification`);
  }
  return `${claim.value}${includeUnit ? claim.unit : ''}`;
};

export const subtitleText = (data: ChapterData, id: string) => {
  const subtitle = data.subtitles[id];
  if (!subtitle) throw new Error(`missing subtitle: ${id}`);
  let text = subtitle.template;
  for (const claimId of subtitle.claimIds) text = text.split(`{{${claimId}}}`).join(formatClaim(data, claimId));
  if (/\{\{/.test(text)) throw new Error(`unresolved claim in subtitle: ${id}`);
  return text;
};

export const validateSceneContract = (scene: SceneTiming, manifest: AudioManifest, fps: number, data: ChapterData) => {
  resolveTimeline([scene]);
  if (!(fps > 0) || !Number.isInteger(scene.audioOffsetFrames) || scene.audioOffsetFrames < 0 || scene.tailPaddingFrames < 0) throw new Error('invalid scene timing');
  const clips = manifest.clips.filter((clip) => clip.id === scene.audioId);
  if (clips.length !== 1) throw new Error(`missing audio or duplicate audio: ${scene.audioId}`);
  const clip = clips[0];
  if (clip.sceneId !== scene.id || !(clip.sampleRate > 0) || !Number.isInteger(clip.sampleCount) || clip.sampleCount <= 0 || !/^[a-f0-9]{64}$/.test(clip.sha256)) throw new Error('invalid audio identity');
  const usedFrames = scene.audioOffsetFrames + clip.sampleCount / clip.sampleRate * fps + scene.tailPaddingFrames;
  if (usedFrames > scene.durationInFrames + 1e-8) throw new Error(`audio with padding exceeds scene ${scene.id}`);
  if (new Set(data.narrationOrder).size !== data.narrationOrder.length) throw new Error('duplicate expected cue in narration order');
  const ids = new Set<string>();
  let previousEnd = 0;
  for (const cue of clip.cues) {
    if (ids.has(cue.id)) throw new Error(`duplicate cue: ${cue.id}`);
    ids.add(cue.id);
    if (!Number.isInteger(cue.startSample) || !Number.isInteger(cue.endSample) || cue.startSample < previousEnd || cue.endSample <= cue.startSample || cue.endSample > clip.sampleCount) throw new Error(`cue ${cue.id} order/range invalid`);
    subtitleText(data, cue.id);
    previousEnd = cue.endSample;
  }
  if (clip.cues.length !== data.narrationOrder.length || clip.cues.some((cue, index) => cue.id !== data.narrationOrder[index])) {
    throw new Error('cue IDs must match narration order exactly');
  }
  for (const id of Object.keys(data.claims)) formatClaim(data, id);
  return clip;
};
