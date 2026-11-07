import React, {useEffect, useMemo} from 'react';
import {useLoader} from '@react-three/fiber';
import {staticFile} from 'remotion';
import * as THREE from 'three';

export type Who = 'homer' | 'kent' | 'judd';
// Exact accepted display boundaries, pivots and amplitudes. Original PNGs stay read-only.
// Sources: elder/HomerMarkerPilot.tsx (v2), elder/ElderMarkerPilot.tsx (hand fix).
export const MARKERS = {
  homer: {file: 'homer-marker-pilot/homer-original.png', w: 368, h: 996,
    head: 'M24 186H217V324H195V419H52V326H24Z',
    arm: 'M92 437L103 459L79 493L58 627V681H0V437Z',
    neck: [125, 416], shoulder: [92, 450], eyes: [[102, 340], [153, 332]], phase: 0},
  kent: {file: 'elder-marker-pilot/kent.png', w: 380, h: 1046,
    head: 'M75 0H335V128H305V220L289 242L255 254H147L123 234L110 208V128H75Z',
    arm: 'M0 162H110V210H115V279H151L167 300L122 402L119 476H0Z',
    neck: [205, 253], shoulder: [153, 298], eyes: [[169, 168], [234, 168]], phase: 157},
  judd: {file: 'elder-marker-pilot/judd.png', w: 290, h: 1052,
    head: 'M0 0H290V245H194L183 258L169 269L152 279L133 270L112 254L99 245H0Z',
    arm: 'M211 283H295V618H242L233 500L220 389L201 330Z M290 640A25 31 0 1 1 240 640A25 31 0 1 1 290 640Z',
    neck: [151, 277], shoulder: [213, 305], eyes: [[124, 194], [173, 192]], phase: 83},
} as const;

const margin = 70;
const rotateAt = (ctx: CanvasRenderingContext2D, pivot: readonly number[], angle: number) => {
  ctx.translate(pivot[0], pivot[1]); ctx.rotate(angle * Math.PI / 180);
  ctx.translate(-pivot[0], -pivot[1]);
};

export const MarkerPlane: React.FC<{who: Who; frame: number; animated?: boolean;
  height?: number; position?: [number, number, number]}> =
  ({who, frame, animated = true, height = 4.5, position = [0, 0, 0]}) => {
    const s = MARKERS[who];
    const original = useLoader(THREE.TextureLoader, staticFile(`assets/characters/${s.file}`));
    const {canvas, texture} = useMemo(() => {
      const canvas = document.createElement('canvas');
      canvas.width = s.w + 2 * margin; canvas.height = s.h + 40;
      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.minFilter = THREE.LinearFilter; texture.generateMipmaps = false;
      return {canvas, texture};
    }, [s]);
    useEffect(() => () => texture.dispose(), [texture]);
    const ctx = canvas.getContext('2d', {willReadFrequently: true})!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save(); ctx.translate(margin, 15);
    const image = original.image as HTMLImageElement;
    if (!animated) ctx.drawImage(image, 0, 0, s.w, s.h);
    else {
      ctx.drawImage(image, 0, 0, s.w, s.h);
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fill(new Path2D(s.head)); ctx.fill(new Path2D(s.arm));
      ctx.globalCompositeOperation = 'source-over';
      if (who === 'judd') {
        ctx.save(); ctx.clip(new Path2D('M211 305Q232 390 236 500L241 620L264 714L244 690L221 620L201 440Z'));
        ctx.drawImage(image, 30, 0, s.w, s.h); ctx.restore();
      }
      const gesture = who === 'homer' ? Math.sin(frame / 30 * 1.1) * 7.5
        : -3.75 * (1 + Math.sin(frame / 30 * 1.1));
      ctx.save(); rotateAt(ctx, s.shoulder, gesture); ctx.clip(new Path2D(s.arm));
      ctx.drawImage(image, 0, 0, s.w, s.h); ctx.restore();
      ctx.save(); rotateAt(ctx, s.neck, Math.sin(frame / 30 * 1.5) * 3.75);
      ctx.save(); ctx.clip(new Path2D(s.head)); ctx.drawImage(image, 0, 0, s.w, s.h); ctx.restore();
      const blink = (frame + s.phase) % 300;
      if ((blink >= 70 && blink <= 77) || (blink >= 197 && blink <= 204)) {
        for (const [x, y] of s.eyes) {
          ctx.fillStyle = 'white'; ctx.beginPath(); ctx.ellipse(x, y, who === 'homer' ? 9 : 12, who === 'homer' ? 10 : 12, 0, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = '#171715'; ctx.lineWidth = 4; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(x - (who === 'homer' ? 6 : 7), y); ctx.quadraticCurveTo(x, y + 4, x + (who === 'homer' ? 6 : 7), y); ctx.stroke();
        }
      }
      ctx.restore();
    }
    ctx.restore();
    // Remove only the source white matte at display time. White marker gaps reveal
    // the paper stage; no replacement drawing, regeneration or file modification.
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < pixels.data.length; i += 4) {
      const alpha = 1 - Math.min(pixels.data[i], pixels.data[i + 1], pixels.data[i + 2]) / 255;
      if (alpha <= 0) {pixels.data[i + 3] = 0; continue;}
      for (let j = 0; j < 3; j++) pixels.data[i + j] = Math.max(0, (pixels.data[i + j] - 255 * (1 - alpha)) / alpha);
      pixels.data[i + 3] = Math.round(pixels.data[i + 3] * alpha);
    }
    ctx.putImageData(pixels, 0, 0); texture.needsUpdate = true;
    const planeH = height * canvas.height / s.h;
    return <mesh position={[position[0], position[1] + planeH / 2 - 25 / s.h * height, position[2]]}>
      <planeGeometry args={[height * canvas.width / s.h, planeH]}/>
      <meshBasicMaterial map={texture} transparent depthWrite={false} toneMapped={false} side={THREE.DoubleSide}/>
    </mesh>;
  };
