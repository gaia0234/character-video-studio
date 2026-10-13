import {z} from 'zod';
import {framesFor} from './video';

const asset = z.object({src: z.string().min(1), width: z.number().int().positive(),
  height: z.number().int().positive(), contentHeight: z.number().int().positive(), padding: z.number().int().nonnegative()});
export const dialogueSchema = z.object({
  image: z.string().min(1),
  characters: z.object({'ルーノ': asset, 'ミーノ': asset, 'カーノ': asset}),
  beats: z.array(z.object({speaker: z.enum(['ルーノ', 'ミーノ', 'カーノ']), text: z.string().min(1),
    spokenText: z.string().min(1).optional(),
    characterScale: z.number().min(0.6).max(1.15).optional(),
    characterX: z.number().min(-100).max(100).optional(),
    characterY: z.number().min(-100).max(100).optional(),
    audio: z.object({src: z.string().min(1), seconds: z.number().positive(),
      startSeconds: z.number().nonnegative()}).optional(),
    seconds: z.number().min(1), stage: z.enum(['character', 'reveal', 'layout']),
    reaction: z.enum(['enter', 'point', 'tilt', 'nod'])}).refine(beat => !beat.audio ||
      beat.audio.startSeconds + beat.audio.seconds + 0.3 <= beat.seconds + 1e-8,
      {message: '音声終了後に0.3秒以上の間が必要です'})).min(1),
  voiceCredits: z.array(z.string().min(1)).optional(),
});
export const dialoguePropsSchema = z.object({dialogue: dialogueSchema});
export type DialogueData = z.infer<typeof dialogueSchema>;
export const dialogueDuration = (dialogue: DialogueData) => dialogue.beats.reduce((sum, beat) => sum + framesFor(beat.seconds), 0);

export const validateDialogueAssets = async (dialogue: DialogueData) => {
  const {staticFile} = await import('remotion');
  await Promise.all([...Object.values(dialogue.characters), {src: dialogue.image, width: 900, height: 900}].map(asset =>
    new Promise<void>((resolve, reject) => {
      const image = new Image();
      image.onload = () => image.naturalWidth === asset.width && image.naturalHeight === asset.height
        ? resolve() : reject(new Error(`素材寸法が異なります: ${asset.src}`));
      image.onerror = () => reject(new Error(`素材を読み込めません: ${asset.src}`));
      image.src = staticFile(asset.src);
    })));
  await Promise.all(dialogue.beats.filter(beat => beat.audio).map(beat =>
    new Promise<void>((resolve, reject) => {
      const audio = new Audio();
      audio.onloadedmetadata = () => Math.abs(audio.duration - beat.audio!.seconds) < 0.01
        ? resolve() : reject(new Error(`音声の長さが異なります: ${beat.audio!.src}`));
      audio.onerror = () => reject(new Error(`音声を読み込めません: ${beat.audio!.src}`));
      audio.src = staticFile(beat.audio!.src);
    })));
};
