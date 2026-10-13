import {Composition} from 'remotion';
import {Shorts} from './Shorts';
import videoJson from './data/video.json';
import rankingTestJson from './data/tests/ranking-3.json';
import collectionTestJson from './data/tests/collection-5.json';
import {validateAssets} from './data/assets';
import {durationFor, FPS, videoPropsSchema, videoSchema} from './data/video';
import {CharacterDialogue} from './CharacterDialogue';
import dialogueJson from './data/tests/character-dialogue.json';
import voiceDialogueJson from './data/tests/character-dialogue-voice.json';
import editorProjectJson from './data/editor-project.json';
import {editorProjectSchema, projectToDialogue} from './data/editorProject';
import {dialogueDuration, dialoguePropsSchema, dialogueSchema, validateDialogueAssets} from './data/characterDialogue';

const video = videoJson.scenes.length > 0 ? videoSchema.parse(videoJson) : null;
const dialogue = dialogueSchema.parse(dialogueJson);
const voiceDialogue = dialogueSchema.parse(voiceDialogueJson);
const editorDialogue = projectToDialogue(editorProjectSchema.parse(editorProjectJson));
const compositions = [
  ...(video ? [{id: 'Shorts', video}] : []),
  {id: 'TestRanking3', video: videoSchema.parse(rankingTestJson)},
  {id: 'TestCollection5', video: videoSchema.parse(collectionTestJson)},
];
export const Root = () => <>{compositions.map(({id, video: data}) => (
  <Composition key={id} id={id} component={Shorts} width={1080} height={1920}
    fps={FPS} durationInFrames={durationFor(data)} defaultProps={{video: data}}
    schema={videoPropsSchema}
    calculateMetadata={async ({props}) => {
      const parsed = videoSchema.parse(props.video);
      await validateAssets(parsed);
      return {durationInFrames: durationFor(parsed), props: {video: parsed}};
    }} />
))}{[{id: 'TestCharacterDialogue', data: dialogue}, {id: 'TestCharacterDialogueVoice', data: voiceDialogue},
  {id: 'EditorDialogue', data: editorDialogue}].map(({id, data}) =>
  <Composition key={id} id={id} component={CharacterDialogue} width={1080} height={1920}
  fps={FPS} durationInFrames={dialogueDuration(data)} defaultProps={{dialogue: data}}
  schema={dialoguePropsSchema} calculateMetadata={async ({props}) => {
    const parsed = dialogueSchema.parse(props.dialogue);
    await validateDialogueAssets(parsed);
    return {durationInFrames: dialogueDuration(parsed), props: {dialogue: parsed}};
  }} />)}</>;
