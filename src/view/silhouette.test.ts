/**
 * Tests for decoding and growing the head silhouette grid.
 * Every shipped face must decode to a full-size grid with a solid head in the middle.
 * Growing adds a one-cell border so the textured edge never falls outside the geometry, and the head frame finds the
 * head top and width for hats, with a fallback for faces without a silhouette.
 */
import { describe, expect, it } from 'vitest';
import { FACE_CREDITS } from '../roster/credits';
import { HEAD_GRID } from './headCard';
import { decodeSilhouette, dilate, headFrame } from './silhouette';

const LANDMARKS = { eyeA: { x: 0.4, y: 0.45 }, eyeB: { x: 0.6, y: 0.45 }, mouth: { x: 0.5, y: 0.7 }, mouthWidth: 0.2, jaw: [] };
const CARD = 1.1;

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

  it('finds the head top from the first occupied row', () => {
    const rows = ['000000000000', '000ff0000000', ...Array<string>(46).fill('0fffffffff00')];
    const frame = headFrame(rows, LANDMARKS, HEAD_GRID, CARD);
    expect(frame.top).toBeCloseTo(CARD / 2 - (1 / HEAD_GRID) * CARD, 5);
    expect(frame.width).toBeCloseTo((36 / HEAD_GRID) * CARD, 5);
    expect(frame.eyeY).toBeCloseTo(CARD / 2 - 0.45 * CARD, 5);
    expect(frame.eyeLeft).toBeLessThan(0);
    expect(frame.eyeRight).toBeGreaterThan(0);
  });

  it('falls back when the grid is empty', () => {
    const frame = headFrame([], LANDMARKS, HEAD_GRID, CARD);
    expect(frame.top).toBeCloseTo(0.44, 5);
    expect(frame.width).toBeCloseTo(0.66, 5);
  });

  it('puts every shipped head top in the upper half of the card', () => {
    for (const c of FACE_CREDITS) expect(headFrame(c.silhouette, c.landmarks, HEAD_GRID, CARD).top, c.id).toBeGreaterThan(0);
  });
});
