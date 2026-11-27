/**
 * Frame data of the directional moves: charge moves for walking toward the opponent and evasive moves for walking away.
 * Charge moves dash forward and hit harder than a punch or kick but leave a longer recovery; evasive moves back off while they swing.
 * Ticks are 60 Hz; reach is measured from the body edge, as for every move.
 */
import { ARC_FULL, ARC_NARROW, ARC_WIDE, DashPhase, MoveFamily, MoveKind, PLAIN_HIT, type MoveData } from './moveTypes';

export type DirectionalMove =
  | MoveKind.FlyingPunch | MoveKind.Headbutt | MoveKind.ShoulderCharge | MoveKind.Dropkick | MoveKind.BicycleKick
  | MoveKind.SlideKick | MoveKind.Uppercut | MoveKind.SpinningBackfist | MoveKind.BackflipKick | MoveKind.SpinKick;

const P = MoveFamily.Punch;
const K = MoveFamily.Kick;
const S = DashPhase.Startup;
const A = DashPhase.Active;

export const DIRECTIONAL_MOVES: Readonly<Record<DirectionalMove, MoveData>> = {
  [MoveKind.FlyingPunch]: {
    startup: 8, active: 6, recovery: 16, damage: 9, reach: 0.8, arcCos: ARC_NARROW, knockback: 3.5, hitstun: 24, guardDamage: 14,
    family: P, dash: 9, dashPhase: A, knockdown: false, ...PLAIN_HIT,
  },
  [MoveKind.Headbutt]: {
    startup: 9, active: 4, recovery: 16, damage: 11, reach: 0.6, arcCos: ARC_NARROW, knockback: 3, hitstun: 28, guardDamage: 16,
    family: P, dash: 5, dashPhase: S, knockdown: false, ...PLAIN_HIT,
  },
  [MoveKind.ShoulderCharge]: {
    startup: 10, active: 8, recovery: 18, damage: 10, reach: 0.7, arcCos: ARC_WIDE, knockback: 6, hitstun: 26, guardDamage: 22,
    family: K, dash: 11, dashPhase: A, knockdown: false, ...PLAIN_HIT,
  },
  [MoveKind.Dropkick]: {
    startup: 12, active: 5, recovery: 24, damage: 13, reach: 1, arcCos: ARC_NARROW, knockback: 7, hitstun: 30, guardDamage: 20,
    family: K, dash: 8, dashPhase: A, knockdown: true, ...PLAIN_HIT,
  },
  [MoveKind.BicycleKick]: {
    startup: 12, active: 8, recovery: 20, damage: 12, reach: 1, arcCos: ARC_WIDE, knockback: 5, hitstun: 26, guardDamage: 18,
    family: K, dash: 4, dashPhase: A, knockdown: false, ...PLAIN_HIT,
  },
  [MoveKind.SlideKick]: {
    startup: 8, active: 8, recovery: 18, damage: 9, reach: 1.1, arcCos: ARC_NARROW, knockback: 2, hitstun: 24, guardDamage: 10,
    family: K, dash: 9, dashPhase: A, knockdown: true, ...PLAIN_HIT,
  },
  [MoveKind.Uppercut]: {
    startup: 7, active: 3, recovery: 16, damage: 11, reach: 0.7, arcCos: ARC_NARROW, knockback: 3, hitstun: 30, guardDamage: 12,
    family: P, dash: -3, dashPhase: S, knockdown: false, ...PLAIN_HIT,
  },
  [MoveKind.SpinningBackfist]: {
    startup: 9, active: 4, recovery: 14, damage: 9, reach: 0.9, arcCos: ARC_FULL, knockback: 4, hitstun: 24, guardDamage: 12,
    family: P, dash: -4, dashPhase: S, knockdown: false, ...PLAIN_HIT,
  },
  [MoveKind.BackflipKick]: {
    startup: 10, active: 5, recovery: 20, damage: 11, reach: 0.9, arcCos: ARC_WIDE, knockback: 6, hitstun: 26, guardDamage: 16,
    family: K, dash: -6, dashPhase: A, knockdown: false, ...PLAIN_HIT,
  },
  [MoveKind.SpinKick]: {
    startup: 11, active: 5, recovery: 16, damage: 10, reach: 1.1, arcCos: ARC_FULL, knockback: 5, hitstun: 24, guardDamage: 18,
    family: K, dash: -3, dashPhase: S, knockdown: false, ...PLAIN_HIT,
  },
};
