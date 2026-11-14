/**
 * Tests for screen insets: the HUD gives a top inset, and touch controls give a bottom inset in portrait.
 * In landscape the controls give a right inset instead, and without controls only the top is covered.
 * Every inset is capped, and a degenerate screen size yields no insets.
 */
import { describe, expect, it } from 'vitest';
import { MAX_INSET, NO_INSETS, screenInsets } from './screenInsets';

const PAD = { left: 600, top: 150, right: 800, bottom: 300 };

describe('screenInsets', () => {
  it('maps landscape controls to a right inset', () => {
    expect(screenInsets(800, 300, 60, PAD)).toEqual({ top: 0.2, bottom: 0, left: 0, right: 0.25 });
  });

  it('maps portrait controls to a bottom inset', () => {
    const pad = { left: 200, top: 500, right: 390, bottom: 660 };
    const s = screenInsets(390, 660, 66, pad);
    expect(s.top).toBeCloseTo(0.1);
    expect(s.bottom).toBeCloseTo(160 / 660);
    expect(s.right).toBe(0);
  });

  it('gives only the top inset without controls', () => {
    expect(screenInsets(1280, 720, 72, null)).toEqual({ ...NO_INSETS, top: 0.1 });
  });

  it('caps every inset and ignores an empty screen', () => {
    const s = screenInsets(800, 300, 290, { left: 10, top: 0, right: 800, bottom: 300 });
    expect(s.top).toBe(MAX_INSET);
    expect(s.right).toBe(MAX_INSET);
    expect(screenInsets(0, 0, 10, null)).toEqual(NO_INSETS);
  });
});
