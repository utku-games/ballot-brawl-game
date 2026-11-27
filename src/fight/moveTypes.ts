/**
 * The vocabulary of attacks: every move kind, its family (punch or kick, for sounds and hit effects), and the frame-data shape all moves share.
 * Moves also carry their body motion (a dash along the facing, negative backs away, during startup or active frames) and how they land: knockdowns, repeat hits, going through a block, or countering.
 * Pure types and constants; moves.ts holds the numbers.
 */

export enum MoveKind {
  Punch = 'punch',
  Kick = 'kick',
  Finisher = 'finisher',
  /** Throwing a picked-up item; it hits through a projectile, not in melee. */
  Item = 'item',
  FlyingPunch = 'flyingPunch',
  Headbutt = 'headbutt',
  ShoulderCharge = 'shoulderCharge',
  Dropkick = 'dropkick',
  BicycleKick = 'bicycleKick',
  SlideKick = 'slideKick',
  Uppercut = 'uppercut',
  SpinningBackfist = 'spinningBackfist',
  BackflipKick = 'backflipKick',
  SpinKick = 'spinKick',
  Bite = 'bite',
  Bullrush = 'bullrush',
  LeapSlam = 'leapSlam',
  Tornado = 'tornado',
  Counter = 'counter',
  Shockwave = 'shockwave',
  Grab = 'grab',
}

/** Which basic attack a move sounds and lands like. */
export enum MoveFamily {
  Punch = 'punch',
  Kick = 'kick',
  Finisher = 'finisher',
  Item = 'item',
}

/** When a move's dash carries the body. */
export enum DashPhase {
  Startup = 'startup',
  Active = 'active',
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
  family: MoveFamily;
  /** Speed along the facing during dashPhase, m/s; negative moves backwards, 0 stands still. */
  dash: number;
  dashPhase: DashPhase;
  /** True when a clean hit knocks the target down. */
  knockdown: boolean;
  /** Active ticks between repeated hits on the same target; 0 hits each target once. */
  rehitEvery: number;
  /** True when the move goes through a block (grabs). */
  beatsGuard: boolean;
  /** True for a counter stance: it never hits by itself, but turns an attack landing during its active frames back on the attacker. */
  counter: boolean;
}

/** Cosines of the arc half-angles moves use. */
export const ARC_NARROW = Math.cos(Math.PI / 4);
export const ARC_WIDE = Math.cos(Math.PI / 3);
export const ARC_FINISHER = Math.cos((Math.PI * 5) / 12);
/** Every direction counts as inside the arc. */
export const ARC_FULL = -1;

/** How an ordinary hit lands: once per target, blockable, not a counter. */
export const PLAIN_HIT: Pick<MoveData, 'rehitEvery' | 'beatsGuard' | 'counter'> = { rehitEvery: 0, beatsGuard: false, counter: false };

/** A move that stays in place, does not knock down and lands as an ordinary hit. */
export const STILL: Pick<MoveData, 'dash' | 'dashPhase' | 'knockdown' | 'rehitEvery' | 'beatsGuard' | 'counter'> = {
  dash: 0, dashPhase: DashPhase.Active, knockdown: false, ...PLAIN_HIT,
};
