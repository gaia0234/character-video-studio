import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';

const items = [
  ['homer', 'happy'], ['homer', 'cheer'], ['judd', 'sigh'], ['judd', 'stern'],
  ['kent', 'nod'], ['kent', 'think'],
];

export const SvgCheck: React.FC = () => (
  <AbsoluteFill style={{background: '#F6F1E4'}}>
    {items.map(([key, expr], i) => (
      <div key={`${key}-${expr}`} style={{position: 'absolute', left: 20 + (i % 6) * 260, top: 20, width: 250, height: 980}}>
        <Img
          src={staticFile(`assets/characters/elder-svg/${key}-${expr}.svg`)}
          style={{width: '100%', height: '100%', objectFit: 'contain'}}
        />
      </div>
    ))}
  </AbsoluteFill>
);
