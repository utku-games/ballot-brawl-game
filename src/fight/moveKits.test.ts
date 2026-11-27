/**
 * Tests the directional move rules: stick direction relative to facing, kit choice from stats, the move each button press becomes, and the move library's frame data.
 * Every kit maps all four directional slots to directional moves, and standing still always keeps the plain punch and kick.
 * Pure rules; matches are covered in directionalMoves.test.ts.
 */
import { describe, expect, it } from 'vitest';
import { AttackButton, attackFor, KIT_MOVES, kitForStats, MoveKit, stickDirection, StickDirection } from './moveKits';
import { DIRECTIONAL_MOVES, DashPhase, isDashFrame, MoveKind } from './moves';

describe('stickDirection', () => {
  it('reads toward, away and standing relative to the facing', () => {
    expect(stickDirection(1, 0, 1, 0)).toBe(StickDirection.Toward);
    expect(stickDirection(-1, 0, 1, 0)).toBe(StickDirection.Away);
    expect(stickDirection(0, 1, 1, 0)).toBe(StickDirection.Standing);
    expect(stickDirection(0.1, 0, 1, 0)).toBe(StickDirection.Standing);
    expect(stickDirection(0.7, 0.7, 0, 1)).toBe(StickDirection.Toward);
  });
});

describe('kitForStats', () => {
  it('picks the kit from the fighter strength', () => {
    expect(kitForStats({ power: 5, speed: 3, toughness: 3 })).toBe(MoveKit.Bruiser);
    expect(kitForStats({ power: 4, speed: 5, toughness: 3 })).toBe(MoveKit.Acrobat);
    expect(kitForStats({ power: 2, speed: 2, toughness: 5 })).toBe(MoveKit.Brawler);
    expect(kitForStats({ power: 3, speed: 3, toughness: 3 })).toBe(MoveKit.Trickster);
  });
});

describe('attackFor', () => {
  it('keeps the plain moves when standing and uses the kit otherwise', () => {
    for (const kit of Object.values(MoveKit)) {
      expect(attackFor(AttackButton.Punch, StickDirection.Standing, kit)).toBe(MoveKind.Punch);
      expect(attackFor(AttackButton.Kick, StickDirection.Standing, kit)).toBe(MoveKind.Kick);
      expect(attackFor(AttackButton.Punch, StickDirection.Toward, kit)).toBe(KIT_MOVES[kit].punchToward);
      expect(attackFor(AttackButton.Punch, StickDirection.Away, kit)).toBe(KIT_MOVES[kit].punchAway);
      expect(attackFor(AttackButton.Kick, StickDirection.Toward, kit)).toBe(KIT_MOVES[kit].kickToward);
      expect(attackFor(AttackButton.Kick, StickDirection.Away, kit)).toBe(KIT_MOVES[kit].kickAway);
    }
  });

  it('uses every directional move in some kit', () => {
    const used = new Set(Object.values(KIT_MOVES).flatMap((k) => Object.values(k)));
    expect([...used].sort()).toEqual(Object.keys(DIRECTIONAL_MOVES).sort());
  });
});

describe('DIRECTIONAL_MOVES', () => {
  it.each(Object.entries(DIRECTIONAL_MOVES))('%s has valid frame data', (_name, m) => {
    expect(m.startup).toBeGreaterThan(0);
    expect(m.active).toBeGreaterThan(0);
    expect(m.recovery).toBeGreaterThan(0);
    expect(m.damage).toBeGreaterThan(0);
    expect(m.reach).toBeGreaterThan(0);
    expect(m.dash).not.toBe(0);
  });

  it('dashes only during its phase', () => {
    const fly = DIRECTIONAL_MOVES[MoveKind.FlyingPunch];
    expect(fly.dashPhase).toBe(DashPhase.Active);
    expect(isDashFrame(fly, 0)).toBe(false);
    expect(isDashFrame(fly, fly.startup)).toBe(true);
    expect(isDashFrame(fly, fly.startup + fly.active)).toBe(false);
    const upper = DIRECTIONAL_MOVES[MoveKind.Uppercut];
    expect(isDashFrame(upper, 0)).toBe(true);
    expect(isDashFrame(upper, upper.startup)).toBe(false);
  });
});
