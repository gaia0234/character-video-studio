import {staticFile} from 'remotion';
import {commentsFor, type VideoData} from './video';

// Run before rendering so missing files or incorrect dimensions fail explicitly.
export const validateAssets = async (video: VideoData) => {
  const images = new Map<string, {width: number; height: number} | undefined>();
  const audio = new Set<string>();
  if (video.narration) audio.add(video.narration);
  for (const scene of video.scenes) {
    if (scene.image) {
      const previous = images.get(scene.image.src);
      if (previous && (previous.width !== scene.image.width || previous.height !== scene.image.height)) {
        throw new Error(`画像寸法の指定が一致しません: ${scene.image.src}`);
      }
      images.set(scene.image.src, scene.image);
    }
    for (const comment of commentsFor(scene)) {
      if (comment.characterAsset && !images.has(comment.characterAsset)) images.set(comment.characterAsset, undefined);
    }
    if (scene.narration) audio.add(scene.narration);
  }
  await Promise.all([...images].map(([src, dimensions]) => new Promise<void>((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      if (dimensions && (image.naturalWidth !== dimensions.width || image.naturalHeight !== dimensions.height)) {
        reject(new Error(`画像寸法が異なります: ${src} 実寸${image.naturalWidth}×${image.naturalHeight}`));
      } else resolve();
    };
    image.onerror = () => reject(new Error(`画像を読み込めません: ${src}`));
    image.src = staticFile(src);
  })));
  await Promise.all([...audio].map(async (src) => {
    const response = await fetch(staticFile(src), {method: 'HEAD'});
    if (!response.ok) throw new Error(`音声を読み込めません: ${src}`);
  }));
};
