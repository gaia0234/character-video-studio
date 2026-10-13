import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {colors, contentStyle} from '../design';

export const Intro = ({title, subtitle, selectionLabel}: {title: string; subtitle: string; selectionLabel: string}) => {
  const progress = interpolate(useCurrentFrame(), [0, 12], [0, 1], {extrapolateRight: 'clamp'});
  return <AbsoluteFill>
    <div style={{...contentStyle, top: 320, fontSize: 28, letterSpacing: 4, color: colors.muted}}>ルーノ · ミーノ · カーノ</div>
    <div style={{...contentStyle, top: 420, opacity: progress, transform: `translateY(${(1 - progress) * 24}px)`}}>
      <h1 data-fit style={{fontSize: 92, fontWeight: 800, lineHeight: 1.42, margin: 0, whiteSpace: 'pre-line', maxHeight: 580}}>{title}</h1>
      <div style={{width: 100, height: 7, background: colors.gold, margin: '48px 0'}} />
      <div style={{display: 'inline-block', fontSize: 44, fontWeight: 800, padding: '14px 32px',
        borderRadius: 16, background: colors.paleBlue}}>{selectionLabel}</div>
      <p data-fit style={{fontSize: 38, lineHeight: 1.7, margin: '36px 0 0', whiteSpace: 'pre-line', maxHeight: 220}}>{subtitle}</p>
    </div>
    <div style={{...contentStyle, top: 1500, fontSize: 26, color: colors.muted}}>知る。見つける。考える。</div>
  </AbsoluteFill>;
};
