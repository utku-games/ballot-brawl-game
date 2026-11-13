/**
 * Frame data for the three attacks every fighter has: punch, kick and the meter-powered finisher.
 * Startup, active and recovery are counted in 60 Hz ticks; reach is measured from the body edge.
 * The finisher is slow and short-ranged to dodge, but hits every enemy in its arc for heavy damage.
 */

export enum MoveKind {
  Punch = 'punch',
  Kick = 'kick',
  Finisher = 'finisher',
}

export interface MoveData {
  startup: number;
  active: number;
  recovery: number;
  damage: number;
  /** Reach beyond the attacker's body radius, meters. */
  reach: number;
  /** Cosine of the half-angle of the hit arc in front of the attacker. */
  arcCos: number;
  /** Initial knockback speed on hit, m/s. */
  knockback: number;
  hitstun: number;
  /** Guard drained when the hit is defended. */
  guardDamage: number;
}

/** Cosines of the arc half-angles used below. */
const ARC_NARROW = Math.cos(Math.PI / 4);
const ARC_WIDE = Math.cos(Math.PI / 3);
const ARC_FINISHER = Math.cos((Math.PI * 5) / 12);

export const MOVES: Readonly<Record<MoveKind, MoveData>> = {
  [MoveKind.Punch]: {
    startup: 5, active: 3, recovery: 10, damage: 6, reach: 0.75, arcCos: ARC_NARROW,
    knockback: 1.2, hitstun: 21, guardDamage: 9,
  },
  [MoveKind.Kick]: {
    startup: 10, active: 4, recovery: 17, damage: 10, reach: 1.05, arcCos: ARC_WIDE,
    knockback: 4.5, hitstun: 24, guardDamage: 18,
  },
  [MoveKind.Finisher]: {
    startup: 22, active: 8, recovery: 30, damage: 38, reach: 1.6, arcCos: ARC_FINISHER,
    knockback: 9, hitstun: 40, guardDamage: 1000,
  },
};

/** Total ticks a move occupies the attacker. */
export function moveDuration(move: Readonly<MoveData>): number {
  return move.startup + move.active + move.recovery;
}

/** True during the ticks in which the move can hit (frame counted from 0 at the start). */
export function isActiveFrame(move: Readonly<MoveData>, frame: number): boolean {
  return frame >= move.startup && frame < move.startup + move.active;
}
