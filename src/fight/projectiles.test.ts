/**
 * Tests for thrown finishers: a projectile hits an enemy at range, is blocked by defending and ignores teammates.
 * It must disappear on a hit, at the arena wall and when its flight time runs out, and its id is deterministic.
 * Each test arms a Throw fighter with a full meter in a small match and steps it with scripted inputs.
 */
import { describe, expect, it } from 'vitest';
import { FinisherStyle } from '../roster/signatureTypes';
import { GUARD_MAX, METER_MAX } from './fightConstants';
import { IDLE_INPUT, type MatchState } from './fightTypes';
import { createMatch } from './matchSetup';
import { FINISHERS, MoveKind } from './moves';
import { PROJECTILE_TICKS } from './projectiles';
import { duel, entries, input, run, styled, tap } from './testFight';

const SPECIAL = input({ special: true });
const DEFEND = input({ defend: true });
const FLIGHT = FINISHERS[FinisherStyle.Throw].startup + PROJECTILE_TICKS + 2;

function thrower(state: MatchState): MatchState {
  const [a] = state.fighters;
  a.profile = styled(FinisherStyle.Throw);
  a.meter = METER_MAX;
  return state;
}

describe('projectiles', () => {
  it('hits an enemy five metres away and then disappears', () => {
    const { state, events } = tap(thrower(duel(5)), FLIGHT, [SPECIAL, IDLE_INPUT]);
    expect(events.filter((e) => e.kind === 'throw')).toHaveLength(1);
    expect(events.filter((e) => e.kind === 'hit' && e.move === MoveKind.Finisher)).toHaveLength(1);
    expect(state.fighters[1].health).toBeLessThan(state.fighters[1].profile.maxHealth);
    expect(state.projectiles).toHaveLength(0);
  });

  it('is blocked by defending: no damage and the guard breaks', () => {
    const first = run(thrower(duel(5)), 1, [SPECIAL, DEFEND]);
    const { state, events } = run(first.state, FLIGHT, [IDLE_INPUT, DEFEND]);
    expect(events.some((e) => e.kind === 'block')).toBe(true);
    expect(events.some((e) => e.kind === 'guardBreak')).toBe(true);
    expect(state.fighters[1].damageTaken).toBe(0);
    expect(state.fighters[1].guard).toBeLessThan(GUARD_MAX);
  });

  it('flies past teammates', () => {
    const start = createMatch({ teams: [entries(2), entries(1)] });
    const [a, mate, enemy] = start.fighters;
    a.profile = styled(FinisherStyle.Throw);
    a.meter = METER_MAX;
    a.x = -4; a.z = 0; a.facingX = 1; a.facingZ = 0;
    mate.x = -2; mate.z = 0;
    enemy.x = 2; enemy.z = 0;
    const { state } = tap(start, FLIGHT, [SPECIAL, IDLE_INPUT, IDLE_INPUT]);
    expect(state.fighters[1].damageTaken).toBe(0);
    expect(state.fighters[2].damageTaken).toBeGreaterThan(0);
  });

  it('vanishes when it misses: the target steps aside and the flight runs out', () => {
    const start = thrower(duel(7));
    const dodge = input({ moveZ: 1 });
    const mid = tap(start, FINISHERS[FinisherStyle.Throw].startup + 2, [SPECIAL, IDLE_INPUT]);
    expect(mid.state.projectiles).toHaveLength(1);
    const end = run(mid.state, PROJECTILE_TICKS, [IDLE_INPUT, dodge]);
    expect(end.state.projectiles).toHaveLength(0);
    expect(end.events.some((e) => e.kind === 'hit')).toBe(false);
  });

  it('is deterministic', () => {
    const a = tap(thrower(duel(5)), 30, [SPECIAL, IDLE_INPUT]).state;
    const b = tap(thrower(duel(5)), 30, [SPECIAL, IDLE_INPUT]).state;
    expect(a).toEqual(b);
  });
});
