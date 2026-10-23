import React from 'react';
import {AbsoluteFill, Img, staticFile, getInputProps} from 'remotion';

const LABELS: Record<string, string> = {
  homer: 'ホーマー（赤・差し色 #C8322C）',
  judd: 'ジャッド（青・差し色 #2B5FA8）',
  kent: 'ケント（緑・差し色 #2E7D4F）',
};

/**
 * 元画像（設定シート切出し）と生成SVGの左右比較。
 * 使い方: npx remotion still src/elder/index.ts ElderSvgCheck out.png --props='{"char":"homer"}'
 */
export const SvgCheck: React.FC = () => {
  const {char = 'homer'} = getInputProps() as {char?: string};
  const label = LABELS[char] ?? char;
  const pane = (title: string, src: string): React.ReactNode => (
    <div style={{flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 12}}>
      <div style={{fontSize: 34, fontWeight: 700, marginBottom: 8}}>{title}</div>
      <div style={{flex: 1, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <Img src={src} style={{maxWidth: '100%', maxHeight: '100%', objectFit: 'contain'}} />
      </div>
    </div>
  );
  return (
    <AbsoluteFill style={{background: '#F6F1E4', flexDirection: 'row'}}>
      {pane(`元画像 ${label}`, staticFile(`assets/characters/elder-source/${char}.png`))}
      {pane(`生成SVG ${label}`, staticFile(`assets/characters/elder-svg/${char}.svg`))}
    </AbsoluteFill>
  );
};
