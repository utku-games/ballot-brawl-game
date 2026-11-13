/**
 * Tests for Rivalry Battles data and twist rules: the table's validity, the requested matchups and forbidden pairs.
 * Twists must change speed or damage exactly as named, and Blackout lighting must stay in range and go dark at times.
 * Every rule is checked on plain data without rendering.
 */
import { describe, expect, it } from 'vitest';
import { RosterDataError } from '../core/errors';
import { FORBIDDEN_PAIRS, RIVALRIES, rivalriesIn, validateRivalries } from './rivalries';
import { RivalrySection, Twist, type Rivalry } from './rivalryTypes';
import { BLACKOUT_DIM, blackoutLight, HEAVY_DAMAGE, TURBO_SPEED, twistModifiers } from './twists';

function pairOf(r: Readonly<Rivalry>): string {
  return [r.left, r.right].sort().join('|');
}

describe('rivalries', () => {
  it('has both sections and a valid table', () => {
    expect(rivalriesIn(RivalrySection.Rivalries).length).toBeGreaterThan(0);
    expect(rivalriesIn(RivalrySection.SpecialEdition).length).toBeGreaterThan(0);
    expect(() => validateRivalries(RIVALRIES)).not.toThrow();
  });

  it('includes the requested matchups', () => {
    const pairs = new Set(RIVALRIES.map(pairOf));
    for (const [a, b] of [
      ['thomas-edison', 'nikola-tesla'], ['donald-trump', 'xi-jinping'], ['elon-musk', 'mark-zuckerberg'],
      ['shehbaz-sharif', 'goat'], ['james-cameron', 'pig'], ['recep-tayyip-erdogan', 'camel'],
    ]) expect(pairs.has([a, b].sort().join('|')), `${a} vs ${b}`).toBe(true);
    const special = rivalriesIn(RivalrySection.SpecialEdition).map(pairOf);
    expect(special).toContain(['shehbaz-sharif', 'goat'].sort().join('|'));
  });

  it('never pairs Netanyahu with Khamenei', () => {
    const forbidden = new Set(FORBIDDEN_PAIRS.map(([a, b]) => [a, b].sort().join('|')));
    expect(forbidden.has(['benjamin-netanyahu', 'ali-khamenei'].sort().join('|'))).toBe(true);
    for (const r of RIVALRIES) expect(forbidden.has(pairOf(r)), r.id).toBe(false);
    const bad: Rivalry = { ...RIVALRIES[0], id: 'bad', title: 'Bad', left: 'ali-khamenei', right: 'benjamin-netanyahu' };
    expect(() => validateRivalries([...RIVALRIES, bad])).toThrow(RosterDataError);
  });

  it('rejects duplicates, self-pairs and unknown fighters', () => {
    expect(() => validateRivalries([...RIVALRIES, RIVALRIES[0]])).toThrow(RosterDataError);
    expect(() => validateRivalries([{ ...RIVALRIES[0], id: 'x', title: 'X', right: RIVALRIES[0].left }])).toThrow(RosterDataError);
    expect(() => validateRivalries([{ ...RIVALRIES[0], id: 'y', title: 'Y', right: 'nobody' }])).toThrow();
  });
});

describe('twists', () => {
  it('changes speed and damage only as named', () => {
    expect(twistModifiers(Twist.None)).toEqual({ speedScale: 1, damageScale: 1 });
    expect(twistModifiers(Twist.Blackout)).toEqual({ speedScale: 1, damageScale: 1 });
    expect(twistModifiers(Twist.Turbo)).toEqual({ speedScale: TURBO_SPEED, damageScale: 1 });
    expect(twistModifiers(Twist.HeavyHitters)).toEqual({ speedScale: 1, damageScale: HEAVY_DAMAGE });
  });

  it('keeps the lights on except in a blackout, which goes dark at times and stays in range', () => {
    const samples = Array.from({ length: 400 }, (_, i) => i * 0.025);
    expect(samples.every((t) => blackoutLight(Twist.Turbo, t) === 1)).toBe(true);
    const levels = samples.map((t) => blackoutLight(Twist.Blackout, t));
    expect(levels.every((l) => l >= 0 && l <= 1)).toBe(true);
    expect(levels).toContain(BLACKOUT_DIM);
    expect(levels).toContain(1);
  });
});
