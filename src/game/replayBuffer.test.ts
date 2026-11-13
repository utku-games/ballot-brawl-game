/**
 * Tests for the knockout replay buffer and its playback timing.
 * The buffer must keep only the newest states, oldest first, without changing the array it was given.
 * Playback must step through the states at the replay speed and report the end.
 */
import { describe, expect, it } from 'vitest';
import { TICK_RATE } from '../fight/fightConstants';
import { pushCapped, REPLAY_SPEED, REPLAY_TICKS, replayIndex } from './replayBuffer';

describe('pushCapped', () => {
  it('keeps only the newest items, oldest first', () => {
    let buffer: number[] = [];
    for (let i = 0; i < 10; i += 1) buffer = pushCapped(buffer, i, 4);
    expect(buffer).toEqual([6, 7, 8, 9]);
    const before = [1, 2];
    pushCapped(before, 3, 2);
    expect(before).toEqual([1, 2]);
    expect(REPLAY_TICKS).toBe(150);
  });
});

describe('replayIndex', () => {
  it('steps through the states at replay speed and ends after the last one', () => {
    expect(replayIndex(0, 100)).toBe(0);
    expect(replayIndex(1, 100)).toBe(Math.floor(TICK_RATE * REPLAY_SPEED));
    expect(replayIndex(100 / (TICK_RATE * REPLAY_SPEED), 100)).toBe(-1);
  });
});
