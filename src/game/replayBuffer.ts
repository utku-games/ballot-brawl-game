/**
 * The rolling history used for the knockout replay: the most recent simulation states, oldest first.
 * Only the last REPLAY_TICKS states are kept, so memory stays flat however long the match runs.
 * Pure helpers over arrays; the match session owns the buffer and plays it back after a knockout.
 */
import { TICK_RATE } from '../fight/fightConstants';

/** States kept for the replay: the last 2.5 seconds of the fight. */
export const REPLAY_TICKS = Math.round(2.5 * TICK_RATE);
/** Playback speed of the replay, as a fraction of real time. */
export const REPLAY_SPEED = 0.4;

/** Appends an item and drops the oldest ones beyond `cap`; returns a new array. */
export function pushCapped<T>(buffer: readonly T[], item: T, cap: number): T[] {
  const next = [...buffer, item];
  return next.length > cap ? next.slice(next.length - cap) : next;
}

/** Index of the state to show `seconds` into a replay of `length` states, or -1 once it is over. */
export function replayIndex(seconds: number, length: number): number {
  const index = Math.floor(seconds * TICK_RATE * REPLAY_SPEED);
  return index < length ? index : -1;
}
