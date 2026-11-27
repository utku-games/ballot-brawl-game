/**
 * Tests that the CPU uses directional moves: it lunges in with a charge move from just outside reach, and swings an evasive move while backing off on low guard.
 * A random source fixed at zero makes every chance succeed, so each rule is checked on its own.
 * With the variant chance at zero the CPU never uses them, as on the easiest settings before this feature.
 */
import { describe, expect, it } from 'vitest';
import { duel } from '../fight/testFight';
import { FRESH_MEMORY, thinkAi } from './aiBrain';
import { profileForLevel } from './aiProfile';
import { MoveKind } from '../fight/moves';

const ALWAYS = (): number => 0;
/** The hardest CPU with its signature special switched off, so only directional moves are in play. */
const HARD = { ...profileForLevel(1), specialChance: 0 };

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

describe('CPU signature specials', () => {
  it('fires a ready special that would reach', () => {
    const s = duel(2);
    s.fighters[0]!.profile = { ...s.fighters[0]!.profile, special: MoveKind.Bullrush };
    expect(thinkAi(s, s.fighters[0]!, profileForLevel(1), FRESH_MEMORY, ALWAYS).input.special).toBe(true);
  });

  it('keeps a counter for when an attack is coming', () => {
    const s = duel(1.2);
    s.fighters[0]!.profile = { ...s.fighters[0]!.profile, special: MoveKind.Counter };
    expect(thinkAi(s, s.fighters[0]!, profileForLevel(1), FRESH_MEMORY, ALWAYS).input.special).toBe(false);
  });

  it('waits while the special recharges', () => {
    const s = duel(2);
    s.fighters[0]!.specialCooldown = 10;
    expect(thinkAi(s, s.fighters[0]!, { ...profileForLevel(1), variantChance: 0 }, FRESH_MEMORY, ALWAYS).input.special).toBe(false);
  });
});
