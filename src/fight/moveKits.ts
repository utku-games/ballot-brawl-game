/**
 * Which move a Punch or Kick press becomes: the stick direction relative to the fighter's facing picks standing, toward or away, and the fighter's kit names the move for each.
 * Four kits give fighters different styles (Bruiser, Acrobat, Brawler, Trickster), chosen from their stats so every roster entry gets one without hand-tuning.
 * Pure rules with no I/O; fighterControl applies them and combatProfile stores each fighter's kit.
 */
import type { FighterStats } from '../roster/rosterTypes';
import { MoveKind } from './moveTypes';
import type { DirectionalMove } from './moveLibrary';

export enum MoveKit {
  /** Strong hitters: headbutt and shoulder charge. */
  Bruiser = 'bruiser',
  /** Fast fighters: flying punch, bicycle kick and backflips. */
  Acrobat = 'acrobat',
  /** Tough all-rounders: flying punch, dropkick and uppercut. */
  Brawler = 'brawler',
  /** Everyone else: slide kick and spinning backfist. */
  Trickster = 'trickster',
}

export enum StickDirection {
  Standing = 'standing',
  Toward = 'toward',
  Away = 'away',
}

export enum AttackButton {
  Punch = 'punch',
  Kick = 'kick',
}

export interface KitMoves {
  punchToward: DirectionalMove;
  punchAway: DirectionalMove;
  kickToward: DirectionalMove;
  kickAway: DirectionalMove;
}

export const KIT_MOVES: Readonly<Record<MoveKit, KitMoves>> = {
  [MoveKit.Bruiser]: { punchToward: MoveKind.Headbutt, punchAway: MoveKind.Uppercut, kickToward: MoveKind.ShoulderCharge, kickAway: MoveKind.SpinKick },
  [MoveKit.Acrobat]: { punchToward: MoveKind.FlyingPunch, punchAway: MoveKind.SpinningBackfist, kickToward: MoveKind.BicycleKick, kickAway: MoveKind.BackflipKick },
  [MoveKit.Brawler]: { punchToward: MoveKind.FlyingPunch, punchAway: MoveKind.Uppercut, kickToward: MoveKind.Dropkick, kickAway: MoveKind.SpinKick },
  [MoveKit.Trickster]: { punchToward: MoveKind.FlyingPunch, punchAway: MoveKind.SpinningBackfist, kickToward: MoveKind.SlideKick, kickAway: MoveKind.BackflipKick },
};

/** A stick this short counts as standing still. */
export const STICK_DEADZONE = 0.3;
/** Cosine between stick and facing beyond which the stick points toward (or, negated, away from) the opponent. */
export const DIRECTION_COS = 0.5;
/** A stat at or above this marks a fighter's strength. */
const HIGH_STAT = 4;

/** Standing, toward or away, from the stick (x, z on the floor) and the unit facing toward the opponent. */
export function stickDirection(moveX: number, moveZ: number, facingX: number, facingZ: number): StickDirection {
  const length = Math.hypot(moveX, moveZ);
  if (length < STICK_DEADZONE) return StickDirection.Standing;
  const cos = (moveX * facingX + moveZ * facingZ) / length;
  if (cos >= DIRECTION_COS) return StickDirection.Toward;
  if (cos <= -DIRECTION_COS) return StickDirection.Away;
  return StickDirection.Standing;
}

/** The kit a fighter fights with: power-led Bruiser, speed-led Acrobat, toughness-led Brawler, otherwise Trickster. */
export function kitForStats(stats: Readonly<FighterStats>): MoveKit {
  if (stats.power >= HIGH_STAT && stats.power >= stats.speed) return MoveKit.Bruiser;
  if (stats.speed >= HIGH_STAT) return MoveKit.Acrobat;
  if (stats.toughness >= HIGH_STAT) return MoveKit.Brawler;
  return MoveKit.Trickster;
}

/** The move a button press becomes for this kit and stick direction. */
export function attackFor(button: AttackButton, direction: StickDirection, kit: MoveKit): MoveKind {
  const moves = KIT_MOVES[kit];
  if (button === AttackButton.Punch) {
    if (direction === StickDirection.Toward) return moves.punchToward;
    return direction === StickDirection.Away ? moves.punchAway : MoveKind.Punch;
  }
  if (direction === StickDirection.Toward) return moves.kickToward;
  return direction === StickDirection.Away ? moves.kickAway : MoveKind.Kick;
}
