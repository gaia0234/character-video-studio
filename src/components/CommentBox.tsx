import {Img, staticFile} from 'remotion';
import type {CommentData} from '../data/video';
import {colors, speakerColors} from '../design';

export const CommentBox = ({speaker, text, characterAsset, testMode}: Pick<CommentData, 'speaker' | 'text' | 'characterAsset'> & {testMode: boolean}) => {
  const accent = speakerColors[speaker];
  return <div style={{display: 'flex', gap: 24, alignItems: 'center', height: '100%'}}>
    {characterAsset ? <Img src={staticFile(characterAsset)} style={{width: 190, height: 270, objectFit: 'contain', flexShrink: 0}} />
      : testMode ? <div style={{width: 186, height: 250, flexShrink: 0, display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center', gap: 18, border: `2px dashed ${accent}`, borderRadius: 24, background: colors.white}}>
        <div style={{fontSize: 28, color: accent, fontWeight: 700}}>{speaker}</div>
        <div style={{fontSize: 22, color: colors.muted}}>キャラ配置枠</div>
      </div> : null}
    <div style={{flex: 1, minWidth: 0, boxSizing: 'border-box', background: colors.white,
      border: `2px solid ${colors.line}`, borderLeft: `7px solid ${accent}`, borderRadius: 22, padding: '24px 28px'}}>
      <div style={{fontSize: 26, fontWeight: 700, color: accent, marginBottom: 12}}>{speaker}</div>
      <div data-fit style={{fontSize: 40, lineHeight: 1.55, whiteSpace: 'pre-line', maxHeight: 190}}>{text}</div>
    </div>
  </div>;
};
