/**
 * Tests for decoding and growing the head silhouette grid.
 * Every shipped face must decode to a full-size grid with a solid head in the middle.
 * Growing adds a one-cell border so the textured edge never falls outside the geometry.
 */
import { describe, expect, it } from 'vitest';
import { FACE_CREDITS } from '../roster/credits';
import { HEAD_GRID } from './headCard';
import { decodeSilhouette, dilate } from './silhouette';

describe('silhouette', () => {
  it('decodes hex rows into cells, left to right', () => {
    expect(decodeSilhouette(['80', '01'], 8)).toEqual([
      [true, false, false, false, false, false, false, false],
      [false, false, false, false, false, false, false, true],
    ]);
  });

  it('grows by one cell', () => {
    const grown = dilate([[false, false, false], [false, true, false], [false, false, false]]);
    expect(grown.flat().every(Boolean)).toBe(true);
  });

  it('gives every face a full grid with a solid centre', () => {
    for (const c of FACE_CREDITS) {
      const grid = decodeSilhouette(c.silhouette, HEAD_GRID);
      expect(grid, c.id).toHaveLength(HEAD_GRID);
      expect(grid[HEAD_GRID / 2][HEAD_GRID / 2], c.id).toBe(true);
    }
  });
});
