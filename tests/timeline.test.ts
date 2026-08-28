import { describe, expect, it } from 'vitest';
import { makeSheetPlan, normalizeBlock, resolveTimeline, sortFrameNames, timelineDuration } from '../src/timeline';

describe('source ordering', () => {
  it('keeps numbered drawings in natural order', () => {
    expect(sortFrameNames([{ name: 'walk_10.png' }, { name: 'walk_2.png' }, { name: 'walk_1.png' }]).map((item) => item.name)).toEqual(['walk_1.png', 'walk_2.png', 'walk_10.png']);
  });
});

describe('cycle resolution', () => {
  it('rotates each pass by the requested offset', () => {
    expect(resolveTimeline([{ id: 'a', start: 0, end: 2, repeats: 3, offset: 1 }], 3)).toEqual([0, 1, 2, 1, 2, 0, 2, 0, 1]);
  });

  it('supports negative offsets and concatenated blocks', () => {
    expect(resolveTimeline([
      { id: 'a', start: 1, end: 3, repeats: 2, offset: -1 },
      { id: 'b', start: 0, end: 0, repeats: 2, offset: 0 }
    ], 4)).toEqual([1, 2, 3, 3, 1, 2, 0, 0]);
  });

  it('clamps invalid recipe inputs', () => {
    expect(normalizeBlock({ id: 'a', start: -5, end: 99, repeats: 0, offset: 2000 }, 5)).toEqual({ id: 'a', start: 0, end: 4, repeats: 1, offset: 4 });
    expect(normalizeBlock({ id: 'b', start: 1, end: 3, repeats: 2, offset: -100 }, 5).offset).toBe(-2);
    expect(resolveTimeline([], 5)).toEqual([]);
  });
});

describe('sprite-sheet constraints', () => {
  it('finds a compact valid grid', () => {
    const plan = makeSheetPlan(12, 64, 64, 256, 0);
    expect(plan).toMatchObject({ columns: 3, rows: 4, width: 192, height: 256, scale: 1 });
  });

  it('returns null when frames cannot fit', () => {
    expect(makeSheetPlan(17, 64, 64, 256, 0)).toBeNull();
  });

  it('honors padding and power-of-two output', () => {
    const plan = makeSheetPlan(5, 50, 30, 256, 2, 1, true);
    expect(plan).not.toBeNull();
    expect(plan!.width & (plan!.width - 1)).toBe(0);
    expect(plan!.height & (plan!.height - 1)).toBe(0);
    expect(plan!.cellWidth).toBe(54);
  });

  it('reports duration in seconds', () => expect(timelineDuration(36, 12)).toBe(3));
});
