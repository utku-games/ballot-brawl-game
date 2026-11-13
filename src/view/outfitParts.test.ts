/**
 * Tests for the outfit and neckwear part lists.
 * Every outfit and neckwear must produce valid parts on real rig anchors, and long garments must hang from the hips.
 * Pieces must scale with the build, and the toga must drape over one shoulder only.
 */
import { describe, expect, it } from 'vitest';
import { Build, Neckwear, Outfit } from '../roster/lookTypes';
import { bodyDims } from './buildShapes';
import { neckwearParts } from './neckwearParts';
import { outfitLayout } from './outfitParts';
import { Anchor, ColorSlot, Shape, type PartSpec } from './partSpec';

const AVG = bodyDims(Build.Average);

function expectValid(parts: readonly PartSpec[]): void {
  for (const p of parts) {
    expect(Object.values(Anchor)).toContain(p.anchor);
    for (const s of p.size) expect(s).toBeGreaterThan(0);
    for (const v of [...p.position, ...p.rotation]) expect(Number.isFinite(v)).toBe(true);
  }
}

describe('outfitLayout', () => {
  it('gives every outfit valid parts on every build', () => {
    for (const b of Object.values(Build)) for (const o of Object.values(Outfit)) expectValid(outfitLayout(o, bodyDims(b)).parts);
  });

  it('hangs long garments from the hips', () => {
    for (const o of [Outfit.Gown, Outfit.Robe, Outfit.Toga]) {
      expect(outfitLayout(o, AVG).parts.some((p) => p.anchor === Anchor.Body && p.shape === Shape.Cone)).toBe(true);
    }
  });

  it('keeps floor-length skirts above the floor', () => {
    for (const b of Object.values(Build)) {
      const d = bodyDims(b);
      const skirt = outfitLayout(Outfit.Gown, d).parts.find((p) => p.anchor === Anchor.Body);
      expect(skirt).toBeDefined();
      if (skirt) expect(skirt.position[1] - skirt.size[1] / 2).toBeGreaterThan(-d.legLength);
    }
  });

  it('drapes the toga over one shoulder only and leaves the arms bare', () => {
    const layout = outfitLayout(Outfit.Toga, AVG);
    const torsoParts = layout.parts.filter((p) => p.anchor === Anchor.Torso);
    expect(torsoParts.length).toBeGreaterThan(0);
    expect(torsoParts.every((p) => p.position[0] <= 0) || torsoParts.every((p) => p.position[0] >= 0)).toBe(true);
    expect(layout.sleeves).toBe(ColorSlot.Skin);
  });

  it('scales coat tails with the build', () => {
    const lowest = (b: Build): number => Math.min(...outfitLayout(Outfit.FrockCoat, bodyDims(b)).parts.map((p) => p.position[1] - p.size[1] / 2));
    expect(lowest(Build.Tall)).toBeLessThan(lowest(Build.Short));
  });
});

describe('neckwearParts', () => {
  it('gives every neckwear except None valid parts', () => {
    for (const n of Object.values(Neckwear)) {
      const parts = neckwearParts(n, AVG);
      expect(parts.length > 0).toBe(n !== Neckwear.None);
      expectValid(parts);
    }
  });

  it('makes the long tie longer than the regular tie', () => {
    expect(neckwearParts(Neckwear.LongTie, AVG)[0].size[1]).toBeGreaterThan(neckwearParts(Neckwear.Tie, AVG)[0].size[1]);
  });
});
