/**
 * Keeps an online link honest: it says when to send a keep-alive ping and when the other side has gone quiet too long.
 * WebRTC can take half a minute to notice a phone that lost signal or a laptop that went to sleep, so both sides ping
 * once a second and give up after several silent seconds, or after much longer when the other side said it is away.
 * Pure: the caller passes the current time in milliseconds, so the rules are tested without timers.
 */

export const PING_EVERY_MS = 1000;
/** Silence after which the link counts as lost. */
export const LOST_AFTER_MS = 8000;
/** Silence allowed while the other page is hidden (an app switch, a background tab whose timers are throttled). */
export const AWAY_LOST_AFTER_MS = 120_000;
/** A gap this long between this side's own checks means its timers were frozen (a suspended phone app). */
export const STALL_AFTER_MS = 3000;

export class Liveness {
  private lastHeard: number;
  private lastPing: number;
  private peerAway = false;
  private lastCheck: number;

  constructor(now: number) {
    this.lastHeard = now;
    this.lastPing = now;
    this.lastCheck = now;
  }

  /** Call on every periodic check before lost(): after a stall this side resumes instead of blaming the peer. */
  checked(now: number): void {
    if (now - this.lastCheck >= STALL_AFTER_MS) this.resumed(now);
    this.lastCheck = now;
  }

  /** Call whenever any message arrives. */
  heard(now: number): void {
    this.lastHeard = now;
  }

  /** Records that the other page was hidden (true) or came back (false). */
  setPeerAway(away: boolean): void {
    this.peerAway = away;
  }

  /** Call when this page becomes visible again: its own silence clock was frozen, so it starts afresh. */
  resumed(now: number): void {
    this.lastHeard = now;
    this.lastPing = now;
  }

  /** True when a ping should go out now; it then counts as sent. */
  pingDue(now: number): boolean {
    if (now - this.lastPing < PING_EVERY_MS) return false;
    this.lastPing = now;
    return true;
  }

  lost(now: number): boolean {
    return now - this.lastHeard >= (this.peerAway ? AWAY_LOST_AFTER_MS : LOST_AFTER_MS);
  }
}
