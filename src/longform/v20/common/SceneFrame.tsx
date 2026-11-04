import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Backdrop, MarkerFilters, useStudioFont} from '../../ToyotaV3VisualFrame';

export const SceneFrame = ({children}: {children: React.ReactNode}) => {
  useStudioFont();
  return <AbsoluteFill style={{background: '#F5F0E5', color: '#293747', fontFamily: '"Studio Noto Sans JP", sans-serif'}}>
    <MarkerFilters />
    <Backdrop mode="diagram" tone="day" />
    {children}
  </AbsoluteFill>;
};
