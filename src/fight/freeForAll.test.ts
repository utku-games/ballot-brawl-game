/**
 * Tests for free-for-all matches of three or four sides: circular spawns, enemies on every other side, and the end rules.
 * The match must continue while two or more sides stand, and end with the last one; time over picks the healthiest side.
 * Two-team matches must still spawn exactly as before.
 */
import { describe, expect, it } from 'vitest';
import { MatchSetupError } from '../core/errors';
import { isInsideArena } from '../core/arena';
import { MATCH_TIME_TICKS } from './fightConstants';
import { ActionKind, EndReason, IDLE_INPUT, MatchPhase, type MatchState } from './fightTypes';
import { nearestEnemy } from './matchQueries';
import { createMatch } from './matchSetup';
import { stepMatch } from './matchStep';
import { entries, NO_EXTRAS } from './testFight';

function party(sides: number): MatchState {
  return createMatch({ teams: Array.from({ length: sides }, () => entries(1)), ...NO_EXTRAS });
}

function knockOut(s: MatchState, index: number): void {
  s.fighters[index].health = 0;
  s.fighters[index].action = { kind: ActionKind.KnockedOut, frame: 0, duration: 0, move: null, hitIds: [] };
}

const IDLE4 = [IDLE_INPUT, IDLE_INPUT, IDLE_INPUT, IDLE_INPUT];

describe('free-for-all', () => {
  it('spawns three or four sides inside the arena, facing the centre', () => {
    for (const n of [3, 4]) {
      const s = party(n);
      expect(new Set(s.fighters.map((f) => f.team)).size).toBe(n);
      for (const f of s.fighters) {
        expect(isInsideArena(f)).toBe(true);
        expect(f.x * f.facingX + f.z * f.facingZ).toBeLessThan(0);
      }
    }
  });

  it('rejects one side or more than four', () => {
    expect(() => createMatch({ teams: [entries(1)], ...NO_EXTRAS })).toThrow(MatchSetupError);
    expect(() => party(5)).toThrow(MatchSetupError);
  });

  it('treats every other side as an enemy', () => {
    const s = party(4);
    const enemy = nearestEnemy(s.fighters, s.fighters[0]);
    expect(enemy?.team).not.toBe(s.fighters[0].team);
  });

  it('keeps going while two sides stand and ends with the last one', () => {
    const s = party(4);
    knockOut(s, 1);
    knockOut(s, 2);
    expect(stepMatch(s, IDLE4).phase).toBe(MatchPhase.Fighting);
    knockOut(s, 0);
    const done = stepMatch(s, IDLE4);
    expect(done.phase).toBe(MatchPhase.Over);
    expect(done.winner).toBe(s.fighters[3].team);
  });

  it('gives time over to the healthiest side, or a draw on a tie', () => {
    const s = party(3);
    s.ticksLeft = 1;
    s.fighters[0].health -= 10;
    s.fighters[2].health -= 20;
    const out = stepMatch(s, IDLE4);
    expect(out.events.find((e) => e.kind === 'matchOver')).toMatchObject({ winner: 1, reason: EndReason.TimeOver });
    const tie = party(3);
    tie.ticksLeft = 1;
    tie.fighters[2].health -= 20;
    expect(stepMatch(tie, IDLE4).winner).toBeNull();
    expect(MATCH_TIME_TICKS).toBeGreaterThan(1);
  });

  it('spawns two teams exactly as before', () => {
    const s = createMatch({ teams: [entries(2), entries(2)], ...NO_EXTRAS });
    expect(s.fighters.filter((f) => f.team === 0).every((f) => f.x < 0 && f.facingX > 0 && f.facingZ === 0)).toBe(true);
    expect(s.fighters.filter((f) => f.team === 1).every((f) => f.x > 0 && f.facingX < 0 && f.facingZ === 0)).toBe(true);
  });
});
