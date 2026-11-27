/**
 * Tests signature specials in real matches: the SPECIAL button fires the fighter's special and starts its cooldown, a full meter still fires the Finisher, and each mechanic lands its own way.
 * Grabs go through a block, a counter stance turns an attack back on the attacker, the Tornado hits more than once, charges and leaps knock down, and the Shockwave pushes hardest.
 * Fighters use the neutral profile with the special under test swapped in.
 */
import { describe, expect, it } from 'vitest';
import { METER_MAX } from './fightConstants';
import { IDLE_INPUT, type FighterInput, type MatchState } from './fightTypes';
import { MoveKind, SPECIAL_COOLDOWN_TICKS, type SpecialMove } from './moves';
import { duel, input, NEUTRAL_PROFILE, run, tap } from './testFight';

const SPECIAL = input({ special: true });
const DEFEND = input({ defend: true });

function withSpecial(state: MatchState, slot: number, special: SpecialMove): MatchState {
  state.fighters[slot]!.profile = { ...NEUTRAL_PROFILE, special };
  return state;
}

function swings(events: MatchState['events'], attacker: string): MoveKind[] {
  const out: MoveKind[] = [];
  for (const e of events) if (e.kind === 'swing' && e.attacker === attacker) out.push(e.move);
  return out;
}

/** Runs input pairs in sequence, each for its number of ticks, and returns the final state and every event. */
function script(state: MatchState, steps: ReadonlyArray<[number, FighterInput, FighterInput]>): { state: MatchState; events: MatchState['events'] } {
  let s = state;
  const events: MatchState['events'] = [];
  for (const [ticks, a, b] of steps) {
    const r = run(s, ticks, [a, b]);
    s = r.state;
    events.push(...r.events);
  }
  return { state: s, events };
}

describe('the SPECIAL button', () => {
  it('fires the special, starts the cooldown and ignores presses while recharging', () => {
    const start = withSpecial(duel(4), 0, MoveKind.Shockwave);
    const first = tap(start, 2, [SPECIAL, IDLE_INPUT]);
    expect(swings(first.events, 't0s0')).toEqual([MoveKind.Shockwave]);
    expect(first.state.fighters[0]!.specialCooldown).toBe(SPECIAL_COOLDOWN_TICKS - 1);
    const waited = run(first.state, 60, [IDLE_INPUT, IDLE_INPUT]);
    expect(swings(tap(waited.state, 2, [SPECIAL, IDLE_INPUT]).events, 't0s0')).toEqual([]);
    const recharged = run(waited.state, SPECIAL_COOLDOWN_TICKS, [IDLE_INPUT, IDLE_INPUT]);
    expect(swings(tap(recharged.state, 2, [SPECIAL, IDLE_INPUT]).events, 't0s0')).toEqual([MoveKind.Shockwave]);
  });

  it('fires the Finisher with a full meter and leaves the special ready', () => {
    const start = duel(4);
    start.fighters[0]!.meter = METER_MAX;
    const { events, state } = tap(start, 2, [SPECIAL, IDLE_INPUT]);
    expect(swings(events, 't0s0')).toEqual([MoveKind.Finisher]);
    expect(state.fighters[0]!.specialCooldown).toBe(0);
  });
});

describe('special mechanics', () => {
  it('grabs through a block', () => {
    const { events } = run(withSpecial(duel(1.3), 0, MoveKind.Grab), 30, [SPECIAL, DEFEND]);
    expect(events.some((e) => e.kind === 'hit' && e.move === MoveKind.Grab)).toBe(true);
    expect(events.some((e) => e.kind === 'block')).toBe(false);
  });

  it('turns an attack on a counter stance back on the attacker', () => {
    const start = withSpecial(duel(1.3), 1, MoveKind.Counter);
    const { state, events } = script(start, [[1, IDLE_INPUT, SPECIAL], [2, IDLE_INPUT, IDLE_INPUT], [1, input({ punch: true }), IDLE_INPUT], [40, IDLE_INPUT, IDLE_INPUT]]);
    expect(state.fighters[1]!.damageTaken).toBe(0);
    expect(state.fighters[0]!.damageTaken).toBeGreaterThan(0);
    expect(events.some((e) => e.kind === 'knockdown' && e.target === 't0s0')).toBe(true);
  });

  it('hits the same target more than once with a Tornado', () => {
    const { events } = tap(withSpecial(duel(1.3), 0, MoveKind.Tornado), 50, [SPECIAL, IDLE_INPUT]);
    expect(events.filter((e) => e.kind === 'hit' && e.move === MoveKind.Tornado).length).toBeGreaterThan(1);
  });

  it.each<SpecialMove>([MoveKind.Bullrush, MoveKind.LeapSlam])('knocks down with %s', (special) => {
    const { events } = tap(withSpecial(duel(2.2), 0, special), 50, [SPECIAL, IDLE_INPUT]);
    expect(events.some((e) => e.kind === 'knockdown')).toBe(true);
  });

  it('pushes harder with a Shockwave than with a kick', () => {
    const wave = tap(withSpecial(duel(1.6), 0, MoveKind.Shockwave), 40, [SPECIAL, IDLE_INPUT]).state.fighters[1]!.x;
    const kick = tap(duel(1.6), 40, [input({ kick: true }), IDLE_INPUT]).state.fighters[1]!.x;
    expect(wave).toBeGreaterThan(kick + 0.5);
  });
});
