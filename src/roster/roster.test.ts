/**
 * Tests for roster data and validation.
 * The shipped roster must pass every rule, and each rule must reject a deliberately broken list.
 * Lookups by id, category and boss are checked too.
 */
import { describe, expect, it } from 'vitest';
import { RosterDataError, UnknownEntityError } from '../core/errors';
import { bossOf, CATEGORY_ORDER, fighterById, fightersIn, REGULARS_PER_CATEGORY, ROSTER, validateRoster } from './roster';
import { Build, Headwear, Neckwear, Outfit, Prop } from './lookTypes';
import { Category } from './rosterTypes';
import { FinisherStyle, Gesture, Projectile } from './signatureTypes';

describe('roster', () => {
  it('has eleven regulars and one boss per category', () => {
    for (const c of CATEGORY_ORDER) {
      expect(fightersIn(c).filter((f) => !f.boss)).toHaveLength(REGULARS_PER_CATEGORY);
      expect(bossOf(c).boss).toBe(true);
    }
  });

  it('uses kebab-case ids that are safe file names', () => {
    for (const f of ROSTER) expect(f.id).toMatch(/^[a-z]+(-[a-z]+)*$/);
  });

  it('looks fighters up by id', () => {
    expect(fighterById('winston-churchill').category).toBe(Category.Politicians);
    expect(() => fighterById('nobody')).toThrow(UnknownEntityError);
  });

  it('rejects duplicates, unfair stats and a missing boss', () => {
    const first = ROSTER[0];
    expect(() => validateRoster([...ROSTER, first])).toThrow(RosterDataError);
    expect(() => validateRoster(ROSTER.map((f, i) => (i === 0 ? { ...f, stats: { ...f.stats, power: 5 } } : f)))).toThrow(RosterDataError);
    expect(() => validateRoster(ROSTER.filter((f) => !(f.boss && f.category === Category.Tycoons)))).toThrow(RosterDataError);
  });

  it('gives every fighter a complete look from the catalogue', () => {
    for (const f of ROSTER) {
      expect(Object.values(Build)).toContain(f.look.build);
      expect(Object.values(Outfit)).toContain(f.look.outfit);
      expect(Object.values(Neckwear)).toContain(f.look.neckwear);
      expect(Object.values(Headwear)).toContain(f.look.headwear);
      expect(Object.values(Prop)).toContain(f.look.prop);
    }
  });

  it('matches the spec for signature looks', () => {
    expect(fighterById('abraham-lincoln').look).toMatchObject({
      build: Build.Lanky, outfit: Outfit.FrockCoat, neckwear: Neckwear.BowTie, headwear: Headwear.TopHat, prop: Prop.None,
    });
    expect(fighterById('napoleon-bonaparte').look).toMatchObject({
      build: Build.Short, outfit: Outfit.MilitaryCoat, headwear: Headwear.Bicorne, prop: Prop.Sword,
    });
    expect(fighterById('winston-churchill').look).toMatchObject({
      build: Build.Round, neckwear: Neckwear.BowTie, headwear: Headwear.Homburg, prop: Prop.Cigar,
    });
    expect(fighterById('bernie-sanders').look.prop).toBe(Prop.Mittens);
  });

  it('rejects a look value outside the catalogue', () => {
    const broken = ROSTER.map((f, i) => (i === 0 ? { ...f, look: { ...f.look, outfit: 'cape' as Outfit } } : f));
    expect(() => validateRoster(broken)).toThrow(RosterDataError);
  });

  it('gives every fighter a valid signature', () => {
    for (const f of ROSTER) {
      expect(Object.values(FinisherStyle), f.id).toContain(f.signature.style);
      expect(Object.values(Gesture), f.id).toContain(f.signature.gesture);
      expect(f.signature.projectile !== Projectile.None, f.id).toBe(f.signature.style === FinisherStyle.Throw);
    }
  });

  it('matches the spec for signature moves', () => {
    expect(fighterById('winston-churchill').signature).toEqual({ style: FinisherStyle.Smash, gesture: Gesture.VSign, projectile: Projectile.None });
    expect(fighterById('isaac-newton').signature).toEqual({ style: FinisherStyle.Throw, gesture: Gesture.Point, projectile: Projectile.Apple });
    expect(fighterById('wolfgang-amadeus-mozart').signature).toEqual({ style: FinisherStyle.Throw, gesture: Gesture.Conduct, projectile: Projectile.Note });
    expect(fighterById('napoleon-bonaparte').signature.style).toBe(FinisherStyle.Rush);
    expect(fighterById('giorgia-meloni').signature.gesture).not.toBe(Gesture.Salute);
  });

  it('rejects a thrower without a projectile and a projectile without a throw', () => {
    const swap = (i: number, signature: object): typeof ROSTER => ROSTER.map((f, j) => (j === i ? { ...f, signature: { ...f.signature, ...signature } } : f));
    expect(() => validateRoster(swap(0, { style: FinisherStyle.Throw, projectile: Projectile.None }))).toThrow(RosterDataError);
    expect(() => validateRoster(swap(0, { style: FinisherStyle.Smash, projectile: Projectile.Apple }))).toThrow(RosterDataError);
    expect(() => validateRoster(swap(0, { gesture: 'moonwalk' }))).toThrow(RosterDataError);
  });
});
