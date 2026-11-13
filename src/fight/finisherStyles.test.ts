/**
 * Tests for the four finisher styles: Smash keeps the original numbers, Rush dashes through enemies, Quake hits all
 * around and Throw has no melee contact of its own.
 * Every style still needs a full meter and empties it on use.
 * Each test builds a duel, gives the attacker a style and a full meter, and checks positions, hits and events.
 */
import { describe, expect, it } from 'vitest';
import { ARENA_HALF_WIDTH } from '../core/arena';
import { FinisherStyle } from '../roster/signatureTypes';
import { METER_MAX } from './fightConstants';
import { IDLE_INPUT, type MatchState } from './fightTypes';
import { FINISHERS, MoveKind, moveDuration, MOVES, RUSH_SPEED } from './moves';
import { duel, input, styled, tap } from './testFight';

const SPECIAL = input({ special: true });
const TICK = 1 / 60;

function armed(state: MatchState, style: FinisherStyle): MatchState {
  const [a] = state.fighters;
  a.profile = styled(style);
  a.meter = METER_MAX;
  return state;
}

function finish(state: MatchState, style: FinisherStyle): ReturnType<typeof tap> {
  return tap(state, moveDuration(FINISHERS[style]), [SPECIAL, IDLE_INPUT]);
}

describe('finisher styles', () => {
  it('keeps Smash equal to the original finisher', () => {
    expect(FINISHERS[FinisherStyle.Smash]).toEqual(MOVES[MoveKind.Finisher]);
  });

  it('carries a Rush forward about three metres and hits an enemy on the path', () => {
    const start = armed(duel(3.5), FinisherStyle.Rush);
    const x0 = start.fighters[0].x;
    const { state, events } = finish(start, FinisherStyle.Rush);
    const dash = FINISHERS[FinisherStyle.Rush].active * RUSH_SPEED * TICK;
    expect(state.fighters[0].x - x0).toBeGreaterThan(dash * 0.5);
    expect(events.filter((e) => e.kind === 'hit' && e.move === MoveKind.Finisher)).toHaveLength(1);
  });

  it('stops a Rush at the arena wall', () => {
    const start = armed(duel(2), FinisherStyle.Rush);
    const [a, b] = start.fighters;
    a.x = ARENA_HALF_WIDTH - 1;
    b.x = -ARENA_HALF_WIDTH + 1;
    a.facingX = 1;
    const { state } = finish(start, FinisherStyle.Rush);
    expect(state.fighters[0].x).toBeLessThanOrEqual(ARENA_HALF_WIDTH);
  });

  it('lets a Quake hit an enemy directly behind', () => {
    const start = armed(duel(1.4), FinisherStyle.Quake);
    start.fighters[0].facingX = -1;
    const { events } = tap(start, 1, [SPECIAL, IDLE_INPUT]);
    expect(events.some((e) => e.kind === 'swing')).toBe(true);
    const after = finish(start, FinisherStyle.Quake);
    expect(after.events.filter((e) => e.kind === 'hit')).toHaveLength(1);
  });

  it('gives Throw no melee contact', () => {
    const start = armed(duel(1.2), FinisherStyle.Throw);
    const { events } = tap(start, FINISHERS[FinisherStyle.Throw].startup, [SPECIAL, IDLE_INPUT]);
    expect(events.some((e) => e.kind === 'hit')).toBe(false);
  });

  it('needs a full meter for every style and empties it', () => {
    for (const style of Object.values(FinisherStyle)) {
      const empty = duel(1.2);
      empty.fighters[0].profile = styled(style);
      expect(tap(empty, 2, [SPECIAL, IDLE_INPUT]).events.some((e) => e.kind === 'swing'), style).toBe(false);
      const { state } = tap(armed(duel(1.2), style), 2, [SPECIAL, IDLE_INPUT]);
      expect(state.fighters[0].meter, style).toBeLessThan(METER_MAX);
    }
  });
});
