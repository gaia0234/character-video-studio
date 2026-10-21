// V10尺検査の境界テスト: node scripts/check-longform-v10.test.mjs
// 意味のある境界のみ: 一致境界pass / +1フレーム超過fail / 開始0.4s控除の再発ケース /
// cue収まり（scene内・重複なし）。実ファイル検査は本体check-longform-v10.mjsが担当。
import {strict as assert} from 'node:assert';
import {
  evaluateAudioWindow, evaluateCueFit,
} from './check-longform-v10.mjs';

const FPS = 30;

// ケース1: 一致境界はpass（端数は切り上げで吸収する）
{
  const r = evaluateAudioWindow({audioSeconds: 20.0, startSeconds: 0.4, tailSeconds: 0.5, sceneSeconds: 20.9, fps: FPS});
  // 必要尺=20.9s → 必要フレーム=627 → scene 20.9s=627f で一致
  assert.equal(r.requiredFrames, 627, `必要フレーム627、実測${r.requiredFrames}`);
  assert.equal(r.limitFrames, 627);
  assert.equal(r.ok, true, '一致境界はpassであること');
}

// ケース2: +1フレーム超過はfail（ちょうど1fの境界）
{
  // 必要尺がscene+ちょうど1フレーム分だけ長い: audio=20+1/30s → audio+0.9=20.9333…s (628f) > scene 20.9s (627f)
  const r = evaluateAudioWindow({audioSeconds: 20 + 1 / 30, startSeconds: 0.4, tailSeconds: 0.5, sceneSeconds: 20.9, fps: FPS});
  assert.equal(r.ok, false, '超過はfailであること');
  assert.equal(r.excessFrames, 1, `超過フレーム${r.excessFrames}`);
}

// ケース3: 開始0.4s控除の再発ケース。0.4を控除しない実装はここを誤ってpassする。
//   audio 20.0s: audio+0.5=20.5s(615f) ならscene 20.6s(618f)へfitするが、
//   audio+0.4+0.5=20.9s(627f) はscene 20.6s を超える。正しい実装は必ずfail。
{
  const r = evaluateAudioWindow({audioSeconds: 20.0, startSeconds: 0.4, tailSeconds: 0.5, sceneSeconds: 20.6, fps: FPS});
  assert.equal(r.ok, false, '開始0.4sを控除しないと通るケースでfailであること');
  assert.equal(r.excessFrames, 9, `audio+0.4+0.5=20.9s(627f) > scene 20.6s(618f)→ちょうど9f超過のはず、実測${r.excessFrames}`);
}

// ケース3b: 同一scene秒で開始0.4s分がほぼぴったり収まるラインの確認。
//   必要尺=audio+0.9。scene 20.9s のとき audio 最大20.0s（これを境にpass/failが反転する）。
{
  const okLine = evaluateAudioWindow({audioSeconds: 20.0, startSeconds: 0.4, tailSeconds: 0.5, sceneSeconds: 20.9, fps: FPS});
  assert.equal(okLine.ok, true);
  const overLine = evaluateAudioWindow({audioSeconds: 20.034, startSeconds: 0.4, tailSeconds: 0.5, sceneSeconds: 20.9, fps: FPS});
  assert.equal(overLine.ok, false, `境界直上の+0.034s（ceilで2フレーム超過）はfail: frames=${overLine.requiredFrames}`);
}

// ケース4: cue収まり。start<end・前cueのend<=次cueのstart・全体がscene内。
{
  const okCues = evaluateCueFit(
    [{start: 0, end: 3, speaker: 'ミーノ', text: 'あ'}, {start: 17, end: 20, speaker: 'ナレ2', text: 'い'}], 630);
  assert.equal(okCues.ok, true, JSON.stringify(okCues));
  // 最終cueのendがsceneを超える → fail（scene=21秒に対しcue end=21.5s）
  const overEnd = evaluateCueFit(
    [{start: 0, end: 3, speaker: 'ミーノ', text: 'あ'}, {start: 17, end: 21.5, speaker: 'ナレ2', text: 'い'}], 630);
  assert.equal(overEnd.ok, false, `最終cueのscene超過はfail: ${JSON.stringify(overEnd)}`);
  // 重複はfail
  const overlap = evaluateCueFit(
    [{start: 0, end: 5, speaker: 'ミーノ', text: 'あ'}, {start: 4, end: 10, speaker: 'ナレ2', text: 'い'}], 630);
  assert.equal(overlap.ok, false, `cue重複はfail: ${JSON.stringify(overlap)}`);
  // 逆順はfail
  const inverted = evaluateCueFit(
    [{start: 17, end: 20, speaker: 'ミーノ', text: 'あ'}, {start: 0, end: 3, speaker: 'ナレ2', text: 'い'}], 630);
  assert.equal(inverted.ok, false, `cue逆順はfail: ${JSON.stringify(inverted)}`);
}

console.log('境界テスト: 全ケースpass（一致pass/+1f fail/開始offset控除fail/cue収まり）');
