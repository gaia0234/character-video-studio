import {z} from 'zod';
import type {DialogueData} from './characterDialogue';

export const voiceStyles = {'ルーノ': 10, 'ミーノ': 43, 'カーノ': 14} as const;
const path = z.string().regex(/^(assets|audio)\/[A-Za-z0-9_./-]+$/)
  .refine(value => !value.split('/').includes('..'), '素材のパスが不正です');
const asset = z.object({src: path, width: z.number().int().positive(), height: z.number().int().positive(),
  contentHeight: z.number().int().positive(), padding: z.number().int().nonnegative()});
export const editorBeatSchema = z.object({
  id: z.string().regex(/^beat-[0-9]{2}$/),
  speaker: z.enum(['ルーノ', 'ミーノ', 'カーノ']),
  text: z.string().trim().min(1).max(150),
  spokenText: z.string().trim().min(1).max(300),
  voiceSpeed: z.number().min(0.7).max(1.4),
  pauseSeconds: z.number().min(0.3).max(3),
  holdSeconds: z.number().min(0).max(5),
  characterScale: z.number().min(0.6).max(1.15),
  characterX: z.number().min(-100).max(100),
  characterY: z.number().min(-100).max(100),
  stage: z.enum(['character', 'reveal', 'layout']),
  reaction: z.enum(['enter', 'point', 'tilt', 'nod']),
  audio: z.object({src: path, seconds: z.number().positive().max(60),
    generatedFor: z.string().max(1000)}).optional(),
});
export const editorProjectSchema = z.object({
  version: z.literal(1), title: z.string().trim().min(1).max(60),
  image: path,
  characters: z.object({'ルーノ': asset, 'ミーノ': asset, 'カーノ': asset}),
  voiceCredits: z.array(z.string().min(1)).length(3),
  beats: z.array(editorBeatSchema).min(1).max(30),
}).refine(project => new Set(project.beats.map(beat => beat.id)).size === project.beats.length,
  {message: '場面IDが重複しています'});
export type EditorProject = z.infer<typeof editorProjectSchema>;
export type EditorBeat = EditorProject['beats'][number];
export const voiceKey = (beat: EditorBeat) => JSON.stringify([beat.speaker, beat.spokenText, beat.voiceSpeed]);
export const hasFreshAudio = (beat: EditorBeat) => beat.audio?.generatedFor === voiceKey(beat);
export const projectToDialogue = (project: EditorProject): DialogueData => ({
  image: project.image, characters: project.characters, voiceCredits: project.voiceCredits,
  beats: project.beats.map(beat => ({speaker: beat.speaker, text: beat.text, spokenText: beat.spokenText,
    stage: beat.stage, reaction: beat.reaction,
    seconds: Math.ceil((0.3 + (beat.audio?.seconds ?? Math.max(1, beat.spokenText.length / 7)) +
      beat.pauseSeconds + beat.holdSeconds) * 30 - 1e-6) / 30,
    characterScale: beat.characterScale, characterX: beat.characterX, characterY: beat.characterY,
    ...(hasFreshAudio(beat) ? {audio: {src: beat.audio!.src, seconds: beat.audio!.seconds, startSeconds: 0.3}} : {}),
  })),
});
