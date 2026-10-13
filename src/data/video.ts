import {z} from 'zod';

// Asset paths are relative to public/. Narration is optional for silent previews.
const assetPath = z.string().regex(/^(assets|audio)\/[A-Za-z0-9_./-]+$/)
  .refine((path) => !path.split('/').includes('..'), 'public/内のパスを指定してください');
const seconds = z.number().min(1).max(60);
const speaker = z.enum(['ルーノ', 'ミーノ', 'カーノ']);
const commentSchema = z.object({
  speaker,
  text: z.string().min(1).max(65),
  startSeconds: z.number().min(0),
  characterAsset: assetPath.optional(),
});
export const videoSchema = z.object({
  mode: z.enum(['ranking', 'collection']).default('ranking'),
  testMode: z.boolean().default(false),
  title: z.string().min(1).max(48),
  subtitle: z.string().min(1).max(70),
  introSeconds: seconds,
  endingSeconds: seconds,
  narration: assetPath.optional(),
  ending: z.object({title: z.string().min(1).max(48), message: z.string().min(1).max(80)}),
  scenes: z.array(z.object({
    rank: z.number().int().min(1).max(99).optional(),
    title: z.string().min(1).max(28),
    body: z.string().min(1).max(90),
    seconds,
    image: z.object({
      src: assetPath,
      width: z.number().int().positive(),
      height: z.number().int().positive(),
    }).optional(),
    narration: assetPath.optional(),
    comments: z.array(commentSchema).max(8).optional(),
    // Keep existing scripts readable while new scripts use comments[].
    speaker: speaker.optional(),
    comment: z.string().min(1).max(65).optional(),
    characterAsset: assetPath.optional(),
  })).min(1).max(8),
}).superRefine((video, ctx) => {
  const ranks = new Set<number>();
  video.scenes.forEach((scene, index) => {
    const issue = (field: string, message: string) => ctx.addIssue({
      code: z.ZodIssueCode.custom, path: ['scenes', index, field], message,
    });
    if (video.mode === 'ranking') {
      if (scene.rank === undefined) issue('rank', 'ランキングには順位が必要です');
      else if (ranks.has(scene.rank)) issue('rank', '順位が重複しています');
      else ranks.add(scene.rank);
    }
    if (video.narration && scene.narration) issue('narration', '全編音声とシーン音声は併用できません');
    if ((scene.speaker === undefined) !== (scene.comment === undefined)) {
      issue('comment', 'speakerとcommentは一緒に指定してください');
    }
    if (scene.characterAsset && !scene.speaker) issue('characterAsset', '立ち絵には話者が必要です');
    if (scene.comments !== undefined && (scene.speaker || scene.comment || scene.characterAsset)) {
      issue('comments', 'commentsと旧コメント項目は併用できません');
    }
    scene.comments?.forEach((comment, commentIndex) => {
      if (framesFor(comment.startSeconds) >= framesFor(scene.seconds)
        || (commentIndex > 0 && framesFor(comment.startSeconds) <= framesFor(scene.comments![commentIndex - 1].startSeconds))) {
        ctx.addIssue({code: z.ZodIssueCode.custom,
          path: ['scenes', index, 'comments', commentIndex, 'startSeconds'],
          message: '表示開始はシーン内で、前のコメントより後のフレームにしてください'});
      }
    });
  });
});
export const videoPropsSchema = z.object({video: videoSchema});
export type VideoData = z.infer<typeof videoSchema>;
export type VideoProps = z.infer<typeof videoPropsSchema>;
export type SceneData = VideoData['scenes'][number];
export type CommentData = z.infer<typeof commentSchema>;
export const commentsFor = (scene: SceneData): CommentData[] => scene.comments
  ?? (scene.speaker && scene.comment ? [{speaker: scene.speaker, text: scene.comment,
    startSeconds: 0, characterAsset: scene.characterAsset}] : []);
export const FPS = 30;
export const framesFor = (seconds: number) => Math.round(seconds * FPS);
export const durationFor = (video: VideoData) => framesFor(video.introSeconds)
  + video.scenes.reduce((sum, scene) => sum + framesFor(scene.seconds), 0)
  + framesFor(video.endingSeconds);
