/**
 * Tests the seated crowd layout: seats stay on their bench rows and inside the bench width, gaps stay empty, and the result is repeatable.
 * Colours come only from the palettes, leans stay small, and roughly the configured share of seats is left empty.
 * Pure data; no Three.js.
 */
import { describe, expect, it } from 'vitest';
import { EMPTY_SHARE, MAX_LEAN, SKIN_TONES, SUIT_COLORS, seatsOnBenches, type BenchRow } from './crowdLayout';

const ROWS: BenchRow[] = [{ top: 0.5, z: -5.9 }, { top: 1, z: -6.8 }, { top: 1.5, z: -7.7 }];
const HALF = 9;
const SPACING = 0.75;

describe('seatsOnBenches', () => {
  it('seats people on the rows, within the bench width, the same way every time', () => {
    const seats = seatsOnBenches(ROWS, HALF, SPACING, []);
    expect(seatsOnBenches(ROWS, HALF, SPACING, [])).toEqual(seats);
    for (const s of seats) {
      expect(ROWS.some((r) => r.top === s.y && r.z === s.z)).toBe(true);
      expect(Math.abs(s.x)).toBeLessThanOrEqual(HALF + SPACING);
      expect(SUIT_COLORS).toContain(s.suit);
      expect(SKIN_TONES).toContain(s.skin);
      expect(Math.abs(s.lean)).toBeLessThanOrEqual(MAX_LEAN);
    }
    const full = ROWS.length * (Math.floor((HALF * 2) / SPACING) + 1);
    expect(seats.length / full).toBeGreaterThan(1 - EMPTY_SHARE * 2);
    expect(seats.length).toBeLessThan(full);
  });

  it('leaves gaps empty on their row only', () => {
    const seats = seatsOnBenches(ROWS, HALF, SPACING, [{ row: 2, x0: -1.2, x1: 1.2 }]);
    expect(seats.some((s) => s.z === ROWS[2]!.z && Math.abs(s.x) <= 1.2)).toBe(false);
    expect(seats.some((s) => s.z === ROWS[0]!.z && Math.abs(s.x) <= 1.2)).toBe(true);
  });
});
