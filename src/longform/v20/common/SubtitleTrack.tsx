import React from 'react';

export const SubtitleTrack = ({frame, cues}: {frame: number; cues: readonly {start: number; end: number; text: string}[]}) => {
  const cue = cues.find((q) => frame >= q.start && frame < q.end);
  if (!cue) return null;
  return <div data-check-id="subtitle-wrap" style={{position: 'absolute', left: 95, right: 95, bottom: 32, height: 106,
    display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
    <div style={{background: '#26313FF7', color: '#FFFCF5', borderRadius: 18, height: 106, padding: '0 32px',
      display: 'flex', alignItems: 'center', justifyContent: 'center', maxWidth: 1720,
      boxShadow: '0 10px 28px #1D253040'}}>
      <span style={{fontSize: 46, fontWeight: 800, lineHeight: 1.4, letterSpacing: '0.01em',
        textAlign: 'center', whiteSpace: 'nowrap'}}>{cue.text}</span>
    </div>
  </div>;
};
