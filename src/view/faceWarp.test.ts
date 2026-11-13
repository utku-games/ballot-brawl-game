/**
 * Tests for the facial-expression warp.
 * A neutral face never moves, hurt closes the eyes and drops the jaw, happy widens the mouth.
 * Points far from the eyes and mouth stay put so the hair and outline keep their shape.
 */
import { describe, expect, it } from 'vitest';
import { NEUTRAL, warpPoint, isNeutral } from './faceWarp';

const LM = { eyeA: { x: 0.4, y: 0.4 }, eyeB: { x: 0.6, y: 0.4 }, mouth: { x: 0.5, y: 0.7 }, mouthWidth: 0.16 };

describe('warpPoint', () => {
  it('leaves a neutral face untouched', () => {
    expect(warpPoint(0.42, 0.43, LM, NEUTRAL)).toEqual({ du: 0, dy: 0 });
    expect(isNeutral(NEUTRAL)).toBe(true);
  });

  it('squints the eyes and drops the jaw when hurt', () => {
    const hurt = { hurt: 1, happy: 0, ko: 0 };
    expect(warpPoint(0.4, 0.43, LM, hurt).dy).toBeLessThan(0);
    expect(warpPoint(0.4, 0.37, LM, hurt).dy).toBeGreaterThan(0);
    expect(warpPoint(0.5, 0.74, LM, hurt).dy).toBeGreaterThan(0);
  });

  it('pulls the mouth corners out and up when happy', () => {
    const w = warpPoint(0.58, 0.7, LM, { hurt: 0, happy: 1, ko: 0 });
    expect(w.du).toBeGreaterThan(0);
    expect(w.dy).toBeLessThan(0);
  });

  it('barely moves the hair far from the features', () => {
    const w = warpPoint(0.5, 0.05, LM, { hurt: 1, happy: 1, ko: 1 });
    expect(Math.abs(w.du) + Math.abs(w.dy)).toBeLessThan(1e-3);
  });
});
