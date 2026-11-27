/**
 * Frame data of the seven signature special mechanics, each fighter's named move on the SPECIAL button between finishers.
 * Each plays differently: a guard-draining bite, a long knockdown charge, a leap that lands all around, a multi-hit tornado, a counter stance, a push-back shockwave and a grab through blocks.
 * Ticks are 60 Hz; specials recharge for SPECIAL_COOLDOWN_TICKS after use.
 */
import { ARC_FULL, ARC_NARROW, ARC_WIDE, DashPhase, MoveFamily, MoveKind, PLAIN_HIT, type MoveData } from './moveTypes';

export type SpecialMove =
  | MoveKind.Bite | MoveKind.Bullrush | MoveKind.LeapSlam | MoveKind.Tornado | MoveKind.Counter | MoveKind.Shockwave | MoveKind.Grab;

/** Six seconds between specials. */
export const SPECIAL_COOLDOWN_TICKS = 360;

const P = MoveFamily.Punch;
const K = MoveFamily.Kick;
const S = DashPhase.Startup;
const A = DashPhase.Active;

export const SPECIAL_MOVES: Readonly<Record<SpecialMove, MoveData>> = {
  [MoveKind.Bite]: {
    startup: 6, active: 4, recovery: 14, damage: 12, reach: 0.55, arcCos: ARC_NARROW, knockback: 2, hitstun: 30, guardDamage: 45,
    family: P, dash: 4, dashPhase: S, knockdown: false, ...PLAIN_HIT,
  },
  [MoveKind.Bullrush]: {
    startup: 14, active: 16, recovery: 24, damage: 14, reach: 0.8, arcCos: ARC_WIDE, knockback: 8, hitstun: 34, guardDamage: 30,
    family: K, dash: 13, dashPhase: A, knockdown: true, ...PLAIN_HIT,
  },
  [MoveKind.LeapSlam]: {
    startup: 18, active: 4, recovery: 22, damage: 13, reach: 1.3, arcCos: ARC_FULL, knockback: 6, hitstun: 30, guardDamage: 24,
    family: K, dash: 7, dashPhase: S, knockdown: true, ...PLAIN_HIT,
  },
  [MoveKind.Tornado]: {
    startup: 10, active: 24, recovery: 18, damage: 5, reach: 0.9, arcCos: ARC_FULL, knockback: 2, hitstun: 14, guardDamage: 8,
    family: K, dash: 2, dashPhase: A, knockdown: false, ...PLAIN_HIT, rehitEvery: 8,
  },
  [MoveKind.Counter]: {
    startup: 2, active: 36, recovery: 14, damage: 15, reach: 0, arcCos: ARC_FULL, knockback: 6, hitstun: 30, guardDamage: 0,
    family: P, dash: 0, dashPhase: A, knockdown: true, ...PLAIN_HIT, counter: true,
  },
  [MoveKind.Shockwave]: {
    startup: 14, active: 3, recovery: 20, damage: 4, reach: 2.2, arcCos: ARC_FULL, knockback: 11, hitstun: 22, guardDamage: 12,
    family: K, dash: 0, dashPhase: A, knockdown: false, ...PLAIN_HIT,
  },
  [MoveKind.Grab]: {
    startup: 7, active: 3, recovery: 22, damage: 14, reach: 0.6, arcCos: ARC_NARROW, knockback: 7, hitstun: 32, guardDamage: 0,
    family: P, dash: 3, dashPhase: S, knockdown: true, ...PLAIN_HIT, beatsGuard: true,
  },
};
