/**
 * Tests the procedural floor patterns: every pixel stays in [0, 1], patterns are deterministic, and seams appear where planks and tiles meet.
 * A plain floor is uniformly full brightness, and marble tiles alternate between two tones.
 * Pure numbers; no textures or Three.js.
 */
import { describe, expect, it } from 'vitest';
import { FloorPattern, PATTERN_SIZE, floorPatternPixels, hash2 } from './floorPatterns';

const at = (pixels: Float32Array, x: number, y: number): number => pixels[y * PATTERN_SIZE + x] as number;

describe('floorPatternPixels', () => {
  it.each(Object.values(FloorPattern))('%s stays in range and is deterministic', (pattern) => {
    const a = floorPatternPixels(pattern);
    expect(a).toHaveLength(PATTERN_SIZE * PATTERN_SIZE);
    expect(Math.min(...a)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...a)).toBeLessThanOrEqual(1);
    expect(floorPatternPixels(pattern)).toEqual(a);
  });

  it('leaves a plain floor at full brightness', () => {
    expect(new Set(floorPatternPixels(FloorPattern.Plain))).toEqual(new Set([1]));
  });

  it('draws darker seams between planks than across a plank', () => {
    const planks = floorPatternPixels(FloorPattern.Planks);
    expect(at(planks, 10, 0)).toBeLessThan(at(planks, 10, 20) - 0.2);
  });

  it('alternates marble tile tones', () => {
    const tiles = floorPatternPixels(FloorPattern.Tiles);
    const half = PATTERN_SIZE / 2;
    expect(at(tiles, 20, 20)).toBeGreaterThan(at(tiles, half + 20, 20));
  });
});

describe('hash2', () => {
  it('is stable and spread over [0, 1)', () => {
    expect(hash2(3, 7)).toBe(hash2(3, 7));
    expect(hash2(3, 7)).not.toBe(hash2(7, 3));
    const values = Array.from({ length: 200 }, (_, i) => hash2(i, i * 3));
    expect(Math.min(...values)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...values)).toBeLessThan(1);
  });
});
