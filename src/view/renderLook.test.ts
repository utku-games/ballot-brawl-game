/**
 * Tests the render look constants: shadow coverage must span the arena floor with margin to spare.
 * The colour grade and the fighter rim light must pass the engine's own validators, and the grade must change the image.
 * Only constants and pure engine validators are used, so no WebGL context is needed.
 */
import { DEFAULT_BLOOM, isNeutralGrade, resolveBloom, resolveRimLight, validateColorGrade } from '@utku/engine';
import { describe, expect, it } from 'vitest';
import { ARENA_HALF_DEPTH, ARENA_HALF_WIDTH } from '../core/arena';
import { ARENA_GRADE, BLOOM_THRESHOLD, FIGHTER_RIM, SHADOW_HALF_EXTENT, SHADOW_SOFTNESS } from './renderLook';

describe('render look', () => {
  it('covers the whole arena floor with shadows, with margin past the edges', () => {
    expect(SHADOW_HALF_EXTENT).toBeGreaterThan(ARENA_HALF_WIDTH);
    expect(SHADOW_HALF_EXTENT).toBeGreaterThan(ARENA_HALF_DEPTH);
  });
  it('uses a valid, visible colour grade', () => {
    expect(() => validateColorGrade(ARENA_GRADE)).not.toThrow();
    expect(isNeutralGrade(ARENA_GRADE)).toBe(false);
  });
  it('uses a valid rim light and soft shadow radius', () => {
    expect(resolveRimLight(FIGHTER_RIM)).toEqual(FIGHTER_RIM);
    expect(SHADOW_SOFTNESS).toBeGreaterThan(1);
  });
  it('raises the bloom threshold above the engine default with a valid value', () => {
    expect(resolveBloom({ threshold: BLOOM_THRESHOLD }).threshold).toBeGreaterThan(DEFAULT_BLOOM.threshold);
  });
});
