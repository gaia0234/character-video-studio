const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
// Run the production TypeScript directly without adding a test dependency.
require.extensions['.ts'] = (module, filename) => {
  const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true},
  });
  module._compile(compiled.outputText, filename);
};
const {resolveTimeline, validateSceneContract, sampleToSceneFrame, formatClaim} = require('./contracts.ts');
const {chapterData, chapterTiming, audioManifest, resolveSelection, openingCues, resolveOpeningDirection} = require('./chapters/ch1/model.ts');

const scene = chapterTiming.scenes[0];
// Cut changes follow the manifest's subtitle IDs, including any future approved boundary change.
assert.deepEqual(resolveOpeningDirection().cuts, {bFrom: 276, cFrom: 439});
const movedCues = structuredClone(openingCues);
movedCues.find((cue) => cue.id === 'ch1-01-04').start = 277;
assert.equal(resolveOpeningDirection(movedCues).cuts.bFrom, 277);
assert.throws(() => resolveOpeningDirection(openingCues.filter((cue) => cue.id !== 'ch1-01-06')), /missing cut cue/);
assert.equal(resolveSelection({selectedScene: 'ch1-01'}).durationInFrames, 811);
assert.throws(() => resolveSelection({selectedScene: 'ch2-01'}), /not migrated/);
assert.throws(() => resolveSelection({selectedScene: ''}), /not migrated/);
assert.deepEqual(resolveTimeline([{id: 'a', durationInFrames: 10}, {id: 'b', durationInFrames: 23}]), [
  {id: 'a', durationInFrames: 10, startFrame: 0}, {id: 'b', durationInFrames: 23, startFrame: 10},
]);
assert.throws(() => resolveTimeline([{id: 'a', durationInFrames: 10}, {id: 'a', durationInFrames: 23}]), /duplicate/);
assert.throws(() => resolveTimeline([{id: 'a', durationInFrames: 0}]), /positive integer/);

// At 24kHz/30fps one frame is 800 samples; only this conversion applies lead/rounding.
assert.equal(sampleToSceneFrame(46400, 24000, 30, 12), 70);
assert.equal(sampleToSceneFrame(399, 24000, 30, 12), 12);
assert.equal(sampleToSceneFrame(400, 24000, 30, 12), 13);
assert.deepEqual(openingCues.map(({start, end}) => [start, end]), [
  [12, 70], [70, 221], [221, 276], [276, 371], [371, 439],
  [439, 525], [525, 615], [615, 702], [702, 795],
]);
assert.equal(formatClaim(chapterData, 'g21-start'), '1993年');
assert.equal(formatClaim(chapterData, 'economy-target'), '1.5倍');
assert.throws(() => formatClaim(chapterData, 'missing'), /missing claim/);
validateSceneContract(scene, audioManifest, chapterTiming.fps, chapterData);
// Actual PCM plus 12f lead and preserved tail fits exactly; shortening by 1f must fail.
assert.throws(() => validateSceneContract({...scene, durationInFrames: 810}, audioManifest, 30, chapterData), /audio.*exceeds/);
assert.throws(() => validateSceneContract({...scene, audioId: 'missing'}, audioManifest, 30, chapterData), /missing audio/);
const badManifest = structuredClone(audioManifest);
badManifest.clips[0].cues[1].startSample = -1;
assert.throws(() => validateSceneContract(scene, badManifest, 30, chapterData), /cue.*order/);
const duplicate = structuredClone(audioManifest);
duplicate.clips[0].cues[1].id = duplicate.clips[0].cues[0].id;
assert.throws(() => validateSceneContract(scene, duplicate, 30, chapterData), /duplicate cue/);
const missingMiddleCue = structuredClone(audioManifest);
missingMiddleCue.clips[0].cues = missingMiddleCue.clips[0].cues.filter((cue) => cue.id !== 'ch1-01-05');
assert.throws(() => validateSceneContract(scene, missingMiddleCue, 30, chapterData), /cue IDs.*narration order/);
const extraCue = structuredClone(audioManifest);
extraCue.clips[0].cues.push({id: 'unplanned', startSample: 626400, endSample: 626432});
const extraText = structuredClone(chapterData);
extraText.subtitles.unplanned = {template: '余分な字幕。', claimIds: []};
assert.throws(() => validateSceneContract(scene, extraCue, 30, extraText), /cue IDs.*narration order/);
const duplicateExpected = structuredClone(chapterData);
duplicateExpected.narrationOrder[4] = duplicateExpected.narrationOrder[3];
assert.throws(() => validateSceneContract(scene, audioManifest, 30, duplicateExpected), /duplicate expected cue/);
const missingText = structuredClone(chapterData);
delete missingText.subtitles['ch1-01-02'];
assert.throws(() => validateSceneContract(scene, audioManifest, 30, missingText), /missing subtitle/);
const wrongMeaning = structuredClone(chapterData);
wrongMeaning.claims['economy-target'].definition = '';
assert.throws(() => validateSceneContract(scene, audioManifest, 30, wrongMeaning), /claim.*definition/);
console.log('v20 contracts: PASS (selection, accumulation, sample rounding, inherited cues, numeric meaning, exact fit and invalid inputs)');
