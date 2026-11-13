/**
 * Tests for the arena floor clamp used by the fight simulation.
 * Points inside stay put, points outside are pulled back by the body radius.
 * Oversized radii collapse to the centre line instead of producing inverted bounds.
 */
import { describe, expect, it } from 'vitest';
import { ARENA_HALF_DEPTH, ARENA_HALF_WIDTH, clampToArena, isInsideArena } from './arena';

const RADIUS = 0.5;

describe('clampToArena', () => {
  it('leaves an inside point unchanged', () => {
    expect(clampToArena({ x: 1, z: -1 }, RADIUS)).toEqual({ x: 1, z: -1 });
  });

  it('pulls an outside point back inside by the radius', () => {
    const p = clampToArena({ x: 100, z: -100 }, RADIUS);
    expect(p).toEqual({ x: ARENA_HALF_WIDTH - RADIUS, z: -(ARENA_HALF_DEPTH - RADIUS) });
    expect(isInsideArena(p)).toBe(true);
  });

  it('collapses to zero when the radius exceeds the arena', () => {
    expect(clampToArena({ x: 3, z: 3 }, ARENA_HALF_WIDTH * 2)).toEqual({ x: 0, z: 0 });
  });
});
