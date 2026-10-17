import {AbsoluteFill, Html5Audio, Img, interpolate, OffthreadVideo, Sequence, Series, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {useLocalFont} from './components/useLocalFont';
import {type DialogueData} from './data/characterDialogue';
import {framesFor} from './data/video';
import {colors, contentStyle, speakerColors} from './design';

const ramp = (frame: number, start: number, end: number) => interpolate(frame, [start, end], [0, 1],
  {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

type DialogueProps = {dialogue: DialogueData; lunoVideoSrc?: string};

const Beat = ({dialogue, index, lunoVideoSrc}: DialogueProps & {index: number}) => {
  const frame = useCurrentFrame();
  const beat = dialogue.beats[index];
  const duration = framesFor(beat.seconds);
  const info = beat.stage !== 'character';
  const videoSrc = beat.speaker === 'ルーノ' ? lunoVideoSrc : undefined;
  const asset = dialogue.characters[beat.speaker];
  const entrance = ramp(frame, 0, 12);
  const speaking = ramp(frame, 9, 15) * (1 - ramp(frame, duration - 12, duration - 9));
  // One restrained gesture per beat; no continuous rocking or synthesized parts.
  const gesture = ramp(frame, 24, 36) * (1 - ramp(frame, 51, 63));
  const angle = beat.reaction === 'tilt' ? -4 * gesture : beat.reaction === 'point' ? -1.5 * gesture : 0;
  const nod = beat.reaction === 'nod' ? 9 * gesture : 0;
  const visibleHeight = (info ? 576 : 864) * (beat.characterScale ?? 1);
  const scale = visibleHeight / asset.contentHeight;
  const characterWidth = asset.width * scale;
  const characterHeight = asset.height * scale;
  const imageEnter = ramp(frame, 15, 30);
  const layout = beat.stage === 'layout' ? ramp(frame, 60, 84) : 0;
  const panelWidth = videoSrc ? 430 + 120 * layout : 470 + 300 * layout;
  const panelHeight = videoSrc ? 390 : 580 - 70 * layout;
  const squareSize = videoSrc ? 320 + 40 * layout : 390 + 50 * layout;
  return <AbsoluteFill>
    {videoSrc ? <OffthreadVideo data-generated-character src={staticFile(videoSrc)} muted
      style={{position: 'absolute', left: 200, top: 550, width: 620, height: 1100, objectFit: 'contain'}} /> : null}
    {beat.audio ? <Sequence from={framesFor(beat.audio.startSeconds)}>
      <Html5Audio src={staticFile(beat.audio.src)} />
    </Sequence> : null}
    <div style={{...contentStyle, top: 230, display: 'flex', alignItems: 'center', gap: 22}}>
      <span style={{fontSize: 36, fontWeight: 700, color: speakerColors[beat.speaker]}}>{beat.speaker}</span>
      <div style={{height: 2, flex: 1, background: colors.line}} />
    </div>
    <div data-fit data-dialogue style={{...contentStyle, top: 318, minHeight: 180, fontSize: info ? 55 : 64,
      fontWeight: 750, lineHeight: 1.45, whiteSpace: 'pre-line', opacity: speaking,
      transform: `translateY(${(1 - ramp(frame, 9, 15)) * 8}px)`}}>{beat.text}</div>
    {info ? <>
      <div data-panel style={{position: 'absolute', top: 550, left: 510 - panelWidth / 2,
        width: panelWidth, height: panelHeight, border: `2px solid ${colors.line}`, borderRadius: 26,
        background: colors.white, opacity: imageEnter, transform: `translateY(${(1 - imageEnter) * 18}px)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <Img data-square src={staticFile(dialogue.image)} style={{width: squareSize, height: squareSize,
          transform: `scale(${0.96 + imageEnter * 0.04})`}} />
      </div>
      {beat.stage === 'layout' ? <div data-fit style={{...contentStyle, top: videoSrc ? 950 : 1090, textAlign: 'center',
        fontSize: videoSrc ? 24 : 30, color: colors.muted, opacity: ramp(frame, 90, 102)}}>画像の形は１：１のまま</div> : null}
    </> : null}
    {!videoSrc ? <div style={{position: 'absolute', left: 510 + (beat.characterX ?? 0) - characterWidth / 2,
      top: (info ? 1140 : 635) + (beat.characterY ?? 0) - asset.padding * scale, width: characterWidth, height: characterHeight,
      opacity: entrance, transformOrigin: '50% 80%',
      transform: `translate(${(1 - entrance) * (beat.speaker === 'ミーノ' ? -54 : 54)}px, ${nod}px) rotate(${angle}deg)`}}>
      <Img data-character src={staticFile(asset.src)} style={{width: '100%', height: '100%'}} />
    </div> : null}
    {beat.stage === 'layout' && !videoSrc ? <svg width="64" height="64" viewBox="0 0 64 64"
      style={{position: 'absolute', left: 775, top: 1210, opacity: ramp(frame, 60, 66)}} aria-hidden>
      <circle cx="32" cy="32" r="28" stroke={colors.gold} strokeWidth="3" fill={colors.white} />
      <path d="M32 10L40 32 32 54 24 32Z" fill={colors.gold} />
    </svg> : null}
    {index === dialogue.beats.length - 1 && dialogue.voiceCredits ?
      <div style={{...contentStyle, top: lunoVideoSrc ? 1680 : 1550, fontSize: 20, lineHeight: 1.6, color: colors.muted}}>
        {dialogue.voiceCredits.map(credit => <div key={credit}>{credit}</div>)}
      </div> : null}
  </AbsoluteFill>;
};

export const CharacterDialogue = ({dialogue, lunoVideoSrc}: DialogueProps) => {
  useLocalFont();
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  return <AbsoluteFill style={{fontFamily: '"Studio Noto Sans JP", sans-serif', color: colors.ink, textAlign: 'left'}}>
    <Img src={staticFile('assets/backgrounds/study-room-v1.svg')}
      style={{position: 'absolute', width: 1080, height: 1920}} />
    <div style={{...contentStyle, top: 82, fontSize: 24, color: colors.muted,
      display: 'flex', justifyContent: 'space-between'}}><span>KNOWLEDGE ANIME</span><span>{dialogue.voiceCredits ? '音声付き' : '無音'} · {lunoVideoSrc ? '生成映像編集試作' : 'PNG素材試験'}</span></div>
    <Series>{dialogue.beats.map((beat, index) => <Series.Sequence key={index} durationInFrames={framesFor(beat.seconds)}>
      <Beat dialogue={dialogue} index={index} lunoVideoSrc={lunoVideoSrc} />
    </Series.Sequence>)}</Series>
    <div style={{...contentStyle, bottom: lunoVideoSrc ? 100 : 180, height: 5, background: colors.line}}>
      <div style={{height: '100%', width: `${(frame + 1) / durationInFrames * 100}%`, background: colors.gold}} />
    </div>
  </AbsoluteFill>;
};

// Local pilot only: the editor's saved data and existing compositions keep their PNG path.
export const KlingEditorPilot = ({dialogue}: {dialogue: DialogueData}) =>
  <CharacterDialogue dialogue={dialogue} lunoVideoSrc="assets/videos/luno-loop-kling4-v1.mp4" />;
