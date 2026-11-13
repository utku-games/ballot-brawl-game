/**
 * Tests for ring-outs on an open platform: a big hit near the edge knocks the target off, and a hit in the middle does not.
 * Walking or dashing never carries anyone over, and arenas with walls keep the old behaviour.
 * A ring-out ends the match like any knockout, and the result is deterministic.
 */
import { describe, expect, it } from 'vitest';
import { ARENA_HALF_WIDTH } from '../core/arena';
import { FinisherStyle } from '../roster/signatureTypes';
import { METER_MAX } from './fightConstants';
import { EndReason, IDLE_INPUT, MatchPhase, type MatchState } from './fightTypes';
import { FINISHERS, MoveKind, moveDuration, MOVES } from './moves';
import { RING_OUT_SOURCE } from './ringOuts';
import { duel, input, run, styled, tap } from './testFight';

const KICK = input({ kick: true });
const FINISH = input({ special: true });
const KICK_TICKS = moveDuration(MOVES[MoveKind.Kick]) + 30;

/** A duel on the open platform with the target standing near the right edge. */
function nearEdge(ringOuts: boolean, gap: number, edgeGap: number): MatchState {
  const s = { ...duel(gap), ringOuts };
  const [a, b] = s.fighters;
  b.x = ARENA_HALF_WIDTH - edgeGap;
  a.x = b.x - gap;
  a.facingX = 1;
  b.facingX = -1;
  b.profile = { ...b.profile, maxHealth: 999 };
  b.health = 999;
  return s;
}

function finishOn(s: MatchState): ReturnType<typeof tap> {
  const [a] = s.fighters;
  a.profile = styled(FinisherStyle.Smash);
  a.meter = METER_MAX;
  return tap(s, moveDuration(FINISHERS[FinisherStyle.Smash]) + 40, [FINISH, IDLE_INPUT]);
}

describe('ring-outs', () => {
  it('knocks a fighter off the edge with a big hit and ends the match', () => {
    const { state, events } = finishOn(nearEdge(true, 1.3, 0.5));
    expect(events.some((e) => e.kind === 'ringOut')).toBe(true);
    expect(events).toContainEqual({ kind: 'ko', target: state.fighters[1].slotId, by: RING_OUT_SOURCE });
    expect(state.fighters[1].ringedOut).toBe(true);
    expect(state.fighters[1].x).toBeGreaterThan(ARENA_HALF_WIDTH);
    expect(state.phase).toBe(MatchPhase.Over);
    expect(events.find((e) => e.kind === 'matchOver')).toMatchObject({ winner: 0, reason: EndReason.KnockOut });
  });

  it('keeps the same hit inside the walls of an ordinary arena', () => {
    const { state, events } = finishOn(nearEdge(false, 1.3, 0.5));
    expect(events.some((e) => e.kind === 'ringOut')).toBe(false);
    expect(state.fighters[1].x).toBeLessThanOrEqual(ARENA_HALF_WIDTH);
  });

  it('does not ring out a fighter hit far from the edge', () => {
    const { events } = tap(nearEdge(true, 1.3, 6), KICK_TICKS, [KICK, IDLE_INPUT]);
    expect(events.some((e) => e.kind === 'hit')).toBe(true);
    expect(events.some((e) => e.kind === 'ringOut')).toBe(false);
  });

  it('never lets walking or a rush carry anyone over', () => {
    const walk = run(nearEdge(true, 6, 0.5), 200, [IDLE_INPUT, input({ moveX: 1 })]).state;
    expect(walk.fighters[1].ringedOut).toBe(false);
    expect(walk.fighters[1].x).toBeLessThan(ARENA_HALF_WIDTH);
    const s = nearEdge(true, 3, 0.3);
    s.fighters[0].profile = styled(FinisherStyle.Rush);
    s.fighters[0].meter = METER_MAX;
    const rush = tap(s, moveDuration(FINISHERS[FinisherStyle.Rush]), [FINISH, IDLE_INPUT]).state;
    expect(rush.fighters[0].ringedOut).toBe(false);
    expect(rush.fighters[0].x).toBeLessThan(ARENA_HALF_WIDTH);
    expect(rush.fighters[0].x).toBeGreaterThan(s.fighters[0].x);
  });

  it('is deterministic', () => {
    expect(finishOn(nearEdge(true, 1.3, 0.5)).state).toEqual(finishOn(nearEdge(true, 1.3, 0.5)).state);
  });
});
