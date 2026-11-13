/**
 * Keeps an online link honest: it says when to send a keep-alive ping and when the other side has gone quiet too long.
 * WebRTC can take half a minute to notice a phone that lost signal or a laptop that went to sleep, so both sides ping
 * once a second and give up after several silent seconds.
 * Pure: the caller passes the current time in milliseconds, so the rules are tested without timers.
 */

export const PING_EVERY_MS = 1000;
/** Silence after which the link counts as lost. */
export const LOST_AFTER_MS = 8000;

export class Liveness {
  private lastHeard: number;
  private lastPing: number;

  constructor(now: number) {
    this.lastHeard = now;
    this.lastPing = now;
  }

  /** Call whenever any message arrives. */
  heard(now: number): void {
    this.lastHeard = now;
  }

  /** True when a ping should go out now; it then counts as sent. */
  pingDue(now: number): boolean {
    if (now - this.lastPing < PING_EVERY_MS) return false;
    this.lastPing = now;
    return true;
  }

  lost(now: number): boolean {
    return now - this.lastHeard >= LOST_AFTER_MS;
  }
}
