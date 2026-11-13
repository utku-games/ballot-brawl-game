/**
 * Tests for the keep-alive rules: pings go out once per interval, and silence past the limit counts as lost.
 * Hearing anything resets the silence clock; an away peer gets a longer limit, and resuming starts a fresh window.
 * Times are plain numbers, so no timers are involved.
 */
import { describe, expect, it } from 'vitest';
import { AWAY_LOST_AFTER_MS, Liveness, LOST_AFTER_MS, PING_EVERY_MS, STALL_AFTER_MS } from './liveness';

const LONG_GAP_MS = 300_000;

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

  it('waits much longer for a peer that said it is away', () => {
    const l = new Liveness(0);
    l.setPeerAway(true);
    expect(l.lost(AWAY_LOST_AFTER_MS / 2)).toBe(false);
    expect(l.lost(AWAY_LOST_AFTER_MS)).toBe(true);
    l.setPeerAway(false);
    expect(l.lost(LOST_AFTER_MS)).toBe(true);
  });

  it('starts a fresh window when this page resumes', () => {
    const l = new Liveness(0);
    l.resumed(LONG_GAP_MS);
    expect(l.lost(LONG_GAP_MS + LOST_AFTER_MS - 1)).toBe(false);
    expect(l.pingDue(LONG_GAP_MS + 1)).toBe(false);
    expect(l.lost(LONG_GAP_MS + LOST_AFTER_MS)).toBe(true);
  });

  it('treats a stall in its own checks as a resume, but not regular checks', () => {
    const l = new Liveness(0);
    for (let t = 0; t <= LOST_AFTER_MS; t += STALL_AFTER_MS / 2) l.checked(t);
    expect(l.lost(LOST_AFTER_MS)).toBe(true);
    const s = new Liveness(0);
    s.checked(LONG_GAP_MS);
    expect(s.lost(LONG_GAP_MS)).toBe(false);
  });
});
