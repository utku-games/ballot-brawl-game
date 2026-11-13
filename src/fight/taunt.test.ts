/**
 * Tests for the taunt: a completed taunt earns meter, a hit during the taunt earns nothing, and it cannot start
 * mid-attack.
 * The meter is capped at its maximum, and a taunt keeps running when its controller changes.
 * Each test drives a small duel with scripted inputs and checks the meter, actions and events.
 */
import { describe, expect, it } from 'vitest';
import { METER_MAX, TAUNT_METER, TAUNT_TICKS } from './fightConstants';
import { ActionKind, IDLE_INPUT } from './fightTypes';
import { MoveKind, moveDuration, MOVES } from './moves';
import { duel, input, run, tap } from './testFight';

const TAUNT = input({ taunt: true });
const PUNCH = input({ punch: true });
const FAR = 5;
const CLOSE = 1.2;

describe('taunt', () => {
  it('earns meter when it completes untouched', () => {
    const { state, events } = tap(duel(FAR), TAUNT_TICKS + 2, [TAUNT, IDLE_INPUT]);
    expect(state.fighters[0].meter).toBe(TAUNT_METER);
    expect(events.filter((e) => e.kind === 'taunt')).toHaveLength(1);
    expect(events.filter((e) => e.kind === 'tauntDone')).toHaveLength(1);
    expect(state.fighters[0].action.kind).toBe(ActionKind.Idle);
  });

  it('earns nothing when a hit interrupts it', () => {
    const { state, events } = tap(duel(CLOSE), TAUNT_TICKS + 2, [TAUNT, PUNCH]);
    expect(events.some((e) => e.kind === 'hit')).toBe(true);
    expect(events.some((e) => e.kind === 'tauntDone')).toBe(false);
    expect(state.fighters[0].meter).toBeLessThan(TAUNT_METER);
  });

  it('cannot start in the middle of an attack', () => {
    const swinging = tap(duel(FAR), 2, [PUNCH, IDLE_INPUT]).state;
    const { events } = run(swinging, moveDuration(MOVES[MoveKind.Punch]) - 3, [TAUNT, IDLE_INPUT]);
    expect(events.some((e) => e.kind === 'taunt')).toBe(false);
  });

  it('caps the meter', () => {
    const start = duel(FAR);
    start.fighters[0].meter = METER_MAX - 5;
    const { state, events } = tap(start, TAUNT_TICKS + 2, [TAUNT, IDLE_INPUT]);
    expect(state.fighters[0].meter).toBe(METER_MAX);
    expect(events.find((e) => e.kind === 'tauntDone')).toMatchObject({ meter: 5 });
  });

  it('keeps running when the controller changes and presses other buttons', () => {
    const started = tap(duel(FAR), 2, [TAUNT, IDLE_INPUT]).state;
    const { state } = run(started, 3, [input({ punch: true, moveX: 1 }), IDLE_INPUT]);
    expect(state.fighters[0].action.kind).toBe(ActionKind.Taunt);
    expect(state.fighters[0].x).toBe(started.fighters[0].x);
  });
});
