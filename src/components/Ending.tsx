import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {colors, contentStyle} from '../design';

export const Ending = ({title, message}: {title: string; message: string}) => {
  const progress = interpolate(useCurrentFrame(), [0, 12], [0, 1], {extrapolateRight: 'clamp'});
  return <AbsoluteFill>
    <div style={{...contentStyle, top: 410, opacity: progress, transform: `translateY(${(1 - progress) * 20}px)`}}>
      <div style={{fontSize: 28, letterSpacing: 4, color: colors.muted, marginBottom: 44}}>ルーノ · ミーノ · カーノ</div>
      <h2 data-fit style={{fontSize: 80, fontWeight: 800, lineHeight: 1.4, margin: 0, whiteSpace: 'pre-line', maxHeight: 560}}>{title}</h2>
      <div style={{width: 100, height: 7, background: colors.gold, margin: '48px 0'}} />
      <p data-fit style={{fontSize: 38, lineHeight: 1.8, margin: 0, whiteSpace: 'pre-line', maxHeight: 360}}>{message}</p>
    </div>
  </AbsoluteFill>;
};
