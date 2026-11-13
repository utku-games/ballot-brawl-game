/**
 * Frame data for the three attacks every fighter has: punch, kick and the meter-powered finisher in four styles.
 * Startup, active and recovery are counted in 60 Hz ticks; reach is measured from the body edge.
 * Smash is a heavy close hit in a wide arc, Rush dashes through enemies, Quake hits all around and Throw hits at range
 * through a projectile (so it has no melee reach of its own).
 */
import { FinisherStyle } from '../roster/signatureTypes';

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
/** Every direction counts as inside the arc. */
const ARC_FULL = -1;
/** Rush dash speed during its active frames, m/s. */
export const RUSH_SPEED = 15;

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

/** The finisher's frame data per style; Smash is the original finisher. */
export const FINISHERS: Readonly<Record<FinisherStyle, MoveData>> = {
  [FinisherStyle.Smash]: MOVES[MoveKind.Finisher],
  [FinisherStyle.Rush]: {
    startup: 14, active: 12, recovery: 26, damage: 32, reach: 0.8, arcCos: ARC_FULL,
    knockback: 8, hitstun: 40, guardDamage: 1000,
  },
  [FinisherStyle.Throw]: {
    startup: 16, active: 1, recovery: 24, damage: 34, reach: 0, arcCos: ARC_FULL,
    knockback: 7, hitstun: 40, guardDamage: 1000,
  },
  [FinisherStyle.Quake]: {
    startup: 24, active: 6, recovery: 30, damage: 28, reach: 1.1, arcCos: ARC_FULL,
    knockback: 8, hitstun: 40, guardDamage: 1000,
  },
};

/** Frame data of a move for a fighter whose finisher has the given style. */
export function moveData(move: MoveKind, style: FinisherStyle): MoveData {
  return move === MoveKind.Finisher ? FINISHERS[style] : MOVES[move];
}

/** True when a style's finisher hits through a projectile instead of a melee contact. */
export function isRanged(style: FinisherStyle): boolean {
  return style === FinisherStyle.Throw;
}

/** Total ticks a move occupies the attacker. */
export function moveDuration(move: Readonly<MoveData>): number {
  return move.startup + move.active + move.recovery;
}

/** True during the ticks in which the move can hit (frame counted from 0 at the start). */
export function isActiveFrame(move: Readonly<MoveData>, frame: number): boolean {
  return frame >= move.startup && frame < move.startup + move.active;
}
