import type { SheetPlan, SourceFrame } from './types';

export interface BakedSheet { blob: Blob; plan: SheetPlan }

async function loadBitmap(frame: SourceFrame): Promise<ImageBitmap> {
  return createImageBitmap(frame.blob);
}

export async function bakeSheet(frames: SourceFrame[], sequence: number[], plan: SheetPlan): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = plan.width;
  canvas.height = plan.height;
  const context = canvas.getContext('2d', { alpha: true });
  if (!context) throw new Error('Canvas export is not supported in this browser.');
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  const bitmaps = await Promise.all(frames.map(loadBitmap));
  const padding = Math.floor((plan.cellWidth - Math.round(frames[0].width * plan.scale)) / 2);
  sequence.forEach((sourceIndex, outputIndex) => {
    const x = (outputIndex % plan.columns) * plan.cellWidth + padding;
    const y = Math.floor(outputIndex / plan.columns) * plan.cellHeight + padding;
    context.drawImage(bitmaps[sourceIndex], x, y, Math.round(frames[sourceIndex].width * plan.scale), Math.round(frames[sourceIndex].height * plan.scale));
  });
  bitmaps.forEach((bitmap) => bitmap.close());
  return new Promise((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('The browser could not encode the sprite sheet.')), 'image/png'));
}

export function downloadBlob(blob: Blob, filename: string): void {
  const anchor = document.createElement('a');
  const url = URL.createObjectURL(blob);
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

export function buildMetadata(name: string, frames: SourceFrame[], sequence: number[], plan: SheetPlan, fps: number, pngBytes: number): object {
  return {
    format: 'cycle-blocks/spritesheet@1',
    image: `${name}.png`,
    size: { w: plan.width, h: plan.height },
    frameSize: { w: Math.round(frames[0].width * plan.scale), h: Math.round(frames[0].height * plan.scale) },
    padding: Math.floor((plan.cellWidth - Math.round(frames[0].width * plan.scale)) / 2),
    columns: plan.columns,
    rows: plan.rows,
    frameCount: sequence.length,
    fps,
    durationMs: Math.round(sequence.length / fps * 1000),
    pngBytes,
    frames: sequence.map((sourceIndex, index) => ({
      index,
      source: frames[sourceIndex].name,
      x: (index % plan.columns) * plan.cellWidth + Math.floor((plan.cellWidth - Math.round(frames[0].width * plan.scale)) / 2),
      y: Math.floor(index / plan.columns) * plan.cellHeight + Math.floor((plan.cellHeight - Math.round(frames[0].height * plan.scale)) / 2),
      w: Math.round(frames[sourceIndex].width * plan.scale),
      h: Math.round(frames[sourceIndex].height * plan.scale),
      durationMs: Math.round(1000 / fps)
    }))
  };
}
