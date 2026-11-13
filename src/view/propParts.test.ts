/**
 * Tests for the hand prop part lists.
 * Every prop except None must put valid parts in the right hand, and mittens must replace both hands instead.
 * Long props must stay above the floor even on the shortest build with the arm hanging down.
 */
import { describe, expect, it } from 'vitest';
import { Build, Prop } from '../roster/lookTypes';
import { bodyDims, torsoPivotHeight } from './buildShapes';
import { Anchor } from './partSpec';
import { handY, propParts } from './propParts';

const AVG = bodyDims(Build.Average);
/** The shoulder pivot sits this far below the torso top, as in the rig. */
const SHOULDER_DROP = 0.1;

describe('propParts', () => {
  it('gives every held prop valid parts in the right hand', () => {
    for (const p of Object.values(Prop).filter((v) => v !== Prop.None && v !== Prop.Mittens)) {
      const layout = propParts(p, AVG);
      expect(layout.parts.length, p).toBeGreaterThan(0);
      expect(layout.parts.every((s) => s.anchor === Anchor.HandR), p).toBe(true);
      expect(layout.parts.every((s) => s.size.every((v) => v > 0)), p).toBe(true);
      expect(layout.hidesHand, p).toBe(false);
    }
    expect(propParts(Prop.None, AVG)).toEqual({ parts: [], hidesHand: false });
  });

  it('replaces both hands with mittens', () => {
    const d = bodyDims(Build.Lanky);
    const m = propParts(Prop.Mittens, d);
    expect(m.hidesHand).toBe(true);
    expect(new Set(m.parts.map((s) => s.anchor))).toEqual(new Set([Anchor.ArmL, Anchor.ArmR]));
    expect(m.parts[0].position[1]).toBeCloseTo(handY(d), 6);
  });

  it('keeps every prop above the floor on every build', () => {
    for (const b of Object.values(Build)) {
      const d = bodyDims(b);
      const handHeight = torsoPivotHeight(d) + d.torsoHeight - SHOULDER_DROP + handY(d);
      for (const p of Object.values(Prop)) {
        for (const s of propParts(p, d).parts.filter((x) => x.anchor === Anchor.HandR)) {
          expect(handHeight + s.position[1] - Math.max(...s.size) / 2, `${b} ${p}`).toBeGreaterThan(0);
        }
      }
    }
  });
});
