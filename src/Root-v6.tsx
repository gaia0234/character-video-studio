import {Composition} from 'remotion';
import {FPS} from './data/video';
import {LongformToyota01V6, toyota01DurationFrames} from './longform/LongformToyota01V6';

// v6（冒頭3キャラ掛け合い版）専用エントリ。共有ファイルは編集しない。
export const RootV6 = () => <>
  <Composition id="LongformToyota01V6" component={LongformToyota01V6}
    width={1920} height={1080} fps={FPS} durationInFrames={toyota01DurationFrames} />
</>;
