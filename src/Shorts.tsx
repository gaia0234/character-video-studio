import {AbsoluteFill, Html5Audio, Series, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Intro} from './components/Intro';
import {RankingScene} from './components/RankingScene';
import {Ending} from './components/Ending';
import {framesFor, type VideoProps} from './data/video';
import {Background} from './components/Background';
import {useLocalFont} from './components/useLocalFont';
import {colors, contentStyle} from './design';

export const Shorts = ({video}: VideoProps) => {
  useLocalFont();
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  return <AbsoluteFill style={{color: colors.ink,
    fontFamily: '"Studio Noto Sans JP", sans-serif'}}>
    <Background />
    {video.narration ? <Html5Audio src={staticFile(video.narration)} /> : null}
    <Series>
      <Series.Sequence durationInFrames={framesFor(video.introSeconds)}><Intro title={video.title} subtitle={video.subtitle}
        selectionLabel={video.mode === 'ranking' ? `TOP ${video.scenes.length}` : `${video.scenes.length}選`} /></Series.Sequence>
      {video.scenes.map((scene, index) => <Series.Sequence key={index} durationInFrames={framesFor(scene.seconds)}>
        <RankingScene scene={scene} mode={video.mode} index={index} count={video.scenes.length} testMode={video.testMode} />
      </Series.Sequence>)}
      <Series.Sequence durationInFrames={framesFor(video.endingSeconds)}><Ending {...video.ending} /></Series.Sequence>
    </Series>
    {video.testMode ? <div style={{...contentStyle, top: 82, display: 'flex', justifyContent: 'space-between',
      fontSize: 24, letterSpacing: 2, color: colors.muted}}>
      <span>レイアウト試験</span><span>無音 · キャラ仮配置</span>
    </div> : null}
    <div style={{...contentStyle, bottom: 180, height: 5, background: colors.line}}>
      <div style={{height: '100%', width: `${Math.min(100, (frame + 1) / durationInFrames * 100)}%`, background: colors.gold}} />
    </div>
  </AbsoluteFill>;
};
