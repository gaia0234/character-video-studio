import {Composition} from 'remotion';
import {FPS} from './data/video';
import {LongformToyota01V9, toyota01DurationFrames} from './longform/LongformToyota01V9';

// v9（男声2・速度1.04）専用エントリ。共有ファイルは編集しない。
export const RootV9 = () => <>
  <Composition id="LongformToyota01V9" component={LongformToyota01V9}
    width={1920} height={1080} fps={FPS} durationInFrames={toyota01DurationFrames} />
</>;
