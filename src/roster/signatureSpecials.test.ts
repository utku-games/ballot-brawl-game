/**
 * Tests the signature specials table: every roster fighter has a special with a name, no id is unknown, and every special mechanic is used.
 * Names are short enough to fit the centre banner and unique, so announcements never repeat between fighters.
 * Pure data checks.
 */
import { describe, expect, it } from 'vitest';
import { SPECIAL_MOVES } from '../fight/specialLibrary';
import { ROSTER } from './roster';
import { fightersWithSpecials, signatureSpecialOf } from './signatureSpecials';

const MAX_NAME = 22;

describe('signature specials', () => {
  it('gives every roster fighter a named special and knows no other ids', () => {
    const ids = ROSTER.map((f) => f.id).sort();
    expect([...fightersWithSpecials()].sort()).toEqual(ids);
    const names = ROSTER.map((f) => signatureSpecialOf(f.id).name);
    for (const name of names) {
      expect(name.length).toBeGreaterThan(0);
      expect(name.length).toBeLessThanOrEqual(MAX_NAME);
    }
    expect(new Set(names).size).toBe(names.length);
  });

  it('uses every special mechanic', () => {
    const used = new Set(ROSTER.map((f) => signatureSpecialOf(f.id).move));
    expect([...used].sort()).toEqual(Object.keys(SPECIAL_MOVES).sort());
  });
});
