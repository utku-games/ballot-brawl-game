/**
 * Tests which surface preset a fighter part gets: skin for the skin slot, glossy vinyl for every other slot and fixed colour.
 * The rule is shared by the costume builder, so a change here changes every fighter.
 * Pure mapping; no Three.js.
 */
import { describe, expect, it } from 'vitest';
import { ColorSlot } from './partSpec';
import { FIGHTER_SURFACE, SKIN_SURFACE, surfaceForPaint } from './surfaceLooks';

describe('surfaceForPaint', () => {
  it('uses skin only for the skin slot', () => {
    expect(surfaceForPaint(ColorSlot.Skin)).toBe(SKIN_SURFACE);
    for (const slot of [ColorSlot.Main, ColorSlot.MainDark, ColorSlot.Accent, ColorSlot.Hair, ColorSlot.Fixed]) {
      expect(surfaceForPaint(slot)).toBe(FIGHTER_SURFACE);
    }
    expect(surfaceForPaint(0xffd700)).toBe(FIGHTER_SURFACE);
  });
});
