/**
 * Tests for the guest's state buffer: normal pacing, catching up after a burst, and waiting on an empty buffer.
 * Every pushed state is eventually taken in order, so no tick's events are lost.
 * Catch-up never takes more than the clock steps plus the catch-up cap in one frame.
 */
import { describe, expect, it } from 'vitest';
import { MAX_CATCH_UP, SnapshotQueue, TARGET_BUFFER } from './snapshotQueue';

describe('snapshot queue', () => {
  it('takes one state per clock step while near the target', () => {
    const q = new SnapshotQueue<number>();
    for (let i = 0; i < TARGET_BUFFER + 1; i += 1) q.push(i);
    expect(q.take(1)).toEqual([0]);
  });

  it('returns nothing when empty', () => {
    expect(new SnapshotQueue<number>().take(2)).toEqual([]);
  });

  it('catches up after a burst without skipping', () => {
    const q = new SnapshotQueue<number>();
    for (let i = 0; i < 20; i += 1) q.push(i);
    const first = q.take(1);
    expect(first).toEqual(Array.from({ length: 1 + MAX_CATCH_UP }, (_, i) => i));
    const seen = [...first];
    while (q.length > 0) seen.push(...q.take(1));
    expect(seen).toEqual(Array.from({ length: 20 }, (_, i) => i));
  });
});
