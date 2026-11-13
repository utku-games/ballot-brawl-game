/**
 * Tests for player-to-fighter assignment during team brawls.
 * Swapping moves to the next living teammate, a knockout moves control automatically, and two players never share a fighter.
 * A player whose whole team is down loses their assignment.
 */
import { describe, expect, it } from 'vitest';
import { ActionKind, type FighterState } from '../fight/fightTypes';
import { createMatch } from '../fight/matchSetup';
import { entries } from '../fight/testFight';
import { PlayerId } from '../input/controlFrame';
import { playerSlots, updateAssignment } from './controlAssignment';

function knockOut(f: FighterState): void {
  f.action = { kind: ActionKind.KnockedOut, frame: 0, duration: 0, move: null, hitIds: [] };
}

describe('updateAssignment', () => {
  it('keeps control without a swap and moves on a swap', () => {
    const s = createMatch({ teams: [entries(3), entries(1)] });
    const start = new Map([[PlayerId.One, 't0s0']]);
    expect(updateAssignment(start, s.fighters, PlayerId.One, false).get(PlayerId.One)).toBe('t0s0');
    expect(updateAssignment(start, s.fighters, PlayerId.One, true).get(PlayerId.One)).toBe('t0s1');
  });

  it('moves control off a knocked-out fighter, skipping the other player', () => {
    const s = createMatch({ teams: [entries(3), entries(1)] });
    knockOut(s.fighters[0]);
    const start = new Map([[PlayerId.One, 't0s0'], [PlayerId.Two, 't0s1']]);
    const next = updateAssignment(start, s.fighters, PlayerId.One, false);
    expect(next.get(PlayerId.One)).toBe('t0s2');
    expect(playerSlots(next)).toEqual(new Set(['t0s2', 't0s1']));
  });

  it('drops the player when the whole team is down', () => {
    const s = createMatch({ teams: [entries(1), entries(1)] });
    knockOut(s.fighters[0]);
    expect(updateAssignment(new Map([[PlayerId.One, 't0s0']]), s.fighters, PlayerId.One, false).has(PlayerId.One)).toBe(false);
  });
});
