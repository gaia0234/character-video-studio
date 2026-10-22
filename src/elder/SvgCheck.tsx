import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';

const boxes = [
  {key: 'homer', x: 20},
  {key: 'judd', x: 500},
  {key: 'kent', x: 980},
];

export const SvgCheck: React.FC = () => (
  <AbsoluteFill style={{background: '#F6F1E4'}}>
    {boxes.map((b) => (
      <div key={b.key} style={{position: 'absolute', left: b.x, top: 20, width: 460, height: 980}}>
        <Img
          src={staticFile(`assets/characters/elder-svg/${b.key}.svg`)}
          style={{width: '100%', height: '100%', objectFit: 'contain'}}
        />
      </div>
    ))}
  </AbsoluteFill>
);
