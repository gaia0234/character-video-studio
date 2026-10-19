import {Composition} from 'remotion';
import {FPS} from './data/video';
import {LongformToyota01V5B, toyota01DurationFrames} from './longform/LongformToyota01V5B';

// v5b分離検証用エントリ。共有ファイル（Root.tsx等）は編集せず、新規ファイルのみ。
export const RootV5B = () => <>
  <Composition id="LongformToyota01V5B" component={LongformToyota01V5B}
    width={1920} height={1080} fps={FPS} durationInFrames={toyota01DurationFrames} />
</>;
