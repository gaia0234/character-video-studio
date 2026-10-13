import {AbsoluteFill} from 'remotion';
import {colors} from '../design';

export const Background = () => <AbsoluteFill style={{background: colors.paper}}>
  <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute'}} aria-hidden>
    <path d="M0 0H1080V620C850 550 630 170 0 350Z" fill={colors.white} />
    <circle cx="1030" cy="250" r="290" fill={colors.paleBlue} opacity=".55" />
    <path d="M730 30C450 140 1000 430 880 670" fill="none" stroke={colors.line} strokeWidth="3" strokeDasharray="10 15" />
    <g transform="translate(925 235)" stroke={colors.ink} fill="none" opacity=".13">
      <circle r="78" strokeWidth="3" /><circle r="60" strokeWidth="2" />
      <path d="M0-98V98M-98 0H98M0-55L17 0 0 55-17 0Z" strokeWidth="3" />
    </g>
    <path d="M0 1795C350 1680 660 1865 1080 1715V1920H0Z" fill={colors.paleBlue} opacity=".7" />
    <g transform="translate(70 1840)" fill="none" stroke={colors.muted} strokeWidth="3" opacity=".3">
      <path d="M0 0H170V28H0ZM12-32H160V-4H12ZM25-65H150V-36H25Z" />
      <path d="M36-48H132M25 12H146M65-18H140" />
    </g>
    <g transform="translate(985 1735)" fill="none" stroke={colors.muted} strokeWidth="3" opacity=".3">
      <path d="M0 0V90M0 28C-45 24-48-8-40-18 0-14 0 28 0 28ZM0 58C44 54 48 18 40 10 3 19 0 58 0 58Z" />
      <path d="M-26 90H26L19 126H-19Z" />
    </g>
  </svg>
</AbsoluteFill>;
