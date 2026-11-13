/**
 * Tests for roster data and validation.
 * The shipped roster must pass every rule, and each rule must reject a deliberately broken list.
 * Lookups by id, category and boss are checked too.
 */
import { describe, expect, it } from 'vitest';
import { RosterDataError, UnknownEntityError } from '../core/errors';
import { bossOf, CATEGORY_ORDER, fighterById, fightersIn, REGULARS_PER_CATEGORY, ROSTER, validateRoster } from './roster';
import { Category } from './rosterTypes';

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
});
