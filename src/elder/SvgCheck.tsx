import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';

export const SvgCheck: React.FC = () => (
  <AbsoluteFill style={{background: '#F6F1E4', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 10, padding: 16}}>
    {['homer', 'judd', 'kent'].map((k) => (
      <div key={k} style={{width: 460, height: 980}}>
        <Img src={staticFile(`assets/characters/elder-svg/${k}.svg`)} style={{width: '100%', height: '100%', objectFit: 'contain'}} />
      </div>
    ))}
  </AbsoluteFill>
);
