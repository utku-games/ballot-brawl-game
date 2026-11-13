/**
 * Tests for the keep-alive rules: pings go out once per interval, and silence past the limit counts as lost.
 * Hearing anything resets the silence clock.
 * Times are plain numbers, so no timers are involved.
 */
import { describe, expect, it } from 'vitest';
import { Liveness, LOST_AFTER_MS, PING_EVERY_MS } from './liveness';

describe('liveness', () => {
  it('pings once per interval', () => {
    const l = new Liveness(0);
    expect(l.pingDue(PING_EVERY_MS - 1)).toBe(false);
    expect(l.pingDue(PING_EVERY_MS)).toBe(true);
    expect(l.pingDue(PING_EVERY_MS + 10)).toBe(false);
    expect(l.pingDue(2 * PING_EVERY_MS)).toBe(true);
  });

  it('is lost after a long silence and reset by any message', () => {
    const l = new Liveness(0);
    expect(l.lost(LOST_AFTER_MS - 1)).toBe(false);
    l.heard(LOST_AFTER_MS - 1);
    expect(l.lost(LOST_AFTER_MS + 100)).toBe(false);
    expect(l.lost(2 * LOST_AFTER_MS)).toBe(true);
  });
});
