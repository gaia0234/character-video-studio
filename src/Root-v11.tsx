import {Composition} from 'remotion';
import {FPS} from './data/video';
import {LongformToyota01V11, toyota01V11DurationFrames} from './longform/LongformToyota01V11';

// V11（5区間・35scene・自然会話版・音声付き）専用エントリ。共有ファイルは編集しない。
export const RootV11 = () => <>
  <Composition id="LongformToyota01V11" component={LongformToyota01V11}
    width={1920} height={1080} fps={FPS} durationInFrames={toyota01V11DurationFrames} />
</>;
