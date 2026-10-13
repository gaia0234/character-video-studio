import {AbsoluteFill, Html5Audio, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {commentsFor, framesFor, type SceneData, type VideoData} from '../data/video';
import {colors, contentStyle} from '../design';
import {CommentBox} from './CommentBox';

export const RankingScene = ({scene, mode, index, count, testMode}: {
  scene: SceneData; mode: VideoData['mode']; index: number; count: number; testMode: boolean;
}) => {
  const frame = useCurrentFrame();
  const visibleComments = commentsFor(scene).filter((item) => framesFor(item.startSeconds) <= frame);
  const comment = visibleComments[visibleComments.length - 1];
  const imageProgress = interpolate(frame, [6, 15], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const titleProgress = interpolate(frame, [0, 8], [0, 1], {extrapolateRight: 'clamp'});
  const imageScale = scene.image ? Math.min(800 / scene.image.width, 490 / scene.image.height) : 1;
  return <AbsoluteFill>
    {scene.narration ? <Html5Audio src={staticFile(scene.narration)} /> : null}
    <div style={{...contentStyle, top: 176, display: 'flex', alignItems: 'center', gap: 28}}>
      <div style={{fontSize: 54, fontWeight: 800, color: colors.muted}}>{mode === 'ranking' ? `第${scene.rank}位` : `${index + 1}/${count}`}</div>
      <div style={{height: 2, flex: 1, background: colors.line}} />
    </div>
    <h2 data-fit style={{...contentStyle, top: 280, height: 250, fontSize: 64, fontWeight: 800,
      lineHeight: 1.3, margin: 0, whiteSpace: 'pre-line', opacity: titleProgress,
      transform: `translateY(${(1 - titleProgress) * 18}px)`}}>{scene.title}</h2>
    <div style={{...contentStyle, top: 560, height: 550, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: colors.white, border: `2px solid ${colors.line}`, borderRadius: 24,
      opacity: imageProgress, transform: `translateY(${(1 - imageProgress) * 28}px)`}}>
      {scene.image ? <Img src={staticFile(scene.image.src)} style={{width: scene.image.width * imageScale,
        height: scene.image.height * imageScale, objectFit: 'contain'}} /> : null}
    </div>
    <p data-fit style={{...contentStyle, top: 1150, height: 185, fontSize: 40, lineHeight: 1.6,
      whiteSpace: 'pre-line', margin: 0, color: colors.muted}}>{scene.body}</p>
    <div style={{...contentStyle, top: 1390, height: 290}}>{comment ? <CommentBox {...comment} testMode={testMode} /> : null}</div>
  </AbsoluteFill>;
};
