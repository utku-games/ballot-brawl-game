/**
 * Frame data for every attack: punch, kick, the directional moves (moveLibrary.ts), the signature specials (specialLibrary.ts), throwing a picked-up item, and the meter-powered finisher in four styles.
 * Startup, active and recovery are counted in 60 Hz ticks; reach is measured from the body edge.
 * Smash is a heavy close hit in a wide arc, Rush dashes through enemies, Quake hits all around and Throw hits at range
 * through a projectile (so it has no melee reach of its own).
 */
import { FinisherStyle } from '../roster/signatureTypes';
import { DIRECTIONAL_MOVES } from './moveLibrary';
import { ARC_FINISHER, ARC_FULL, ARC_NARROW, ARC_WIDE, DashPhase, MoveFamily, MoveKind, PLAIN_HIT, STILL, type MoveData } from './moveTypes';
import { SPECIAL_MOVES } from './specialLibrary';

export { ARC_FULL, ARC_NARROW, ARC_WIDE, DashPhase, MoveFamily, MoveKind, type MoveData } from './moveTypes';
export { DIRECTIONAL_MOVES, type DirectionalMove } from './moveLibrary';
export { SPECIAL_MOVES, SPECIAL_COOLDOWN_TICKS, type SpecialMove } from './specialLibrary';

/** Rush finisher dash speed during its active frames, m/s. */
export const RUSH_SPEED = 15;

const BASE_MOVES = {
  [MoveKind.Punch]: {
    startup: 5, active: 3, recovery: 10, damage: 6, reach: 0.75, arcCos: ARC_NARROW,
    knockback: 1.2, hitstun: 21, guardDamage: 9, family: MoveFamily.Punch, ...STILL,
  },
  [MoveKind.Kick]: {
    startup: 10, active: 4, recovery: 17, damage: 10, reach: 1.05, arcCos: ARC_WIDE,
    knockback: 4.5, hitstun: 24, guardDamage: 18, family: MoveFamily.Kick, ...STILL,
  },
  [MoveKind.Finisher]: {
    startup: 22, active: 8, recovery: 30, damage: 38, reach: 1.6, arcCos: ARC_FINISHER,
    knockback: 9, hitstun: 40, guardDamage: 1000, family: MoveFamily.Finisher, ...STILL, knockdown: true,
  },
  [MoveKind.Item]: {
    startup: 8, active: 1, recovery: 14, damage: 14, reach: 0, arcCos: ARC_FULL,
    knockback: 3.5, hitstun: 24, guardDamage: 25, family: MoveFamily.Item, ...STILL,
  },
} as const satisfies Readonly<Record<string, MoveData>>;

export const MOVES: Readonly<Record<MoveKind, MoveData>> = { ...BASE_MOVES, ...DIRECTIONAL_MOVES, ...SPECIAL_MOVES };

/** The finisher's frame data per style; Smash is the original finisher. Every finisher knocks down. */
export const FINISHERS: Readonly<Record<FinisherStyle, MoveData>> = {
  [FinisherStyle.Smash]: MOVES[MoveKind.Finisher],
  [FinisherStyle.Rush]: {
    startup: 14, active: 12, recovery: 26, damage: 32, reach: 0.8, arcCos: ARC_FULL,
    knockback: 8, hitstun: 40, guardDamage: 1000, family: MoveFamily.Finisher, dash: RUSH_SPEED, dashPhase: DashPhase.Active, knockdown: true, ...PLAIN_HIT,
  },
  [FinisherStyle.Throw]: {
    startup: 16, active: 1, recovery: 24, damage: 34, reach: 0, arcCos: ARC_FULL,
    knockback: 7, hitstun: 40, guardDamage: 1000, family: MoveFamily.Finisher, ...STILL, knockdown: true,
  },
  [FinisherStyle.Quake]: {
    startup: 24, active: 6, recovery: 30, damage: 28, reach: 1.1, arcCos: ARC_FULL,
    knockback: 8, hitstun: 40, guardDamage: 1000, family: MoveFamily.Finisher, ...STILL, knockdown: true,
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

/** True when this move, for a fighter with this finisher style, never makes melee contact. */
export function hitsByProjectile(move: MoveKind, style: FinisherStyle): boolean {
  return move === MoveKind.Item || (move === MoveKind.Finisher && isRanged(style));
}

/** Total ticks a move occupies the attacker. */
export function moveDuration(move: Readonly<MoveData>): number {
  return move.startup + move.active + move.recovery;
}

/** True during the ticks in which the move can hit (frame counted from 0 at the start). */
export function isActiveFrame(move: Readonly<MoveData>, frame: number): boolean {
  return frame >= move.startup && frame < move.startup + move.active;
}

/** True while the move's dash carries the body: during its startup or its active frames. */
export function isDashFrame(move: Readonly<MoveData>, frame: number): boolean {
  if (move.dash === 0) return false;
  return move.dashPhase === DashPhase.Startup ? frame < move.startup : isActiveFrame(move, frame);
}

/** The basic attack a move sounds and lands like. */
export function familyOf(move: MoveKind): MoveFamily {
  return MOVES[move].family;
}
