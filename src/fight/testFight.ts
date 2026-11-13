/**
 * Helpers for fight tests: a neutral combat profile, quick match builders and an input runner.
 * They keep each test focused on one rule instead of setup boilerplate.
 * Only test files import this module.
 */
import { combatProfile, NO_MODIFIERS } from './combatProfile';
import { IDLE_INPUT, type FighterInput, type MatchState } from './fightTypes';
import { createMatch, type TeamEntry } from './matchSetup';
import { stepMatch } from './matchStep';

export const NEUTRAL_PROFILE = combatProfile({ power: 3, speed: 3, toughness: 3 }, NO_MODIFIERS);

export function entries(count: number): TeamEntry[] {
  return Array.from({ length: count }, (_, i) => ({ fighterId: `f${i}`, profile: NEUTRAL_PROFILE }));
}

/** A 1v1 match with both fighters placed `gap` meters apart on the X axis, facing each other. */
export function duel(gap: number): MatchState {
  const state = createMatch({ teams: [entries(1), entries(1)] });
  const [a, b] = state.fighters;
  a.x = -gap / 2;
  a.z = 0;
  b.x = gap / 2;
  b.z = 0;
  return state;
}

export function input(partial: Partial<FighterInput>): FighterInput {
  return { ...IDLE_INPUT, ...partial };
}

/** Steps the match `ticks` times, giving the same inputs each tick, and returns the final state and all events. */
export function run(state: MatchState, ticks: number, inputs: FighterInput[]): { state: MatchState; events: MatchState['events'] } {
  let s = state;
  const events: MatchState['events'] = [];
  for (let i = 0; i < ticks; i += 1) {
    s = stepMatch(s, inputs);
    events.push(...s.events);
  }
  return { state: s, events };
}

/** Presses the inputs on the first tick only, then idles for the rest. */
export function tap(state: MatchState, ticks: number, first: FighterInput[]): { state: MatchState; events: MatchState['events'] } {
  const once = run(state, 1, first);
  const rest = run(once.state, ticks - 1, first.map(() => IDLE_INPUT));
  return { state: rest.state, events: [...once.events, ...rest.events] };
}
