/**
 * Tests for the headwear part lists.
 * Every hat's crown piece must sit on the head top, sinking only slightly into the hair, on the head card anchor.
 * Aviators must sit on the eye line in front of the face, and the top hat must add the most height.
 */
import { describe, expect, it } from 'vitest';
import { Headwear } from '../roster/lookTypes';
import { HAT_SINK, headwearHeight, headwearParts } from './headwearParts';
import { Anchor } from './partSpec';
import type { HeadFrame } from './silhouette';

const FRAME: HeadFrame = { top: 0.45, width: 0.7, eyeY: 0.05, eyeLeft: -0.12, eyeRight: 0.12 };
const EPSILON = 1e-6;
const HATS = Object.values(Headwear).filter((h) => h !== Headwear.None && h !== Headwear.Aviators);

describe('headwearParts', () => {
  it('seats every hat crown on the head top', () => {
    for (const h of HATS) {
      const parts = headwearParts(h, FRAME);
      expect(parts.length, h).toBeGreaterThan(0);
      expect(parts.every((p) => p.anchor === Anchor.Card), h).toBe(true);
      const crown = parts[0];
      expect(crown.position[1] - crown.size[1] / 2, h).toBeGreaterThanOrEqual(FRAME.top - HAT_SINK - EPSILON);
      expect(crown.position[1] - crown.size[1] / 2, h).toBeLessThanOrEqual(FRAME.top);
      expect(crown.position[2], h).toBeLessThanOrEqual(0);
    }
  });

  it('puts aviators on the eye line in front of the face', () => {
    const lenses = headwearParts(Headwear.Aviators, FRAME);
    expect(lenses.length).toBeGreaterThan(0);
    expect(lenses.every((p) => Math.abs(p.position[1] - FRAME.eyeY) < 0.05 && p.position[2] > 0)).toBe(true);
  });

  it('adds no parts and no height for None', () => {
    expect(headwearParts(Headwear.None, FRAME)).toEqual([]);
    expect(headwearHeight(Headwear.None)).toBe(0);
  });

  it('makes the top hat the tallest hat', () => {
    for (const h of HATS.filter((v) => v !== Headwear.TopHat)) expect(headwearHeight(Headwear.TopHat)).toBeGreaterThan(headwearHeight(h));
  });
});
