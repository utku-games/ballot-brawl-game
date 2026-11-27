/**
 * Tests that the CPU uses directional moves: it lunges in with a charge move from just outside reach, and swings an evasive move while backing off on low guard.
 * A random source fixed at zero makes every chance succeed, so each rule is checked on its own.
 * With the variant chance at zero the CPU never uses them, as on the easiest settings before this feature.
 */
import { describe, expect, it } from 'vitest';
import { duel } from '../fight/testFight';
import { FRESH_MEMORY, thinkAi } from './aiBrain';
import { profileForLevel } from './aiProfile';

const ALWAYS = (): number => 0;
const HARD = profileForLevel(1);

describe('CPU directional moves', () => {
  it('lunges toward a target just outside reach', () => {
    const s = duel(2.5);
    const { input } = thinkAi(s, s.fighters[0]!, HARD, FRESH_MEMORY, ALWAYS);
    expect(input.kick || input.punch).toBe(true);
    expect(input.moveX).toBeGreaterThan(0.9);
  });

  it('swings an evasive move while backing off on low guard', () => {
    const s = duel(1.2);
    s.fighters[0]!.guard = 0;
    const { input } = thinkAi(s, s.fighters[0]!, { ...HARD, defendChance: 0 }, FRESH_MEMORY, ALWAYS);
    expect(input.kick || input.punch).toBe(true);
    expect(input.moveX).toBeLessThan(-0.9);
  });

  it('never uses them with a zero chance', () => {
    const s = duel(2.5);
    const { input } = thinkAi(s, s.fighters[0]!, { ...HARD, variantChance: 0 }, FRESH_MEMORY, ALWAYS);
    expect(input.kick || input.punch).toBe(false);
  });
});
