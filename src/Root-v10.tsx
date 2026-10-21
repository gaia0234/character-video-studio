import {Composition} from 'remotion';
import {FPS} from './data/video';
import {LongformToyota01V10, toyota01V10DurationFrames} from './longform/LongformToyota01V10';

// v10（全章60scene・音声付き初稿）専用エントリ。共有ファイルは編集しない。
export const RootV10 = () => <>
  <Composition id="LongformToyota01V10" component={LongformToyota01V10}
    width={1920} height={1080} fps={FPS} durationInFrames={toyota01V10DurationFrames} />
</>;
