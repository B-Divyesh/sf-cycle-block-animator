import type { CycleBlock, SheetPlan } from './types';

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

export function sortFrameNames<T extends { name: string }>(frames: T[]): T[] {
  return [...frames].sort((a, b) => collator.compare(a.name, b.name));
}

export function normalizeBlock(block: CycleBlock, frameCount: number): CycleBlock {
  const last = Math.max(0, frameCount - 1);
  const start = Math.min(last, Math.max(0, Math.trunc(block.start)));
  const end = Math.min(last, Math.max(start, Math.trunc(block.end)));
  const maxOffset = end - start;
  return {
    ...block,
    start,
    end,
    repeats: Math.min(120, Math.max(1, Math.trunc(block.repeats))),
    offset: Math.min(maxOffset, Math.max(-maxOffset, Math.trunc(block.offset)))
  };
}

export function resolveTimeline(blocks: CycleBlock[], frameCount: number): number[] {
  if (frameCount < 1) return [];
  return blocks.flatMap((raw) => {
    const block = normalizeBlock(raw, frameCount);
    const length = block.end - block.start + 1;
    const output: number[] = [];
    for (let pass = 0; pass < block.repeats; pass += 1) {
      for (let position = 0; position < length; position += 1) {
        const shifted = ((position + pass * block.offset) % length + length) % length;
        output.push(block.start + shifted);
      }
    }
    return output;
  });
}

function nextPowerOfTwo(value: number): number {
  return 2 ** Math.ceil(Math.log2(Math.max(1, value)));
}

export function makeSheetPlan(
  count: number,
  frameWidth: number,
  frameHeight: number,
  maxTexture: number,
  padding: number,
  scale = 1,
  powerOfTwo = false
): SheetPlan | null {
  if (count < 1 || frameWidth < 1 || frameHeight < 1 || scale <= 0) return null;
  const cellWidth = Math.max(1, Math.round(frameWidth * scale)) + padding * 2;
  const cellHeight = Math.max(1, Math.round(frameHeight * scale)) + padding * 2;
  const maxColumns = Math.floor(maxTexture / cellWidth);
  const maxRows = Math.floor(maxTexture / cellHeight);
  if (maxColumns < 1 || maxRows < 1 || count > maxColumns * maxRows) return null;

  let best: SheetPlan | null = null;
  for (let columns = 1; columns <= Math.min(count, maxColumns); columns += 1) {
    const rows = Math.ceil(count / columns);
    if (rows > maxRows) continue;
    const rawWidth = columns * cellWidth;
    const rawHeight = rows * cellHeight;
    const width = powerOfTwo ? nextPowerOfTwo(rawWidth) : rawWidth;
    const height = powerOfTwo ? nextPowerOfTwo(rawHeight) : rawHeight;
    if (width > maxTexture || height > maxTexture) continue;
    const plan = { columns, rows, cellWidth, cellHeight, width, height, scale };
    if (!best || width * height < best.width * best.height || (width * height === best.width * best.height && Math.abs(width - height) < Math.abs(best.width - best.height))) best = plan;
  }
  return best;
}

export function timelineDuration(frameCount: number, fps: number): number {
  return fps > 0 ? frameCount / fps : 0;
}
