import {Composition} from 'remotion';
import {FPS} from './data/video';
import {LongformToyota01V7, toyota01DurationFrames} from './longform/LongformToyota01V7';

// v7（掛け合い構成修正・低めナレーター）専用エントリ。共有ファイルは編集しない。
export const RootV7 = () => <>
  <Composition id="LongformToyota01V7" component={LongformToyota01V7}
    width={1920} height={1080} fps={FPS} durationInFrames={toyota01DurationFrames} />
</>;
