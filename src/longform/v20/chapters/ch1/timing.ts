// Scene-local direction only. Subtitle boundaries and PCM duration live in the audio manifest.
export const chapterTiming = {
  fps: 30,
  scenes: [{
    id: 'ch1-01', durationInFrames: 811, audioId: 'ch1-01-voice', audioOffsetFrames: 12,
    // Inherited 0.532s ending hold (result.json audio.tail_seconds), at 30fps.
    tailPaddingFrames: 15.96,
    direction: {
      cuts: {bCueId: 'ch1-01-04', cCueId: 'ch1-01-06'},
      yearIn: [15, 33], deskIn: [80, 98], carIn: [110, 128], projectIn: [229, 247],
      chartIn: [286, 304], environmentIn: [445, 463], resourcesIn: [491, 509],
    },
  }],
} as const;
