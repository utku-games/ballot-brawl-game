/**
 * Tests for the body dimensions of each build.
 * Average must match the original rig, and the other builds must be taller, shorter, wider or longer-armed as named.
 * Every build must stay buildable: positive sizes, a valid torso capsule and legs longer than they are thick.
 */
import { describe, expect, it } from 'vitest';
import { Build } from '../roster/lookTypes';
import { bodyDims, headPivotHeight } from './buildShapes';

const height = (b: Build): number => headPivotHeight(bodyDims(b));

describe('bodyDims', () => {
  it('keeps Average equal to the original rig', () => {
    expect(bodyDims(Build.Average)).toMatchObject({ legLength: 0.72, torsoHeight: 0.62, armLength: 0.58, shoulderWidth: 0.38 });
    expect(height(Build.Average)).toBeCloseTo(0.72 - 0.05 + 0.62 + 0.08, 6);
  });

  it('orders heights', () => {
    expect(height(Build.Tall)).toBeGreaterThan(height(Build.Average));
    expect(height(Build.Lanky)).toBeGreaterThan(height(Build.Average));
    expect(height(Build.Short)).toBeLessThan(height(Build.Average));
    expect(height(Build.Round)).toBeLessThan(height(Build.Average));
  });

  it('makes Round wider, Lanky longer-armed and thinner, and Stocky thicker', () => {
    const avg = bodyDims(Build.Average);
    expect(bodyDims(Build.Round).torsoWidth).toBeGreaterThan(avg.torsoWidth);
    expect(bodyDims(Build.Round).torsoDepth).toBeGreaterThan(avg.torsoDepth);
    expect(bodyDims(Build.Lanky).armLength).toBeGreaterThan(avg.armLength);
    expect(bodyDims(Build.Lanky).torsoWidth).toBeLessThan(avg.torsoWidth);
    expect(bodyDims(Build.Stocky).limbRadius).toBeGreaterThan(avg.limbRadius);
    expect(bodyDims(Build.Stocky).shoulderWidth).toBeGreaterThan(avg.shoulderWidth);
  });

  it('keeps every build buildable', () => {
    for (const b of Object.values(Build)) {
      const d = bodyDims(b);
      for (const v of Object.values(d)) expect(v).toBeGreaterThan(0);
      expect(d.torsoHeight).toBeGreaterThan(d.torsoDepth);
      expect(d.legLength).toBeGreaterThan(d.legRadius * 2);
    }
  });
});
