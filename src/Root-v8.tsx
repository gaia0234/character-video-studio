import {Composition} from 'remotion';
import {FPS} from './data/video';
import {LongformToyota01V8, toyota01DurationFrames} from './longform/LongformToyota01V8';

// v8（ナレーター男声2採用）専用エントリ。共有ファイルは編集しない。
export const RootV8 = () => <>
  <Composition id="LongformToyota01V8" component={LongformToyota01V8}
    width={1920} height={1080} fps={FPS} durationInFrames={toyota01DurationFrames} />
</>;
